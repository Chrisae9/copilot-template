import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '../setup.ts';

let serverPort: number;

describe('Player Join/Leave Notifications', () => {
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

        // Attach listeners before emitting join events
        await new Promise<void>((resolve) => {
            clientA.emit('client:create_room', { gameSettings: { maxPlayers: 4 } });
            clientA.on('server:room_created', (data) => {
                roomCode = data.roomCode;
                resolve();
            });
        });
    });

    afterEach(() => {
        if (clientA && clientA.connected) clientA.disconnect();
        if (clientB && clientB.connected) clientB.disconnect();
    });

    it('should emit server:player_joined when a player joins the room', async () => {
        // Attach listeners before emitting join event
        const joinPromise = new Promise<void>((resolve, reject) => {
            clientA.on('server:player_joined', (data) => {
                expect(data).toHaveProperty('playerId');
                expect(data.playerId).toBe(clientB.id);
                expect(data).toHaveProperty('roomCode');
                expect(data.roomCode).toBe(roomCode);
                resolve();
            });
            setTimeout(() => reject(new Error('No player_joined event received')), 5000);
        });
        // clientA joins first (already joined in beforeEach)
        // Now clientB joins and triggers notification
        clientB.emit('client:join_room', { roomCode });
        await joinPromise;
    });

    it('should emit server:player_left when a player leaves the room', async () => {
        // Ensure clientB is in the room before leaving
        await new Promise<void>((resolve) => {
            clientB.emit('client:join_room', { roomCode });
            clientB.on('server:player_joined', (data) => {
                if (data.playerId === clientB.id) resolve();
            });
        });
        const leavePromise = new Promise<void>((resolve, reject) => {
            clientA.on('server:player_left', (data) => {
                expect(data).toHaveProperty('playerId');
                expect(data.playerId).toBe(clientB.id);
                expect(data).toHaveProperty('roomCode');
                expect(data.roomCode).toBe(roomCode);
                resolve();
            });
            setTimeout(() => reject(new Error('No player_left event received')), 5000);
        });
        clientB.emit('client:leave_room', { roomCode });
        await leavePromise;
    });
});
