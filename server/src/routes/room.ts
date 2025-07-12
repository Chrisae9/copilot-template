import { Request, Response, Router } from 'express';

import Room from '../models/Room.js';

const router = Router();


/**
 * POST /api/room/join
 * Join an existing game room
 * Body: { roomCode: string, playerId: string }
 */
router.post('/join', async (req: Request, res: Response) => {
    const { roomCode, playerId } = req.body;
    if (!roomCode || typeof roomCode !== 'string' || !playerId || typeof playerId !== 'string') {
        return res.status(400).json({ error: 'Invalid room code or playerId' });
    }
    try {
        const room = await Room.findOne({ roomCode });
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        if (room.players.includes(playerId)) {
            return res.status(409).json({ error: 'Player already in room' });
        }
        room.players.push(playerId);
        await room.save();
        return res.status(200).json({ room });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to join room', details: error instanceof Error ? error.message : error });
    }
});

/**
 * POST /api/room/leave
 * Leave a game room
 * Body: { roomCode: string, playerId: string }
 */
router.post('/leave', async (req: Request, res: Response) => {
    const { roomCode, playerId } = req.body;
    if (!roomCode || typeof roomCode !== 'string' || !playerId || typeof playerId !== 'string') {
        return res.status(400).json({ error: 'Invalid room code or playerId' });
    }
    try {
        const room = await Room.findOne({ roomCode });
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        room.players = room.players.filter((id: string) => id !== playerId);
        await room.save();
        return res.status(200).json({ room });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to leave room', details: error instanceof Error ? error.message : error });
    }
});

/**
 * POST /api/room/create
 * Create a new game room
 * Body: { roomCode: string }
 */
router.post('/create', async (req: Request, res: Response) => {
    const { roomCode } = req.body;
    if (!roomCode || typeof roomCode !== 'string') {
        return res.status(400).json({ error: 'Invalid room code' });
    }
    try {
        const existing = await Room.findOne({ roomCode });
        if (existing) {
            return res.status(409).json({ error: 'Room code already exists' });
        }
        const room = await Room.create({ roomCode });
        return res.status(201).json({ room });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to create room', details: error instanceof Error ? error.message : error });
    }
});

export default router;
