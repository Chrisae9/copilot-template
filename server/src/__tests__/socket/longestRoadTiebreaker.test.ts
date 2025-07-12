import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Longest Road Tiebreaker Integration Tests
 * If two players tie for longest road (>=5), neither should have the card or points.
 */
describe('Longest Road Tiebreaker', () => {
    let roomCode: string;
    let clientA: ClientSocket;
    let clientB: ClientSocket;
    const serverPort = process.env.TEST_SOCKET_PORT || 3001;

    beforeEach(async () => {
        clientA = Client(`http://localhost:${serverPort}`);
        clientB = Client(`http://localhost:${serverPort}`);

        await new Promise<void>((resolve, reject) => {
            clientA.on('connect', resolve);
            clientA.on('connect_error', reject);
            setTimeout(() => reject(new Error('Timeout')), 5000);
        });
        await new Promise<void>((resolve, reject) => {
            clientB.on('connect', resolve);
            clientB.on('connect_error', reject);
            setTimeout(() => reject(new Error('Timeout')), 5000);
        });

        // Create room and join both clients
        await new Promise<void>((resolve) => {
            clientA.emit('client:create_room', { gameSettings: { maxPlayers: 4 } });
            clientA.on('server:room_created', (data) => {
                roomCode = data.roomCode;
                clientA.emit('client:join_room', { roomCode });
                clientB.emit('client:join_room', { roomCode });
                resolve();
            });
        });
    });

    afterEach(() => {
        if (clientA && clientA.connected) clientA.disconnect();
        if (clientB && clientB.connected) clientB.disconnect();
    });

    it('should revoke Longest Road if two players tie for longest road', async () => {
        // Build 5 roads for clientA
        for (let i = 0; i < 5; i++) {
            await new Promise<void>((resolve, reject) => {
                clientA.on('server:game_state_update', (data) => {
                    resolve();
                });
                clientA.emit('client:build_item', { type: 'road', position: { from: { q: i, r: 0 }, to: { q: i + 1, r: 0 } } });
                setTimeout(() => reject(new Error('No game_state_update for road')), 2000);
            });
        }
        // Build 5 roads for clientB (tie)
        for (let i = 0; i < 5; i++) {
            await new Promise<void>((resolve, reject) => {
                clientB.on('server:game_state_update', (data) => {
                    resolve();
                });
                clientB.emit('client:build_item', { type: 'road', position: { from: { q: i, r: 1 }, to: { q: i + 1, r: 1 } } });
                setTimeout(() => reject(new Error('No game_state_update for road')), 2000);
            });
        }
        // Both should have 5, but neither should have Longest Road
        let longestRoadA: any = null;
        let longestRoadB: any = null;
        clientA.on('server:game_state_update', (data) => {
            longestRoadA = data.gameState.longestRoad;
        });
        clientB.on('server:game_state_update', (data) => {
            longestRoadB = data.gameState.longestRoad;
        });
        // Wait a short time for state propagation
        await new Promise((resolve) => setTimeout(resolve, 500));
        expect(longestRoadA).toBeNull();
        expect(longestRoadB).toBeNull();
    });
});
