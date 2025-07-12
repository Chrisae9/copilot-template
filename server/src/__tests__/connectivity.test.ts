import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it } from 'vitest';

/**
 * Minimal Socket.IO connectivity test for Docker networking
 */

describe('Socket.IO Connectivity (Docker)', () => {
    let httpServer: ReturnType<typeof createServer>;
    let io: Server;
    let client: ClientSocket;
    let connected = false;
    let port: number;

    beforeEach(async () => {
        httpServer = createServer();
        await new Promise<void>((resolve) => {
            httpServer.listen(0, '127.0.0.1', () => {
                const address = httpServer.address();
                if (address && typeof address === 'object') {
                    port = address.port;
                }
                resolve();
            });
        });
        io = new Server(httpServer, {
            cors: { origin: '*', methods: ['GET', 'POST'] }
        });
        io.on('connection', () => {
            connected = true;
        });
    });

    afterEach(async () => {
        io.close();
        await new Promise<void>((resolve) => httpServer.close(() => resolve()));
        if (client && client.connected) client.disconnect();
        connected = false;
    });

    it('should connect client to server using Docker networking', async () => {
        client = Client(`http://localhost:${port}`);
        await new Promise<void>((resolve, reject) => {
            client.on('connect', resolve);
            client.on('connect_error', reject);
            setTimeout(() => reject(new Error('Timeout')), 5000);
        });
        // Wait a moment for server to register connection
        await new Promise((resolve) => setTimeout(resolve, 500));
        expect(client.connected).toBe(true);
        expect(connected).toBe(true);
    });
});
