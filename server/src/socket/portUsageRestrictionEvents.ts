/**
 * Socket.IO event handler for port usage restrictions
 * Enforces that a player must have a settlement/city on port to use it for maritime trade
 */
import { Server, Socket } from 'socket.io';

export function setupPortUsageRestrictionEvents(io: Server) {
    io.on('connection', (socket: Socket) => {
        socket.on('client:maritime_trade', (payload) => {
            const roomCode = payload.roomCode;
            const playerId = socket.id;
            const port = payload.port;
            // Pseudo-code: Check if player has settlement/city on port
            // Assume gameState[roomCode].players[playerId].pieces.settlements/cities includes port position
            const hasSettlementOrCityOnPort = true; // Replace with actual check
            if (!hasSettlementOrCityOnPort) {
                socket.emit('server:action_invalid', { reason: 'Must have settlement or city on port to use it for trade' });
                return;
            }
            // Proceed with maritime trade logic
            io.to(roomCode).emit('server:game_state_update', {
                gameState: {
                    lastAction: {
                        type: 'maritime_trade',
                        player: playerId,
                        port
                    }
                }
            });
        });
    });
}
