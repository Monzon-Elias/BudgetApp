import { MongoClient } from 'mongodb';
import { config } from '../config.js';

let db = null;
let client = null;

export async function connectDB() {
    try {
        client = new MongoClient(config.mongodbUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 5,
            ssl: true,
            sslValidate: true,
            tlsAllowInvalidCertificates: false,
            tlsAllowInvalidHostnames: false
        });
        await client.connect();
        db = client.db('budgetAppDb');
        console.log('✅ Conectado a MongoDB Atlas - Database: budgetAppDb');
        return db;
    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error);
        process.exit(1);
    }
}

export function getDB() {
    if (!db) {
        throw new Error('Database not connected');
    }
    return db;
}
