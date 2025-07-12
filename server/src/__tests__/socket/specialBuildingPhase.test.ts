import { describe, expect, it } from 'vitest';
import { attemptTrade, buildRoad, buildSettlement, createTestGame, endTurn, playDevCard } from '../setup';

/**
 * Special Building Phase (5-6 Player Expansion)
 * After each player's turn, all other players may build (but not trade or play dev cards).
 * This test simulates the special building phase and verifies only building is allowed.
 */
describe('Special Building Phase (5-6 Player Expansion)', () => {
    it('should allow non-active players to build during special building phase', async () => {
        const game = await createTestGame({ players: 5, board: 'standard', phase: 'main' });
        // Simulate end of active player's turn
        await endTurn(game, game.players[0]);
        // Non-active player attempts to build a road
        const buildResult = await buildRoad(game, game.players[1], { from: { q: 0, r: 0 }, to: { q: 0, r: 1 } });
        expect(buildResult.success).toBe(true);
        // Non-active player attempts to build a settlement
        const settlementResult = await buildSettlement(game, game.players[2], { q: 1, r: 1 });
        expect(settlementResult.success).toBe(true);
    });

    it('should reject trade attempts during special building phase', async () => {
        const game = await createTestGame({ players: 5, board: 'standard', phase: 'main' });
        await endTurn(game, game.players[0]);
        // Non-active player attempts to trade
        const tradeResult = await attemptTrade(game.players[1], { give: { brick: 1 }, receive: { wool: 1 }, with: game.players[2] });
        expect(tradeResult.success).toBe(false);
        expect(tradeResult.error).toMatch(/not allowed during special building phase/i);
    });

    it('should reject dev card play during special building phase', async () => {
        const game = await createTestGame({ players: 5, board: 'standard', phase: 'main' });
        await endTurn(game, game.players[0]);
        // Non-active player attempts to play a dev card
        const devCardResult = await playDevCard(game.players[1], 'knight');
        expect(devCardResult.success).toBe(false);
        expect(devCardResult.error).toMatch(/not allowed during special building phase/i);
    });
});
