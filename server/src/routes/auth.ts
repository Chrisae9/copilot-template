import bcrypt from 'bcryptjs';
import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User';

const router = express.Router();
const JWT_SECRET: string = process.env.JWT_SECRET || 'test-jwt-secret';

// JWT middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    if (!token || typeof token !== 'string') {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        (req as any).user = decoded;
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// Register
router.post('/register', async (req: Request, res: Response) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password || password.length < 6) {
        return res.status(400).json({ error: 'Invalid registration data' });
    }
    const existing = await (User as mongoose.Model<any>).findOne({ $or: [{ email }, { username }] });
    if (existing) {
        return res.status(409).json({ error: 'User already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await (User as mongoose.Model<any>).create({ username, email, passwordHash });
    const token = jwt.sign({ id: user._id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user: { username: user.username, email: user.email }, token });
});

// Login
router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await (User as mongoose.Model<any>).findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { username: user.username, email: user.email }, token });
});

// Me (protected)
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
    const userData = (req as any).user;
    res.json({ user: { username: userData.username, email: userData.email } });
});

export default router;
