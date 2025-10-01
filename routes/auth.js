import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB } from '../db/mongodb.js';
import { config } from '../config.js';

const router = express.Router();

// Registrar usuario
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = getDB();
        
        // Verificar si el usuario ya existe
        const existingUser = await db.collection('Users').findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Crear usuario
        const newUser = {
            email,
            password: hashedPassword,
            createdAt: new Date()
        };
        
        await db.collection('Users').insertOne(newUser);

        res.status(201).json({ 
            message: 'User registered successfully. You can now login.',
            email 
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error registering user' });
    }
});

// Solicitar reset de contraseña
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const db = getDB();

        // Verificar si el usuario existe
        const user = await db.collection('Users').findOne({ email });
        if (!user) {
            // Por seguridad, no revelamos si el email existe o no
            return res.json({ message: 'If the email exists, a reset link has been sent.' });
        }

        // Crear token de reset (expira en 1 hora)
        const resetToken = jwt.sign({ email, type: 'password-reset' }, config.jwtSecret, { expiresIn: '1h' });
        
        // Guardar token en la base de datos
        await db.collection('Users').updateOne(
            { email },
            { $set: { resetToken, resetTokenExpires: new Date(Date.now() + 3600000) } }
        );

        // TODO: Implementar envío de email de reset
        // Por ahora, solo logueamos el token para desarrollo
        console.log('🔑 Reset token for', email, ':', resetToken);
        console.log('🔗 Reset URL:', `${config.frontendUrl}/reset-password.html?token=${resetToken}`);

        res.json({ message: 'If the email exists, a reset link has been sent.' });
    } catch (error) {
        console.error('Error in forgot password:', error);
        res.status(500).json({ error: 'Error processing request' });
    }
});

// Reset contraseña
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const db = getDB();

        // Verificar token
        const decoded = jwt.verify(token, config.jwtSecret);
        if (decoded.type !== 'password-reset') {
            return res.status(400).json({ error: 'Invalid token' });
        }

        // Buscar usuario y verificar que el token no haya expirado
        const user = await db.collection('Users').findOne({ 
            email: decoded.email,
            resetToken: token,
            resetTokenExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        // Hash nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar contraseña y limpiar token
        await db.collection('Users').updateOne(
            { email: decoded.email },
            { 
                $set: { password: hashedPassword },
                $unset: { resetToken: '', resetTokenExpires: '' }
            }
        );

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(400).json({ error: 'Invalid or expired token' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = getDB();

        // Buscar usuario
        const user = await db.collection('Users').findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Ya no necesitamos verificar email

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Crear JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            config.jwtSecret,
            { expiresIn: '7d' }
        );

        res.json({ 
            message: 'Login successful',
            token,
            user: { email: user.email, id: user._id }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
});

export default router;

