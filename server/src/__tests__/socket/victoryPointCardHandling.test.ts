import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import http from 'http';
import { Server } from 'socket.io';

describe('Victory Point Card Handling', () => {
    let clientA: ClientSocket;
    let clientB: ClientSocket;
    let roomCode: string;
    let httpServer: http.Server;
    let ioServer: Server;
    let SERVER_URL: string;

    beforeEach(async () => {
        httpServer = http.createServer();
        await new Promise<void>((resolve) => {
            httpServer.listen(0, '127.0.0.1', () => {
                const address = httpServer.address();
                if (address && typeof address === 'object') {
                    SERVER_URL = `http://localhost:${address.port}`;
                }
                resolve();
            });
        });
        ioServer = new Server(httpServer);
        // TODO: Attach your server-side handlers here if needed
        clientA = Client(SERVER_URL);
        clientB = Client(SERVER_URL);
        await new Promise<void>((resolve, reject) => {
            clientA.on('connect', resolve);
            clientA.on('connect_error', reject);
            setTimeout(() => reject(new Error('Timeout')), 5000);
        });
        await new Promise<void>((resolve, reject) => {
            clientB.on('connect', resolve);
            clientB.on('connect_error', reject);
            setTimeout(() => reject(new Error('Timeout')), 5000);
        });
        // Create room and join both clients
        await new Promise<void>((resolve) => {
            clientA.emit('client:create_room', { gameSettings: { maxPlayers: 2 } });
            clientA.on('server:room_created', (data) => {
                roomCode = data.roomCode;
                clientA.emit('client:join_room', { roomCode });
                clientB.emit('client:join_room', { roomCode });
                resolve();
            });
        });
    });

    afterEach(() => {
        if (clientA && clientA.connected) clientA.disconnect();
        if (clientB && clientB.connected) clientB.disconnect();
        if (ioServer) ioServer.close();
        if (httpServer) httpServer.close();
    });

    it('should keep Victory Point cards secret until game end', async () => {
        // Simulate buying a Victory Point card
        clientA.emit('client:buy_dev_card', { type: 'victory_point' });
        // Listen for game state update
        let vpCardVisible = false;
        clientB.on('server:game_state_update', (data) => {
            // Victory Point card should not be visible to other players
            if (data.gameState && data.gameState.players) {
                const otherPlayer = data.gameState.players.find((p: any) => p.userId === clientA.id);
                if (otherPlayer && otherPlayer.devCards) {
                    vpCardVisible = otherPlayer.devCards.hidden.includes('victory_point');
                }
            }
        });
        // Wait a short time to ensure no VP card is revealed
        await new Promise((resolve) => setTimeout(resolve, 1000));
        expect(vpCardVisible).toBe(false);
        // Simulate game end
        clientA.emit('client:end_game', {});
        // Listen for final state
        let vpCardRevealed = false;
        clientB.on('server:game_state_update', (data) => {
            if (data.gameState && data.gameState.players) {
                const otherPlayer = data.gameState.players.find((p: any) => p.userId === clientA.id);
                if (otherPlayer && otherPlayer.devCards) {
                    vpCardRevealed = otherPlayer.devCards.hidden.includes('victory_point');
                }
            }
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        expect(vpCardRevealed).toBe(true);
    });

    it('should reject attempts to play Victory Point cards during the game', async () => {
        // Simulate buying a Victory Point card
        clientA.emit('client:buy_dev_card', { type: 'victory_point' });
        // Wait for card to be added
        await new Promise((resolve) => setTimeout(resolve, 500));
        // Attempt to play Victory Point card
        const invalidPlay = new Promise<void>((resolve) => {
            clientA.on('server:action_invalid', (data) => {
                expect(data.reason).toMatch(/cannot play victory point/i);
                resolve();
            });
        });
        clientA.emit('client:play_dev_card', { cardType: 'victory_point' });
        await invalidPlay;
    });
});
