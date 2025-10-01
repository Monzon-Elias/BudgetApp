import express from 'express';
import cors from 'cors';
import { config } from '../config.js';
import { connectDB } from '../db/mongodb.js';
import authRoutes from '../routes/auth.js';
import budgetRoutes from '../routes/budget.js';

const app = express();

// Middleware
app.use(cors({
    origin: ['https://budgetsite.netlify.app', 'http://localhost:5500'],
    credentials: true
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
