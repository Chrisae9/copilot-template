const EXTENDED_HEX_COUNT = 30;
const EXTENDED_TERRAIN_COUNTS: Record<TerrainType, number> = {
    hills: 5,
    forest: 6,
    fields: 6,
    mountains: 5,
    pasture: 6,
    desert: 2,
};

describe('Board Generation (5-6 player extended)', () => {
    it('should generate a board with 30 hexes for extended size', () => {
        const board: Board = generateBoard('extended');
        expect(board.hexes).toHaveLength(EXTENDED_HEX_COUNT);
    });

    it('should have correct terrain distribution for extended board', () => {
        const board: Board = generateBoard('extended');
        const terrainCounts: Record<TerrainType, number> = {
            hills: 0, forest: 0, fields: 0, mountains: 0, pasture: 0, desert: 0
        };
        for (const hex of board.hexes) terrainCounts[hex.terrain]++;
        expect(terrainCounts).toEqual(EXTENDED_TERRAIN_COUNTS);
    });

    it('should have exactly 2 deserts for extended board', () => {
        const board: Board = generateBoard('extended');
        const deserts = board.hexes.filter(h => h.terrain === 'desert');
        expect(deserts).toHaveLength(2);
    });

    it('should generate correct number of ports for extended board', () => {
        const board: Board = generateBoard('extended');
        expect(board.ports.length).toBe(11);
    });
});
import { describe, expect, it } from 'vitest';
import type { Board, TerrainType } from '../../../../src/types/catan';
import { generateBoard } from '../board.js';

const STANDARD_HEX_COUNT = 19;
const STANDARD_TERRAIN_COUNTS: Record<TerrainType, number> = {
    hills: 3,
    forest: 4,
    fields: 4,
    mountains: 3,
    pasture: 4,
    desert: 1,
};
const STANDARD_NUMBER_TOKENS = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];


describe('Board Generation', () => {
    it('should generate a board with 19 hexes for standard size', () => {
        const board: Board = generateBoard('standard');
        expect(board.hexes).toHaveLength(STANDARD_HEX_COUNT);
    });

    it('should have correct terrain distribution', () => {
        const board: Board = generateBoard('standard');
        const terrainCounts: Record<TerrainType, number> = {
            hills: 0, forest: 0, fields: 0, mountains: 0, pasture: 0, desert: 0
        };
        for (const hex of board.hexes) terrainCounts[hex.terrain]++;
        expect(terrainCounts).toEqual(STANDARD_TERRAIN_COUNTS);
    });

    it('should place the robber on the desert', () => {
        const board: Board = generateBoard('standard');
        const desert = board.hexes.find(h => h.terrain === 'desert');
        expect(desert).toBeDefined();
        expect(desert?.hasRobber).toBe(true);
    });

    it('should assign number tokens to all non-desert hexes', () => {
        const board: Board = generateBoard('standard');
        const nonDesertHexes = board.hexes.filter(h => h.terrain !== 'desert');
        for (const hex of nonDesertHexes) {
            expect(typeof hex.numberToken).toBe('number');
            expect(hex.numberToken).not.toBeNull();
        }
        const tokens = nonDesertHexes.map(h => h.numberToken).sort((a, b) => (a! - b!));
        expect(tokens).toEqual([...STANDARD_NUMBER_TOKENS].sort((a, b) => a - b));
    });

    it('should not place 6 and 8 tokens on adjacent hexes', () => {
        // This test will be implemented after adjacency logic is available
        // Placeholder for now
        expect(true).toBe(true);
    });

    it('should generate correct number of ports', () => {
        const board: Board = generateBoard('standard');
        expect(board.ports.length).toBeGreaterThanOrEqual(8);
        expect(board.ports.length).toBeLessThanOrEqual(9);
    });
});
