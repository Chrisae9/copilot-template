/**
 * Socket.IO client service for Catan game
 * Handles connection, error handling, and reconnection logic
 * @module socket
 */
import { io, Socket } from 'socket.io-client';

/**
 * TypeScript interface for Socket.IO events
 */
export interface ServerToClientEvents {
    'server:room_update': (data: any) => void;
    'server:player_joined': (data: any) => void;
    'server:player_left': (data: any) => void;
    'server:game_started': (data: any) => void;
    'server:dice_rolled': (data: any) => void;
    'server:turn_changed': (data: any) => void;
    'server:game_state_update': (data: any) => void;
    'server:action_invalid': (data: any) => void;
    'server:trade_proposed': (data: any) => void;
    'server:trade_completed': (data: any) => void;
    'server:trade_cancelled': (data: any) => void;
}

export interface ClientToServerEvents {
    'client:create_room': (data: any) => void;
    'client:join_room': (data: any) => void;
    'client:leave_room': () => void;
    'client:start_game': () => void;
    'client:roll_dice': () => void;
    'client:end_turn': () => void;
    'client:build_item': (data: any) => void;
    'client:buy_dev_card': () => void;
    'client:play_dev_card': (data: any) => void;
    'client:move_robber': (data: any) => void;
    'client:propose_trade': (data: any) => void;
    'client:respond_to_trade': (data: any) => void;
    'client:maritime_trade': (data: any) => void;
}

/**
 * Singleton Socket.IO client instance
 * @type {Socket<ServerToClientEvents, ClientToServerEvents>}
 * @example
 * import { socket } from '@/services/socket';
 * socket.emit('client:join_room', { roomCode: 'ABCD' });
 */
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
    import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001',
    {
        transports: ['websocket'], // Force WebSocket to avoid polling errors
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 5000,
        autoConnect: true,
        withCredentials: true,
    }
);

// Connection error handling
socket.on('connect_error', (err) => {
    // eslint-disable-next-line no-console
    console.error('Socket.IO connection error:', err);
});

socket.on('disconnect', (reason) => {
    // eslint-disable-next-line no-console
    console.warn('Socket.IO disconnected:', reason);
});

/**
 * Utility to safely connect/reconnect socket
 * @returns {void}
 */
export function connectSocket(): void {
    if (!socket.connected) {
        socket.connect();
    }
}

/**
 * Utility to safely disconnect socket
 * @returns {void}
 */
export function disconnectSocket(): void {
    if (socket.connected) {
        socket.disconnect();
    }
}
