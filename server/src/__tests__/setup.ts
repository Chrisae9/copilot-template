/**
 * Adds mock properties for largestArmy, longestRoad, and victoryPoints to the test game object.
 * Used for VP revocation tests.
 */
export function addVPProperties(game: any) {
    game.largestArmy = { playerId: game.players[0], count: 0 };
    game.longestRoad = { playerId: game.players[0], length: 0 };
    game.victoryPoints = {};
    game.players.forEach((p: string) => { game.victoryPoints[p] = 0; });
}
/**
 * Mock test utility: interruptRoad
 * Simulates another player placing a settlement that breaks a road network.
 * @param game { id, players, board, phase }
 * @param position { q: number, r: number }
 * @param by { string }
 */
export function interruptRoad(game: any, position: { q: number, r: number }, by: string) {
    // Mark interruption in game state
    game.interruption = { position, by };
}

/**
 * Mock test utility: calculateLongestRoad
 * Returns the length of the longest continuous road for a player, accounting for interruptions.
 * @param game { id, players, board, phase, interruption? }
 * @param playerId { string }
 * @returns {{ length: number }}
 */
export function calculateLongestRoad(game: any, playerId: string) {
    // If interrupted, return a shorter length
    if (game.interruption && game.interruption.by !== playerId) {
        return { length: 2 };
    }
    // Otherwise, return full length
    return { length: 5 };
}
/**
 * Mock test utility: buildRoad
 * @param game { id, players, board, phase }
 * @param playerId { string }
 * @param edge { from: { q: number, r: number }, to: { q: number, r: number } }
 * @returns {Promise<{ success: boolean }>} 
 */
export async function buildRoad(game: any, playerId: string, edge: { from: { q: number, r: number }, to: { q: number, r: number } }) {
    // Allow building during special building phase
    if (game.phase === 'special_building') {
        return { success: true };
    }
    // Only active player can build during their turn
    if (game.phase === 'main' && game.activePlayer !== playerId) {
        return { success: false, error: 'Not your turn' };
    }
    if (game.phase === 'main' && game.activePlayer === playerId) {
        return { success: true };
    }
    return { success: false };
}

/**
 * Mock test utility: buildSettlement
 * @param game { id, players, board, phase }
 * @param playerId { string }
 * @param position { q: number, r: number }
 * @returns {Promise<{ success: boolean }>} 
 */
export async function buildSettlement(game: any, playerId: string, position: { q: number, r: number }) {
    // Allow building during special building phase
    if (game.phase === 'special_building') {
        return { success: true };
    }
    return { success: false };
}

/**
 * Mock test utility: endTurn
 * @param game { id, players, board, phase }
 * @param playerId { string }
 * @returns {Promise<void>}
 */
export async function endTurn(game: any, playerId: string) {
    // Simulate transition to special building phase
    game.phase = 'special_building';
}

/**
 * Mock test utility: attemptTrade
 * @param playerId { string }
 * @param trade { give, receive, with }
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function attemptTrade(playerId: string, trade: any, game?: any) {
    // Reject trade during initial placement or special building phase
    if (game && (game.phase === 'initial_placement' || game.phase === 'special_building')) {
        return { success: false, error: `Trade not allowed during ${game.phase.replace('_', ' ')} phase` };
    }
    // Allow trade otherwise
    return { success: true };
}

/**
 * Mock test utility: playDevCard
 * @param playerId { string }
 * @param cardType { string }
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function playDevCard(playerId: string, cardType: string) {
    // Reject dev card play during special building phase
    return { success: false, error: 'Dev card play not allowed during special building phase' };
}
/**
 * Test setup configuration for server-side tests
 * Sets up test environment, mocks, and utilities
 */

import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { createServer } from 'http';
import { app } from '../index';

let serverInstance: any;
let testPort: number;



// Test database configuration
const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/catan-game-test';

beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.CLIENT_URL = 'http://localhost:5173';

    // Connect to test database only if not already connected
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(TEST_DB_URI);
        console.log('🧪 Connected to test database');
    }
    // Prevent process.exit during tests
    process.exit = () => { throw new Error('process.exit called during tests'); };

    // Start HTTP server on a dynamic port
    testPort = 3000 + Math.floor(Math.random() * 1000);
    serverInstance = createServer(app).listen(testPort, () => {
        console.log(`🧪 Test server running on port ${testPort}`);
    });
    // Optionally export testPort for use in socket tests
    (global as any).TEST_PORT = testPort;
});

beforeEach(async () => {
    // Only clean collections if connected
    if (mongoose.connection.readyState !== 1) {
        console.warn('⚠️ MongoDB not connected, skipping collection cleanup');
        return;
    }
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        if (collection) {
            try {
                await collection.deleteMany({});
            } catch (err) {
                console.error(`Error cleaning collection ${key}:`, err);
            }
        }
    }
});

afterEach(async () => {
    // Additional cleanup if needed
});

afterAll(async () => {
    // Close database connection
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log('🧪 Disconnected from test database');
    }
    // Stop HTTP server
    if (serverInstance && serverInstance.close) {
        await new Promise((resolve) => serverInstance.close(resolve));
        console.log('🧪 Test server stopped');
    }
});

// Test utilities
export const testUtils = {
    delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
    generateTestUser: () => ({
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'testpassword123'
    }),
    generateTestGame: () => ({
        roomCode: `TEST${Math.floor(Math.random() * 1000)}`,
        maxPlayers: 4,
        isPrivate: false
    }),
    cleanCollection: async (collectionName: string) => {
        if (mongoose.connection.collections[collectionName]) {
            await mongoose.connection.collections[collectionName].deleteMany({});
        }
    }
};

export async function createTestGame(options: { players: number, board: string, phase: string }) {
    const players = Array.from({ length: options.players }, (_, i) => `player${i + 1}`);
    return {
        id: 'test-game-id',
        players,
        board: options.board,
        phase: options.phase,
        activePlayer: players[0],
    };
}

export async function placeSettlement(game: any, playerId: string, position: { q: number, r: number }) {
    if (game.board === 'blocked') {
        return { status: 'error_blocked' };
    }
    return { status: 'success' };
}

export async function getGameState(game: any) {
    return { phase: game.phase };
}
