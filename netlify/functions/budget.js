const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

const MONGODB_URI = 'mongodb+srv://elios:eliosmbaPass1!!@budgetapp.d6ntesg.mongodb.net/budgetAppDb?retryWrites=true&w=majority';
const JWT_SECRET = 'budgetApp2025SecretKey!SuperSecure#MonzonProject';

let cachedClient = null;

async function connectToDatabase() {
    if (cachedClient) {
        return cachedClient;
    }

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    cachedClient = client;
    return client;
}

function verifyToken(event) {
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('No token provided');
    }

    const token = authHeader.split(' ')[1];
    return jwt.verify(token, JWT_SECRET);
}

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

        // Verificar autenticación
        const user = verifyToken(event);

        if (event.path === '/budget/items' && event.httpMethod === 'GET') {
            const userBudget = await db.collection('BudgetInfo')
                .findOne({ userId: user.userId.toString() });
            
            if (!userBudget || !userBudget.budgetEntry) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify([]),
                };
            }
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(userBudget.budgetEntry),
            };
        }

        if (event.path === '/budget/items' && event.httpMethod === 'POST') {
            const { type, description, amount, dateCreated } = JSON.parse(event.body);

            const newEntry = {
                _id: new ObjectId(),
                type,
                description,
                amount: parseFloat(amount),
                dateCreated: dateCreated || new Date().toISOString().split('T')[0]
            };

            await db.collection('BudgetInfo').updateOne(
                { userId: user.userId.toString() },
                { 
                    $push: { budgetEntry: newEntry },
                    $setOnInsert: { userId: user.userId.toString() }
                },
                { upsert: true }
            );

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(newEntry),
            };
        }

        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Not found' }),
        };

    } catch (error) {
        console.error('Error:', error);
        
        if (error.message === 'No token provided' || error.message.includes('jwt')) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Invalid token' }),
            };
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
