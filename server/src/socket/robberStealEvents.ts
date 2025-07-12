/**
 * Socket.IO event handler for robber steal logic
 * Ensures failed steal returns null if target has no resources
 * @module robberStealEvents
 */
import type { Server, Socket } from 'socket.io';
import type { GameState, PlayerState, Resources } from '../../../src/types/catan';

function getStealableResource(resources: Resources): keyof Resources | null {
    const available = Object.entries(resources).filter(([_, v]) => v > 0);
    if (available.length === 0) return null;
    // Randomly select a resource to steal
    const idx = Math.floor(Math.random() * available.length);
    return available[idx] ? (available[idx][0] as keyof Resources) : null;
}

export function setupRobberStealEvents(io: Server) {
    io.on('connection', (socket: Socket) => {
        socket.on('client:move_robber', ({ position, stealFrom, roomCode }) => {
            const gameState: GameState = ((global as any).gameState?.[roomCode] as GameState);
            if (!gameState) return;
            const target: PlayerState | undefined = gameState.players.find(p => p.userId === stealFrom);
            let stolenResource: keyof Resources | null = null;
            if (target) {
                stolenResource = getStealableResource(target.resources);
                if (stolenResource) {
                    target.resources[stolenResource]--;
                }
            }
            // Broadcast game state update
            io.to(roomCode).emit('server:game_state_update', {
                gameState: {
                    ...gameState,
                    lastAction: {
                        type: 'move_robber',
                        player: socket.data.userId,
                        position,
                        stealFrom,
                        resource: stolenResource
                    }
                }
            });
        });
    });
}
