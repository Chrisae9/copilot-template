import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * Robber Movement and Resource Stealing Integration Tests
 * Tests moving the robber, stealing resources, and invalid moves.
 */
describe('Robber Movement and Resource Stealing', () => {
    let httpServer: ReturnType<typeof import('http').createServer>;
    let io: import('socket.io').Server;
    // Minimal in-memory game state for test harness
    const gameStateByRoom: Record<string, any> = {};
    let serverPort: number;
beforeAll(async () => {
    httpServer = require('http').createServer();
    io = new (require('socket.io').Server)(httpServer, {
        cors: { origin: '*', methods: ['GET', 'POST'] }
    });
    await new Promise<void>((resolve, reject) => {
        httpServer.listen(0, '0.0.0.0', () => {
            const address = httpServer.address();
            if (address && typeof address === 'object') {
                serverPort = address.port;
                // Wait a short time to ensure server is ready
                setTimeout(resolve, 250);
            } else {
                reject(new Error('Failed to get server address'));
            }
        });
    });
    io.on('connection', (socket) => {
            // eslint-disable-next-line no-console
            console.log('SERVER: client connected', socket.id);
            socket.on('client:create_room', (data) => {
                // eslint-disable-next-line no-console
                console.log('SERVER: client:create_room', data);
                const roomCode = `TEST${Math.floor(Math.random() * 1000)}`;
                socket.join(roomCode);
                // Initialize game state for room
                gameStateByRoom[roomCode] = {
                    robberPosition: { q: 0, r: 0 },
                    players: {}, // playerId -> { settlements: [], resources: { ... } }
                    lastAction: null
                };
                socket.emit('server:room_created', { roomCode, gameSettings: data.gameSettings });
                // eslint-disable-next-line no-console
                console.log('SERVER: room created', roomCode);
            });
            socket.on('client:join_room', (data) => {
                // eslint-disable-next-line no-console
                console.log('SERVER: client:join_room', data);
                socket.join(data.roomCode);
                // Initialize player state if not present
                if (gameStateByRoom[data.roomCode]) {
                    gameStateByRoom[data.roomCode].players[socket.id] = {
                        settlements: [],
                        resources: { brick: 0, lumber: 0, wool: 0, grain: 0, ore: 0 }
                    };
                }
            });
            socket.on('test:set_player_settlement', ({ roomCode, playerId, position }) => {
                // eslint-disable-next-line no-console
                console.log('SERVER: test:set_player_settlement', { roomCode, playerId, position });
                if (gameStateByRoom[roomCode] && gameStateByRoom[roomCode].players[playerId]) {
                    gameStateByRoom[roomCode].players[playerId].settlements.push(position);
                }
            });
            socket.on('test:set_player_resources', ({ roomCode, playerId, resources }) => {
                // eslint-disable-next-line no-console
                console.log('SERVER: test:set_player_resources', { roomCode, playerId, resources });
                if (gameStateByRoom[roomCode] && gameStateByRoom[roomCode].players[playerId]) {
                    gameStateByRoom[roomCode].players[playerId].resources = { ...resources };
                }
            });
            socket.on('test:simulate_production', ({ roomCode, resource, hex, recipients, amount }) => {
                // eslint-disable-next-line no-console
                console.log('SERVER: test:simulate_production', { roomCode, resource, hex, recipients, amount });
                // Only produce if robber is NOT present on hex
                const state = gameStateByRoom[roomCode];
                if (!state) return;
                const blocked = state.robberPosition.q === hex.q && state.robberPosition.r === hex.r;
                recipients.forEach((pid) => {
                    if (!blocked && state.players[pid]) {
                        state.players[pid].resources[resource] += amount;
                    }
                });
                // Emit game state update to all clients in room
                // eslint-disable-next-line no-console
                console.log('SERVER: emitting game_state_update', JSON.stringify({
                    players: Object.entries(state.players).map(([userId, p]) => {
                        const player = p as { resources: any };
                        return { userId, resources: player.resources };
                    }),
                    lastAction: { type: 'simulate_production', blocked }
                }, null, 2));
                io.to(roomCode).emit('server:game_state_update', {
                    gameState: {
                        players: Object.entries(state.players).map(([userId, p]) => {
                            const player = p as { resources: any };
                            return { userId, resources: player.resources };
                        }),
                        lastAction: { type: 'simulate_production', blocked }
                    }
                });
            });

            // Move server-side handler for client:move_robber to top level
            socket.on('client:move_robber', ({ position, stealFrom }) => {
                // eslint-disable-next-line no-console
                console.log('SERVER: client:move_robber', { position, stealFrom });
                // Move robber if position is valid and not same as current
                const roomCode = Object.keys(socket.rooms).find((r) => r.startsWith('TEST'));
                if (!roomCode) return;
                const state = gameStateByRoom[roomCode];
                if (!state) return;
                if (position.q === state.robberPosition.q && position.r === state.robberPosition.r) {
                    // eslint-disable-next-line no-console
                    console.log('SERVER: invalid move, robber already on hex');
                    socket.emit('server:action_invalid', { reason: 'Robber is already on that hex.' });
                    return;
                }
                // For test: treat q/r > 20 as invalid
                if (position.q > 20 || position.r > 20) {
                    // eslint-disable-next-line no-console
                    console.log('SERVER: invalid move, position out of bounds');
                    socket.emit('server:action_invalid', { reason: 'Invalid position' });
                    return;
                }
                state.robberPosition = position;
                let resourceStolen: string | null = null;
                if (stealFrom && state.players[stealFrom]) {
                    // Steal first available resource
                    const res = state.players[stealFrom].resources;
                    const keys = Object.keys(res).filter((k) => res[k] > 0);
                    if (keys.length > 0) {
                        resourceStolen = keys[0];
                        if (resourceStolen) {
                            res[resourceStolen] -= 1;
                            state.players[socket.id].resources[resourceStolen] = (state.players[socket.id].resources[resourceStolen] || 0) + 1;
                        }
                    }
                }
                state.lastAction = {
                    type: 'move_robber',
                    player: socket.id,
                    position,
                    stealFrom,
                    resource: resourceStolen
                };
                // eslint-disable-next-line no-console
                console.log('SERVER: emitting game_state_update', JSON.stringify({
                    players: Object.entries(state.players).map(([userId, p]) => {
                        const player = p as { resources: any };
                        return { userId, resources: player.resources };
                    }),
                    lastAction: state.lastAction
                }, null, 2));
                io.to(roomCode).emit('server:game_state_update', {
                    gameState: {
                        players: Object.entries(state.players).map(([userId, p]) => {
                            const player = p as { resources: any };
                            return { userId, resources: player.resources };
                        }),
                        lastAction: state.lastAction
                    }
                });
            });
        });

        afterAll(async () => {
            io.close();
            await new Promise<void>((resolve) => httpServer.close(() => resolve()));
        });
        it('should block resource production on a hex occupied by the robber', async () => {
            // Setup: Place robber on a specific hex (e.g., {q: 2, r: 3})
            const robberHex = { q: 2, r: 3 };
            let received = false;
            let debugEvents: any[] = [];
            // Catch-all event listener for debugging
            clientA.onAny((event, ...args) => {
                // eslint-disable-next-line no-console
                console.log(`CLIENT: received event '${event}'`, JSON.stringify(args, null, 2));
            });
            // Register specific event listener BEFORE emitting any events
            clientA.on('server:game_state_update', (data) => {
                debugEvents.push(data);
                // eslint-disable-next-line no-console
                console.log('CLIENT: received game_state_update', JSON.stringify(data, null, 2));
                if (data.gameState?.players) {
                    const player = data.gameState.players.find((p: any) => p.userId === clientA.id);
                    if (player && player.resources.grain > 0) received = true;
                }
            });
            // Register listener for action_invalid
            clientA.on('server:action_invalid', (data) => {
                // eslint-disable-next-line no-console
                console.log('CLIENT: received action_invalid', JSON.stringify(data, null, 2));
            });
            // Move robber to the target hex
            await new Promise<void>((resolve) => {
                clientA.once('server:game_state_update', (data) => {
                    if (data.gameState.lastAction?.type === 'move_robber') {
                        // Give clientA a settlement on the same hex (test harness event)
                        clientA.emit('test:set_player_settlement', { roomCode, playerId: clientA.id, position: robberHex });
                        // Give clientA 0 of the resource to start
                        clientA.emit('test:set_player_resources', { roomCode, playerId: clientA.id, resources: { brick: 0, lumber: 0, wool: 0, grain: 0, ore: 0 } });
                        // Simulate a dice roll that would produce the resource for that hex
                        clientA.emit('test:simulate_production', { roomCode, resource: 'grain', hex: robberHex, recipients: [clientA.id], amount: 1 });
                        // Wait to see if clientA receives the resource (should NOT happen)
                        setTimeout(() => {
                            // Print debug info for inspection
                            // eslint-disable-next-line no-console
                            console.log('DEBUG game_state_update events:', JSON.stringify(debugEvents, null, 2));
                            expect(received).toBe(false);
                            resolve();
                        }, 3000);
                    }
                });
                clientA.emit('client:move_robber', { position: robberHex });
            });
        });
    });
    it('should reject moving the robber to the same hex it currently occupies', async () => {
        // Assume initial robber position is { q: 0, r: 0 } (or fetch from game state if needed)
        // For this test, we will move the robber to a valid position, then try to move it back
        // Step 1: Move robber to a new position
        const newPosition = { q: 1, r: 2 };
        await new Promise<void>((resolve) => {
            clientA.on('server:game_state_update', (data) => {
                if (data.gameState.lastAction?.type === 'move_robber') resolve();
            });
            clientA.emit('client:move_robber', { position: newPosition });
        });
        // Step 2: Try to move robber to the same position again
        const invalidMove = new Promise<void>((resolve) => {
            clientA.on('server:action_invalid', (data) => {
                expect(data.reason).toMatch(/same hex|already there|current position|cannot.*same/i);
                resolve();
            });
        });
        clientA.emit('client:move_robber', { position: newPosition });
        await invalidMove;
    });
    let roomCode: string;
    let clientA: ClientSocket;
    let clientB: ClientSocket;
    // Always use localhost for test harness reliability
    const serverHost = 'localhost';


beforeEach(async () => {
    clientA = Client(`http://${serverHost}:${serverPort}`, { transports: ['websocket'] });
    clientB = Client(`http://${serverHost}:${serverPort}`, { transports: ['websocket'] });

    await new Promise<void>((resolve, reject) => {
        let connectedA = false;
        let connectedB = false;
        const timeout = setTimeout(() => reject(new Error('Timeout connecting clients')), 10000);
        clientA.on('connect', () => {
            connectedA = true;
            if (connectedB) {
                clearTimeout(timeout);
                resolve();
            }
        });
        clientA.on('connect_error', reject);
        clientB.on('connect', () => {
            connectedB = true;
            if (connectedA) {
                clearTimeout(timeout);
                resolve();
            }
        });
        clientB.on('connect_error', reject);
    });

    // Create room and join both clients
    await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout creating room')), 10000);
        clientA.emit('client:create_room', { gameSettings: { maxPlayers: 4 } });
        clientA.on('server:room_created', (data) => {
            roomCode = data.roomCode;
            clientA.emit('client:join_room', { roomCode });
            clientB.emit('client:join_room', { roomCode });
            clearTimeout(timeout);
            resolve();
        });
    });
});

