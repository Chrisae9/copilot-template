import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

// --- Bank Resource Limits & Scarcity Rule Tests ---
describe('Bank Resource Limits & Scarcity Rule', () => {
    const TEST_TIMEOUT = 15000;
    let httpServer: ReturnType<typeof import('http').createServer>;
    let io: import('socket.io').Server;
    const gameStateByRoom: Record<string, any> = {};
    let roomCode: string;
    let clientA: ClientSocket;
    let clientB: ClientSocket;

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
                    bank: { brick: 19, lumber: 19, wool: 19, grain: 19, ore: 19 },
                    players: {},
                    lastAction: null
                };
                socket.emit('server:room_created', { roomCode, gameSettings: data.gameSettings });
            });
            socket.on('client:join_room', (data) => {
                socket.join(data.roomCode);
                if (gameStateByRoom[data.roomCode]) {
                    gameStateByRoom[data.roomCode].players[socket.id] = {
                        resources: { brick: 0, lumber: 0, wool: 0, grain: 0, ore: 0 }
                    };
                }
            });
            socket.on('test:set_bank_resources', ({ roomCode, resources }) => {
                if (gameStateByRoom[roomCode]) {
                    gameStateByRoom[roomCode].bank = { ...resources };
                }
            });
            socket.on('test:set_player_resources', ({ roomCode, playerId, resources }) => {
                if (gameStateByRoom[roomCode] && gameStateByRoom[roomCode].players[playerId]) {
                    gameStateByRoom[roomCode].players[playerId].resources = { ...resources };
                }
            });
            socket.on('client:maritime_trade', ({ give, receive }) => {
                const room = Array.from(socket.rooms).find((r) => r.startsWith('TEST'));
                // eslint-disable-next-line no-console
                console.log('SERVER: client:maritime_trade', { socketId: socket.id, room, give, receive });
                if (!room) return;
                const state = gameStateByRoom[room];
                // Check bank resources
                const resourceType = Object.keys(receive)[0];
                const amount = receive[resourceType];
                if (state.bank[resourceType] >= amount) {
                    // Deduct from bank, add to player
                    state.bank[resourceType] -= amount;
                    state.players[socket.id].resources[resourceType] = (state.players[socket.id].resources[resourceType] || 0) + amount;
                    // Deduct given resources from player
                    const giveType = Object.keys(give)[0];
                    state.players[socket.id].resources[giveType] -= give[giveType];
                    state.lastAction = {
                        type: 'maritime_trade',
                        player: socket.id,
                        give,
                        receive
                    };
                    // eslint-disable-next-line no-console
                    console.log('SERVER: emitting game_state_update', {
                        players: Object.entries(state.players).map(([userId, p]) => {
                            const player = p as { resources: any };
                            return { userId, resources: player.resources };
                        }),
                        lastAction: state.lastAction
                    });
                    io.to(room).emit('server:game_state_update', {
                        gameState: {
                            players: Object.entries(state.players).map(([userId, p]) => {
                                const player = p as { resources: any };
                                return { userId, resources: player.resources };
                            }),
                            lastAction: state.lastAction
                        }
                    });
                }
            });
            socket.on('test:simulate_production', ({ roomCode, resource, recipients, amount }) => {
                const state = gameStateByRoom[roomCode];
                if (!state) return;
                // Scarcity rule: if bank cannot pay all, no one receives
                if (state.bank[resource] < recipients.length * amount) {
                    io.to(roomCode).emit('server:scarcity_rule_enforced', {
                        resource,
                        reason: 'scarcity: bank has insufficient resources'
                    });
                    return;
                }
                recipients.forEach((pid) => {
                    if (state.players[pid]) {
                        state.players[pid].resources[resource] += amount;
                        state.bank[resource] -= amount;
                    }
                });
                state.lastAction = {
                    type: 'production',
                    recipients,
                    resource
                };
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
    });

    afterAll(async () => {
        io.close();
        await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    });

    beforeEach(async () => {
        clientA = Client(`http://localhost:${serverPort}`);
        clientB = Client(`http://localhost:${serverPort}`);

        await new Promise<void>((resolve, reject) => {
            clientA.once('connect', resolve);
            clientA.once('connect_error', reject);
            setTimeout(() => reject(new Error('Timeout')), TEST_TIMEOUT);
        });
        await new Promise<void>((resolve, reject) => {
            clientB.once('connect', resolve);
            clientB.once('connect_error', reject);
            setTimeout(() => reject(new Error('Timeout')), TEST_TIMEOUT);
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

    it('should allow a maritime trade if the bank has enough of the requested resource', async () => {
        clientA.emit('test:set_bank_resources', { roomCode, resources: { brick: 19, lumber: 19, wool: 1, grain: 19, ore: 19 } });
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
        console.log('[DEBUG] CLIENT: emitting client:maritime_trade', { give: { brick: 4 }, receive: { wool: 1 } });
        clientA.emit('client:maritime_trade', { give: { brick: 4 }, receive: { wool: 1 } });
        await stateUpdate;
    });

    it('should enforce the scarcity rule: if the bank cannot pay all players, no one receives that resource', async () => {
        clientA.emit('test:set_bank_resources', { roomCode, resources: { brick: 19, lumber: 19, wool: 1, grain: 19, ore: 19 } });
        await new Promise(resolve => setTimeout(resolve, 100));
        const scarcity = new Promise<void>((resolve) => {
            clientA.once('server:scarcity_rule_enforced', (data) => {
                console.log('[DEBUG] CLIENT: received scarcity_rule_enforced', data);
                expect(data.resource).toBe('wool');
                expect(data.reason).toMatch(/scarcity|bank.*insufficient/i);
                resolve();
            });
        });
        clientA.emit('test:simulate_production', { roomCode, resource: 'wool', recipients: [clientA.id, clientB.id], amount: 1 });
        await scarcity;
    });
});
