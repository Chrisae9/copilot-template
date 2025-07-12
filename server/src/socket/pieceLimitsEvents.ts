/**
 * Socket.IO event handler for piece limits enforcement
 * Ensures players cannot build beyond allowed limits for roads, settlements, and cities.
 * @module pieceLimitsEvents
 */
import type { Server, Socket } from 'socket.io';
import type { GameState, PlayerState } from '../../../src/types/catan';

const ROAD_LIMIT = 15;
const SETTLEMENT_LIMIT = 5;
const CITY_LIMIT = 4;

export function setupPieceLimitsEvents(io: Server) {
    io.on('connection', (socket: Socket) => {
        socket.on('client:build_item', (payload) => {
            const roomCode = socket.data.roomCode;
            const gameState: GameState = ((global as any).gameState?.[roomCode] as GameState);
            if (!gameState) return;
            const playerId = socket.data.userId;
            const player: PlayerState | undefined = gameState.players.find(p => p.userId === playerId);
            if (!player) return;
            if (payload.type === 'road') {
                if ((player.pieces?.roads?.length || 0) >= ROAD_LIMIT) {
                    socket.emit('server:action_invalid', { reason: 'road limit reached' });
                    return;
                }
            }
            if (payload.type === 'settlement') {
                if ((player.pieces?.settlements?.length || 0) >= SETTLEMENT_LIMIT) {
                    socket.emit('server:action_invalid', { reason: 'settlement limit reached' });
                    return;
                }
            }
            if (payload.type === 'city') {
                if ((player.pieces?.cities?.length || 0) >= CITY_LIMIT) {
                    socket.emit('server:action_invalid', { reason: 'city limit reached' });
                    return;
                }
            }
            // Pass through to main build logic (handled elsewhere)
            io.to(roomCode).emit('client:build_item', payload);
        });
    });
}
