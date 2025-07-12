import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '../setup.ts';

// --- Dice Roll Event Tests ---
describe('Dice Roll Event', () => {
    let roomCode: string;
    let activePlayerId: string;
    let clientSocket: ClientSocket;
    let otherClient: ClientSocket;

    let serverPort: number;
    beforeEach(async () => {
        // Assign a random port for the test server
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
        // Create a room and join as two clients
        clientSocket = Client(`http://localhost:${serverPort}`);
        otherClient = Client(`http://localhost:${serverPort}`);

        await new Promise<void>((resolve, reject) => {
            clientSocket.on('connect', resolve);
            clientSocket.on('connect_error', reject);
            setTimeout(() => reject(new Error('Timeout')), 5000);
        });
        await new Promise<void>((resolve, reject) => {
            otherClient.on('connect', resolve);
            otherClient.on('connect_error', reject);
            setTimeout(() => reject(new Error('Timeout')), 5000);
        });

        // Simulate room creation and joining
        await new Promise<void>((resolve) => {
            clientSocket.emit('client:create_room', { gameSettings: { maxPlayers: 4 } });
            clientSocket.on('server:room_created', (data) => {
                roomCode = data.roomCode;
                clientSocket.emit('client:join_room', { roomCode });
                otherClient.emit('client:join_room', { roomCode });
                resolve();
            });
        });

        // Set up mock active player (simulate server-side logic)
        activePlayerId = clientSocket.id!;
    });

    afterEach(() => {
        if (clientSocket && clientSocket.connected) clientSocket.disconnect();
        if (otherClient && otherClient.connected) otherClient.disconnect();
    });

    it('should allow only the active player to roll dice', async () => {
        // Listen for dice rolled event
        const diceRollPromise = new Promise<void>((resolve, reject) => {
            clientSocket.on('server:dice_rolled', (data) => {
                expect(data).toHaveProperty('player', activePlayerId);
                expect(Array.isArray(data.result)).toBe(true);
                expect(data.result.length).toBe(2);
                const sum = data.result[0] + data.result[1];
                expect(sum).toBeGreaterThanOrEqual(2);
                expect(sum).toBeLessThanOrEqual(12);
                resolve();
            });
            clientSocket.on('server:action_invalid', (data) => {
                reject(new Error('Active player should not be rejected'));
            });
            setTimeout(() => reject(new Error('Dice roll event timeout')), 5000);
        });
        clientSocket.emit('client:roll_dice', {});
        await diceRollPromise;
    });

    it('should reject dice roll from non-active player', async () => {
        const invalidPromise = new Promise<void>((resolve, reject) => {
            otherClient.on('server:action_invalid', (data) => {
                expect(data).toHaveProperty('reason');
                resolve();
            });
            otherClient.on('server:dice_rolled', () => {
                reject(new Error('Non-active player should not receive dice_rolled'));
            });
            setTimeout(() => reject(new Error('No rejection for non-active player')), 5000);
        });
        otherClient.emit('client:roll_dice', {});
        await invalidPromise;
    });

    it('should reject dice roll if not in correct phase', async () => {
        const invalidPromise = new Promise<void>((resolve, reject) => {
            clientSocket.on('server:action_invalid', (data) => {
                expect(data).toHaveProperty('reason');
                resolve();
            });
            setTimeout(() => reject(new Error('No rejection for wrong phase')), 5000);
        });
        clientSocket.emit('client:roll_dice', { forceInvalidPhase: true });
        await invalidPromise;
    });

    it('should broadcast dice roll result to all clients in the room', async () => {
        const clientReceived = new Promise<void>((resolve) => {
            clientSocket.on('server:dice_rolled', (data) => {
                expect(data).toHaveProperty('player', activePlayerId);
                resolve();
            });
        });
        const otherReceived = new Promise<void>((resolve) => {
            otherClient.on('server:dice_rolled', (data) => {
                expect(data).toHaveProperty('player', activePlayerId);
                resolve();
            });
        });
        clientSocket.emit('client:roll_dice', {});
        await Promise.all([clientReceived, otherReceived]);
    });
});
