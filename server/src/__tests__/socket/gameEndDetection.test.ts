import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Game End Detection (Immediate Win at 10+ Points) Integration Tests
 * Tests that the game ends and the winner is declared when a player reaches 10+ points.
 */
describe('Game End Detection (Immediate Win at 10+ Points)', () => {
    let roomCode: string;
    let clientA: ClientSocket;
    let clientB: ClientSocket;
    const serverPort = process.env.TEST_SOCKET_PORT || 3001;

    beforeEach(async () => {
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

        // Create room and join both clients
        await new Promise<void>((resolve) => {
            clientA.emit('client:create_room', { gameSettings: { maxPlayers: 4 } });
            clientA.on('server:room_created', (data) => {
                roomCode = data.roomCode;
                clientA.emit('client:join_room', { roomCode });
                clientB.emit('client:join_room', { roomCode });
                resolve();
            });
        });
    });

    afterEach(() => {
        if (clientA && clientA.connected) clientA.disconnect();
        if (clientB && clientB.connected) clientB.disconnect();
    });

    it('should immediately end the game and declare the winner when a player reaches 10+ points', async () => {
        // Give clientA 9 points, then simulate an action that gives 1 more point
        clientA.emit('test:set_player_victory_points', { roomCode, playerId: clientA.id, points: 9 });
        // Simulate building a settlement for 1 more point
        const gameEnd = new Promise<void>((resolve) => {
            clientA.on('server:game_ended', (data) => {
                expect(data.winner).toBe(clientA.id);
                expect(data.points).toBeGreaterThanOrEqual(10);
                resolve();
            });
        });
        clientA.emit('client:build_item', { type: 'settlement', position: { q: 10, r: 10 } });
        await gameEnd;
    });

    it('should not end the game if no player has 10+ points', async () => {
        clientA.emit('test:set_player_victory_points', { roomCode, playerId: clientA.id, points: 8 });
        // Simulate building a settlement for 1 more point (total 9)
        let gameEnded = false;
        clientA.on('server:game_ended', () => { gameEnded = true; });
        clientA.emit('client:build_item', { type: 'settlement', position: { q: 11, r: 11 } });
        // Wait a short time to ensure no game_ended event is sent
        await new Promise((resolve) => setTimeout(resolve, 500));
        expect(gameEnded).toBe(false);
    });

    it('should broadcast the winner to all players', async () => {
        clientA.emit('test:set_player_victory_points', { roomCode, playerId: clientA.id, points: 9 });
        const winnerA = new Promise<void>((resolve) => {
            clientA.on('server:game_ended', (data) => {
                expect(data.winner).toBe(clientA.id);
                resolve();
            });
        });
        const winnerB = new Promise<void>((resolve) => {
            clientB.on('server:game_ended', (data) => {
                expect(data.winner).toBe(clientA.id);
                resolve();
            });
        });
        clientA.emit('client:build_item', { type: 'settlement', position: { q: 12, r: 12 } });
        await Promise.all([winnerA, winnerB]);
    });
});
