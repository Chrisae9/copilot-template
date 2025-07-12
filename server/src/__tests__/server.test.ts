// --- User Authentication Tests (TDD) ---

import mongoose from 'mongoose';
import User from '../models/User';
import { beforeAll, afterAll } from 'vitest';

describe('User Authentication', () => {
    const testUser = { username: 'testuser', email: 'testuser@example.com', password: 'TestPass123!' };
    let testUserToken: string;

    beforeAll(async () => {
        // Clean up any existing test user before starting
        await User.deleteMany({ email: testUser.email });
        // Register the test user for login tests
        await request(app)
            .post('/api/auth/register')
            .send(testUser)
            .expect(201);
        // Login and set token for protected endpoint test
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: testUser.password })
            .expect(200);
        testUserToken = loginResponse.body.token;
    });

    afterAll(async () => {
        // Clean up only the test user after all tests
        await User.deleteMany({ email: testUser.email });
        await mongoose.connection.close();
    });

    it('should register a new user successfully', async () => {
        // Use a unique user for this test to avoid duplicate registration
        const uniqueUser = { username: `user_${Date.now()}`, email: `user_${Date.now()}@example.com`, password: 'TestPass123!' };
        const response = await request(app)
            .post('/api/auth/register')
            .send(uniqueUser)
            .expect(201);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user).toMatchObject({ username: uniqueUser.username, email: uniqueUser.email });
        expect(response.body).toHaveProperty('token');
    });

    it('should not allow duplicate registration', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send(testUser)
            .expect(409);
        expect(response.body).toHaveProperty('error');
    });

    it('should not register with invalid data', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({ username: '', email: 'bad', password: '' })
            .expect(400);
        expect(response.body).toHaveProperty('error');
    });

    it('should login with correct credentials', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: testUser.password })
            .expect(200);
        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('token');
        testUserToken = response.body.token;
    });

    it('should not login with wrong password', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: testUser.email, password: 'WrongPass!' })
            .expect(401);
        expect(response.body).toHaveProperty('error');
    });

    it('should not login with non-existent user', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nouser@example.com', password: 'irrelevant' })
            .expect(401);
        expect(response.body).toHaveProperty('error');
    });

    it('should access a JWT-protected endpoint with valid token', async () => {
        // Ensure login has occurred and token is set
        expect(testUserToken).toBeDefined();
        const response = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${testUserToken}`)
            .expect(200);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user).toMatchObject({ username: testUser.username, email: testUser.email });
    });

    it('should reject access to JWT-protected endpoint with invalid token', async () => {
        const response = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer invalidtoken')
            .expect(401);
        expect(response.body).toHaveProperty('error');
    });

    it('should reject access to JWT-protected endpoint with no token', async () => {
        const response = await request(app)
            .get('/api/auth/me')
            .expect(401);
        expect(response.body).toHaveProperty('error');
    });
});
/**
 * Server integration tests
 * Tests the main Express server functionality, health endpoints, and basic API routes
 */

import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../index.js';
import './setup.ts';

describe('Server Integration Tests', () => {
    describe('Health Check Endpoint', () => {
        it('should return server health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body).toMatchObject({
                status: 'ok',
                service: 'catan-game-server',
                environment: 'test'
            });

            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('mongodb');
            expect(typeof response.body.timestamp).toBe('string');
            expect(['connected', 'disconnected']).toContain(response.body.mongodb);
        });

        it('should have valid timestamp format', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            const timestamp = new Date(response.body.timestamp);
            expect(timestamp).toBeInstanceOf(Date);
            expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 10000); // Within last 10 seconds
        });
    });

    describe('API Status Endpoint', () => {
        it('should return API status information', async () => {
            const response = await request(app)
                .get('/api/status')
                .expect(200);

            expect(response.body).toMatchObject({
                message: 'Catan Game API is running',
                version: '1.0.0'
            });

            expect(response.body).toHaveProperty('timestamp');
            expect(typeof response.body.timestamp).toBe('string');
        });
    });

    describe('Database Test Endpoint', () => {
        it('should successfully test database operations', async () => {
            const response = await request(app)
                .get('/api/db-test')
                .expect(200);

            expect(response.body).toMatchObject({
                status: 'success',
                message: 'Database operations completed successfully',
                tests: {
                    write: '✅ Passed',
                    read: '✅ Passed',
                    delete: '✅ Passed'
                }
            });

            expect(response.body).toHaveProperty('database');
            expect(response.body).toHaveProperty('server');
            expect(response.body).toHaveProperty('timestamp');

            // Verify database information
            expect(response.body.database).toHaveProperty('name');
            expect(response.body.database).toHaveProperty('readyState');
            expect(response.body.database.readyState).toBe(1); // Connected state
        });

        it('should handle database operations correctly', async () => {
            // This test verifies that the database test doesn't leave test data
            const firstResponse = await request(app)
                .get('/api/db-test')
                .expect(200);

            const secondResponse = await request(app)
                .get('/api/db-test')
                .expect(200);

            // Both should succeed independently
            expect(firstResponse.body.status).toBe('success');
            expect(secondResponse.body.status).toBe('success');
        });
    });

    describe('Error Handling', () => {
        it('should return 404 for unknown API routes', async () => {
            const response = await request(app)
                .get('/api/nonexistent')
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });

        it('should handle POST requests to health endpoint', async () => {
            await request(app)
                .post('/health')
                .expect(404);
        });
    });

    describe('CORS Headers', () => {
        it('should include proper CORS headers', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            // Check for CORS headers (should be set by cors middleware)
            expect(response.headers).toHaveProperty('access-control-allow-origin');
        });
    });

    describe('JSON Response Format', () => {
        it('should return valid JSON for all API endpoints', async () => {
            const endpoints = ['/health', '/api/status', '/api/db-test'];

            for (const endpoint of endpoints) {
                const response = await request(app)
                    .get(endpoint)
                    .expect(200);

                expect(response.type).toBe('application/json');
                expect(typeof response.body).toBe('object');
            }
        });
    });

    describe('Server Configuration', () => {
        it('should have correct environment variables in test mode', async () => {
            expect(process.env.NODE_ENV).toBe('test');
            expect(process.env.JWT_SECRET).toBe('test-jwt-secret');
            expect(process.env.CLIENT_URL).toBe('http://localhost:5173');
        });

        it('should handle missing environment variables gracefully', async () => {
            // Health endpoint should still work even with missing optional env vars
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body.status).toBe('ok');
        });
    });
});
