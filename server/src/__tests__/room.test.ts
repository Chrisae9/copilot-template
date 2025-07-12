import mongoose from 'mongoose';
import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { app } from '../index';
import Room from '../models/Room';

function getUniqueRoomCode(prefix = 'TEST') {
    return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

const TEST_PLAYER_ID = 'player1';

describe('Room Management API', () => {
    let roomCode: string;

    beforeEach(async () => {
        roomCode = getUniqueRoomCode();
        await Room.deleteMany({ roomCode });
    });

    afterEach(async () => {
        await Room.deleteMany({ roomCode });
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it('should create a new room', async () => {
        const res = await request(app)
            .post('/api/room/create')
            .send({ roomCode })
            .expect(201);
        expect(res.body.room).toHaveProperty('roomCode', roomCode);
        expect(res.body.room.players).toEqual([]);
    });

    it('should join an existing room', async () => {
        // Create room first
        await request(app)
            .post('/api/room/create')
            .send({ roomCode, playerId: TEST_PLAYER_ID })
            .expect(201);
        const res = await request(app)
            .post('/api/room/join')
            .send({ roomCode, playerId: 'player2' })
            .expect(200);
        expect(res.body.room.players).toContain('player2');
    });

    it('should not allow duplicate join', async () => {
        // Create room and join once
        await request(app)
            .post('/api/room/create')
            .send({ roomCode, playerId: TEST_PLAYER_ID })
            .expect(201);
        await request(app)
            .post('/api/room/join')
            .send({ roomCode, playerId: 'player2' })
            .expect(200);
        // Try to join again
        const res = await request(app)
            .post('/api/room/join')
            .send({ roomCode, playerId: 'player2' })
            .expect(409);
        expect(res.body.error).toMatch(/already in room/i);
    });

    it('should leave a room', async () => {
        // Create room and join
        await request(app)
            .post('/api/room/create')
            .send({ roomCode, playerId: TEST_PLAYER_ID })
            .expect(201);
        await request(app)
            .post('/api/room/join')
            .send({ roomCode, playerId: 'player2' })
            .expect(200);
        // Leave room
        const res = await request(app)
            .post('/api/room/leave')
            .send({ roomCode, playerId: 'player2' })
            .expect(200);
        expect(res.body.room.players).not.toContain('player2');
    });

    it('should return 404 for leaving non-existent room', async () => {
        const fakeRoom = getUniqueRoomCode('FAKE');
        const res = await request(app)
            .post('/api/room/leave')
            .send({ roomCode: fakeRoom, playerId: 'ghost' })
            .expect(404);
        expect(res.body.error).toMatch(/not found/i);
    });
});
