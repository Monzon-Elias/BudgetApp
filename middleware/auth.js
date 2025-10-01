import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function authMiddleware(req, res, next) {
    try {
        const token = req.headers.authorization?.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded; // { userId, email }
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

