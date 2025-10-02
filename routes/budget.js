import express from 'express';
import { getDB } from '../db/mongodb.js';
import { authMiddleware } from '../middleware/auth.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all budget items
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
        console.error('Error getting items:', error);
        res.status(500).json({ error: 'Error getting budget items' });
    }
});

// Create new budget item
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

        await db.collection('BudgetInfo').updateOne(
            { userId: req.user.userId.toString() },
            { 
                $push: { budgetEntry: newEntry },
                $setOnInsert: { userId: req.user.userId.toString() }
            },
            { upsert: true }
        );

        res.status(201).json(newEntry);
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ error: 'Error creating budget item' });
    }
});

// Update budget item
router.put('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { type, description, amount, dateCreated } = req.body;
        const db = getDB();

        const updateData = {
            'budgetEntry.$.type': type,
            'budgetEntry.$.description': description,
            'budgetEntry.$.amount': parseFloat(amount),
            'budgetEntry.$.dateCreated': dateCreated || new Date().toISOString().split('T')[0]
        };

        const result = await db.collection('BudgetInfo').updateOne(
            { 
                userId: req.user.userId.toString(),
                'budgetEntry._id': new ObjectId(id)
            },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Budget item not found' });
        }

        res.json({ message: 'Budget item updated successfully' });
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Error updating budget item' });
    }
});

// Delete budget item
router.delete('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();

        const result = await db.collection('BudgetInfo').updateOne(
            { userId: req.user.userId.toString() },
            { $pull: { budgetEntry: { _id: new ObjectId(id) } } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Budget item not found' });
        }

        res.json({ message: 'Budget item deleted successfully' });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Error deleting budget item' });
    }
});

export default router;
