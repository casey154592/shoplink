const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Transaction = require('../models/Transaction');
const UserModel = require('../models/User');
const Post = require('../models/Post');
const { createNotification } = require('./notifications');

// Middleware for authentication
async function auth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    try {
        const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = await UserModel.findById(decoded.id);
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
}

// Create a new transaction (customer initiates)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'customer') {
            return res.status(403).json({ message: 'Only customers can initiate transactions' });
        }

        const { postId, amount, description, initialMessage } = req.body;

        if (!postId || !amount || !description) {
            return res.status(400).json({ message: 'Post ID, amount, and description are required' });
        }

        // Find the post to get CEO ID
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const transactionData = {
            customerId: req.user._id,
            ceoId: post.ceoId,
            postId: postId,
            amount: parseFloat(amount),
            description: description.trim(),
            status: 'pending'
        };

        if (initialMessage && initialMessage.trim().length > 0) {
            transactionData.messages = [{ senderId: req.user._id, text: initialMessage.trim() }];
        }

        const transaction = new Transaction(transactionData);
        await transaction.save();

        // Create notification for CEO
        await createNotification(
            post.ceoId,
            req.user._id,
            'transaction_created',
            'New Transaction Request',
            `${req.user.username} wants to purchase your product for ₦${amount}`,
            transaction._id
        );

        // Populate transaction data
        const populatedTransaction = await Transaction.findById(transaction._id)
            .populate('customerId', 'username profilePictureUrl')
            .populate('ceoId', 'username profilePictureUrl brandName')
            .populate('postId', 'description price');

        res.status(201).json({ 
            message: 'Transaction created successfully', 
            transaction: populatedTransaction 
        });
    } catch (err) {
        console.error('Transaction creation error:', err);
        res.status(500).json({ message: 'Failed to create transaction', error: err.message });
    }
});

// Get transactions for current user
router.get('/', auth, async (req, res) => {
    try {
        let query = {};
        
        if (req.user.role === 'customer') {
            query.customerId = req.user._id;
        } else if (req.user.role === 'CEO') {
            query.ceoId = req.user._id;
        }

        const transactions = await Transaction.find(query)
            .populate('customerId', 'username profilePictureUrl')
            .populate('ceoId', 'username profilePictureUrl brandName')
            .populate('postId', 'description price imageUrl')
            .sort({ createdAt: -1 });

        res.json(transactions);
    } catch (err) {
        console.error('Fetch transactions error:', err);
        res.status(500).json({ message: 'Failed to fetch transactions', error: err.message });
    }
});

// Update transaction status (CEO or customer can update based on role)
router.put('/:id', auth, async (req, res) => {
    try {
        const { status, message } = req.body;
        const transactionId = req.params.id;

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        // Check permissions
        const isCustomer = transaction.customerId.toString() === req.user._id.toString();
        const isCEO = transaction.ceoId.toString() === req.user._id.toString();

        if (!isCustomer && !isCEO) {
            return res.status(403).json({ message: 'You can only update your own transactions' });
        }

        // Validate status transitions
        const allowedStatuses = ['pending', 'in_progress', 'completed', 'cancelled', 'failed'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Business logic for status changes
        if (isCustomer && !['cancelled'].includes(status)) {
            return res.status(403).json({ message: 'Customers can only cancel transactions' });
        }

        if (isCEO && !['in_progress', 'completed', 'failed'].includes(status)) {
            return res.status(403).json({ message: 'CEOs can only update to in_progress, completed, or failed' });
        }

        if (message && message.trim().length > 0) {
            transaction.messages.push({ senderId: req.user._id, text: message.trim() });
        }
        transaction.status = status;
        await transaction.save();

        // Create notification for the other party
        const otherPartyId = isCustomer ? transaction.ceoId : transaction.customerId;
        const otherParty = await UserModel.findById(otherPartyId);
        
        let notificationTitle = '';
        let notificationMessage = '';
        
        if (status === 'cancelled') {
            notificationTitle = 'Transaction Cancelled';
            notificationMessage = `${req.user.username} cancelled the transaction`;
        } else if (status === 'in_progress') {
            notificationTitle = 'Transaction Started';
            notificationMessage = `${req.user.username} accepted your transaction request`;
        } else if (status === 'completed') {
            notificationTitle = 'Transaction Completed';
            notificationMessage = `Your transaction with ${req.user.username} has been completed`;
        } else if (status === 'failed') {
            notificationTitle = 'Transaction Failed';
            notificationMessage = `The transaction with ${req.user.username} failed`;
        }

        if (notificationTitle && notificationMessage) {
            await createNotification(
                otherPartyId,
                req.user._id,
                'transaction_updated',
                notificationTitle,
                notificationMessage,
                transactionId
            );
        }

        const updatedTransaction = await Transaction.findById(transactionId)
            .populate('customerId', 'username profilePictureUrl')
            .populate('ceoId', 'username profilePictureUrl brandName')
            .populate('postId', 'description price imageUrl');

        res.json({ 
            message: 'Transaction updated successfully', 
            transaction: updatedTransaction 
        });
    } catch (err) {
        console.error('Transaction update error:', err);
        res.status(500).json({ message: 'Failed to update transaction', error: err.message });
    }
});

// GET a specific transaction by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id)
            .populate('customerId', 'username profilePictureUrl')
            .populate('ceoId', 'username profilePictureUrl brandName')
            .populate('postId', 'description price imageUrl');
        
        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
        
        // Ensure only parties can view
        const isParty = [transaction.customerId._id.toString(), transaction.ceoId._id.toString()].includes(req.user._id.toString());
        if (!isParty) return res.status(403).json({ message: 'Access denied' });
        
        res.json(transaction);
    } catch (err) {
        console.error('Fetch transaction error:', err);
        res.status(500).json({ message: 'Failed to fetch transaction', error: err.message });
    }
});

