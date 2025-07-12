
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { app } from '../index';
import Room from '../models/Room';

function getUniqueRoomCode(prefix = 'FLOW') {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

describe('Game Flow API', () => {
    let roomCode: string;

    afterEach(async () => {
        if (roomCode) {
            await Room.deleteMany({ roomCode });
        }
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('should start a game and return initial game state', async () => {
        roomCode = getUniqueRoomCode('FLOW');
        // First, create a room
        await request(app)
            .post('/api/room/create')
            .send({ roomCode })
            .expect(201);

        // Start the game
        const res = await request(app)
            .post('/api/game/start')
            .send({ roomCode })
            .expect(200);

        expect(res.body).toHaveProperty('gameState');
        expect(res.body.gameState).toHaveProperty('board');
        expect(res.body.gameState).toHaveProperty('players');
        expect(Array.isArray(res.body.gameState.players)).toBe(true);
        expect(res.body.gameState.board).toHaveProperty('hexes');
        expect(res.body.gameState.board).toHaveProperty('ports');
        expect(res.body.gameState.board).toHaveProperty('size');
    });

    it('should advance the turn and update current player', async () => {
        roomCode = getUniqueRoomCode('FLOWTURNS');
        // Start a game with two players
        await request(app)
            .post('/api/room/create')
            .send({ roomCode })
            .expect(201);
        await request(app)
            .post('/api/room/join')
            .send({ roomCode, playerId: 'p2' })
            .expect(200);
        await request(app)
            .post('/api/room/join')
            .send({ roomCode, playerId: 'p1' })
            .expect(200);

        // Debug: verify room exists in DB
        const room = await Room.findOne({ roomCode });
        expect(room).not.toBeNull();
        expect(room?.players).toEqual(expect.arrayContaining(['p1', 'p2']));
        await request(app)
            .post('/api/game/start')
            .send({ roomCode })
            .expect(200);

        // Advance the turn
        const res = await request(app)
            .post('/api/game/nextTurn')
            .send({ roomCode })
            .expect(200);

        expect(res.body).toHaveProperty('gameState');
        expect(res.body.gameState).toHaveProperty('currentTurn');
        expect(['p1', 'p2']).toContain(res.body.gameState.currentTurn.currentPlayerId);
    });

    it('should build a road and return updated game state', async () => {
        roomCode = getUniqueRoomCode('FLOWBUILD');
        // Start a game with two players
        await request(app)
            .post('/api/room/create')
            .send({ roomCode })
            .expect(201);
        await request(app)
            .post('/api/room/join')
            .send({ roomCode, playerId: 'p1' })
            .expect(200);
        await request(app)
            .post('/api/room/join')
            .send({ roomCode, playerId: 'p2' })
            .expect(200);
        await request(app)
            .post('/api/game/start')
            .send({ roomCode })
            .expect(200);

        // Build a road
        const res = await request(app)
            .post('/api/game/build')
            .send({ roomCode, playerId: 'p1', type: 'road', position: { from: { q: 0, r: 0 }, to: { q: 1, r: 0 } } })
            .expect(200);

        expect(res.body).toHaveProperty('gameState');
        expect(res.body.gameState).toHaveProperty('board');
        expect(res.body.gameState).toHaveProperty('players');
    });

    it('should roll dice and return a valid result', async () => {
        roomCode = getUniqueRoomCode('FLOWDICE');
        // Start a game with two players
        await request(app)
            .post('/api/room/create')
            .send({ roomCode })
            .expect(201);
        await request(app)
            .post('/api/room/join')
            .send({ roomCode, playerId: 'p1' })
            .expect(200);
        await request(app)
            .post('/api/room/join')
            .send({ roomCode, playerId: 'p2' })
            .expect(200);
        await request(app)
            .post('/api/game/start')
            .send({ roomCode })
            .expect(200);

        // Roll dice
        const res = await request(app)
            .post('/api/game/rollDice')
            .send({ roomCode, playerId: 'p1' })
            .expect(200);

        expect(res.body).toHaveProperty('result');
        expect(Array.isArray(res.body.result)).toBe(true);
        expect(res.body.result.length).toBe(2);
        expect(res.body.result[0]).toBeGreaterThanOrEqual(1);
        expect(res.body.result[0]).toBeLessThanOrEqual(6);
        expect(res.body.result[1]).toBeGreaterThanOrEqual(1);
        expect(res.body.result[1]).toBeLessThanOrEqual(6);
    });
});
