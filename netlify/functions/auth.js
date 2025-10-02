const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const MONGODB_URI = 'mongodb+srv://elios:eliosmbaPass1!!@budgetapp.d6ntesg.mongodb.net/budgetAppDb?retryWrites=true&w=majority';
const JWT_SECRET = 'budgetApp2025SecretKey!SuperSecure#MonzonProject';

let cachedClient = null;

async function connectToDatabase() {
    if (cachedClient) {
        return cachedClient;
    }

    const client = new MongoClient(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    await client.connect();
    cachedClient = client;
    return client;
}

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: '',
        };
    }

    try {
        const client = await connectToDatabase();
        const db = client.db('budgetAppDb');

        if (event.path === '/auth/login' && event.httpMethod === 'POST') {
            const { email, password } = JSON.parse(event.body);

            // Buscar usuario
            const user = await db.collection('Users').findOne({ email });
            if (!user) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Invalid credentials' }),
                };
            }

            // Verificar contraseña
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Invalid credentials' }),
                };
            }

            // Crear JWT token
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
                }),
            };
        }

        if (event.path === '/auth/register' && event.httpMethod === 'POST') {
            const { email, password } = JSON.parse(event.body);

            // Verificar si el usuario ya existe
            const existingUser = await db.collection('Users').findOne({ email });
            if (existingUser) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Email already registered' }),
                };
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

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({
                    message: 'User registered successfully. You can now login.',
                    email
                }),
            };
        }

        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Not found' }),
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
