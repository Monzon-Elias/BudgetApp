import express from 'express';
import { getDB } from '../db/mongodb.js';
import { authMiddleware } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener todos los items del usuario
router.get('/items', async (req, res) => {
    try {
        const db = getDB();
        const userBudget = await db.collection('BudgetInfo')
            .findOne({ userId: req.user.userId.toString() });
        
        if (!userBudget || !userBudget.budgetEntry) {
            return res.json([]);
        }
        
        res.json(userBudget.budgetEntry);
    } catch (error) {
        console.error('Error obteniendo items:', error);
        res.status(500).json({ error: 'Error fetching items' });
    }
});

// Crear nuevo item
router.post('/items', async (req, res) => {
    try {
        const { type, description, amount, dateCreated } = req.body;
        const db = getDB();

        const newEntry = {
            _id: new ObjectId(),
            type,
            description,
            amount: parseFloat(amount),
            dateCreated: dateCreated || new Date().toISOString().split('T')[0]
        };

        // Buscar documento del usuario o crearlo si no existe
        const result = await db.collection('BudgetInfo').updateOne(
            { userId: req.user.userId.toString() },
            { 
                $push: { budgetEntry: newEntry },
                $setOnInsert: { userId: req.user.userId.toString() }
            },
            { upsert: true }
        );

        res.status(201).json(newEntry);
    } catch (error) {
        console.error('Error creando item:', error);
        res.status(500).json({ error: 'Error creating item' });
    }
});

// Actualizar item
router.put('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { type, description, amount, dateCreated } = req.body;
        const db = getDB();


        const updateFields = {
            'budgetEntry.$.type': type,
            'budgetEntry.$.description': description,
            'budgetEntry.$.amount': parseFloat(amount)
        };

        // Actualizar fecha (si viene del input o usar fecha actual)
        updateFields['budgetEntry.$.dateCreated'] = dateCreated || new Date().toISOString().split('T')[0];


        // Verificar que el documento existe antes de actualizar
        const existingDoc = await db.collection('BudgetInfo').findOne({
            userId: req.user.userId.toString(),
            'budgetEntry._id': new ObjectId(id)
        });
        

        const result = await db.collection('BudgetInfo').updateOne(
            { 
                userId: req.user.userId.toString(),
                'budgetEntry._id': new ObjectId(id)
            },
            { 
                $set: updateFields
            }
        );


        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json({ message: 'Item updated', modifiedCount: result.modifiedCount });
    } catch (error) {
        console.error('Error actualizando item:', error);
        res.status(500).json({ error: 'Error updating item' });
    }
});

// Eliminar item
router.delete('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();

        const result = await db.collection('BudgetInfo').updateOne(
            { userId: req.user.userId.toString() },
            { 
                $pull: { 
                    budgetEntry: { _id: new ObjectId(id) }
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json({ message: 'Item deleted' });
    } catch (error) {
        console.error('Error eliminando item:', error);
        res.status(500).json({ error: 'Error deleting item' });
    }
});

export default router;

