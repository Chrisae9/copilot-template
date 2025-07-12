import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '../setup.ts';

let serverPort: number;

describe('Socket Error Handling', () => {
    let roomCode: string;
    let clientA: ClientSocket;
    let clientB: ClientSocket;

    beforeEach(async () => {
        if (!serverPort) {
            const http = require('http');
            const server = http.createServer();
            await new Promise<void>((resolve) => {
                server.listen(0, '0.0.0.0', () => {
                    const address = server.address();
                    if (address && typeof address === 'object') {
                        serverPort = address.port;
                    }
                    server.close(resolve);
                });
            });
        }
        clientA = Client(`http://localhost:${serverPort}`);
        clientB = Client(`http://localhost:${serverPort}`);
        await Promise.all([
            new Promise<void>((resolve, reject) => {
                clientA.on('connect', resolve);
                clientA.on('connect_error', reject);
                setTimeout(() => reject(new Error('Timeout')), 5000);
            }),
            new Promise<void>((resolve, reject) => {
                clientB.on('connect', resolve);
                clientB.on('connect_error', reject);
                setTimeout(() => reject(new Error('Timeout')), 5000);
            })
        ]);
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

    it('should emit server:action_invalid for unknown event', async () => {
        const invalidPromise = new Promise<void>((resolve) => {
            clientA.on('server:action_invalid', (data) => {
                expect(data).toHaveProperty('reason');
                expect(data.reason).toMatch(/unknown|invalid|not recognized/i);
                resolve();
            });
        });
        clientA.emit('client:unknown_event', { foo: 'bar' });
        await invalidPromise;
    });

    it('should emit server:action_invalid for invalid payload', async () => {
        const invalidPromise = new Promise<void>((resolve) => {
            clientA.on('server:action_invalid', (data) => {
                expect(data).toHaveProperty('reason');
                expect(data.reason).toMatch(/invalid|payload|missing/i);
                resolve();
            });
        });
        clientA.emit('client:build_item', { type: 'road' }); // missing position
        await invalidPromise;
    });

    it('should emit server:action_invalid if bank has insufficient resources for maritime trade', async () => {
        clientA.emit('test:set_bank_resources', { roomCode, resources: { brick: 19, lumber: 19, wool: 0, grain: 19, ore: 19 } });
        clientA.emit('test:set_player_resources', { roomCode, playerId: clientA.id, resources: { brick: 4, lumber: 0, wool: 0, grain: 0, ore: 0 } });
        const invalid = new Promise<void>((resolve) => {
            clientA.on('server:action_invalid', (data) => {
                expect(data.reason).toMatch(/bank.*insufficient|not enough.*bank|scarcity/i);
                resolve();
            });
        });
        clientA.emit('client:maritime_trade', { give: { brick: 4 }, receive: { wool: 1 } });
        await invalid;
    });

    it('should emit server:action_invalid for non-active player build attempts', async () => {
        // Only clientA is active, clientB tries to build
        const buildPayload = { type: 'road', position: { x: 1, y: 1 } };
        const invalid = new Promise<void>((resolve) => {
            clientB.on('server:action_invalid', (data) => {
                expect(data).toHaveProperty('reason');
                resolve();
            });
        });
        clientB.emit('client:build_item', buildPayload);
        await invalid;
    });
});
