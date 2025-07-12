// ...existing code...


import { Request, Response, Router } from 'express';
import { generateInitialGameState } from '../game/board';
import Room from '../models/Room';

const router = Router();

/**
 * POST /api/game/rollDice
 * Roll two dice for a player
 * Body: { roomCode: string, playerId: string }
 */
router.post('/rollDice', async (req: Request, res: Response) => {
    const { roomCode, playerId } = req.body;
    if (!roomCode || typeof roomCode !== 'string' || !playerId || typeof playerId !== 'string') {
        return res.status(400).json({ error: 'Invalid rollDice request' });
    }
    try {
        const room = await Room.findOne({ roomCode });
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        // Simulate rolling two dice
        const result = [
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1
        ];
        return res.status(200).json({ result });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to roll dice', details: error instanceof Error ? error.message : error });
    }
});
/**
 * POST /api/game/build
 * Build a road, settlement, or city
 * Body: { roomCode: string, playerId: string, type: 'road'|'settlement'|'city', position: any }
 */
router.post('/build', async (req: Request, res: Response) => {
    const { roomCode, playerId, type, position } = req.body;
    if (!roomCode || typeof roomCode !== 'string' || !playerId || typeof playerId !== 'string' || !type) {
        return res.status(400).json({ error: 'Invalid build request' });
    }
    try {
        const room = await Room.findOne({ roomCode });
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        // Stub: return a fake updated game state
        const gameState = {
            board: {},
            players: room.players,
        };
        return res.status(200).json({ gameState });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to build', details: error instanceof Error ? error.message : error });
    }
});
/**
 * POST /api/game/start
 * Start a new game for a room
 * Body: { roomCode: string }
 */
router.post('/start', async (req: Request, res: Response) => {
    const { roomCode } = req.body;
    if (!roomCode || typeof roomCode !== 'string') {
        return res.status(400).json({ error: 'Invalid room code' });
    }
    try {
        const room = await Room.findOne({ roomCode });
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        // Generate initial game state (stub)
        const gameState = generateInitialGameState(room.players);
        return res.status(200).json({ gameState });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to start game', details: error instanceof Error ? error.message : error });
    }
});


/**
 * POST /api/game/nextTurn
 * Advance the turn for a game
 * Body: { roomCode: string }
 */
router.post('/nextTurn', async (req: Request, res: Response) => {
    const { roomCode } = req.body;
    if (!roomCode || typeof roomCode !== 'string') {
        return res.status(400).json({ error: 'Invalid room code' });
    }
    try {
        const room = await Room.findOne({ roomCode });
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        // Stub: alternate between players
        const players = room.players;
        if (!players || players.length < 2) {
            return res.status(400).json({ error: 'Not enough players' });
        }
        // For demo, alternate currentPlayerId between players
        const lastTurn = req.body.lastTurn || players[0];
        const nextPlayer = lastTurn === players[0] ? players[1] : players[0];
        const gameState = {
            board: {},
            players,
            currentTurn: { currentPlayerId: nextPlayer }
        };
        return res.status(200).json({ gameState });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to advance turn', details: error instanceof Error ? error.message : error });
    }
});

export default router;
