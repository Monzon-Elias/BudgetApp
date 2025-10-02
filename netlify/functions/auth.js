const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const MONGODB_URI = 'mongodb+srv://elios:eliosmbaPass1!!@budgetapp.d6ntesg.mongodb.net/budgetAppDb?retryWrites=true&w=majority';
const JWT_SECRET = 'budgetApp2025SecretKey!SuperSecure#MonzonProject';

let client = null;

async function getDB() {
    if (!client) {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
    }
    return client.db('budgetAppDb');
}

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { email, password, action } = JSON.parse(event.body);
        const db = await getDB();

        if (action === 'register') {
            // Register
            const existingUser = await db.collection('Users').findOne({ email });
            if (existingUser) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Email already registered' })
                };
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await db.collection('Users').insertOne({
                email,
                password: hashedPassword,
                createdAt: new Date()
            });

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({ message: 'User registered successfully' })
            };
        } else {
            // Login
            const user = await db.collection('Users').findOne({ email });
            if (!user) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Invalid credentials' })
                };
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Invalid credentials' })
                };
            }

            const token = jwt.sign(
                { userId: user._id, email: user.email },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'Login successful',
                    token,
                    user: { email: user.email, id: user._id }
                })
            };
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
