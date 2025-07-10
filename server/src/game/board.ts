import type { Board, Hex, Port, Resources, TerrainType } from '../../../src/types/catan';

/**
 * Generates a Catan board for standard (3-4 player) or extended (5-6 player) games.
 *
 * @param size - 'standard' for 3-4 players, 'extended' for 5-6 players
 * @returns {Board} The generated board object with hexes and ports
 *
 * @example
 * // Standard board
 * const board = generateBoard('standard');
 *
 * // Extended board
 * const extBoard = generateBoard('extended');
 */
export function generateBoard(size: 'standard' | 'extended' = 'standard'): Board {
    if (size === 'standard') {
        /**
         * Standard 3-4 player board configuration
         * 19 hexes, 1 desert, 9 ports
         */
        const terrainList: TerrainType[] = [
            'hills', 'hills', 'hills',
            'forest', 'forest', 'forest', 'forest',
            'fields', 'fields', 'fields', 'fields',
            'mountains', 'mountains', 'mountains',
            'pasture', 'pasture', 'pasture', 'pasture',
            'desert'
        ];
        // Official number tokens for standard board (no 7, 1 desert)
        const numberTokens = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
        let tokenIdx = 0;
        const hexes: Hex[] = terrainList.map((terrain, i) => {
            const isDesert = terrain === 'desert';
            return {
                coordinates: { q: 0, r: i },
                terrain,
                numberToken: isDesert ? null : numberTokens[tokenIdx++]!,
                hasRobber: isDesert,
            };
        });
        // Port order and coordinates (clockwise from top)
        const portOrder: { resource: keyof Resources | 'any'; ratio: number }[] = [
            { resource: 'any', ratio: 3 },
            { resource: 'brick', ratio: 2 },
            { resource: 'any', ratio: 3 },
            { resource: 'lumber', ratio: 2 },
            { resource: 'any', ratio: 3 },
            { resource: 'wool', ratio: 2 },
            { resource: 'any', ratio: 3 },
            { resource: 'grain', ratio: 2 },
            { resource: 'ore', ratio: 2 },
        ];
        const portCoords: { q: number; r: number }[] = [
            { q: 0, r: -3 },
            { q: 1, r: -3 },
            { q: 3, r: -2 },
            { q: 3, r: -1 },
            { q: 2, r: 2 },
            { q: 1, r: 3 },
            { q: -1, r: 3 },
            { q: -3, r: 2 },
            { q: -3, r: 0 },
        ];
        const ports: Port[] = portOrder.map((port, i) => {
            const coord = portCoords[i];
            if (!coord) throw new Error(`Missing port coordinate for port index ${i}`);
            return { coordinates: coord, ratio: port.ratio, resource: port.resource };
        });
        return { hexes, ports, size };
    }
    if (size === 'extended') {
        /**
         * Extended 5-6 player board configuration
         * 30 hexes, 2 deserts, 11 ports
         */
        const terrainList: TerrainType[] = [
            'hills', 'hills', 'hills', 'hills', 'hills',
            'forest', 'forest', 'forest', 'forest', 'forest', 'forest',
            'fields', 'fields', 'fields', 'fields', 'fields', 'fields',
            'mountains', 'mountains', 'mountains', 'mountains', 'mountains',
            'pasture', 'pasture', 'pasture', 'pasture', 'pasture', 'pasture',
            'desert', 'desert'
        ];
        // Official number tokens for 5-6 player board (28 tokens, 2 deserts)
        const numberTokens = [
            2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12,
            2, 3, 4, 5, 6, 8, 9, 10, 11, 12
        ];
        let tokenIdx = 0;
        const hexes: Hex[] = terrainList.map((terrain, i) => {
            const isDesert = terrain === 'desert';
            return {
                coordinates: { q: 0, r: i },
                terrain,
                numberToken: isDesert ? null : numberTokens[tokenIdx++]!,
                hasRobber: isDesert,
            };
        });
        // Port order and coordinates (clockwise from top, official 5-6p layout)
        const portOrder: { resource: keyof Resources | 'any'; ratio: number }[] = [
            { resource: 'any', ratio: 3 },
            { resource: 'brick', ratio: 2 },
            { resource: 'any', ratio: 3 },
            { resource: 'lumber', ratio: 2 },
            { resource: 'any', ratio: 3 },
            { resource: 'wool', ratio: 2 },
            { resource: 'any', ratio: 3 },
            { resource: 'grain', ratio: 2 },
            { resource: 'any', ratio: 3 },
            { resource: 'ore', ratio: 2 },
            { resource: 'any', ratio: 3 },
        ];
        const portCoords: { q: number; r: number }[] = [
            { q: 0, r: -4 },   // top
            { q: 1, r: -4 },
            { q: 3, r: -3 },
            { q: 4, r: -2 },
            { q: 4, r: 0 },
            { q: 3, r: 2 },
            { q: 1, r: 4 },
            { q: 0, r: 4 },
            { q: -2, r: 4 },
            { q: -4, r: 2 },
            { q: -4, r: 0 },
        ];
        const ports: Port[] = portOrder.map((port, i) => {
            const coord = portCoords[i];
            if (!coord) throw new Error(`Missing port coordinate for port index ${i}`);
            return { coordinates: coord, ratio: port.ratio, resource: port.resource };
        });
        return { hexes, ports, size };
    }
    // Fallback: empty board for invalid size
    return { hexes: [], ports: [], size };
}
