
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import http from 'http';
import { Server } from 'socket.io';

describe('Port Usage Restrictions', () => {
    let clientA: ClientSocket;
    let roomCode: string;
    let httpServer: http.Server;
    let ioServer: Server;
    let SERVER_URL: string;

    beforeEach(async () => {
        httpServer = http.createServer();
        await new Promise<void>((resolve) => {
            httpServer.listen(0, '127.0.0.1', () => {
                const address = httpServer.address();
                if (address && typeof address === 'object') {
                    SERVER_URL = `http://localhost:${address.port}`;
                }
                resolve();
            });
        });
        ioServer = new Server(httpServer);
        // TODO: Attach your server-side handlers here if needed
        clientA = Client(SERVER_URL);
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
        if (ioServer) ioServer.close();
        if (httpServer) httpServer.close();
    });

    it('should reject maritime trade if player does not have settlement/city on port', async () => {
        // Attempt maritime trade without settlement/city on port
        const invalid = new Promise<void>((resolve) => {
            clientA.on('server:action_invalid', (data) => {
                expect(data.reason).toMatch(/must have settlement|city on port/i);
                resolve();
            });
        });
        clientA.emit('client:maritime_trade', { give: { brick: 2 }, receive: { wool: 1 }, port: { resource: 'wool', ratio: 2 } });
        await invalid;
    });

    it('should allow maritime trade if player has settlement/city on port', async () => {
        // Simulate player building settlement on port
        clientA.emit('client:build_item', { type: 'settlement', position: { q: 1, r: -3 }, onPort: true });
        // Attempt maritime trade with settlement on port
        const valid = new Promise<void>((resolve) => {
            clientA.on('server:game_state_update', (data) => {
                expect(data.gameState.lastAction).toMatchObject({ type: 'maritime_trade', player: clientA.id });
                resolve();
            });
        });
        clientA.emit('client:maritime_trade', { give: { brick: 2 }, receive: { wool: 1 }, port: { resource: 'wool', ratio: 2 } });
        await valid;
    });
});
