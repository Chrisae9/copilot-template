/**
 * Socket.IO event handler for invalid build/trade logic
 * Ensures build/trade actions are rejected if resources are insufficient
 * @module invalidBuildTradeEvents
 */
import type { Server, Socket } from 'socket.io';
import type { GameState, PlayerState, Resources } from '../../../src/types/catan';

const COSTS = {
    road: { brick: 1, lumber: 1, wool: 0, grain: 0, ore: 0 },
    settlement: { brick: 1, lumber: 1, wool: 1, grain: 1, ore: 0 },
    city: { brick: 0, lumber: 0, wool: 0, grain: 2, ore: 3 },
};

function hasEnoughResources(player: PlayerState, cost: Resources): boolean {
    for (const key in cost) {
        if ((player.resources[key as keyof Resources] || 0) < cost[key as keyof Resources]) {
            return false;
        }
    }
    return true;
}

export function setupInvalidBuildTradeEvents(io: Server) {
    io.on('connection', (socket: Socket) => {
        socket.on('client:build_item', (payload) => {
            const roomCode = socket.data.roomCode;
            const gameState: GameState = ((global as any).gameState?.[roomCode] as GameState);
            if (!gameState) return;
            const playerId = socket.data.userId;
            const player: PlayerState | undefined = gameState.players.find(p => p.userId === playerId);
            if (!player) return;
            if (payload.type === 'road' && !hasEnoughResources(player, COSTS.road)) {
                socket.emit('server:action_invalid', { reason: 'Insufficient resources to build road' });
                return;
            }
            if (payload.type === 'settlement' && !hasEnoughResources(player, COSTS.settlement)) {
                socket.emit('server:action_invalid', { reason: 'Insufficient resources to build settlement' });
                return;
            }
            if (payload.type === 'city' && !hasEnoughResources(player, COSTS.city)) {
                socket.emit('server:action_invalid', { reason: 'Insufficient resources to build city' });
                return;
            }
            // Pass through to main build logic (handled elsewhere)
            io.to(roomCode).emit('client:build_item', payload);
        });
        socket.on('client:propose_trade', (payload) => {
            const roomCode = socket.data.roomCode;
            const gameState: GameState = ((global as any).gameState?.[roomCode] as GameState);
            if (!gameState) return;
            const playerId = socket.data.userId;
            const player: PlayerState | undefined = gameState.players.find(p => p.userId === playerId);
            if (!player) return;
            // Check if player has enough resources to offer
            for (const key in payload.offer) {
                if ((player.resources[key as keyof Resources] || 0) < payload.offer[key as keyof Resources]) {
                    socket.emit('server:action_invalid', { reason: 'Insufficient resources to trade' });
                    return;
                }
            }
            // Pass through to main trade logic (handled elsewhere)
            io.to(roomCode).emit('client:propose_trade', payload);
        });
    });
}
