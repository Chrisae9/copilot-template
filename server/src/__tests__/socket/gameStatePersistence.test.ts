import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterEach, beforeEach, describe, it } from 'vitest';
import '../setup.ts';

let serverPort: number;

// --- Game State Persistence (Save/Load) Tests ---
describe('Game State Persistence', () => {
    let roomCode: string;
    let activePlayerId: string;
    let clientSocket: ClientSocket;
    let otherClient: ClientSocket;

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
        clientSocket = Client(`http://localhost:${serverPort}`);
        otherClient = Client(`http://localhost:${serverPort}`);

        await new Promise<void>((resolve, reject) => {/* ... */ });
        await new Promise<void>((resolve, reject) => {/* ... */ });

        await new Promise<void>((resolve) => {/* ... */ });

        activePlayerId = clientSocket.id!;
    });

    afterEach(() => {
        if (clientSocket && clientSocket.connected) clientSocket.disconnect();
        if (otherClient && otherClient.connected) otherClient.disconnect();
    });

    it('should save the current game state', async () => {
        // Build to create a state
        const buildPayload = { type: 'road', position: { x: 2, y: 2 } };
        await new Promise<void>((resolve) => {/* ... */ });
        // Save state
        const savePromise = new Promise<void>((resolve, reject) => {/* ... */ });
        await savePromise;
    });

    it('should load the last saved game state and broadcast to all clients', async () => {
        // Build and save
        const buildPayload = { type: 'road', position: { x: 3, y: 3 } };
        await new Promise<void>((resolve) => {/* ... */ });
        await new Promise<void>((resolve) => {/* ... */ });
        // Load state
        const clientReceived = new Promise<void>((resolve) => {/* ... */ });
        const otherReceived = new Promise<void>((resolve) => {/* ... */ });
        clientSocket.emit('client:load_game_state');
        await Promise.all([clientReceived, otherReceived]);
    });

    it('should handle loading when no state is saved', async () => {
        const loadPromise = new Promise<void>((resolve, reject) => {/* ... */ });
        await loadPromise;
    });
});
