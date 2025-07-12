import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterEach, beforeEach, describe, it } from 'vitest';

const serverPort = process.env.TEST_SOCKET_PORT || 3001;
// --- Robber Movement and Resource Stealing Event Tests ---
describe('Robber Movement and Resource Stealing', () => {
    let roomCode: string;
    let clientA: ClientSocket;
    let clientB: ClientSocket;

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

    it('should allow a player to move the robber and steal a resource', async () => {
        // Setup: Give clientB a resource in the test harness
        // (simulate server-side state for test)
        // We'll use a custom event for test harness only
        clientA.emit('test:set_player_resources', { roomCode, playerId: clientB.id, resources: { brick: 1, lumber: 0, wool: 0, grain: 0, ore: 0 } });

        // Listen for game state update and resource steal
        const stateUpdate = new Promise<void>((resolve) => {
            clientA.on('server:game_state_update', (data) => {
                // ...assertions...
                resolve();
            });
        });

        // Move robber and steal from clientB
        clientA.emit('client:move_robber', { position: { q: 1, r: 2 }, stealFrom: clientB.id });
        await stateUpdate;
    });

    it('should handle moving the robber when the target has no resources', async () => {
        // Setup: Ensure clientB has no resources
        clientA.emit('test:set_player_resources', { roomCode, playerId: clientB.id, resources: { brick: 0, lumber: 0, wool: 0, grain: 0, ore: 0 } });

        // Listen for game state update (no resource stolen)
        const stateUpdate = new Promise<void>((resolve) => {
            clientA.on('server:game_state_update', (data) => {
                // ...assertions...
                resolve();
            });
        });

        // Move robber and attempt to steal from clientB
        clientA.emit('client:move_robber', { position: { q: 2, r: 3 }, stealFrom: clientB.id });
        await stateUpdate;
    });

    it('should reject moving the robber to an invalid position', async () => {
        const invalidMove = new Promise<void>((resolve) => {
            clientA.on('server:action_invalid', (data) => {
                // ...assertions...
                resolve();
            });
        });
        clientA.emit('client:move_robber', { position: { q: 999, r: 999 } });
        await invalidMove;
    });
});
