import { createServer } from 'http';
import { AddressInfo } from 'net';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import '../setup.ts';

// --- Discarding on 7 (if >7 cards) Tests ---

describe('Discarding on 7 (if >7 cards)', () => {
    let httpServer: ReturnType<typeof createServer>;
    let io: Server;
    let serverPort: number;
    let roomCode: string;
    let clientA: ClientSocket;
    let clientB: ClientSocket;
    // Game state for test harness
    const gameState: Record<string, any> = {};

    beforeAll(async () => {
        // Create HTTP server for Socket.IO
        httpServer = createServer();
        io = new Server(httpServer, {
            cors: { origin: '*', methods: ['GET', 'POST'] }
        });

        // Start server on a dynamic port
        await new Promise<void>((resolve, reject) => {
            httpServer.listen(0, () => {
                try {
                    const address = httpServer.address() as AddressInfo;
                    serverPort = address.port;
                    console.log(`Test server listening on port ${serverPort}`);
                    setTimeout(resolve, 100); // Wait for server to be ready
                } catch (err) {
                    reject(err);
                }
            });
        });

        // Define Socket.IO event handlers for test harness
        io.on('connection', (socket) => {
            console.log(`Client connected: ${socket.id}`);
            
            socket.on('disconnect', () => {
                console.log(`Client disconnected: ${socket.id}`);
            });
            
            // Room management events
            socket.on('client:create_room', (data) => {
                try {
                    if (!data || !data.gameSettings) {
                        socket.emit('server:error', { error: 'Missing gameSettings' });
                        return;
                    }
                    const roomCode = `TEST${Math.floor(Math.random() * 1000)}`;
                    socket.join(roomCode);
                    
                    // Initialize game state for room
                    gameState[roomCode] = {
                        players: {},
                        phase: 'main',
                        robberPosition: { q: 0, r: 0 }
                    };
                    
                    socket.emit('server:room_created', { roomCode, gameSettings: data.gameSettings });
                    console.log(`Room created: ${roomCode}`);
                } catch (err) {
                    console.error('Error in create_room handler:', err);
                    socket.emit('server:error', { error: 'Internal error creating room' });
                }
            });
            
            socket.on('client:join_room', (data) => {
                try {
                    if (!data || !data.roomCode) {
                        socket.emit('server:error', { error: 'Missing roomCode' });
                        return;
                    }
                    socket.join(data.roomCode);
                    
                    // Initialize player state if room exists
                    if (gameState[data.roomCode]) {
                        gameState[data.roomCode].players[socket.id] = {
                            resources: { brick: 0, lumber: 0, wool: 0, grain: 0, ore: 0 },
                            settlements: [],
                            cities: [],
                            roads: [],
                            devCards: []
                        };
                    }
                    
                    socket.emit('server:player_joined', { roomCode: data.roomCode, playerId: socket.id });
                    console.log(`Player joined room: ${socket.id} → ${data.roomCode}`);
                } catch (err) {
                    console.error('Error in join_room handler:', err);
                    socket.emit('server:error', { error: 'Internal error joining room' });
                }
            });
            
            // Test specific events
            socket.on('test:set_player_resources', (data) => {
                try {
                    const { roomCode, playerId, resources } = data;
                    if (!roomCode || !playerId || !resources) {
                        socket.emit('server:error', { error: 'Missing required data' });
                        return;
                    }
                    
                    if (gameState[roomCode]?.players?.[playerId]) {
                        gameState[roomCode].players[playerId].resources = { ...resources };
                        console.log(`Set player resources: ${playerId} in ${roomCode}`, resources);
                        
                        // Emit updated game state to all clients in room
                        io.to(roomCode).emit('server:game_state_update', { 
                            gameState: {
                                players: Object.entries(gameState[roomCode].players).map(([id, data]: [string, any]) => ({
                                    playerId: id,
                                    resources: data.resources
                                }))
                            }
                        });
                    } else {
                        console.warn(`Player or room not found: ${playerId} in ${roomCode}`);
                    }
                } catch (err) {
                    console.error('Error in set_player_resources handler:', err);
                }
            });
            
            socket.on('test:simulate_roll_seven', (data) => {
                try {
                    const { roomCode } = data;
                    if (!roomCode || !gameState[roomCode]) {
                        socket.emit('server:error', { error: 'Invalid room' });
                        return;
                    }
                    
                    console.log(`Simulating roll of 7 in room ${roomCode}`);
                    
                    // Find players with > 7 cards
                    const playersWithTooManyCards = Object.entries(gameState[roomCode].players)
                        .filter(([_, playerData]: [string, any]) => {
                            const resources = playerData.resources;
                            const total = Object.values(resources).reduce((sum: number, count: any) => sum + count, 0);
                            return total > 7;
                        });
                    
                    // Emit discard_required events
                    playersWithTooManyCards.forEach(([playerId, playerData]: [string, any]) => {
                        const resources = playerData.resources;
                        const total = Object.values(resources).reduce((sum: number, count: any) => sum + count, 0);
                        const discardAmount = Math.floor(total / 2);
                        
                        console.log(`Player ${playerId} must discard ${discardAmount} cards`);
                        io.to(roomCode).emit('server:discard_required', {
                            playerId,
                            amount: discardAmount
                        });
                    });
                    
                    // If no players need to discard, emit game state update
                    if (playersWithTooManyCards.length === 0) {
                        io.to(roomCode).emit('server:game_state_update', {
                            gameState: {
                                phase: 'robber_placement',
                                lastAction: { type: 'roll', result: [3, 4] }
                            }
                        });
                    }
                } catch (err) {
                    console.error('Error in simulate_roll_seven handler:', err);
                }
            });
            
            socket.on('client:discard_resources', (data) => {
                try {
                    const { roomCode, playerId, discard } = data;
                    if (!roomCode || !playerId || !discard) {
                        socket.emit('server:error', { error: 'Missing discard data' });
                        return;
                    }
                    
                    if (gameState[roomCode]?.players?.[playerId]) {
                        const player = gameState[roomCode].players[playerId];
                        const resources = player.resources;
                        
                        // Update resources based on discarded cards
                        Object.entries(discard).forEach(([resource, amount]: [string, any]) => {
                            if (resources[resource] >= amount) {
                                resources[resource] -= amount;
                            }
                        });
                        
                        // Emit confirmation to the player
                        io.to(roomCode).emit('server:discard_confirmed', {
                            playerId,
                            remaining: resources
                        });
                        
                        console.log(`Player ${playerId} discarded resources:`, discard);
                    }
                } catch (err) {
                    console.error('Error in discard_resources handler:', err);
                }
            });
        });
    });

    afterAll(async () => {
        return new Promise<void>((resolve) => {
            io.close(() => {
                httpServer.close(() => {
                    console.log('Test server closed');
                    resolve();
                });
            });
        });
    });

    beforeEach(async () => {
        // Connect clients
        clientA = Client(`http://localhost:${serverPort}`, {
            transports: ['websocket'],
            forceNew: true
        });
        
        clientB = Client(`http://localhost:${serverPort}`, {
            transports: ['websocket'],
            forceNew: true
        });
        
        // Wait for both clients to connect
        await Promise.all([
            new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Connection timeout for client A')), 5000);
                clientA.on('connect', () => {
                    clearTimeout(timeout);
                    resolve();
                });
                clientA.on('connect_error', (err) => {
                    clearTimeout(timeout);
                    reject(new Error(`Connect error for client A: ${err.message}`));
                });
            }),
            new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Connection timeout for client B')), 5000);
                clientB.on('connect', () => {
                    clearTimeout(timeout);
                    resolve();
                });
                clientB.on('connect_error', (err) => {
                    clearTimeout(timeout);
                    reject(new Error(`Connect error for client B: ${err.message}`));
                });
            })
        ]);
        
        console.log('Both clients connected');
        
        // Create room and join both clients
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Room creation timeout')), 5000);
            
            clientA.emit('client:create_room', { gameSettings: { maxPlayers: 4 } });
            clientA.once('server:room_created', (data) => {
                clearTimeout(timeout);
                roomCode = data.roomCode;
                clientA.emit('client:join_room', { roomCode });
                clientB.emit('client:join_room', { roomCode });
                setTimeout(resolve, 200); // Give time for join events to complete
            });
        });
        
        console.log(`Room created and joined: ${roomCode}`);
    });

    afterEach(async () => {
        // Disconnect clients
        if (clientA.connected) {
            clientA.disconnect();
        }
        
        if (clientB.connected) {
            clientB.disconnect();
        }
        
        // Clear game state for the test room
        if (roomCode && gameState[roomCode]) {
            delete gameState[roomCode];
        }
        
        // Wait for disconnects to complete
        await new Promise(resolve => setTimeout(resolve, 200));
    });

    it('should require players with >7 cards to discard half their hand when a 7 is rolled', async () => {
        // Configure both players with >7 cards
        clientA.emit('test:set_player_resources', { 
            roomCode, 
            playerId: clientA.id, 
            resources: { brick: 3, lumber: 3, wool: 2, grain: 0, ore: 0 } // 8 cards
        });
        
        clientB.emit('test:set_player_resources', { 
            roomCode, 
            playerId: clientB.id, 
            resources: { brick: 2, lumber: 2, wool: 2, grain: 2, ore: 1 } // 9 cards
        });
        
        // Track all received discard_required events
        const discardEvents: { playerId: string; amount: number }[] = [];
        
        // Create promises for BOTH client sockets
        const clientADiscardPromise = new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout waiting for discard_required events')), 5000);
            
            // Instead of checking directly, collect all events first
            clientA.on('server:discard_required', (data) => {
                discardEvents.push(data);
                // If we've received 2 events (both players), resolve
                if (discardEvents.length === 2) {
                    clearTimeout(timeout);
                    resolve();
                }
            });
        });
        
        // Wait for listeners to be set up
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Trigger 7 roll
        clientA.emit('test:simulate_roll_seven', { roomCode });
        
        // Wait for events to be collected
        await clientADiscardPromise;
        
        // Now verify that we received the correct events
        expect(discardEvents.length).toBe(2);
        
        // Find the event for clientA
        const clientAEvent = discardEvents.find(e => e.playerId === clientA.id);
        expect(clientAEvent).toBeDefined();
        expect(clientAEvent?.amount).toBe(4); // 8/2 = 4
        
        // Find the event for clientB
        const clientBEvent = discardEvents.find(e => e.playerId === clientB.id);
        expect(clientBEvent).toBeDefined();
        expect(clientBEvent?.amount).toBe(4); // 9/2 = 4.5, round down to 4
    }, 10000);

    it('should not require players with 7 or fewer cards to discard when a 7 is rolled', async () => {
        // Configure both players with ≤7 cards
        clientA.emit('test:set_player_resources', { 
            roomCode, 
            playerId: clientA.id, 
            resources: { brick: 2, lumber: 2, wool: 2, grain: 1, ore: 0 } // 7 cards
        });
        
        clientB.emit('test:set_player_resources', { 
            roomCode, 
            playerId: clientB.id, 
            resources: { brick: 1, lumber: 1, wool: 1, grain: 1, ore: 1 } // 5 cards
        });
        
        // Set up promise that should resolve if game_state_update is received
        // (indicating 7 was rolled but no discards needed)
        const gameUpdatePromise = new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout waiting for game state update')), 5000);
            clientA.once('server:game_state_update', () => {
                clearTimeout(timeout);
                resolve();
            });
        });
        
        // Set up promises that should reject if discard_required is received unexpectedly
        const unexpectedDiscardPromises = [
            new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(resolve, 1000); // Success after 1s with no discard
                clientA.once('server:discard_required', () => {
                    clearTimeout(timeout);
                    reject(new Error('Client A should not have received discard_required'));
                });
            }),
            new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(resolve, 1000); // Success after 1s with no discard
                clientB.once('server:discard_required', () => {
                    clearTimeout(timeout);
                    reject(new Error('Client B should not have received discard_required'));
                });
            })
        ];
        
        // Trigger 7 roll
        clientA.emit('test:simulate_roll_seven', { roomCode });
        
        // Wait for all promises
        await Promise.all([gameUpdatePromise, ...unexpectedDiscardPromises]);
    });

    it('should update player resources after discarding', async () => {
        // Set up player A with >7 cards
        clientA.emit('test:set_player_resources', { 
            roomCode, 
            playerId: clientA.id, 
            resources: { brick: 3, lumber: 3, wool: 2, grain: 0, ore: 0 } // 8 cards
        });
        
        // Listen for discard_required, then submit discard
        const discardFlow = new Promise<void>(async (resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout in discard flow')), 5000);
            
            clientA.once('server:discard_required', (data) => {
                // Discard 2 brick, 2 lumber
                clientA.emit('client:discard_resources', { 
                    roomCode, 
                    playerId: clientA.id, 
                    discard: { brick: 2, lumber: 2 } 
                });
            });
            
            // Listen for discard confirmation
            clientA.once('server:discard_confirmed', (data) => {
                clearTimeout(timeout);
                try {
                    expect(data.playerId).toBe(clientA.id);
                    expect(data.remaining).toEqual({ brick: 1, lumber: 1, wool: 2, grain: 0, ore: 0 });
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
            
            // Start the process after listeners are set up
            clientA.emit('test:simulate_roll_seven', { roomCode });
        });
        
        await discardFlow;
    });
});
