import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * No Playing Dev Card Just Purchased Integration Tests
 * Tests that a development card cannot be played on the same turn it was purchased.
 */
describe('No Playing Dev Card Just Purchased', () => {
    let roomCode: string;
    let clientA: ClientSocket;
    const serverPort = process.env.TEST_SOCKET_PORT || 3001;

    beforeEach(async () => {
        clientA = Client(`http://localhost:${serverPort}`);
        await new Promise<void>((resolve, reject) => {
            clientA.on('connect', resolve);
            clientA.on('connect_error', reject);
            setTimeout(() => reject(new Error('Timeout')), 5000);
        });
        // Create room and join
        await new Promise<void>((resolve) => {
            clientA.emit('client:create_room', { gameSettings: { maxPlayers: 4 } });
            clientA.on('server:room_created', (data) => {
                roomCode = data.roomCode;
                clientA.emit('client:join_room', { roomCode });
                resolve();
            });
        });
    });

    afterEach(() => {
        if (clientA && clientA.connected) clientA.disconnect();
    });

    it('should reject playing a dev card on the same turn it was purchased', async () => {
        // Buy a dev card
        clientA.emit('client:buy_dev_card', { roomCode });
        // Try to play it immediately
        const invalid = new Promise<void>((resolve) => {
            clientA.on('server:action_invalid', (data) => {
                expect(data.reason).toMatch(/cannot play a dev card on the same turn|wait until next turn|just purchased/i);
                resolve();
            });
        });
        clientA.emit('client:play_dev_card', { roomCode, cardType: 'knight' });
        await invalid;
    });

    it('should allow playing a dev card on a later turn', async () => {
        // Buy a dev card
        clientA.emit('client:buy_dev_card', { roomCode });
        // Simulate end of turn (custom test event)
        clientA.emit('test:end_turn', { roomCode });
        // Try to play it now
        const played = new Promise<void>((resolve) => {
            clientA.on('server:game_state_update', (data) => {
                expect(data.gameState.lastAction).toMatchObject({ type: 'play_dev_card', player: clientA.id, cardType: 'knight' });
                resolve();
            });
        });
        clientA.emit('client:play_dev_card', { roomCode, cardType: 'knight' });
        await played;
    });
});
