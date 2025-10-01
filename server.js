import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { connectDB } from './db/mongodb.js';
import authRoutes from './routes/auth.js';
import budgetRoutes from './routes/budget.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/budget', budgetRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ message: 'Budget App API funcionando' });
});

// Conectar a MongoDB e iniciar servidor
const PORT = config.port;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Error iniciando el servidor:', err);
    process.exit(1);
});

