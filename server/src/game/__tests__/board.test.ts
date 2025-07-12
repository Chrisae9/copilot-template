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

    /**
     * Returns all adjacent hexes for a given hex using axial coordinates.
     * @param hex The hex to find neighbors for
     * @param allHexes The list of all hexes on the board
     */
    function getAdjacentHexes(hex: { coordinates: { q: number; r: number } }, allHexes: { coordinates: { q: number; r: number }; numberToken: number | null }[]) {
        // Axial directions for hex grid
        const directions = [
            { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
            { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
        ];
        return directions
            .map(dir => {
                const neighborQ = hex.coordinates.q + dir.q;
                const neighborR = hex.coordinates.r + dir.r;
                return allHexes.find(h => h.coordinates.q === neighborQ && h.coordinates.r === neighborR);
            })
            .filter(Boolean);
    }

    it('should not place 6 and 8 tokens on adjacent hexes', () => {
        const board: Board = generateBoard('standard');
        const sixEightHexes = board.hexes.filter(h => h.numberToken === 6 || h.numberToken === 8);
        for (const hex of sixEightHexes) {
            const neighbors = getAdjacentHexes(hex, board.hexes);
            for (const neighbor of neighbors) {
                if (neighbor && (neighbor.numberToken === 6 || neighbor.numberToken === 8)) {
                    throw new Error(`Adjacent 6/8 tokens found at (${hex.coordinates.q},${hex.coordinates.r}) and (${neighbor.coordinates.q},${neighbor.coordinates.r})`);
                }
            }
        }
    });

    it('should generate correct number of ports', () => {
        const board: Board = generateBoard('standard');
        expect(board.ports.length).toBeGreaterThanOrEqual(8);
        expect(board.ports.length).toBeLessThanOrEqual(9);
    });
});
