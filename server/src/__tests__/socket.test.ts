/**
 * Socket.IO integration tests
 * Tests real-time communication functionality
 */

import { createServer } from 'http';
import { AddressInfo } from 'net';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import './setup.js';

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

        // Start server on random port
        await new Promise<void>((resolve) => {
            httpServer.listen(() => {
                const address = httpServer.address() as AddressInfo;
                serverPort = address.port;
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
                socket.emit('server:room_joined', {
                    roomCode: data.roomCode,
                    success: true
                });
            });

            socket.on('client:create_room', (data) => {
                const roomCode = `TEST${Math.floor(Math.random() * 1000)}`;
                socket.emit('server:room_created', {
                    roomCode,
                    gameSettings: data.gameSettings
                });
            });

            socket.on('client:test_echo', (data) => {
                socket.emit('server:test_echo', data);
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
                const testRoomCode = 'TEST123';

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
