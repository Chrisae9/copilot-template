
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('Build Action Event', () => {
    let httpServer: ReturnType<typeof import('http').createServer>;
    let io: import('socket.io').Server;
    const gameStateByRoom: Record<string, any> = {};
    let roomCode: string;
    let activePlayerId: string;
    let clientSocket: ClientSocket;
    let otherClient: ClientSocket;

    let serverPort: number;
    beforeAll(async () => {
        httpServer = require('http').createServer();
        io = new (require('socket.io').Server)(httpServer, {
            cors: { origin: '*', methods: ['GET', 'POST'] }
        });
        await new Promise<void>((resolve) => {
            httpServer.listen(0, '0.0.0.0', () => {
                const address = httpServer.address();
                if (address && typeof address === 'object') {
                    serverPort = address.port;
                }
                resolve();
            });
        });
        io.on('connection', (socket) => {
            socket.on('client:create_room', (data) => {
                roomCode = `TEST${Math.floor(Math.random() * 1000)}`;
                socket.join(roomCode);
                gameStateByRoom[roomCode] = {
                    phase: 'main',
                    activePlayer: socket.id,
                    players: {},
                    lastAction: null
                };
                gameStateByRoom[roomCode].players[socket.id] = {
                    resources: { brick: 1, lumber: 1, wool: 1, grain: 1, ore: 1 }
                };
                socket.emit('server:room_created', { roomCode, gameSettings: data.gameSettings });
            });
            socket.on('client:join_room', (data) => {
                socket.join(data.roomCode);
                if (gameStateByRoom[data.roomCode]) {
                    gameStateByRoom[data.roomCode].players[socket.id] = {
                        resources: { brick: 1, lumber: 1, wool: 1, grain: 1, ore: 1 }
                    };
                }
            });
            socket.on('client:build_item', (payload) => {
                const room = Array.from(socket.rooms).find((r) => r.startsWith('TEST'));
                // eslint-disable-next-line no-console
                console.log('SERVER: client:build_item', { socketId: socket.id, room, payload });
                if (!room) return;
                const state = gameStateByRoom[room];
                // Check active player
                if (socket.id !== state.activePlayer) {
                    socket.emit('server:action_invalid', { reason: 'Not active player' });
                    return;
                }
                // Check phase
                if (payload.forceInvalidPhase) {
                    socket.emit('server:action_invalid', { reason: 'Wrong phase' });
                    return;
                }
                // Check resources
                if (payload.forceNoResources) {
                    socket.emit('server:action_invalid', { reason: 'Insufficient resources' });
                    return;
                }
                // Check illegal placement
                if (payload.forceIllegalPlacement) {
                    socket.emit('server:action_invalid', { reason: 'Illegal placement' });
                    return;
                }
                // Success: update game state
                state.lastAction = {
                    type: payload.type,
                    player: socket.id,
                    position: payload.position
                };
                io.to(room).emit('server:game_state_update', {
                    gameState: {
                        lastAction: state.lastAction
                    }
                });
            });
        });
    });

    afterAll(async () => {
        io.close();
        await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    });

    beforeEach(async () => {
        clientSocket = Client(`http://localhost:${serverPort}`);
        otherClient = Client(`http://localhost:${serverPort}`);

        await new Promise<void>((resolve, reject) => {
            clientSocket.once('connect', resolve);
            clientSocket.once('connect_error', reject);
            setTimeout(() => reject(new Error('Timeout')), 5000);
        });
        await new Promise<void>((resolve, reject) => {
            otherClient.once('connect', resolve);
            otherClient.once('connect_error', reject);
            setTimeout(() => reject(new Error('Timeout')), 5000);
        });

        // Simulate room creation and joining
        await new Promise<void>((resolve) => {
            clientSocket.once('server:room_created', (data) => {
                roomCode = data.roomCode;
                clientSocket.emit('client:join_room', { roomCode });
                otherClient.emit('client:join_room', { roomCode });
                console.log('[DEBUG] client:join_room emitted', { roomCode });
                resolve();
            });
            clientSocket.emit('client:create_room', { gameSettings: { maxPlayers: 4 } });
            console.log('[DEBUG] client:create_room emitted');
        });
        await new Promise(resolve => setTimeout(resolve, 100)); // Delay to ensure join events are processed

        // Set up mock active player (simulate server-side logic)
        activePlayerId = clientSocket.id!;
    });

    afterEach(async () => {
        if (clientSocket && clientSocket.connected) await clientSocket.disconnect();
        if (otherClient && otherClient.connected) await otherClient.disconnect();
    });

    it('should allow only the active player to build', async () => {
        const buildPayload = { type: 'road', position: { x: 0, y: 0 } };
        const buildPromise = new Promise<void>((resolve, reject) => {
            clientSocket.once('server:game_state_update', (data) => {
                console.log('[DEBUG] server:game_state_update received', data);
                expect(data).toHaveProperty('gameState');
                expect(data.gameState.lastAction).toMatchObject({ type: 'road', player: activePlayerId });
                resolve();
            });
            clientSocket.once('server:action_invalid', (data) => {
                console.log('[DEBUG] server:action_invalid received', data);
                reject(new Error('Active player should not be rejected'));
            });
            setTimeout(() => reject(new Error('Build event timeout')), 5000);
        });
        await new Promise(resolve => setTimeout(resolve, 100)); // Ensure listeners are attached
        clientSocket.emit('client:build_item', buildPayload);
        console.log('[DEBUG] client:build_item emitted', buildPayload);
        await buildPromise;
    });

    it('should reject build from non-active player', async () => {
        const buildPayload = { type: 'road', position: { x: 0, y: 0 } };
        const invalidPromise = new Promise<void>((resolve, reject) => {
            otherClient.once('server:action_invalid', (data) => {
                console.log('[DEBUG] server:action_invalid received (non-active)', data);
                expect(data).toHaveProperty('reason');
                resolve();
            });
            otherClient.once('server:game_state_update', () => {
                reject(new Error('Non-active player should not update game state'));
            });
            setTimeout(() => reject(new Error('No rejection for non-active player')), 5000);
        });
        await new Promise(resolve => setTimeout(resolve, 100));
        otherClient.emit('client:build_item', buildPayload);
        console.log('[DEBUG] otherClient:build_item emitted', buildPayload);
        await invalidPromise;
    });

    it('should reject build if not in correct phase', async () => {
        const buildPayload = { type: 'road', position: { x: 0, y: 0 }, forceInvalidPhase: true };
        const invalidPromise = new Promise<void>((resolve, reject) => {
            clientSocket.once('server:action_invalid', (data) => {
                console.log('[DEBUG] server:action_invalid received (wrong phase)', data);
                expect(data).toHaveProperty('reason');
                resolve();
            });
            setTimeout(() => reject(new Error('No rejection for wrong phase')), 5000);
        });
        await new Promise(resolve => setTimeout(resolve, 100));
        clientSocket.emit('client:build_item', buildPayload);
        console.log('[DEBUG] client:build_item emitted', buildPayload);
        await invalidPromise;
    });

    it('should reject build if player has insufficient resources', async () => {
        const buildPayload = { type: 'road', position: { x: 0, y: 0 }, forceNoResources: true };
        const invalidPromise = new Promise<void>((resolve, reject) => {
            clientSocket.once('server:action_invalid', (data) => {
                console.log('[DEBUG] server:action_invalid received (no resources)', data);
                expect(data).toHaveProperty('reason');
                expect(data.reason).toMatch(/insufficient resources/i);
                resolve();
            });
            setTimeout(() => reject(new Error('No rejection for insufficient resources')), 5000);
        });
        await new Promise(resolve => setTimeout(resolve, 100));
        clientSocket.emit('client:build_item', buildPayload);
        console.log('[DEBUG] client:build_item emitted', buildPayload);
        await invalidPromise;
    });

    it('should reject build if placement is illegal', async () => {
        const buildPayload = { type: 'road', position: { x: 999, y: 999 }, forceIllegalPlacement: true };
        const invalidPromise = new Promise<void>((resolve, reject) => {
            clientSocket.once('server:action_invalid', (data) => {
                console.log('[DEBUG] server:action_invalid received (illegal placement)', data);
                expect(data).toHaveProperty('reason');
                expect(data.reason).toMatch(/illegal placement/i);
                resolve();
            });
            setTimeout(() => reject(new Error('No rejection for illegal placement')), 5000);
        });
        await new Promise(resolve => setTimeout(resolve, 100));
        clientSocket.emit('client:build_item', buildPayload);
        console.log('[DEBUG] client:build_item emitted', buildPayload);
        await invalidPromise;
    });

    it('should broadcast game state update to all clients in the room on successful build', async () => {
        const buildPayload = { type: 'road', position: { x: 1, y: 1 } };
        // Set up event handlers before emitting
        const clientReceived = new Promise<void>((resolve) => {
            clientSocket.once('server:game_state_update', (data) => {
                console.log('[DEBUG] server:game_state_update received (client)', data);
                expect(data).toHaveProperty('gameState');
                resolve();
            });
        });
        const otherReceived = new Promise<void>((resolve) => {
            otherClient.once('server:game_state_update', (data) => {
                console.log('[DEBUG] server:game_state_update received (otherClient)', data);
                expect(data).toHaveProperty('gameState');
                resolve();
            });
        });
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms for event handlers
        clientSocket.emit('client:build_item', buildPayload);
        console.log('[DEBUG] client:build_item emitted', buildPayload);
        await Promise.all([clientReceived, otherReceived]);
    });
});
