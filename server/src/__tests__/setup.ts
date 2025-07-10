/**
 * Test setup configuration for server-side tests
 * Sets up test environment, mocks, and utilities
 */

import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

// Test database configuration
const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/catan-game-test';

/**
 * Global test setup - runs once before all tests
 */
beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.CLIENT_URL = 'http://localhost:5173';

    // Connect to test database
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(TEST_DB_URI);
        console.log('🧪 Connected to test database');
    }
});

/**
 * Setup before each test - clean slate for each test
 */
beforeEach(async () => {
    // Clear all collections before each test
    const collections = mongoose.connection.collections;

    for (const key in collections) {
        const collection = collections[key];
        if (collection) {
            await collection.deleteMany({});
        }
    }
});

/**
 * Cleanup after each test
 */
afterEach(async () => {
    // Additional cleanup if needed
});

/**
 * Global test cleanup - runs once after all tests
 */
afterAll(async () => {
    // Close database connection
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log('🧪 Disconnected from test database');
    }
});

/**
 * Test utilities
 */
export const testUtils = {
    /**
     * Creates a delay for testing async operations
     */
    delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

    /**
     * Generates test data
     */
    generateTestUser: () => ({
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'testpassword123'
    }),

    /**
     * Generates test game data
     */
    generateTestGame: () => ({
        roomCode: `TEST${Math.floor(Math.random() * 1000)}`,
        maxPlayers: 4,
        isPrivate: false
    }),

    /**
     * Cleans up specific collection
     */
    cleanCollection: async (collectionName: string) => {
        if (mongoose.connection.collections[collectionName]) {
            await mongoose.connection.collections[collectionName].deleteMany({});
        }
    }
};
