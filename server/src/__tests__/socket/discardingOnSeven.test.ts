import type { Socket } from 'socket.io-client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { io as Client } from 'socket.io-client';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Define types for better type safety
interface DiscardEvent {
    playerId: string;
    amount: number;
}

interface Resources {
    [key: string]: number;
    brick: number;
    lumber: number;
    wool: number;
    grain: number;
    ore: number;
}

// --- Discarding on 7 (if >7 cards) Tests ---
describe('Discarding on 7 (if >7 cards)', () => {
    let httpServer;
    let io: Server;
    let serverPort: number;
    let roomCode: string;
    let clientA: Socket;
    let clientB: Socket;
    let clients: Socket[] = [];
    // Track resources for all clients by ID
    let playerResources: Map<string, Resources> = new Map();

    beforeAll(async () => {
        // Create HTTP server
        httpServer = createServer();
        io = new Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        // Use dynamic port assignment to avoid conflicts
        await new Promise<void>((resolve) => {
            httpServer.listen(0, '0.0.0.0', () => {
                const address = httpServer.address();
                if (address && typeof address === 'object') {
                    serverPort = address.port;
                } else {
                    serverPort = 3001; // fallback
                }
                console.log(`🧪 Test server running on port ${serverPort}`);
                resolve();
            });
        });

        // Set up Socket.IO event handlers
        io.on('connection', (socket) => {
            console.log(`Client connected: ${socket.id}`);
            
            // Initialize socket data
            socket.data.resources = {} as Resources;
            socket.data.roomCode = '';
            
            // Room management
            socket.on('client:create_room', (data) => {
                if (!data || !data.gameSettings) return;
                roomCode = data.roomCode || `TEST${Math.floor(Math.random() * 1000)}`;
                socket.join(roomCode);
                console.log(`Room created: ${roomCode}`);
                socket.emit('server:room_created', {
                    roomCode,
                    gameSettings: data.gameSettings
                });
            });

            socket.on('client:join_room', (data) => {
                if (!data || !data.roomCode) return;
                socket.join(data.roomCode);
                console.log(`Player joined room: ${socket.id} → ${data.roomCode}`);
                socket.emit('server:room_joined', {
                    roomCode: data.roomCode,
                    success: true
                });
            });

            // Game state manipulation helpers for tests
            socket.on('test:set_player_resources', ({ roomCode, playerId, resources }) => {
                console.log(`Set player resources: ${playerId} in ${roomCode}`, resources);
                // Store resources in global map
                playerResources.set(playerId, resources as Resources);
                // Also store in socket data for convenience
                socket.data.resources = resources as Resources;
                socket.data.roomCode = roomCode;
            });

            // Simulate rolling a 7
            socket.on('test:simulate_roll_seven', ({ roomCode }) => {
                console.log(`Simulating roll of 7 in room ${roomCode}`);
                
                // Find all clients in this room
                const socketsInRoom = Array.from(io.sockets.sockets.values())
                    .filter(s => s.data.roomCode === roomCode);
                
                // Process each player in the room
                socketsInRoom.forEach(s => {
                    // Get resources from the global map
                    const resources = playerResources.get(s.id);
                    if (!resources) return;
                    
                    const totalCards = Object.values(resources)
                        .reduce((sum: number, count: number) => sum + count, 0);
                    
                    if (totalCards > 7) {
                        // Player must discard half (round down)
                        const discardAmount = Math.floor(totalCards / 2);
                        console.log(`Player ${s.id} must discard ${discardAmount} cards`);
                        
                        io.to(roomCode).emit('server:discard_required', {
                            playerId: s.id,
                            amount: discardAmount
                        });
                    }
                });
            });

            // Handle discarding resources
            socket.on('client:discard_resources', ({ roomCode, playerId, discard }) => {
                console.log(`Player ${playerId} discarded resources:`, discard);
                
                // Get resources from the map
                const resources = playerResources.get(playerId);
                if (resources) {
                    // Update resources in the map
                    Object.entries(discard).forEach(([resource, amount]) => {
                        resources[resource] -= amount as number;
                    });
                    
                    // Update the map
                    playerResources.set(playerId, resources);
                    
                    // Emit confirmation with remaining resources
                    io.to(roomCode).emit('server:discard_confirmed', {
                        playerId,
                        remaining: resources
                    });
                }
            });

            socket.on('disconnect', () => {
                console.log(`Client disconnected: ${socket.id}`);
            });
        });
    });

    beforeEach(async () => {
        // Reset the player resources map
        playerResources = new Map();
        
        // Create and connect clients
        clientA = Client(`http://localhost:${serverPort}`);
        clientB = Client(`http://localhost:${serverPort}`);
        
        // Wait for both to connect
        await Promise.all([
            new Promise<void>(resolve => clientA.on('connect', resolve)),
            new Promise<void>(resolve => clientB.on('connect', resolve))
        ]);
        console.log('Both clients connected');
        
        clients = [clientA, clientB];
        
        // Create and join a room
        roomCode = `TEST${Math.floor(Math.random() * 1000)}`;
        await new Promise<void>(resolve => {
            clientA.emit('client:create_room', { 
                roomCode, 
                gameSettings: { maxPlayers: 2 } 
            });
            
            clientA.once('server:room_created', () => {
                clientA.emit('client:join_room', { roomCode });
                clientB.emit('client:join_room', { roomCode });
                setTimeout(resolve, 100);
            });
        });
        console.log(`Room created and joined: ${roomCode}`);
    });

    afterEach(() => {
        // Disconnect clients
        clients.forEach(client => {
            if (client.connected) {
                client.disconnect();
            }
        });
    });

    afterAll(async () => {
        // Clean up the player resources map
        playerResources.clear();
        
        // Close server
        await new Promise<void>(resolve => {
            io.close(() => {
                httpServer.close(() => {
                    console.log('🧪 Test server stopped');
                    resolve();
                });
            });
        });
    });

    it('should require players with >7 cards to discard half their hand when a 7 is rolled', async () => {
        // Give both players >7 cards
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
        
        // Allow time for resources to be set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Collect all discard events
        const discardEvents: DiscardEvent[] = [];
        const discardPromise = new Promise<void>(resolve => {
            let eventsReceived = 0;
            const expectedEvents = 2; // We expect events for both players
            
            const handleDiscardEvent = (data: DiscardEvent) => {
                discardEvents.push(data);
                eventsReceived++;
                if (eventsReceived >= expectedEvents) {
                    resolve();
                }
            };
            
            clientA.on('server:discard_required', handleDiscardEvent);
            clientB.on('server:discard_required', handleDiscardEvent);
            
            // Safety timeout in case events aren't received
            setTimeout(() => {
                if (eventsReceived < expectedEvents) {
                    console.warn(`Only received ${eventsReceived}/${expectedEvents} discard events`);
                    resolve();
                }
            }, 1000);
        });
        
        // Simulate rolling a 7
        clientA.emit('test:simulate_roll_seven', { roomCode });
        
        // Wait for discard events
        await discardPromise;
        
        // Verify client A event
        const clientAEvent = discardEvents.find(e => e.playerId === clientA.id);
        expect(clientAEvent).toBeDefined();
        expect(clientAEvent?.amount).toBe(4); // 8/2 = 4
        
        // Verify client B event
        const clientBEvent = discardEvents.find(e => e.playerId === clientB.id);
        expect(clientBEvent).toBeDefined();
        expect(clientBEvent?.amount).toBe(4); // 9/2 = 4.5, round down to 4
    });

    it('should not require players with 7 or fewer cards to discard when a 7 is rolled', async () => {
        // Set resources at or below limit
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
        
        // Flag to track if discard event was received (should not happen)
        let discardEventReceived = false;
        
        clientA.on('server:discard_required', () => {
            discardEventReceived = true;
        });
        clientB.on('server:discard_required', () => {
            discardEventReceived = true;
        });
        
        // Simulate rolling a 7
        clientA.emit('test:simulate_roll_seven', { roomCode });
        
        // Wait a short time to ensure no discard_required event is sent
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify no discard events were received
        expect(discardEventReceived).toBe(false);
    });

    it('should update player resources after discarding', async () => {
        // Give player A >7 cards
        clientA.emit('test:set_player_resources', { 
            roomCode, 
            playerId: clientA.id, 
            resources: { brick: 3, lumber: 3, wool: 2, grain: 0, ore: 0 } // 8 cards
        });
        
        // Prepare to wait for discard confirmation
        const confirmPromise = new Promise<void>(resolve => {
            clientA.once('server:discard_confirmed', (data) => {
                expect(data.playerId).toBe(clientA.id);
                expect(data.remaining).toEqual({ brick: 1, lumber: 1, wool: 2, grain: 0, ore: 0 });
                resolve();
            });
        });
        
        // Set up handler for discard required event
        clientA.once('server:discard_required', () => {
            // Discard 2 brick, 2 lumber
            clientA.emit('client:discard_resources', { 
                roomCode, 
                playerId: clientA.id, 
                discard: { brick: 2, lumber: 2 }
            });
        });
        
        // Simulate rolling a 7
        clientA.emit('test:simulate_roll_seven', { roomCode });
        
        // Wait for confirmation that resources were updated
        await confirmPromise;
    });
});