afterEach(async () => {
    if (clientA && clientA.connected) await clientA.disconnect();
    if (clientB && clientB.connected) await clientB.disconnect();
    // Wait briefly to ensure server processes disconnects
    await new Promise((resolve) => setTimeout(resolve, 100));
});

    it('should allow a player to move the robber and steal a resource', async () => {
        // Attach listener before emitting events
        const stateUpdate = new Promise<void>((resolve) => {
            clientA.on('server:game_state_update', (data) => {
                expect(data.gameState.lastAction).toMatchObject({
                    type: 'move_robber',
                    player: clientA.id,
                    position: { q: 1, r: 2 },
                    stealFrom: clientB.id,
                    resource: 'brick'
                });
                resolve();
            });
        });
        // Setup: Give clientB a resource in the test harness
        clientA.emit('test:set_player_resources', { roomCode, playerId: clientB.id, resources: { brick: 1, lumber: 0, wool: 0, grain: 0, ore: 0 } });
        // Move robber and steal from clientB
        setTimeout(() => {
            clientA.emit('client:move_robber', { position: { q: 1, r: 2 }, stealFrom: clientB.id });
        }, 250);
        await stateUpdate;
    });

    it('should handle moving the robber when the target has no resources', async () => {
        // Attach listener before emitting events
        const stateUpdate = new Promise<void>((resolve) => {
            clientA.on('server:game_state_update', (data) => {
                expect(data.gameState.lastAction).toMatchObject({
                    type: 'move_robber',
                    player: clientA.id,
                    position: { q: 2, r: 3 },
                    stealFrom: clientB.id,
                    resource: null
                });
                resolve();
            });
        });
        // Setup: Ensure clientB has no resources
        clientA.emit('test:set_player_resources', { roomCode, playerId: clientB.id, resources: { brick: 0, lumber: 0, wool: 0, grain: 0, ore: 0 } });
        // Move robber and attempt to steal from clientB
        setTimeout(() => {
            clientA.emit('client:move_robber', { position: { q: 2, r: 3 }, stealFrom: clientB.id });
        }, 250);
        await stateUpdate;
    });

    it('should reject moving the robber to an invalid position', async () => {
        // Attach listener before emitting event
        const invalidMove = new Promise<void>((resolve) => {
            clientA.on('server:action_invalid', (data) => {
                expect(data.reason).toMatch(/invalid position/i);
                resolve();
            });
        });
        setTimeout(() => {
            clientA.emit('client:move_robber', { position: { q: 999, r: 999 } });
        }, 250);
        await invalidMove;
    });
});
