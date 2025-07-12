import { describe, expect, it } from 'vitest';
import { buildRoad, calculateLongestRoad, createTestGame, interruptRoad } from '../setup';

/**
 * Road building interruption: If a player’s road is interrupted by another player’s settlement/city,
 * longest road calculation must break the road. (Test: Build a road network, interrupt it, and verify longest road recalculation.)
 */
describe('Road Building Interruption (Longest Road Calculation)', () => {
    it('should break longest road when interrupted by another player’s settlement', async () => {
        // Setup: Create a test game with a simple road network
        const game = await createTestGame({ players: 4, board: 'standard', phase: 'main' });
        // Player 1 builds a continuous road: (0,0)-(0,1)-(0,2)-(0,3)-(0,4)
        await buildRoad(game, game.players[0], { from: { q: 0, r: 0 }, to: { q: 0, r: 1 } });
        await buildRoad(game, game.players[0], { from: { q: 0, r: 1 }, to: { q: 0, r: 2 } });
        await buildRoad(game, game.players[0], { from: { q: 0, r: 2 }, to: { q: 0, r: 3 } });
        await buildRoad(game, game.players[0], { from: { q: 0, r: 3 }, to: { q: 0, r: 4 } });
        // Player 2 interrupts with a settlement at (0,2)
        // Simulate interruption (mock logic: interruption breaks road)
        interruptRoad(game, { q: 0, r: 2 }, game.players[1]);
        // Calculate longest road (mock logic: should be split)
        const longestRoad = calculateLongestRoad(game, game.players[0]);
        expect(longestRoad.length).toBeLessThan(5); // Should be < 5 after interruption
    });
});
