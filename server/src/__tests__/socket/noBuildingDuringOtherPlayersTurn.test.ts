import { describe, expect, it } from 'vitest';
import { buildRoad, createTestGame } from '../setup';

/**
 * No building during other player's turn: Only the active player may build, except for special card effects.
 * Test: Attempt build out of turn and verify rejection.
 */
describe('No Building During Other Player’s Turn', () => {
    it('should reject build attempts by non-active player during main phase', async () => {
        const game = await createTestGame({ players: 4, board: 'standard', phase: 'main' });
        game.activePlayer = game.players[0];
        // Non-active player attempts to build a road
        const buildResult = await buildRoad(game, game.players[1], { from: { q: 0, r: 0 }, to: { q: 0, r: 1 } });
        expect(buildResult.success).toBe(false);
        expect(buildResult.error).toMatch(/not your turn/i);
    });

    it('should allow build by active player during their turn', async () => {
        const game = await createTestGame({ players: 4, board: 'standard', phase: 'main' });
        game.activePlayer = game.players[0];
        const buildResult = await buildRoad(game, game.players[0], { from: { q: 0, r: 0 }, to: { q: 0, r: 1 } });
        expect(buildResult.success).toBe(true);
    });
});
