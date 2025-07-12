/**
 * Socket.IO event handler for discard rounding (half, round down)
 * Ensures players discard floor(hand/2) cards when a 7 is rolled
 * @module discardRoundingEvents
 */
import type { Server, Socket } from 'socket.io';
import type { GameState, PlayerState, Resources } from '../../../src/types/catan';

function countResources(resources: Resources): number {
    return Object.values(resources).reduce((sum, val) => sum + val, 0);
}

export function setupDiscardRoundingEvents(io: Server) {
    io.on('connection', (socket: Socket) => {
        socket.on('test:simulate_roll_seven', ({ roomCode }) => {
            const gameState: GameState = ((global as any).gameState?.[roomCode] as GameState);
            if (!gameState) return;
            for (const player of gameState.players) {
                const totalCards = countResources(player.resources);
                if (totalCards > 7) {
                    const discardAmount = Math.floor(totalCards / 2);
                    io.to(player.userId).emit('server:discard_required', { playerId: player.userId, amount: discardAmount });
                }
            }
        });
        socket.on('client:discard_resources', ({ roomCode, playerId, discard }) => {
            const gameState: GameState = ((global as any).gameState?.[roomCode] as GameState);
            if (!gameState) return;
            const player: PlayerState | undefined = gameState.players.find(p => p.userId === playerId);
            if (!player) return;
            // Subtract discarded resources
            for (const key of Object.keys(discard) as Array<keyof Resources>) {
                player.resources[key] = Math.max(0, player.resources[key] - discard[key]);
            }
            io.to(playerId).emit('server:discard_confirmed', { playerId, remaining: player.resources });
        });
    });
}
