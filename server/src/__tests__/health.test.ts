import request from 'supertest';
import { app } from '../index';

describe('GET /health', () => {
    it('should return 200 and status ok with environment and mongodb status', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('environment');
        expect(res.body).toHaveProperty('mongodb');
        expect(['connected', 'disconnected']).toContain(res.body.mongodb);
    });
});
