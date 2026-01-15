import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db/mongodb.js';
import authRoutes from './routes/auth.js';
import budgetRoutes from './routes/budget.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const defaultAllowedOrigins = [
    'http://localhost:5500',
    'https://budgetsite.netlify.app'
];

const envAllowedOrigins = (process.env.FRONTEND_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }

        const isAllowed =
            allowedOrigins.includes(origin) ||
            origin.endsWith('.netlify.app');

        if (isAllowed) {
            return callback(null, true);
        }

        return callback(new Error(`CORS not allowed for origin: ${origin}`));
    },
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/budget', budgetRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Connect to MongoDB and start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
}).catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
