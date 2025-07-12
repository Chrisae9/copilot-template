import { setupInitialPlacementEvents } from '../../socket/initialPlacementEvents';
/**
 * Modular test for settlement placement blocked during initial placement phase.
 * Simulates a board where a player cannot legally place a settlement and verifies correct backend handling.
 *
 * Expected: Server should skip, error, or apply alternate rule (as defined by official rules or house rules).
 *
 * @see https://www.catan.com/faq/settlement-placement-blocked
 */

import { createServer } from 'http';
import { Server } from 'socket.io';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { io as Client, Socket as ClientSocket } from 'socket.io-client';


describe('Initial Placement: Blocked Settlement (Socket)', () => {
    // Global error handler for uncaught promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error('[TEST DEBUG] Unhandled Rejection:', reason);
    });
    process.on('uncaughtException', (err) => {
        console.error('[TEST DEBUG] Uncaught Exception:', err);
    });
    let io: Server;
    let httpServer: ReturnType<typeof createServer>;
    let port: number;
    let client: ClientSocket;

    beforeAll(async () => {
        httpServer = createServer();
        io = new Server(httpServer, { cors: { origin: '*' } });
        io.on('connection', (socket) => {
            socket.on('client:set_context', (data) => {
                socket.data.roomCode = data.roomCode;
                socket.data.userId = data.userId;
            });
            socket.on('join', (roomCode) => {
                socket.join(roomCode);
            });
        });
        setupInitialPlacementEvents(io);
        port = 4000 + Math.floor(Math.random() * 1000);
        await new Promise<void>(resolve => httpServer.listen(port, () => resolve()));
    });

    afterAll(async () => {
        io.close();
        httpServer.close();
        if (client && client.connected) await client.disconnect();
    });

    it('should return error if settlement placement is blocked during initial placement', async () => {
        client = Client(`http://localhost:${port}`);
        await new Promise<void>((resolve, reject) => {
            client.once('connect', resolve);
            client.once('connect_error', reject);
            setTimeout(() => reject(new Error('Timeout')), 5000);
        });
        const roomCode = 'TEST_ROOM_BLOCKED';
        (global as any).gameState = {
            [roomCode]: {
                board: {
                    hexes: [{ coordinates: { q: 0, r: 0 }, terrain: 'forest', numberToken: 8, hasRobber: false }],
                    ports: [],
                    size: 'standard'
                },
                phase: 'initial_placement',
                players: [
                    { userId: 'player1', pieces: { settlements: [], roads: [] } },
                    { userId: 'blocker', pieces: { settlements: [{ coordinates: { q: 0, r: 0 }, playerId: 'blocker' }], roads: [] } }
                ]
            }
        };
        client.emit('client:set_context', { roomCode, userId: 'player1' });
        client.emit('join', roomCode);
        await new Promise(resolve => setTimeout(resolve, 100));
        const eventPromise = new Promise<void>((resolve) => {
            client.once('server:action_invalid', (data: any) => {
                // eslint-disable-next-line no-console
                console.log('[DEBUG] CLIENT: received server:action_invalid', data);
                expect(data.reason).toMatch(/blocked|illegal|cannot place/i);
                resolve();
            });
        });
        client.emit('client:build_item', { type: 'settlement', position: { q: 0, r: 0 }, initialPlacement: true });
        await eventPromise;
        await client.disconnect();
    });

    it('should allow placement if board is not blocked', async () => {
        client = Client(`http://localhost:${port}`);
        await new Promise<void>((resolve, reject) => {
            client.once('connect', resolve);
            client.once('connect_error', reject);
            setTimeout(() => reject(new Error('Timeout')), 5000);
        });
        const roomCode = 'TEST_ROOM_NOT_BLOCKED';
        (global as any).gameState = {
            [roomCode]: {
                board: {
                    hexes: [{ coordinates: { q: 1, r: 1 }, terrain: 'forest', numberToken: 8, hasRobber: false }],
                    ports: [],
                    size: 'standard'
                },
                phase: 'initial_placement',
                players: [{ userId: 'player1', pieces: { settlements: [], roads: [] } }]
            }
        };
        client.emit('client:set_context', { roomCode, userId: 'player1' });
        client.emit('join', roomCode);
        await new Promise(resolve => setTimeout(resolve, 100));
        const eventPromise = new Promise<void>((resolve) => {
            client.once('client:build_item', (data: any) => {
                // eslint-disable-next-line no-console
                console.log('[DEBUG] CLIENT: received client:build_item', data);
                expect(data.type).toBe('settlement');
                expect(data.position).toEqual({ q: 1, r: 1 });
                resolve();
            });
        });
        client.emit('client:build_item', { type: 'settlement', position: { q: 1, r: 1 }, initialPlacement: true });
        await eventPromise;
        await client.disconnect();
    });

    it('should not change game phase if placement is blocked', async () => {
        client = Client(`http://localhost:${port}`);
        await new Promise<void>((resolve, reject) => {
            client.once('connect', resolve);
            client.once('connect_error', reject);
            setTimeout(() => reject(new Error('Timeout')), 5000);
        });
        const roomCode = 'TEST_ROOM_PHASE_BLOCKED';
        (global as any).gameState = {
            [roomCode]: {
                board: {
                    hexes: [], // Simulate blocked board (no available hexes)
                    ports: [],
                    size: 'standard'
                },
                phase: 'initial_placement',
                players: [{ userId: 'player1', pieces: { settlements: [], roads: [] } }]
            }
        };
        client.emit('client:set_context', { roomCode, userId: 'player1' });
        client.emit('join', roomCode);
        await new Promise(resolve => setTimeout(resolve, 100));
        const eventPromise = new Promise<void>((resolve) => {
            client.once('server:action_invalid', async (data: any) => {
                // eslint-disable-next-line no-console
                console.log('[DEBUG] CLIENT: received server:action_invalid', data);
                const state = (global as any).gameState[roomCode];
                expect(state.phase).toBe('initial_placement');
                resolve();
            });
        });
        client.emit('client:build_item', { type: 'settlement', position: { q: 0, r: 0 }, initialPlacement: true });
        await eventPromise;
        await client.disconnect();
    });
});
