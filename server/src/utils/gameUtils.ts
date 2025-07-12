/**
 * Utility functions for game logic
 * Core game utilities that will be used throughout the Catan game
 */

/**
 * Generates a random room code for multiplayer games
 */
export function generateRoomCode(length: number = 4): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
}

/**
 * Validates room code format
 */
export function validateRoomCode(roomCode: string): boolean {
    if (!roomCode || typeof roomCode !== 'string') {
        return false;
    }

    // Room codes must be 4-6 uppercase alphanumeric characters (no lowercase allowed)
    const pattern = /^[A-Z0-9]{4,6}$/;
    return pattern.test(roomCode);
}

/**
 * Generates a random dice roll (2 dice, 1-6 each)
 */
export function rollDice(): { die1: number; die2: number; total: number } {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;

    return {
        die1,
        die2,
        total: die1 + die2
    };
}

/**
 * Validates dice roll result
 */
export function validateDiceRoll(roll: { die1: number; die2: number; total: number }): boolean {
    if (!roll || typeof roll !== 'object') {
        return false;
    }

    const { die1, die2, total } = roll;

    // Each die should be 1-6
    if (die1 < 1 || die1 > 6 || die2 < 1 || die2 > 6) {
        return false;
    }

    // Total should equal sum of dice
    if (total !== die1 + die2) {
        return false;
    }

    return true;
}

/**
 * Calculates distance between two hexagonal coordinates
 * Uses cube coordinates system for hexagonal grids
 */
export function hexDistance(hex1: { q: number; r: number }, hex2: { q: number; r: number }): number {
    // Convert axial to cube coordinates
    const cube1 = { x: hex1.q, y: -hex1.q - hex1.r, z: hex1.r };
    const cube2 = { x: hex2.q, y: -hex2.q - hex2.r, z: hex2.r };

    // Calculate Manhattan distance in cube coordinates, then divide by 2
    return (Math.abs(cube1.x - cube2.x) + Math.abs(cube1.y - cube2.y) + Math.abs(cube1.z - cube2.z)) / 2;
}

/**
 * Validates player count for game
 */
export function validatePlayerCount(count: number): boolean {
    return Number.isInteger(count) && count >= 3 && count <= 6;
}

/**
 * Generates unique player ID
 */
export function generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validates username format
 */
export function validateUsername(username: string): boolean {
    if (!username || typeof username !== 'string') {
        return false;
    }

    // Username should be 3-20 characters, alphanumeric + underscore
    const pattern = /^[a-zA-Z0-9_]{3,20}$/;
    return pattern.test(username);
}

/**
 * Sanitizes user input
 */
export function sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    // Remove <script>...</script> blocks (case-insensitive, multiline)
    let sanitized = input.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    // Remove all other HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    // Trim whitespace
    return sanitized.trim();
}

/**
 * Calculates the longest continuous road for each player and determines the owner.
 * If two or more players tie for the longest road (>=5), returns null (no owner).
 * @param players Array of PlayerState
 * @returns { playerId: string | null, length: number } | null
 */
export function calculateLongestRoad(players: Array<{ userId: string, pieces: { roads: Array<{ coordinates: [{ q: number, r: number }, { q: number, r: number }], playerId: string }> } }>): { playerId: string | null, length: number } | null {
    // Helper: build adjacency map for each player's roads
    function buildGraph(roads: Array<{ coordinates: [{ q: number, r: number }, { q: number, r: number }] }>) {
        const graph: Record<string, Set<string>> = {};
        for (const road of roads) {
            const [a, b] = road.coordinates;
            const keyA = `${a.q},${a.r}`;
            const keyB = `${b.q},${b.r}`;
            if (!graph[keyA]) graph[keyA] = new Set();
            if (!graph[keyB]) graph[keyB] = new Set();
            graph[keyA].add(keyB);
            graph[keyB].add(keyA);
        }
        return graph;
    }
    // Helper: DFS to find longest path in player's road graph
    function longestPath(graph: Record<string, Set<string>>): number {
        let maxLen = 0;
        const keys = Object.keys(graph);
        for (const start of keys) {
            const visited = new Set<string>();
            function dfs(node: string, length: number) {
                visited.add(node);
                maxLen = Math.max(maxLen, length);
                const neighbors = graph[node];
                if (neighbors) {
                    for (const neighbor of neighbors) {
                        if (!visited.has(neighbor)) {
                            dfs(neighbor, length + 1);
                        }
                    }
                }
                visited.delete(node);
            }
            dfs(start, 0);
        }
        return maxLen;
    }
    // Calculate longest road for each player
    const results: Array<{ playerId: string, length: number }> = [];
    for (const player of players) {
        const graph = buildGraph(player.pieces.roads);
        const length = longestPath(graph);
        results.push({ playerId: player.userId, length });
    }
    // Find max length
    const maxLength = Math.max(...results.map(r => r.length));
    if (maxLength < 5) return null; // No one qualifies
    // Find all players with max length
    const contenders = results.filter(r => r.length === maxLength);
    if (contenders.length === 1 && contenders[0]) {
        return { playerId: contenders[0].playerId, length: maxLength };
    }
    // Tie: no owner
    return null;
}
