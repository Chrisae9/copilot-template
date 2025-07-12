import { io as Client, Socket as ClientSocket } from 'socket.io-client';

/**
 * Create and connect N clients to the test server.
 * @param count Number of clients
 * @param port Server port (default 3001)
 * @returns Array of connected ClientSocket instances
 */
export async function createClients(count: number, port: number = 3001): Promise<ClientSocket[]> {
    // Always use localhost for in-memory server tests
    const host = 'localhost';
    const clients = Array.from({ length: count }, () => Client(`http://${host}:${port}`));
    await Promise.all(clients.map((client) => new Promise<void>((resolve, reject) => {
        client.on('connect', resolve);
        client.on('connect_error', reject);
        setTimeout(() => reject(new Error('Timeout')), 5000);
    })));
    return clients;
}

/**
 * Create a room and join all clients to it. Returns the room code.
 * @param clients Array of ClientSocket
 * @returns The room code string
 */
export async function createRoomAndJoin(clients: ClientSocket[]): Promise<string> {
    if (!clients.length) throw new Error('No clients provided to createRoomAndJoin');
    return new Promise<string>((resolve) => {
        clients[0]!.emit('client:create_room', { gameSettings: { maxPlayers: clients.length } });
        clients[0]!.on('server:room_created', (data) => {
            const roomCode = data.roomCode;
            clients.forEach((client) => client.emit('client:join_room', { roomCode }));
            resolve(roomCode);
        });
    });
}

/**
 * Disconnect all clients.
 * @param clients Array of ClientSocket
 */
export function disconnectClients(clients?: ClientSocket[]): void {
    if (!Array.isArray(clients)) return;
    clients.forEach((client) => {
        if (client && client.connected) client.disconnect();
    });
}
