/**
 * Vitest configuration for server-side tests
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Test environment
        environment: 'node',

        // Global test setup
        globals: true,

        // Setup files
        setupFiles: ['./src/__tests__/setup.ts'],

        // Test file patterns
        include: [
            'src/**/*.{test,spec}.{js,ts}',
            'src/__tests__/**/*.test.{js,ts}',
            'src/__tests__/**/*.spec.{js,ts}',
            'src/__tests__/socket/**/*.test.{js,ts}',
            'src/__tests__/socket/**/*.spec.{js,ts}',
            'src/__tests__/socket.test.{js,ts}'
        ],
        exclude: ['node_modules', 'dist'],

        // Timeout settings
        testTimeout: 30000, // 30 seconds for integration tests
        hookTimeout: 30000,

        // Coverage settings
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'dist/',
                'src/__tests__/',
                '**/*.d.ts',
                '**/*.config.*'
            ],
            thresholds: {
                global: {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80
                }
            }
        },

        // Reporter
        reporters: ['verbose'],

        // Retry failed tests
        retry: 1,
        sequence: {
            concurrent: false // Run tests serially to avoid port and DB conflicts
        },
    }
});
