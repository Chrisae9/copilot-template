import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Trading Events Integration Tests
 * Tests all trading-related Socket.IO events: maritime and domestic trades, validation, and edge cases.
 */
describe('Trading Events', () => {
    it('should reject a trade proposal if a player tries to trade with themselves', async () => {
        clientA.emit('test:set_player_resources', { roomCode, playerId: clientA.id, resources: { brick: 1, lumber: 1, wool: 1, grain: 1, ore: 1 } });
        await new Promise(resolve => setTimeout(resolve, 100));
        const invalid = new Promise<void>((resolve) => {
            clientA.once('server:action_invalid', (data) => {
                console.log('[DEBUG] CLIENT: received action_invalid', data);
                expect(data.reason).toMatch(/cannot trade with yourself|no trading with self|invalid trade/i);
                resolve();
            });
        });
        clientA.emit('client:propose_trade', { offer: { brick: 1 }, request: { wool: 1 }, players: [clientA.id] });
        await invalid;
    });
    let roomCode: string;
    let clientA: ClientSocket;
    let clientB: ClientSocket;
    const serverPort = process.env.TEST_SOCKET_PORT || 3001;

    beforeEach(async () => {
        clientA = Client(`http://localhost:${serverPort}`);
        clientB = Client(`http://localhost:${serverPort}`);

        await new Promise<void>((resolve, reject) => {
            clientA.once('connect', resolve);
            clientA.once('connect_error', reject);
            setTimeout(() => reject(new Error('Timeout')), 5000);
        });
        await new Promise<void>((resolve, reject) => {
            clientB.once('connect', resolve);
            clientB.once('connect_error', reject);
            setTimeout(() => reject(new Error('Timeout')), 5000);
        });

        // Create room and join both clients
        await new Promise<void>((resolve) => {
            clientA.once('server:room_created', (data) => {
                roomCode = data.roomCode;
                clientA.emit('client:join_room', { roomCode });
                clientB.emit('client:join_room', { roomCode });
                console.log('[DEBUG] client:join_room emitted', { roomCode });
                resolve();
            });
            clientA.emit('client:create_room', { gameSettings: { maxPlayers: 4 } });
            console.log('[DEBUG] client:create_room emitted');
        });
        await new Promise(resolve => setTimeout(resolve, 100)); // Delay to ensure join events are processed
    });

    afterEach(async () => {
        if (clientA && clientA.connected) await clientA.disconnect();
        if (clientB && clientB.connected) await clientB.disconnect();
    });

    it('should reject a trade proposal if offer is empty (no resources offered)', async () => {
        clientA.emit('test:set_player_resources', { roomCode, playerId: clientA.id, resources: { brick: 1, lumber: 1, wool: 1, grain: 1, ore: 1 } });
        await new Promise(resolve => setTimeout(resolve, 100));
        const invalid = new Promise<void>((resolve) => {
            clientA.once('server:action_invalid', (data) => {
                console.log('[DEBUG] CLIENT: received action_invalid', data);
                expect(data.reason).toMatch(/must offer at least one resource|no resources offered|free trade/i);
                resolve();
            });
        });
        clientA.emit('client:propose_trade', { offer: {}, request: { wool: 1 }, players: [clientB.id] });
        await invalid;
    });

    it('should reject a trade proposal if request is empty (no resources requested)', async () => {
        clientA.emit('test:set_player_resources', { roomCode, playerId: clientA.id, resources: { brick: 1, lumber: 1, wool: 1, grain: 1, ore: 1 } });
        await new Promise(resolve => setTimeout(resolve, 100));
        const invalid = new Promise<void>((resolve) => {
            clientA.once('server:action_invalid', (data) => {
                console.log('[DEBUG] CLIENT: received action_invalid', data);
                expect(data.reason).toMatch(/must request at least one resource|no resources requested|free trade/i);
                resolve();
            });
        });
        clientA.emit('client:propose_trade', { offer: { brick: 1 }, request: {}, players: [clientB.id] });
        await invalid;
    });

    it('should reject a trade proposal if both offer and request are empty (completely free trade)', async () => {
        clientA.emit('test:set_player_resources', { roomCode, playerId: clientA.id, resources: { brick: 1, lumber: 1, wool: 1, grain: 1, ore: 1 } });
        await new Promise(resolve => setTimeout(resolve, 100));
        const invalid = new Promise<void>((resolve) => {
            clientA.once('server:action_invalid', (data) => {
                console.log('[DEBUG] CLIENT: received action_invalid', data);
                expect(data.reason).toMatch(/must offer at least one resource|must request at least one resource|free trade/i);
                resolve();
            });
        });
        clientA.emit('client:propose_trade', { offer: {}, request: {}, players: [clientB.id] });
        await invalid;
    });

    it('should allow a player to perform a valid maritime trade with the bank', async () => {
        clientA.emit('test:set_player_resources', { roomCode, playerId: clientA.id, resources: { brick: 4, lumber: 0, wool: 0, grain: 0, ore: 0 } });
        await new Promise(resolve => setTimeout(resolve, 100));
        const stateUpdate = new Promise<void>((resolve) => {
            clientA.once('server:game_state_update', (data) => {
                console.log('[DEBUG] CLIENT: received game_state_update', JSON.stringify(data, null, 2));
                expect(data.gameState.lastAction).toMatchObject({
                    type: 'maritime_trade',
                    player: clientA.id,
                    give: { brick: 4 },
                    receive: { wool: 1 }
                });
                resolve();
            });
        });
        clientA.emit('client:maritime_trade', { give: { brick: 4 }, receive: { wool: 1 } });
        await stateUpdate;
    });

    it('should reject maritime trade if player has insufficient resources', async () => {
        clientA.emit('test:set_player_resources', { roomCode, playerId: clientA.id, resources: { brick: 2, lumber: 0, wool: 0, grain: 0, ore: 0 } });
        await new Promise(resolve => setTimeout(resolve, 100));
        const invalid = new Promise<void>((resolve) => {
            clientA.once('server:action_invalid', (data) => {
                console.log('[DEBUG] CLIENT: received action_invalid', data);
                expect(data.reason).toMatch(/insufficient resources/i);
                resolve();
            });
        });
        clientA.emit('client:maritime_trade', { give: { brick: 4 }, receive: { wool: 1 } });
        await invalid;
    });

    it('should allow a player to propose a domestic trade to another player', async () => {
        clientA.emit('test:set_player_resources', { roomCode, playerId: clientA.id, resources: { brick: 1, lumber: 1, wool: 0, grain: 0, ore: 0 } });
        await new Promise(resolve => setTimeout(resolve, 100));
        const tradeProposed = new Promise<void>((resolve) => {
            clientB.once('server:trade_proposed', (data) => {
                console.log('[DEBUG] CLIENT: received trade_proposed', data);
                expect(data).toMatchObject({
                    fromPlayer: clientA.id,
                    offer: { brick: 1 },
                    request: { wool: 1 }
                });
                resolve();
            });
        });
        clientA.emit('client:propose_trade', { offer: { brick: 1 }, request: { wool: 1 }, players: [clientB.id] });
        await tradeProposed;
    });

    it('should allow the target player to accept a domestic trade', async () => {
        let tradeId: string | undefined;
        clientA.emit('test:set_player_resources', { roomCode, playerId: clientA.id, resources: { brick: 1, lumber: 0, wool: 0, grain: 0, ore: 0 } });
        clientB.emit('test:set_player_resources', { roomCode, playerId: clientB.id, resources: { brick: 0, lumber: 0, wool: 1, grain: 0, ore: 0 } });
        await new Promise(resolve => setTimeout(resolve, 100));
        const tradeProposed = new Promise<void>((resolve) => {
            clientB.once('server:trade_proposed', (data) => {
                console.log('[DEBUG] CLIENT: received trade_proposed', data);
                tradeId = data.tradeId;
                resolve();
            });
        });
        clientA.emit('client:propose_trade', { offer: { brick: 1 }, request: { wool: 1 }, players: [clientB.id] });
        await tradeProposed;
        const tradeCompleted = new Promise<void>((resolve) => {
            clientA.once('server:trade_completed', (data) => {
                console.log('[DEBUG] CLIENT: received trade_completed', data);
                expect(data.players).toContain(clientA.id);
                expect(data.players).toContain(clientB.id);
                expect(data.resources).toMatchObject({
                    [clientA.id as string]: { brick: -1, wool: 1 },
                    [clientB.id as string]: { brick: 1, wool: -1 }
                });
                resolve();
            });
        });
        clientB.emit('client:respond_to_trade', { tradeId, response: 'accept' });
        await tradeCompleted;
    });

    it('should allow the target player to reject a domestic trade', async () => {
        let tradeId: string | undefined;
        clientA.emit('test:set_player_resources', { roomCode, playerId: clientA.id, resources: { brick: 1, lumber: 0, wool: 0, grain: 0, ore: 0 } });
        clientB.emit('test:set_player_resources', { roomCode, playerId: clientB.id, resources: { brick: 0, lumber: 0, wool: 1, grain: 0, ore: 0 } });
        await new Promise(resolve => setTimeout(resolve, 100));
        const tradeProposed = new Promise<void>((resolve) => {
            clientB.once('server:trade_proposed', (data) => {
                console.log('[DEBUG] CLIENT: received trade_proposed', data);
                tradeId = data.tradeId;
                resolve();
            });
        });
        clientA.emit('client:propose_trade', { offer: { brick: 1 }, request: { wool: 1 }, players: [clientB.id] });
        await tradeProposed;
        const tradeRejected = new Promise<void>((resolve) => {
            clientA.once('server:trade_cancelled', (data) => {
                console.log('[DEBUG] CLIENT: received trade_cancelled', data);
                expect(data.tradeId).toBe(tradeId);
                expect(data.reason).toMatch(/reject/i);
                resolve();
            });
        });
        clientB.emit('client:respond_to_trade', { tradeId, response: 'reject' });
        await tradeRejected;
    });

    it('should reject trade proposals if player lacks resources to offer', async () => {
        clientA.emit('test:set_player_resources', { roomCode, playerId: clientA.id, resources: { brick: 0, lumber: 0, wool: 0, grain: 0, ore: 0 } });
        await new Promise(resolve => setTimeout(resolve, 100));
        const invalid = new Promise<void>((resolve) => {
            clientA.once('server:action_invalid', (data) => {
                console.log('[DEBUG] CLIENT: received action_invalid', data);
                expect(data.reason).toMatch(/insufficient resources/i);
                resolve();
            });
        });
        clientA.emit('client:propose_trade', { offer: { brick: 1 }, request: { wool: 1 }, players: [clientB.id] });
        await invalid;
    });
});
