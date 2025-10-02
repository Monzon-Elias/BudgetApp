import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDB } from '../db/mongodb.js';
import { config } from '../config.js';

const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = getDB();
        
        // Check if user already exists
        const existingUser = await db.collection('Users').findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
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
        console.error('Error in register:', error);
        res.status(500).json({ error: 'Error registering user' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = getDB();

        // Find user
        const user = await db.collection('Users').findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create JWT token
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
        console.error('Error in login:', error);
        res.status(500).json({ error: 'Error logging in' });
    }
});

export default router;
