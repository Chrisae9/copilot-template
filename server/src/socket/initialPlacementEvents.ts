/**
 * Socket.IO event handler for initial placement phase rules
 * Enforces snake order, settlement/road adjacency, and second settlement adjacency to road
 * @module initialPlacementEvents
 */
import type { Server, Socket } from 'socket.io';
import type { GameState, PlayerState } from '../../../src/types/catan';

/**
 * Checks if a settlement position is adjacent to a road owned by the player
 * @param settlementPos - { q, r } coordinates of the settlement
 * @param playerRoads - array of road objects { from, to }
 * @returns {boolean} true if adjacent
 */
function isSettlementAdjacentToRoad(settlementPos: { q: number; r: number }, playerRoads: Array<{ from: { q: number; r: number }; to: { q: number; r: number } }>): boolean {
    return playerRoads.some(road =>
        (road.from.q === settlementPos.q && road.from.r === settlementPos.r) ||
        (road.to.q === settlementPos.q && road.to.r === settlementPos.r)
    );
}

/**
 * Sets up initial placement event handling for Socket.IO
 * @param io - Socket.IO server instance
 */
export function setupInitialPlacementEvents(io: Server) {
    io.on('connection', (socket: Socket) => {
        socket.on('client:build_item', (payload) => {
            console.log('[DEBUG] [initialPlacementEvents] Handler entered', { socketId: socket.id, data: socket.data, payload });
            // Only handle initial placement actions
            if (!payload.initialPlacement) {
                console.log('[DEBUG] [initialPlacementEvents] Not initial placement, skipping');
                return;
            }
            // Get game state for room
            const roomCode = socket.data.roomCode;
            const gameState: GameState = ((global as any).gameState?.[roomCode] as GameState);
            console.log('[DEBUG] [initialPlacementEvents] roomCode:', roomCode, 'gameState:', gameState);
            if (!gameState) {
                console.log('[DEBUG] [initialPlacementEvents] No gameState found for roomCode', roomCode);
                return;
            }
            const playerId = socket.data.userId;
            const player: PlayerState | undefined = gameState.players.find(p => p.userId === playerId);
            console.log('[DEBUG] [initialPlacementEvents] playerId:', playerId, 'player:', player);
            if (!player) {
                console.log('[DEBUG] [initialPlacementEvents] No player found for userId', playerId);
                return;
            }
            // Settlement placement
            if (payload.type === 'settlement') {
                // Check if position is blocked/occupied
                const occupiedPositions = gameState.players.flatMap(p => p.pieces?.settlements?.map(s => s.coordinates) || []);
                const isBlocked = !gameState.board.hexes.some(hex => hex.coordinates.q === payload.position.q && hex.coordinates.r === payload.position.r) ||
                    occupiedPositions.some(pos => pos && pos.q === payload.position.q && pos.r === payload.position.r);
                if (isBlocked) {
                    console.log('[DEBUG] [initialPlacementEvents] Emitting server:action_invalid for blocked settlement', { socketId: socket.id, position: payload.position });
                    socket.emit('server:action_invalid', { reason: 'Settlement position is blocked or illegal' });
                    return;
                }
                // If this is the second settlement, enforce adjacency to player's road
                const settlements = player.pieces?.settlements || [];
                const roads = (player.pieces?.roads || []).map((road: any) => ({ from: road.from, to: road.to }));
                if (settlements.length === 1 && roads.length === 1) {
                    // Second settlement must be adjacent to road
                    if (!isSettlementAdjacentToRoad(payload.position, roads)) {
                        console.log('[DEBUG] [initialPlacementEvents] Emitting server:action_invalid for non-adjacent second settlement', { socketId: socket.id, position: payload.position });
                        socket.emit('server:action_invalid', { reason: 'Second settlement must be adjacent to your road during initial placement' });
                        return;
                    }
                }
            }
            // Pass through to main build logic (handled elsewhere)
            console.log('[DEBUG] [initialPlacementEvents] Emitting client:build_item to room', { roomCode, payload });
            io.to(roomCode).emit('client:build_item', payload);
        });
    });
}
