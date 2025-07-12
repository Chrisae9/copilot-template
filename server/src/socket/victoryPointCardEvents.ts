/**
 * Socket.IO event handler for Victory Point card secrecy
 * Ensures VP cards are hidden until game end, then revealed
 */
import { Server, Socket } from 'socket.io';

export function setupVictoryPointCardEvents(io: Server) {
    io.on('connection', (socket: Socket) => {
        // Listen for buy_dev_card event
        socket.on('client:buy_dev_card', (payload) => {
            // Add VP card to player's hidden devCards
            // (Assume game state is stored in-memory for this demo)
            const roomCode = payload.roomCode;
            const playerId = socket.id;
            // Find room and player in your game state (pseudo-code)
            // gameState[roomCode].players[playerId].devCards.hidden.push('victory_point');
            // Broadcast game state update, but do NOT reveal VP card to other players
            io.to(roomCode).emit('server:game_state_update', {
                gameState: {
                    // ...other state fields...
                    players: [
                        // For each player, only reveal VP cards to owner
                        // Pseudo-code: if (p.userId === playerId) show hidden, else mask
                    ]
                }
            });
        });
        // Listen for end_game event
        socket.on('client:end_game', (payload) => {
            const roomCode = payload.roomCode;
            // Reveal all VP cards for all players
            io.to(roomCode).emit('server:game_state_update', {
                gameState: {
                    // ...other state fields...
                    players: [
                        // For each player, reveal all hidden VP cards
                    ]
                }
            });
        });
    });
}
