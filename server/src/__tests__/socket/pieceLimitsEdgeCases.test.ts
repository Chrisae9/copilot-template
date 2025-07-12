import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Piece Limits Edge Cases Integration Tests
 * Ensures players cannot build beyond allowed limits for roads, settlements, and cities.
 */
describe('Piece Limits Edge Cases', function () {
    let clientA: ClientSocket, roomCode: string;
    const serverPort = process.env.TEST_SOCKET_PORT || 3001;
    beforeEach(async function () {
        clientA = Client(`http://localhost:${serverPort}`);
        await new Promise<void>((resolve, reject) => {
            clientA.on('connect', resolve);
            clientA.on('connect_error', reject);
            setTimeout(() => reject(new Error('Timeout')), 5000);
        });
        // Create room and join clientA
        await new Promise<void>((resolve) => {
            clientA.emit('client:create_room', { gameSettings: { maxPlayers: 1 } });
            clientA.on('server:room_created', (data) => {
                roomCode = data.roomCode;
                clientA.emit('client:join_room', { roomCode });
                resolve();
            });
        });
    });
    afterEach(() => {
        if (clientA && clientA.connected) clientA.disconnect();
    });
    it('should reject building a road if player has reached the road limit', async () => {
        // Simulate player already has max roads
        // (Assume 15 for standard Catan)
        for (let i = 0; i < 15; i++) {
            await new Promise<void>((resolve) => {
                clientA.emit('client:build_item', { type: 'road', position: { from: { q: i, r: 0 }, to: { q: i, r: 1 } } });
                clientA.on('server:game_state_update', resolve);
            });
        }
        // Attempt to build 16th road
        const invalidRoad = new Promise<void>((resolve) => {
            clientA.on('server:action_invalid', (data) => {
                expect(data.reason).toMatch(/road limit/i);
                resolve();
            });
        });
        clientA.emit('client:build_item', { type: 'road', position: { from: { q: 99, r: 0 }, to: { q: 99, r: 1 } } });
        await invalidRoad;
    });
    it('should reject building a settlement if player has reached the settlement limit', async () => {
        // Simulate player already has max settlements (5)
        for (let i = 0; i < 5; i++) {
            await new Promise<void>((resolve) => {
                clientA.emit('client:build_item', { type: 'settlement', position: { q: i, r: 0 } });
                clientA.on('server:game_state_update', resolve);
            });
        }
        // Attempt to build 6th settlement
        const invalidSettlement = new Promise<void>((resolve) => {
            clientA.on('server:action_invalid', (data) => {
                expect(data.reason).toMatch(/settlement limit/i);
                resolve();
            });
        });
        clientA.emit('client:build_item', { type: 'settlement', position: { q: 99, r: 99 } });
        await invalidSettlement;
    });
    it('should reject building a city if player has reached the city limit', async () => {
        // Simulate player already has max cities (4)
        for (let i = 0; i < 4; i++) {
            await new Promise<void>((resolve) => {
                clientA.emit('client:build_item', { type: 'city', position: { q: i, r: 1 } });
                clientA.on('server:game_state_update', resolve);
            });
        }
        // Attempt to build 5th city
        const invalidCity = new Promise<void>((resolve) => {
            clientA.on('server:action_invalid', (data) => {
                expect(data.reason).toMatch(/city limit/i);
                resolve();
            });
        });
        clientA.emit('client:build_item', { type: 'city', position: { q: 99, r: 99 } });
        await invalidCity;
    });
});
