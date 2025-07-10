/**
 * Main server entry point for the Catan-inspired multiplayer game
 * Sets up Express server with Socket.IO for real-time communication
 */

import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import mongoose from 'mongoose';
import morgan from 'morgan';
import path from 'path';
import { Server, Socket } from 'socket.io';
import { fileURLToPath } from 'url';

// ES Module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allow WebSocket connections
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173"
}));
app.use(express.json());

// Health check endpoint (must be registered before static/catch-all routes)
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'catan-game-server',
        environment: process.env.NODE_ENV || 'development',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Serve static files in production and staging
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    const clientBuildPath = path.join(__dirname, '../public');
    app.use(express.static(clientBuildPath));

    // Serve React app for all non-API routes
    app.get('*', (req: Request, res: Response) => {
        // Skip API routes
        if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
            return res.status(404).json({ error: 'API endpoint not found' });
        }
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
}

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/catan-game';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
    })
    .catch((error: Error) => {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    });

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'catan-game-server',
        environment: process.env.NODE_ENV || 'development',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// API routes placeholder
app.get('/api/status', (req: Request, res: Response) => {
    res.json({
        message: 'Catan Game API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Database test endpoint
app.get('/api/db-test', async (req: Request, res: Response) => {
    try {
        // Test database connection and basic operations
        interface TestDoc {
            test: string;
            timestamp: Date;
            randomValue: number;
        }
        const testDoc: TestDoc = {
            test: 'server-db-verification',
            timestamp: new Date(),
            randomValue: Math.random()
        };

        // Use existing model if already defined to avoid OverwriteModelError
        const TestModel = (mongoose.models.Test as mongoose.Model<TestDoc>) || mongoose.model<TestDoc>('Test', new mongoose.Schema<TestDoc>({
            test: String,
            timestamp: Date,
            randomValue: Number
        }));

        // Insert test document
        const inserted = await TestModel.create(testDoc);
        console.log('✅ Database write test successful:', inserted._id);

        // Read test document
        const found = await TestModel.findById(inserted._id);
        console.log('✅ Database read test successful');

        // Delete test document
        await TestModel.findByIdAndDelete(inserted._id);
        console.log('✅ Database delete test successful');

        // Get database stats
        const dbStats = await mongoose.connection.db?.admin().serverStatus();

        res.json({
            status: 'success',
            message: 'Database operations completed successfully',
            tests: {
                write: '✅ Passed',
                read: '✅ Passed',
                delete: '✅ Passed'
            },
            database: {
                name: mongoose.connection.name,
                readyState: mongoose.connection.readyState,
                host: mongoose.connection.host,
                port: mongoose.connection.port
            },
            server: {
                version: dbStats?.version || 'unknown',
                uptime: dbStats?.uptime || 0
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Database test failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Database test failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});

// Socket.IO connection handling
io.on('connection', (socket: Socket) => {
    console.log(`👤 User connected: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`👤 User disconnected: ${socket.id}`);
    });

    // Basic test event
    socket.emit('server:welcome', {
        message: 'Welcome to the Catan-inspired game server!',
        socketId: socket.id
    });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    console.log(`🎲 Game API: http://localhost:${PORT}/api/status`);
    if (process.env.NODE_ENV === 'production') {
        console.log(`🎮 Game client served from: http://localhost:${PORT}`);
    }
});

export { app, io };
