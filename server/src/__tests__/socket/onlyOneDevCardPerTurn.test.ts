import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/**
 * Only One Dev Card Played Per Turn Integration Tests
 * Tests that only one development card can be played per turn, and that playing another is rejected until the next turn.
 */
describe('Only One Dev Card Played Per Turn', () => {
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
        // Give player two dev cards for testing
        clientA.emit('test:set_player_dev_cards', { roomCode, playerId: clientA.id, devCards: ['knight', 'road_building'] });
    });

    afterEach(() => {
        if (clientA && clientA.connected) clientA.disconnect();
    });

    it('should allow playing one dev card per turn', async () => {
        // Play first dev card
        const played = new Promise<void>((resolve) => {
            clientA.on('server:game_state_update', (data) => {
                expect(data.gameState.lastAction).toMatchObject({ type: 'play_dev_card', player: clientA.id, cardType: 'knight' });
                resolve();
            });
        });
        clientA.emit('client:play_dev_card', { roomCode, cardType: 'knight' });
        await played;
    });

    it('should reject playing a second dev card in the same turn', async () => {
        // Play first dev card
        await new Promise<void>((resolve) => {
            clientA.on('server:game_state_update', (data) => {
                if (data.gameState.lastAction.cardType === 'knight') resolve();
            });
        });
        clientA.emit('client:play_dev_card', { roomCode, cardType: 'knight' });
        // Try to play second dev card
        const invalid = new Promise<void>((resolve) => {
            clientA.on('server:action_invalid', (data) => {
                expect(data.reason).toMatch(/only one dev card per turn|already played/i);
                resolve();
            });
        });
        clientA.emit('client:play_dev_card', { roomCode, cardType: 'road_building' });
        await invalid;
    });

    it('should allow playing another dev card on a new turn', async () => {
        // Play first dev card
        await new Promise<void>((resolve) => {
            clientA.on('server:game_state_update', (data) => {
                if (data.gameState.lastAction.cardType === 'knight') resolve();
            });
        });
        clientA.emit('client:play_dev_card', { roomCode, cardType: 'knight' });
        // End turn
        clientA.emit('test:end_turn', { roomCode });
        // Play second dev card
        const played = new Promise<void>((resolve) => {
            clientA.on('server:game_state_update', (data) => {
                expect(data.gameState.lastAction).toMatchObject({ type: 'play_dev_card', player: clientA.id, cardType: 'road_building' });
                resolve();
            });
        });
        clientA.emit('client:play_dev_card', { roomCode, cardType: 'road_building' });
        await played;
    });
});
