/**
 * Largest Army Tiebreaker Integration Tests
 * Ensures no player receives Largest Army if tied for most knights (>=3)
 */

import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import http from 'http';
import { Server } from 'socket.io';

let SERVER_URL: string;
let ioServer: Server | undefined;


describe('Largest Army Tiebreaker', () => {
    let clientA: ClientSocket;
    let clientB: ClientSocket;
    let roomCode: string;
    let httpServer: http.Server;

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
        clientB = Client(SERVER_URL);
        await Promise.all([
            new Promise<void>((resolve) => clientA.on('connect', resolve)),
            new Promise<void>((resolve) => clientB.on('connect', resolve)),
        ]);
        roomCode = `ARMY_TIE_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        await new Promise<void>((resolve) => {
            clientA.emit('client:create_room', { gameSettings: { maxPlayers: 2 }, roomCode });
            clientA.on('server:room_created', (data) => {
                clientA.emit('client:join_room', { roomCode });
                clientB.emit('client:join_room', { roomCode });
                resolve();
            });
        });
    });

    afterEach(() => {
        if (clientA && clientA.connected) clientA.disconnect();
        if (clientB && clientB.connected) clientB.disconnect();
        if (ioServer) ioServer.close();
        if (httpServer) httpServer.close();
    });

    it('should not award Largest Army if two players are tied for most knights (>=3)', async () => {
        // Attach listener before emitting events
        let largestArmy: any = undefined;
        const statePromise = new Promise<void>((resolve) => {
            clientA.on('server:game_state_update', (data) => {
                largestArmy = data.gameState.largestArmy;
                resolve();
            });
        });

        // Give both players 3 played knights
        for (let i = 0; i < 3; i++) {
            clientA.emit('client:play_dev_card', { type: 'play_dev_card', cardType: 'knight' });
            clientB.emit('client:play_dev_card', { type: 'play_dev_card', cardType: 'knight' });
        }

        // Wait for game state update
        await statePromise;
        expect(largestArmy).toBeNull();
    }, 10000); // Increase timeout for reliability
});
