const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Notification = require('../models/Notification');
const UserModel = require('../models/User');
const Post = require('../models/Post');
const Transaction = require('../models/Transaction');

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

// Get notifications for current user
router.get('/', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ recipientId: req.user._id })
            .populate('senderId', 'username profilePictureUrl brandName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Notification.countDocuments({ recipientId: req.user._id });
        const unreadCount = await Notification.countDocuments({ 
            recipientId: req.user._id, 
            isRead: false 
        });

        res.json({
            notifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            unreadCount
        });
    } catch (err) {
        console.error('Fetch notifications error:', err);
        res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
    }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipientId: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification marked as read', notification });
    } catch (err) {
        console.error('Mark notification read error:', err);
        res.status(500).json({ message: 'Failed to mark notification as read', error: err.message });
    }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { recipientId: req.user._id, isRead: false },
            { isRead: true }
        );

        res.json({ 
            message: 'All notifications marked as read', 
            modifiedCount: result.modifiedCount 
        });
    } catch (err) {
        console.error('Mark all notifications read error:', err);
        res.status(500).json({ message: 'Failed to mark notifications as read', error: err.message });
    }
});

// Create notification helper function
async function createNotification(recipientId, senderId, type, title, message, relatedId = null) {
    try {
        // Don't create notification for self
        if (recipientId.toString() === senderId.toString()) {
            return;
        }

        const notification = new Notification({
            recipientId,
            senderId,
            type,
            title,
            message,
            relatedId
        });

        await notification.save();
        console.log('Notification created:', type, 'for user:', recipientId);
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

// Export the helper function so other routes can use it
module.exports.createNotification = createNotification;
module.exports.router = router;