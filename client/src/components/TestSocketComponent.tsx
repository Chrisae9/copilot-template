/**
 * TestSocketComponent for validating Socket.IO client connection
 * @module TestSocketComponent
 */
import React, { useEffect, useState } from 'react';
import { socket } from '../services/socket';

/**
 * Simple test component to validate socket connection and error handling
 * @returns {JSX.Element}
 */
export const TestSocketComponent: React.FC = () => {
    const [connected, setConnected] = useState(socket.connected);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleConnect = () => setConnected(true);
        const handleDisconnect = () => setConnected(false);
        const handleError = (err: any) => setError(err.message || String(err));

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('connect_error', handleError);

        // Attempt connection
        if (!socket.connected) socket.connect();

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('connect_error', handleError);
        };
    }, []);

    return (
        <div className="p-4 border rounded bg-gray-50 dark:bg-gray-800">
            <h2 className="font-bold">Socket.IO Connection Test</h2>
            <p>Status: <span className={connected ? 'text-green-600' : 'text-red-600'}>{connected ? 'Connected' : 'Disconnected'}</span></p>
            {error && <p className="text-red-500">Error: {error}</p>}
        </div>
    );
};
