import { describe, expect, it } from 'vitest';
import { attemptTrade, createTestGame } from '../setup';

/**
 * No trading during initial placement: Trading is not allowed until after initial placement phase.
 * Test: Attempt trade during initial placement and verify rejection.
 */
describe('No Trading During Initial Placement', () => {
    it('should reject trade attempts during initial placement phase', async () => {
        const game = await createTestGame({ players: 4, board: 'standard', phase: 'initial_placement' });
        const tradeResult = await attemptTrade(game.players[0], { give: { brick: 1 }, receive: { wool: 1 }, with: game.players[1] }, game);
        expect(tradeResult.success).toBe(false);
        expect(tradeResult.error).toMatch(/not allowed during initial placement/i);
    });

    it('should allow trade after initial placement phase', async () => {
        const game = await createTestGame({ players: 4, board: 'standard', phase: 'main' });
        const tradeResult = await attemptTrade(game.players[0], { give: { brick: 1 }, receive: { wool: 1 }, with: game.players[1] }, game);
        expect(tradeResult.success).toBe(true);
    });
});
