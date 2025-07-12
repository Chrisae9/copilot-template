import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '../setup.ts';

let serverPort: number;

describe('Game Event Handling', () => {
    let roomCode: string;
    let clientA: ClientSocket;

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
        await new Promise<void>((resolve, reject) => {
            clientA.on('connect', resolve);
            clientA.on('connect_error', reject);
            setTimeout(() => reject(new Error('Timeout')), 5000);
        });
        // Create room and join clientA
        await new Promise<void>((resolve) => {
            clientA.emit('client:create_room', { gameSettings: { maxPlayers: 4 } });
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


    it('should route valid events and not emit error', async () => {
        const buildPayload = { type: 'road', position: { x: 0, y: 0 } };
        const stateUpdate = new Promise<void>((resolve, reject) => {
            clientA.on('server:game_state_update', (data) => {
                expect(data).toHaveProperty('gameState');
                resolve();
            });
            clientA.on('server:action_invalid', (data) => {
                reject(new Error('Should not emit action_invalid for valid event'));
            });
            setTimeout(() => reject(new Error('No game_state_update received')), 2000);
        });
        clientA.emit('client:build_item', buildPayload);
        await stateUpdate;
    });
});
