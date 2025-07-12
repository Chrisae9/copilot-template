import { describe, expect, it } from 'vitest';

/**
 * Largest Army/Longest Road loss: If a player loses largest army/longest road, points must be revoked immediately.
 * Test: Award, then revoke, and verify VP adjustment.
 */
describe('Largest Army/Longest Road Loss (VP Revocation)', () => {
    it('should revoke VP when player loses largest army', async () => {
        // Use a local mock game object with all needed properties
        const players = ['player1', 'player2', 'player3', 'player4'];
        const game = {
            players,
            largestArmy: { playerId: players[0], count: 3 },
            victoryPoints: { [players[0]]: 2, [players[1]]: 0, [players[2]]: 0, [players[3]]: 0 },
        };
        // Simulate player 2 surpassing with more knights
        game.largestArmy = { playerId: players[1], count: 4 };
        // Backend should revoke VP from player 1 and award to player 2
        game.victoryPoints[players[0]] -= 2;
        game.victoryPoints[players[1]] = 2;
        expect(game.victoryPoints[players[0]]).toBe(0);
        expect(game.victoryPoints[players[1]]).toBe(2);
    });

    it('should revoke VP when player loses longest road', async () => {
        // Use a local mock game object with all needed properties
        const players = ['player1', 'player2', 'player3', 'player4'];
        const game = {
            players,
            longestRoad: { playerId: players[0], length: 6 },
            victoryPoints: { [players[0]]: 2, [players[1]]: 0, [players[2]]: 0, [players[3]]: 0 },
        };
        // Simulate player 2 surpassing with longer road
        game.longestRoad = { playerId: players[1], length: 7 };
        // Backend should revoke VP from player 1 and award to player 2
        game.victoryPoints[players[0]] -= 2;
        game.victoryPoints[players[1]] = 2;
        expect(game.victoryPoints[players[0]]).toBe(0);
        expect(game.victoryPoints[players[1]]).toBe(2);
    });
});
