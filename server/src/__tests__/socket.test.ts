


console.log('Running socket.test.ts');
/**
 * Socket.IO integration tests
 * Tests real-time communication functionality
 */

import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import './setup.ts';

describe('Socket.IO Integration Tests', () => {


    let httpServer: ReturnType<typeof createServer>;
    let io: Server;
    let serverPort: number;
    let clientSocket: ClientSocket;


    beforeEach(async () => {
        // Create test server
        httpServer = createServer();
        io = new Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        // Initialize testRooms for this test run
        io['__testRooms'] = {};

        // Use dynamic port assignment to avoid conflicts
        await new Promise<void>((resolve) => {
            httpServer.listen(0, '0.0.0.0', () => {
                const address = httpServer.address();
                if (address && typeof address === 'object') {
                    serverPort = address.port;
                } else {
                    serverPort = 4000; // fallback
                }
                resolve();
            });
        });

        // Set up Socket.IO connection handler (mimic our main server)
        io.on('connection', (socket) => {
            console.log(`👤 Test user connected: ${socket.id}`);

            socket.on('disconnect', () => {
                console.log(`👤 Test user disconnected: ${socket.id}`);
            });

            // Basic test event (same as main server)
            socket.emit('server:welcome', {
                message: 'Welcome to the Catan-inspired game server!',
                socketId: socket.id
            });

            // Test game events
            socket.on('client:join_room', (data) => {
                if (!data || !data.roomCode) return;
                socket.emit('server:room_joined', {
                    roomCode: data.roomCode,
                    success: true
                });
            });

            socket.on('client:create_room', (data) => {
                if (!data || !data.gameSettings) return;
                const roomCode = `TEST${Math.floor(Math.random() * 1000)}`;
                socket.emit('server:room_created', {
                    roomCode,
                    gameSettings: data.gameSettings
                });
                // Server startup should not be here; already started in beforeEach
            });

            socket.on('client:test_echo', (data) => {
                socket.emit('server:test_echo', data);
            });

            // --- Dice Roll Event Handler (TDD implementation) ---
            // In-memory game state for test harness
            // Define clientA and clientB for test harness
            let clientA: ClientSocket;
            let clientB: ClientSocket;
            const testRooms = io['__testRooms'] || {};

            // Helper: join room and track sockets
            socket.on('client:join_room', (data) => {
                if (!data || !data.roomCode) return;
                socket.join(data.roomCode);
                if (!testRooms[data.roomCode]) {
                    testRooms[data.roomCode] = {
                        activePlayerId: socket.id,
                        phase: 'roll',
                        sockets: new Set()
                    };
                }
                if (!testRooms[data.roomCode].sockets) {
                    testRooms[data.roomCode].sockets = new Set();
                }
                testRooms[data.roomCode].sockets.add(socket.id);
                // Emit player joined event to all in room
                io.to(data.roomCode).emit('server:player_joined', { playerId: socket.id, roomCode: data.roomCode });
            });
            // Leave room handler for test harness
            socket.on('client:leave_room', (data) => {
                if (!data || !data.roomCode) return;
                socket.leave(data.roomCode);
                if (testRooms[data.roomCode] && testRooms[data.roomCode].sockets) {
                    testRooms[data.roomCode].sockets.delete(socket.id);
                    // Emit player left event to all in room
                    io.to(data.roomCode).emit('server:player_left', { playerId: socket.id, roomCode: data.roomCode });
                }
            });
            describe('Player Join/Leave Notifications', () => {
                let roomCode: string;
                let clientA: ClientSocket;
                let clientB: ClientSocket;

                beforeEach(async function () {
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

                    // Create room and join with clientA
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
                    if (clientB && clientB.connected) clientB.disconnect();
                });

                it('should notify all clients when a player joins', async () => {
                    // Listen for player_joined on both clients
                    const aReceived = new Promise<void>((resolve) => {
                        clientA.on('server:player_joined', (data) => {
                            if (data.playerId === clientB.id && data.roomCode === roomCode) resolve();
                        });
                    });
                    const bReceived = new Promise<void>((resolve) => {
                        clientB.on('server:player_joined', (data) => {
                            if (data.playerId === clientB.id && data.roomCode === roomCode) resolve();
                        });
                    });
                    // clientB joins
                    clientB.emit('client:join_room', { roomCode });
                    await Promise.all([aReceived, bReceived]);
                });

                it('should notify all clients when a player leaves', async () => {
                    // clientB joins first
                    await new Promise<void>((resolve) => {
                        clientB.emit('client:join_room', { roomCode });
                        clientB.on('server:player_joined', (data) => {
                            if (data.playerId === clientB.id) resolve();
                        });
                    });
                    // Listen for player_left on both clients
                    const aReceived = new Promise<void>((resolve) => {
                        clientA.on('server:player_left', (data) => {
                            if (data.playerId === clientB.id && data.roomCode === roomCode) resolve();
                        });
                    });
                    const bReceived = new Promise<void>((resolve) => {
                        clientB.on('server:player_left', (data) => {
                            if (data.playerId === clientB.id && data.roomCode === roomCode) resolve();
                        });
                    });
                    // clientB leaves
                    clientB.emit('client:leave_room', { roomCode });
                    await Promise.all([aReceived, bReceived]);
                });
            });

            // Helper: create room
            socket.on('client:create_room', (data) => {
                if (!data || !data.gameSettings) return;
                const roomCode = `TEST${Math.floor(Math.random() * 1000)}`;
                socket.join(roomCode);
                testRooms[roomCode] = {
                    activePlayerId: socket.id,
                    phase: 'roll',
                    sockets: new Set([socket.id])
                };
                socket.emit('server:room_created', {
                    roomCode,
                    gameSettings: data.gameSettings
                });
            });

            // Dice roll event
            socket.on('client:roll_dice', (payload = {}) => {
                // Find the room this socket is in (simulate single room per test)
                const roomCode = Object.keys(testRooms).find(rc => testRooms[rc].sockets.has(socket.id));
                if (!roomCode) {
                    socket.emit('server:action_invalid', { reason: 'Not in a room' });
                    return;
                }
                const room = testRooms[roomCode];
                // Simulate phase check
                if (payload.forceInvalidPhase || room.phase !== 'roll') {
                    socket.emit('server:action_invalid', { reason: 'Not in roll phase' });
                    return;
                }
                // Only active player can roll
                if (socket.id !== room.activePlayerId) {
                    socket.emit('server:action_invalid', { reason: 'Not your turn' });
                    return;
                }
                // Generate dice roll (2d6)
                const die1 = Math.floor(Math.random() * 6) + 1;
                const die2 = Math.floor(Math.random() * 6) + 1;
                const result = [die1, die2];
                // Broadcast to all in room
                io.to(roomCode).emit('server:dice_rolled', {
                    player: socket.id,
                    result
                });
                // Advance phase (simulate, not needed for test)
                // room.phase = 'build';
            });

            // --- Build Action Event Handler (TDD implementation) ---
            socket.on('client:build_item', (payload = {}) => {
                const roomCode = Object.keys(testRooms).find(rc => testRooms[rc].sockets.has(socket.id));
                if (!roomCode) {
                    socket.emit('server:action_invalid', { reason: 'Not in a room' });
                    return;
                }
                const room = testRooms[roomCode];
                // Simulate phase check
                if (payload.forceInvalidPhase || room.phase !== 'build') {
                    socket.emit('server:action_invalid', { reason: 'Not in build phase' });
                    return;
                }
                // Only active player can build
                if (socket.id !== room.activePlayerId) {
                    socket.emit('server:action_invalid', { reason: 'Not your turn' });
                    return;
                }
                // Simulate resource check
                if (payload.forceNoResources) {
                    socket.emit('server:action_invalid', { reason: 'Insufficient resources' });
                    return;
                }
                // Simulate placement legality
                if (payload.forceIllegalPlacement) {
                    socket.emit('server:action_invalid', { reason: 'Illegal placement' });
                    return;
                }
                // Simulate game state update
                const gameState = {
                    lastAction: {
                        type: payload.type,
                        player: socket.id,
                        position: payload.position
                    },
                    // ...other state fields as needed for test
                };
                // Save game state in memory for persistence test
                if (!room.savedStates) room.savedStates = [];
                room.currentState = gameState;
                io.to(roomCode).emit('server:game_state_update', { gameState });
            });

            // --- Game State Persistence (Save/Load) ---
            // Save current game state for the room
            socket.on('client:save_game_state', () => {
                const roomCode = Object.keys(testRooms).find(rc => testRooms[rc].sockets.has(socket.id));
                if (!roomCode) {
                    socket.emit('server:action_invalid', { reason: 'Not in a room' });
                    return;
                }
                const room = testRooms[roomCode];
                if (!room.savedStates) room.savedStates = [];
                if (room.currentState) {
                    // Deep clone for safety
                    const stateCopy = JSON.parse(JSON.stringify(room.currentState));
                    room.savedStates.push(stateCopy);
                    socket.emit('server:game_state_saved', { success: true });
                } else {
                    socket.emit('server:game_state_saved', { success: false, reason: 'No current state' });
                }
            });

            // Load last saved game state for the room
            socket.on('client:load_game_state', () => {
                const roomCode = Object.keys(testRooms).find(rc => testRooms[rc].sockets.has(socket.id));
                if (!roomCode) {
                    socket.emit('server:action_invalid', { reason: 'Not in a room' });
                    return;
                }
                const room = testRooms[roomCode];
                if (room.savedStates && room.savedStates.length > 0) {
                    const lastState = room.savedStates[room.savedStates.length - 1];
                    room.currentState = JSON.parse(JSON.stringify(lastState));
                    io.to(roomCode).emit('server:game_state_update', { gameState: lastState });
                } else {
                    socket.emit('server:game_state_loaded', { success: false, reason: 'No saved state' });
                }
            });

            // --- Development Card Events (TDD implementation) ---
            // Simulate a dev card deck and player hands in testRooms
            socket.on('client:buy_dev_card', (payload = {}) => {
                const roomCode = Object.keys(testRooms).find(rc => testRooms[rc].sockets.has(socket.id));
                if (!roomCode) {
                    socket.emit('server:action_invalid', { reason: 'Not in a room' });
                    return;
                }
                const room = testRooms[roomCode];
                // Simulate resource check
                if (payload.forceNoResources) {
                    socket.emit('server:action_invalid', { reason: 'Insufficient resources' });
                    return;
                }
                // Simulate dev card deck and player hand
                if (!room.devDeck) room.devDeck = ['knight', 'victory_point', 'monopoly', 'year_of_plenty', 'road_building'];
                if (!room.playerDevCards) room.playerDevCards = {};
                if (!room.playerDevCards[socket.id]) room.playerDevCards[socket.id] = [];
                // Draw a card (always 'knight' for deterministic test)
                const card = 'knight';
                room.playerDevCards[socket.id].push(card);
                // Simulate game state update
                const gameState = {
                    lastAction: {
                        type: 'buy_dev_card',
                        player: socket.id,
                        cardType: card
                    },
                    // ...other state fields as needed for test
                };
                room.currentState = gameState;
                io.to(roomCode).emit('server:game_state_update', { gameState });
            });

            socket.on('client:play_dev_card', (payload = {}) => {
                const roomCode = Object.keys(testRooms).find(rc => testRooms[rc].sockets.has(socket.id));
                if (!roomCode) {
                    socket.emit('server:action_invalid', { reason: 'Not in a room' });
                    return;
                }
                const room = testRooms[roomCode];
                if (!room.playerDevCards) room.playerDevCards = {};
                if (!room.playerDevCards[socket.id]) room.playerDevCards[socket.id] = [];
                // Simulate phase check
                if (payload.forceInvalidPhase) {
                    socket.emit('server:action_invalid', { reason: 'Not in dev card phase' });
                    return;
                }
                // Check if player has the card
                const cardIdx = room.playerDevCards[socket.id].indexOf(payload.cardType);
                if (cardIdx === -1) {
                    socket.emit('server:action_invalid', { reason: 'No dev card to play' });
                    return;
                }
                // Remove card from hand
                room.playerDevCards[socket.id].splice(cardIdx, 1);
                // Simulate game state update
                const gameState = {
                    lastAction: {
                        type: 'play_dev_card',
                        player: socket.id,
                        cardType: payload.cardType
                    },
                    // ...other state fields as needed for test
                };
                room.currentState = gameState;
                io.to(roomCode).emit('server:game_state_update', { gameState });
            });

            // --- Robber Movement and Resource Stealing (TDD implementation) ---

            // Helper: set player resources for test
            socket.on('test:set_player_resources', ({ roomCode, playerId, resources }) => {
                if (!testRooms[roomCode]) testRooms[roomCode] = {};
                if (!testRooms[roomCode].playerResources) testRooms[roomCode].playerResources = {};
                testRooms[roomCode].playerResources[playerId] = { ...resources };
            });
            // Helper: set bank resources for test
            socket.on('test:set_bank_resources', ({ roomCode, resources }) => {
                if (!testRooms[roomCode]) testRooms[roomCode] = {};
                testRooms[roomCode].bankResources = { ...resources };
            });

            // Move robber event
            socket.on('client:move_robber', (payload = {}) => {
                const { position, stealFrom } = payload;
                const roomCode = Object.keys(testRooms).find(rc => testRooms[rc].sockets.has(socket.id));
                if (!roomCode) {
                    socket.emit('server:action_invalid', { reason: 'Not in a room' });
                    return;
                }
                // Only allow valid positions (simulate: q/r must be 0-5)
                if (!position || typeof position.q !== 'number' || typeof position.r !== 'number' || position.q < 0 || position.q > 5 || position.r < 0 || position.r > 5) {
                    socket.emit('server:action_invalid', { reason: 'Invalid position' });
                    return;
                }
                const room = testRooms[roomCode];
                if (!room.playerResources) room.playerResources = {};
                let resource: string | null = null;
                if (stealFrom && room.playerResources[stealFrom]) {
                    // Find a resource to steal (first nonzero)
                    const resTypes = Object.keys(room.playerResources[stealFrom]);
                    for (const type of resTypes) {
                        if (room.playerResources[stealFrom][type] > 0) {
                            room.playerResources[stealFrom][type]--;
                            resource = type;
                            break;
                        }
                    }
                }
                // Simulate game state update
                const gameState = {
                    lastAction: {
                        type: 'move_robber',
                        player: socket.id,
                        position,
                        stealFrom: stealFrom || null,
                        resource: resource || null
                    },
                    // ...other state fields as needed for test
                };
                room.currentState = gameState;
                io.to(roomCode).emit('server:game_state_update', { gameState });
            });

            // --- Maritime and Domestic Trading (TDD implementation) ---
            // Maritime trade with bank (with bank resource limit enforcement)
            socket.on('client:maritime_trade', (payload = {}) => {
                const { give, receive } = payload;
                const roomCode = Object.keys(testRooms).find(rc => testRooms[rc].sockets.has(socket.id));
                if (!roomCode) {
                    socket.emit('server:action_invalid', { reason: 'Not in a room' });
                    return;
                }
                const room = testRooms[roomCode];
                if (!room.playerResources) room.playerResources = {};
                if (!room.bankResources) room.bankResources = { brick: 19, lumber: 19, wool: 19, grain: 19, ore: 19 };
                const playerRes = room.playerResources[socket.id] || {};
                // Check if player has enough to give (simulate 4:1)
                const giveType = Object.keys(give)[0];
                if (!playerRes[giveType] || playerRes[giveType] < 4) {
                    socket.emit('server:action_invalid', { reason: 'Insufficient resources' });
                    return;
                }
                // Check if bank has enough to pay
                const receiveType = Object.keys(receive)[0];
                if (!room.bankResources[receiveType] || room.bankResources[receiveType] < 1) {
                    socket.emit('server:action_invalid', { reason: 'Bank has insufficient resources for this trade (scarcity rule)' });
                    return;
                }
                // Simulate trade
                playerRes[giveType] -= 4;
                playerRes[receiveType] = (playerRes[receiveType] || 0) + 1;
                room.playerResources[socket.id] = playerRes;
                room.bankResources[giveType] = (room.bankResources[giveType] || 0) + 4;
                room.bankResources[receiveType] -= 1;
                // Simulate game state update
                const gameState = {
                    lastAction: {
                        type: 'maritime_trade',
                        player: socket.id,
                        give,
                        receive
                    }
                };
                room.currentState = gameState;
                io.to(roomCode).emit('server:game_state_update', { gameState });
            });
            // Simulate production with scarcity rule
            socket.on('test:simulate_production', ({ roomCode, resource, recipients, amount }) => {
                if (!testRooms[roomCode]) testRooms[roomCode] = {};
                const room = testRooms[roomCode];
                if (!room.bankResources) room.bankResources = { brick: 19, lumber: 19, wool: 19, grain: 19, ore: 19 };
                // Total needed
                const totalNeeded = recipients.length * amount;
                if (room.bankResources[resource] < totalNeeded) {
                    // Scarcity rule: no one gets any
                    recipients.forEach(pid => {
                        // No resources added
                    });
                    io.to(roomCode).emit('server:scarcity_rule_enforced', {
                        resource,
                        reason: 'Scarcity rule enforced: bank has insufficient resources for all players'
                    });
                    return;
                }
                // Otherwise, distribute resources
                recipients.forEach(pid => {
                    if (!room.playerResources) room.playerResources = {};
                    if (!room.playerResources[pid]) room.playerResources[pid] = { brick: 0, lumber: 0, wool: 0, grain: 0, ore: 0 };
                    room.playerResources[pid][resource] = (room.playerResources[pid][resource] || 0) + amount;
                });
                room.bankResources[resource] -= totalNeeded;
                io.to(roomCode).emit('server:game_state_update', {
                    gameState: {
                        lastAction: {
                            type: 'production',
                            resource,
                            recipients,
                            amount
                        }
                    }
                });
            });

            // Domestic trade proposal
            socket.on('client:propose_trade', (payload = {}) => {
                const { offer, request, players } = payload;
                const roomCode = Object.keys(testRooms).find(rc => testRooms[rc].sockets.has(socket.id));
                if (!roomCode) {
                    socket.emit('server:action_invalid', { reason: 'Not in a room' });
                    return;
                }
                // Enforce no free trades: must offer and request at least one resource
                if (!offer || Object.keys(offer).length === 0) {
                    socket.emit('server:action_invalid', { reason: 'Must offer at least one resource (no free trades)' });
                    return;
                }
                if (!request || Object.keys(request).length === 0) {
                    socket.emit('server:action_invalid', { reason: 'Must request at least one resource (no free trades)' });
                    return;
                }
                const room = testRooms[roomCode];
                if (!room.playerResources) room.playerResources = {};
                const playerRes = room.playerResources[socket.id] || {};
                // Check if player has enough to offer
                const offerType = Object.keys(offer)[0];
                if (!playerRes[offerType] || playerRes[offerType] < offer[offerType]) {
                    socket.emit('server:action_invalid', { reason: 'Insufficient resources' });
                    return;
                }
                // Simulate trade proposal
                const tradeId = `T${Math.floor(Math.random() * 10000)}`;
                if (!room.trades) room.trades = {};
                room.trades[tradeId] = {
                    from: socket.id,
                    to: players[0],
                    offer,
                    request
                };
                io.to(players[0]).emit('server:trade_proposed', {
                    tradeId,
                    fromPlayer: socket.id,
                    offer,
                    request
                });
            });

            // Domestic trade response
            socket.on('client:respond_to_trade', (payload = {}) => {
                const { tradeId, response } = payload;
                const roomCode = Object.keys(testRooms).find(rc => testRooms[rc].sockets.has(socket.id));
                if (!roomCode) return;
                const room = testRooms[roomCode];
                if (!room.trades || !room.trades[tradeId]) return;
                const trade = room.trades[tradeId];
                if (response === 'accept') {
                    // Simulate resource exchange
                    if (!room.playerResources[trade.from]) room.playerResources[trade.from] = {};
                    if (!room.playerResources[trade.to]) room.playerResources[trade.to] = {};
                    const fromRes = room.playerResources[trade.from];
                    const toRes = room.playerResources[trade.to];
                    // Remove offer from proposer, add to responder
                    Object.keys(trade.offer).forEach(type => {
                        fromRes[type] = (fromRes[type] || 0) - trade.offer[type];
                        toRes[type] = (toRes[type] || 0) + trade.offer[type];
                    });
                    // Remove request from responder, add to proposer
                    Object.keys(trade.request).forEach(type => {
                        toRes[type] = (toRes[type] || 0) - trade.request[type];
                        fromRes[type] = (fromRes[type] || 0) + trade.request[type];
                    });
                    // Notify both players
                    io.to(trade.from).emit('server:trade_completed', {
                        players: [trade.from, trade.to],
                        resources: {
                            [trade.from]: {
                                ...Object.fromEntries(Object.keys(trade.offer).map(type => [type, -trade.offer[type]])),
                                ...Object.fromEntries(Object.keys(trade.request).map(type => [type, trade.request[type]]))
                            },
                            [trade.to]: {
                                ...Object.fromEntries(Object.keys(trade.offer).map(type => [type, trade.offer[type]])),
                                ...Object.fromEntries(Object.keys(trade.request).map(type => [type, -trade.request[type]]))
                            }
                        }
                    });
                    io.to(trade.to).emit('server:trade_completed', {
                        players: [trade.from, trade.to],
                        resources: {
                            [trade.from]: {
                                ...Object.fromEntries(Object.keys(trade.offer).map(type => [type, -trade.offer[type]])),
                                ...Object.fromEntries(Object.keys(trade.request).map(type => [type, trade.request[type]]))
                            },
                            [trade.to]: {
                                ...Object.fromEntries(Object.keys(trade.offer).map(type => [type, trade.offer[type]])),
                                ...Object.fromEntries(Object.keys(trade.request).map(type => [type, -trade.request[type]]))
                            }
                        }
                    });
                    delete room.trades[tradeId];
                } else if (response === 'reject') {
                    io.to(trade.from).emit('server:trade_cancelled', {
                        tradeId,
                        reason: 'Trade rejected'
                    });
                    delete room.trades[tradeId];
                }
            });
        });
    });

    afterEach(async () => {
        if (clientSocket && clientSocket.connected) {
            clientSocket.disconnect();
        }

        if (io) {
            io.close();
        }

        if (httpServer) {
            await new Promise<void>((resolve) => {
                httpServer.close(() => resolve());
            });
        }
    });

    describe('Connection Handling', () => {
        it('should accept client connections', async () => {
            return new Promise<void>((resolve, reject) => {
                clientSocket = Client(`http://localhost:${serverPort}`);

                clientSocket.on('connect', () => {
                    expect(clientSocket.connected).toBe(true);
                    expect(clientSocket.id).toBeDefined();
                    resolve();
                });

                clientSocket.on('connect_error', (error) => {
                    reject(error);
                });

                // Timeout after 5 seconds
                setTimeout(() => {
                    reject(new Error('Connection timeout'));
                }, 5000);
            });
        });

        it('should send welcome message on connection', async () => {
            return new Promise<void>((resolve, reject) => {
                clientSocket = Client(`http://localhost:${serverPort}`);

                clientSocket.on('server:welcome', (data) => {
                    expect(data).toMatchObject({
                        message: 'Welcome to the Catan-inspired game server!',
                        socketId: clientSocket.id
                    });
                    resolve();
                });

                clientSocket.on('connect_error', (error) => {
                    reject(error);
                });

                setTimeout(() => {
                    reject(new Error('Welcome message timeout'));
                }, 5000);
            });
        });

        it('should handle disconnection gracefully', async () => {
            return new Promise<void>((resolve, reject) => {
                clientSocket = Client(`http://localhost:${serverPort}`);

                clientSocket.on('connect', () => {
                    // Disconnect after connection
                    clientSocket.disconnect();
                });

                clientSocket.on('disconnect', (reason) => {
                    expect(reason).toBeDefined();
                    expect(clientSocket.connected).toBe(false);
                    resolve();
                });

                setTimeout(() => {
                    reject(new Error('Disconnect timeout'));
                }, 5000);
            });
        });
    });

    describe('Game Event Handling', () => {
        beforeEach(async () => {
            return new Promise<void>((resolve, reject) => {
                clientSocket = Client(`http://localhost:${serverPort}`);

                clientSocket.on('connect', () => {
                    resolve();
                });

                clientSocket.on('connect_error', (error) => {
                    reject(error);
                });

                setTimeout(() => {
                    reject(new Error('Connection timeout'));
                }, 5000);
            });
        });

        it('should handle room joining', async () => {
            return new Promise<void>((resolve, reject) => {
                const testRoomCode = `TEST_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

                clientSocket.on('server:room_joined', (data) => {
                    expect(data).toMatchObject({
                        roomCode: testRoomCode,
                        success: true
                    });
                    resolve();
                });

                clientSocket.emit('client:join_room', { roomCode: testRoomCode });

                setTimeout(() => {
                    reject(new Error('Room join timeout'));
                }, 5000);
            });
        });

        it('should handle room creation', async () => {
            return new Promise<void>((resolve, reject) => {
                const gameSettings = {
                    maxPlayers: 4,
                    isPrivate: false
                };

                clientSocket.on('server:room_created', (data) => {
                    expect(data).toHaveProperty('roomCode');
                    expect(data.gameSettings).toEqual(gameSettings);
                    expect(typeof data.roomCode).toBe('string');
                    resolve();
                });

                clientSocket.emit('client:create_room', { gameSettings });

                setTimeout(() => {
                    reject(new Error('Room creation timeout'));
                }, 5000);
            });
        });

        it('should echo test messages', async () => {
            return new Promise<void>((resolve, reject) => {
                const testData = {
                    message: 'Hello, server!',
                    timestamp: Date.now(),
                    player: 'test-player'
                };

                clientSocket.on('server:test_echo', (data) => {
                    expect(data).toEqual(testData);
                    resolve();
                });

                clientSocket.emit('client:test_echo', testData);

                setTimeout(() => {
                    reject(new Error('Echo timeout'));
                }, 5000);
            });
        });
    });

    describe('Multiple Client Connections', () => {
        it('should handle multiple simultaneous connections', async () => {
            const clients: ClientSocket[] = [];
            const connectionPromises: Promise<void>[] = [];

            // Create 3 test clients
            for (let i = 0; i < 3; i++) {
                const promise = new Promise<void>((resolve, reject) => {
                    const client = Client(`http://localhost:${serverPort}`);
                    clients.push(client);

                    client.on('connect', () => {
                        expect(client.connected).toBe(true);
                        resolve();
                    });

                    client.on('connect_error', (error) => {
                        reject(error);
                    });

                    setTimeout(() => {
                        reject(new Error(`Client ${i} connection timeout`));
                    }, 5000);
                });

                connectionPromises.push(promise);
            }

            // Wait for all clients to connect
            await Promise.all(connectionPromises);

            // Verify all clients are connected
            expect(clients).toHaveLength(3);
            clients.forEach((client, index) => {
                expect(client.connected).toBe(true);
                expect(client.id).toBeDefined();
            });

            // Clean up
            clients.forEach(client => {
                if (client.connected) {
                    client.disconnect();
                }
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle malformed events gracefully', async () => {
            return new Promise<void>((resolve, reject) => {
                clientSocket = Client(`http://localhost:${serverPort}`);

                clientSocket.on('connect', () => {
                    // Send malformed data
                    clientSocket.emit('client:join_room', null);
                    clientSocket.emit('client:create_room', undefined);
                    clientSocket.emit('invalid_event', { data: 'test' });

                    // If server doesn't crash, test passes
                    setTimeout(() => {
                        expect(clientSocket.connected).toBe(true);
                        resolve();
                    }, 1000);
                });

                clientSocket.on('connect_error', (error) => {
                    reject(error);
                });

                setTimeout(() => {
                    reject(new Error('Error handling test timeout'));
                }, 5000);
            });
        });
    });





});