// GET messages for a transaction
router.get('/:id/messages', auth, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
        // ensure only parties can view
        const isParty = [transaction.customerId.toString(), transaction.ceoId.toString()].includes(req.user._id.toString());
        if (!isParty) return res.status(403).json({ message: 'Access denied' });
        // populate sender info
        const messages = await Promise.all((transaction.messages || []).map(async msg => {
            const sender = await UserModel.findById(msg.senderId, 'username profilePictureUrl');
            return {
                ...msg.toObject(),
                sender: sender ? { id: sender._id, username: sender.username, profilePictureUrl: sender.profilePictureUrl } : null
            };
        }));
        res.json({ messages });
    } catch (err) {
        console.error('Fetch messages error:', err);
        res.status(500).json({ message: 'Failed to fetch messages', error: err.message });
    }
});

// POST a message to a transaction
router.post('/:id/messages', auth, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ message: 'Message text is required' });
        }
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
        const isParty = [transaction.customerId.toString(), transaction.ceoId.toString()].includes(req.user._id.toString());
        if (!isParty) return res.status(403).json({ message: 'Access denied' });
        transaction.messages.push({ senderId: req.user._id, text: text.trim() });
        await transaction.save();
        // Notify opposite party about new message
        const otherPartyId = transaction.customerId.toString() === req.user._id.toString() ? transaction.ceoId : transaction.customerId;
        await createNotification(
            otherPartyId,
            req.user._id,
            'message',
            'New Message',
            `${req.user.username} sent you a message regarding the transaction`,
            transaction._id
        );
        res.status(201).json({ message: 'Message sent successfully' });
    } catch (err) {
        console.error('Send message error:', err);
        res.status(500).json({ message: 'Failed to send message', error: err.message });
    }
});
// Get transaction statistics for a user
router.get('/stats/:userId', auth, async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Check if user can view these stats
        if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You can only view your own statistics' });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let query = {};
        if (user.role === 'customer') {
            query.customerId = userId;
        } else if (user.role === 'CEO') {
            query.ceoId = userId;
        }

        const transactions = await Transaction.find(query);
        
        const stats = {
            total: transactions.length,
            pending: transactions.filter(t => t.status === 'pending').length,
            inProgress: transactions.filter(t => t.status === 'in_progress').length,
            completed: transactions.filter(t => t.status === 'completed').length,
            cancelled: transactions.filter(t => t.status === 'cancelled').length,
            failed: transactions.filter(t => t.status === 'failed').length,
            totalAmount: transactions
                .filter(t => t.status === 'completed')
                .reduce((sum, t) => sum + t.amount, 0)
        };

        res.json(stats);
    } catch (err) {
        console.error('Transaction stats error:', err);
        res.status(500).json({ message: 'Failed to fetch transaction statistics', error: err.message });
    }
});

module.exports = router;