import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Invalid Build/Trade Edge Cases Integration Tests
 * Ensures build/trade actions are rejected if resources are insufficient.
 */
describe('Invalid Build/Trade Edge Cases', function () {
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
    it('should reject building a road if player does not have enough resources', async () => {
        // Set player resources to zero
        clientA.emit('test:set_player_resources', { roomCode, playerId: clientA.id, resources: { brick: 0, lumber: 0, wool: 0, grain: 0, ore: 0 } });
        // Attempt to build road
        const invalidRoad = new Promise<void>((resolve) => {
            clientA.on('server:action_invalid', (data) => {
                expect(data.reason).toMatch(/insufficient resources|cannot build/i);
                resolve();
            });
        });
        clientA.emit('client:build_item', { type: 'road', position: { from: { q: 1, r: 0 }, to: { q: 1, r: 1 } } });
        await invalidRoad;
    });
    it('should reject building a settlement if player does not have enough resources', async () => {
        clientA.emit('test:set_player_resources', { roomCode, playerId: clientA.id, resources: { brick: 0, lumber: 0, wool: 0, grain: 0, ore: 0 } });
        const invalidSettlement = new Promise<void>((resolve) => {
            clientA.on('server:action_invalid', (data) => {
                expect(data.reason).toMatch(/insufficient resources|cannot build/i);
                resolve();
            });
        });
        clientA.emit('client:build_item', { type: 'settlement', position: { q: 2, r: 2 } });
        await invalidSettlement;
    });
    it('should reject building a city if player does not have enough resources', async () => {
        clientA.emit('test:set_player_resources', { roomCode, playerId: clientA.id, resources: { brick: 0, lumber: 0, wool: 0, grain: 0, ore: 0 } });
        const invalidCity = new Promise<void>((resolve) => {
            clientA.on('server:action_invalid', (data) => {
                expect(data.reason).toMatch(/insufficient resources|cannot build/i);
                resolve();
            });
        });
        clientA.emit('client:build_item', { type: 'city', position: { q: 3, r: 3 } });
        await invalidCity;
    });
    it('should reject trade if player does not have enough resources to offer', async () => {
        clientA.emit('test:set_player_resources', { roomCode, playerId: clientA.id, resources: { brick: 0, lumber: 0, wool: 0, grain: 0, ore: 0 } });
        const invalidTrade = new Promise<void>((resolve) => {
            clientA.on('server:action_invalid', (data) => {
                expect(data.reason).toMatch(/insufficient resources|cannot trade/i);
                resolve();
            });
        });
        clientA.emit('client:propose_trade', { offer: { brick: 1 }, request: { wool: 1 }, players: [clientA.id] });
        await invalidTrade;
    });
});
