import express from 'express';
import cors from 'cors';
import { config } from '../config.js';
import { connectDB } from '../db/mongodb.js';
import authRoutes from '../routes/auth.js';
import budgetRoutes from '../routes/budget.js';

const app = express();

// Middleware de logging
app.use((req, res, next) => {
    console.log('🔍 Request received:', {
        method: req.method,
        url: req.url,
        origin: req.headers.origin,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
    });
    next();
});

// Middleware
app.use(cors({
    origin: true, // Permitir todos los orígenes temporalmente
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/budget', budgetRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ message: 'Budget App API funcionando' });
});

// Conectar a MongoDB
connectDB().then(() => {
    console.log('✅ Conectado a MongoDB Atlas');
}).catch(err => {
    console.error('❌ Error conectando a MongoDB:', err);
});

export default app;
