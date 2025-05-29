const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const router = express.Router();
const jwt = require('jsonwebtoken');
const UserModel = require('../models/User'); // Use your User model from models/User.js
const Post = require('../models/Post');      // Use your Post model from models/Post.js

// Middleware for authentication
async function auth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    try {
        const decoded = jwt.verify(token, 'YOUR_SECRET');
        req.user = await UserModel.findById(decoded.id);
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
}

// Multer setup for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Create a new product post (Ceo only)
router.post('/', auth, upload.single('productImage'), async (req, res) => {
    try {
        // You should check if user is authenticated and is a Ceo here
        // Example: req.user.role === 'ceo'
        const { price, description, negotiable } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
        const ceoId = req.user ? req.user.id : 'demo-ceo'; // Replace with real user ID

        const post = new Post({
            ceoId,
            imageUrl,
            price,
            description,
            negotiable: negotiable === 'on' || negotiable === true || negotiable === 'true'
        });
        await post.save();
        res.status(201).json({ message: 'Product posted!', post });

        // Notify followers when Ceo posts a product
        const ceo = await UserModel.findById(post.ceoId);
        for (const followerId of ceo.followers) {
            await Notification.create({
                userId: followerId,
                ceoId: ceo._id,
                postId: post._id,
                content: `${ceo.username} posted a new product: ${post.description}`
            });
        }
    } catch (err) {
        res.status(500).json({ message: 'Failed to post product', error: err.message });
    }
});

// GET /api/posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        // Populate Ceo info for each post
        const postsWithAuthor = await Promise.all(posts.map(async post => {
            const ceo = await UserModel.findById(post.ceoId);
            return {
                ...post.toObject(),
                author: ceo ? {
                    id: ceo._id,
                    username: ceo.username,
                    profilePictureUrl: ceo.profilePic,
                    email: ceo.email,
                    followers: ceo.followers || []
                } : null
            };
        }));
        res.json(postsWithAuthor);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch posts', error: err.message });
    }
});

// GET /api/posts/:id
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch post', error: err.message });
    }
});

// Follow a Ceo
router.post('/follow/:ceoId', auth, async (req, res) => {
    try {
        const userId = req.user.id; // You must have authentication middleware
        const ceoId = req.params.ceoId;
        const ceo = await UserModel.findById(ceoId);
        if (!ceo) return res.status(404).json({ message: 'Ceo not found' });
        if (!ceo.followers.includes(userId)) {
            ceo.followers.push(userId);
            await ceo.save();
        }
        res.json({ message: 'Ceo followed' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to follow Ceo', error: err.message });
    }
});

// Get notifications for a user
router.get('/notifications', auth, async (req, res) => {
    try {
        const userId = req.user.id; // You must have authentication middleware
        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
    }
});

module.exports = router;