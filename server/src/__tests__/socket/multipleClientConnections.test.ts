import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';

describe('Multiple Client Connections', () => {
    let httpServer;
    let io: Server;
    let serverPort: number;
    let roomCode: string;
    let clients: ClientSocket[];

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
            
            // Room management
            socket.on('client:create_room', (data) => {
                roomCode = `TEST${Math.floor(Math.random() * 1000)}`;
                socket.join(roomCode);
                console.log(`Room created: ${roomCode}`);
                socket.emit('server:room_created', {
                    roomCode,
                    gameSettings: data?.gameSettings || { maxPlayers: 4 }
                });
            });

            socket.on('client:join_room', (data) => {
                if (!data || !data.roomCode) return;
                socket.join(data.roomCode);
                console.log(`Player joined room: ${socket.id} → ${data.roomCode}`);
                
                // Broadcast room update to all clients in the room
                const players = Array.from(io.sockets.adapter.rooms.get(data.roomCode) || [])
                    .map(id => ({ id }));
                
                io.to(data.roomCode).emit('server:room_update', {
                    players
                });
            });

            // Handle building items
            socket.on('client:build_item', (data) => {
                console.log(`Player ${socket.id} building ${data.type} at position:`, data.position);
                
                // Broadcast game state update to all clients in the room
                if (socket.rooms.has(roomCode)) {
                    io.to(roomCode).emit('server:game_state_update', {
                        gameState: {
                            players: Array.from(io.sockets.adapter.rooms.get(roomCode) || [])
                                .map(id => ({ id })),
                            // Add other game state properties as needed
                            buildings: [
                                { type: data.type, position: data.position, playerId: socket.id }
                            ]
                        }
                    });
                }
            });

            socket.on('disconnect', () => {
                console.log(`Client disconnected: ${socket.id}`);
            });
        });
    });

    beforeEach(async () => {
        // Create clients
        clients = Array(4).fill(null).map(() => Client(`http://localhost:${serverPort}`));
        
        // Wait for all clients to connect
        await Promise.all(
            clients.map(client => 
                new Promise<void>(resolve => client.on('connect', resolve))
            )
        );
        console.log('All clients connected');
        
        // Create room
        await new Promise<void>((resolve) => {
            clients[0].emit('client:create_room', { gameSettings: { maxPlayers: 4 } });
            clients[0].once('server:room_created', (data) => {
                roomCode = data.roomCode;
                console.log(`Room created with code: ${roomCode}`);
                resolve();
            });
        });
        
        // Join all clients to the room
        const joinPromises = clients.map((client) => 
            new Promise<void>(resolve => {
                client.emit('client:join_room', { roomCode });
                setTimeout(resolve, 10); // Small delay to ensure joins are processed
            })
        );
        await Promise.all(joinPromises);
        console.log('All clients joined the room');
    });

    afterEach(() => {
        // Disconnect all clients
        clients.forEach(client => {
            if (client && client.connected) {
                client.disconnect();
            }
        });
    });

    afterAll(async () => {
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

    it('should allow four clients to join the same room and receive room updates', async () => {
        // Set up an array to track which clients received updates
        const receivedUpdates = new Array(clients.length).fill(false);
        
        // Listen for room updates on all clients
        const updatePromises = clients.map((client, index) => 
            new Promise<void>(resolve => {
                const handler = (data) => {
                    // Verify we got player data
                    expect(data).toHaveProperty('players');
                    expect(Array.isArray(data.players)).toBe(true);
                    
                    // There might be multiple updates as clients join, so we look for when all clients are in
                    if (data.players.length >= 4) {
                        receivedUpdates[index] = true;
                        client.off('server:room_update', handler); // Remove listener to avoid duplicates
                        resolve();
                    }
                };
                
                client.on('server:room_update', handler);
            })
        );
        
        // Ensure each client emits a join room event again to trigger updates
        clients.forEach(client => {
            client.emit('client:join_room', { roomCode });
        });
        
        // Wait for all updates to be received
        await Promise.all(updatePromises);
        
        // Verify all clients received updates
        expect(receivedUpdates.every(Boolean)).toBe(true);
    });

    it('should broadcast game state updates to all clients', async () => {
        // Set up listeners for all clients
        const stateUpdatePromises = clients.map(client => 
            new Promise<void>(resolve => {
                client.once('server:game_state_update', (data) => {
                    expect(data).toHaveProperty('gameState');
                    expect(data.gameState).toHaveProperty('buildings');
                    expect(data.gameState.buildings.length).toBeGreaterThan(0);
                    resolve();
                });
            })
        );
        
        // Have the first client build something
        const buildPayload = { type: 'road', position: { x: 0, y: 0 } };
        clients[0].emit('client:build_item', buildPayload);
        
        // Wait for all clients to receive the update
        await Promise.all(stateUpdatePromises);
    });
});
