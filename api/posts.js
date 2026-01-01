const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const router = express.Router();
const jwt = require('jsonwebtoken');
const UserModel = require('../models/User'); // Use your User model from models/User.js
const Post = require('../models/Post');      // Use your Post model from models/Post.js
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

// Test route without auth
router.get('/test', (req, res) => {
    console.log('GET /api/posts/test called');
    res.json({ message: 'Posts API test route working!', timestamp: new Date().toISOString() });
});

// Multer setup for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Create a new product post (Ceo only)
router.post('/', auth, upload.single('productImage'), async (req, res) => {
    console.log('POST /api/posts called with auth');
    try {
        // Check if user is authenticated and is a CEO
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (req.user.role !== 'CEO') {
            return res.status(403).json({ message: 'Only CEOs can create posts' });
        }

        const { price, description, negotiable } = req.body;

        // Validate required fields
        if (!description || !price || !req.file) {
            return res.status(400).json({ message: 'Description, price, and image are required' });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        const ceoId = req.user.id;

        const post = new Post({
            ceoId,
            imageUrl,
            price: parseFloat(price),
            description: description.trim(),
            negotiable: negotiable === 'on' || negotiable === true || negotiable === 'true'
        });
        await post.save();

        // Create notifications for followers
        if (ceo.followers && ceo.followers.length > 0) {
            const brandName = ceo.brandName || ceo.username;
            for (const followerId of ceo.followers) {
                await createNotification(
                    followerId,
                    ceoId,
                    'post_created',
                    'New Post from ' + brandName,
                    `${brandName} just posted a new product: ${description.substring(0, 50)}...`,
                    post._id
                );
            }
        }

        // Populate author info for the response
        const ceo = await UserModel.findById(ceoId);
        const postWithAuthor = {
            ...post.toObject(),
            author: ceo ? {
                id: ceo._id,
                username: ceo.username,
                profilePictureUrl: ceo.profilePictureUrl,
                email: ceo.email,
                followers: ceo.followers || []
            } : null
        };

        res.status(201).json({ message: 'Product posted successfully!', post: postWithAuthor });
    } catch (err) {
        console.error('Post creation error:', err);
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
                    profilePictureUrl: ceo.profilePictureUrl,
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

// Follow/Unfollow a CEO
router.post('/follow/:ceoId', auth, async (req, res) => {
    try {
        if (req.user.role !== 'customer') {
            return res.status(403).json({ message: 'Only customers can follow CEOs' });
        }

        const ceoId = req.params.ceoId;
        const customerId = req.user._id;

        // Check if CEO exists
        const ceo = await UserModel.findById(ceoId);
        if (!ceo || ceo.role !== 'CEO') {
            return res.status(404).json({ message: 'CEO not found' });
        }

        // Check if already following
        const isFollowing = ceo.followers && ceo.followers.includes(customerId);

        if (isFollowing) {
            // Unfollow
            await UserModel.findByIdAndUpdate(ceoId, { $pull: { followers: customerId } });
            res.json({ message: 'Successfully unfollowed CEO' });
        } else {
            // Follow
            await UserModel.findByIdAndUpdate(ceoId, { $addToSet: { followers: customerId } });
            
            // Create notification for CEO
            await createNotification(
                ceoId,
                customerId,
                'user_followed',
                'New Follower',
                `${req.user.username} started following you`,
                customerId
            );
            
            res.json({ message: 'Successfully followed CEO' });
        }
    } catch (err) {
        console.error('Follow/Unfollow error:', err);
        res.status(500).json({ message: 'Failed to follow/unfollow CEO', error: err.message });
    }
});

// DELETE /api/posts/:id - Delete a post (only by the post owner)
router.delete('/:id', auth, async (req, res) => {
    console.log('DELETE /api/posts/:id called with id:', req.params.id);
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;

        console.log('User ID:', userId, 'User Role:', userRole);

        // Find the post
        const post = await Post.findById(postId);
        if (!post) {
            console.log('Post not found:', postId);
            return res.status(404).json({ message: 'Post not found' });
        }

        console.log('Post found, ceoId:', post.ceoId, 'userId:', userId);

        // Check if user is the owner of the post or an admin
        if (post.ceoId.toString() !== userId && userRole !== 'admin') {
            console.log('Unauthorized delete attempt');
            return res.status(403).json({ message: 'You can only delete your own posts' });
        }

        // Delete the post
        await Post.findByIdAndDelete(postId);
        console.log('Post deleted successfully');

        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        console.error('Post deletion error:', err);
        res.status(500).json({ message: 'Failed to delete post', error: err.message });
    }
});

// PUT /api/posts/:id - Edit a post (only by the post owner)
router.put('/:id', auth, async (req, res) => {
    console.log('PUT /api/posts/:id called with id:', req.params.id);
    console.log('Request body:', req.body);
    console.log('User:', req.user ? req.user.id : 'No user');
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;
        const { description, price, negotiable } = req.body;

        // Find the post
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if user is the owner of the post or an admin
        if (post.ceoId.toString() !== userId && userRole !== 'admin') {
            return res.status(403).json({ message: 'You can only edit your own posts' });
        }

        // Validate input
        if (!description || !price) {
            return res.status(400).json({ message: 'Description and price are required' });
        }

        // Update the post
        const updatedPost = await Post.findByIdAndUpdate(
            postId,
            {
                description: description.trim(),
                price: parseFloat(price),
                negotiable: negotiable === 'on' || negotiable === true || negotiable === 'true'
            },
            { new: true }
        );

        // Populate author info for the response
        const ceo = await UserModel.findById(updatedPost.ceoId);
        const postWithAuthor = {
            ...updatedPost.toObject(),
            author: ceo ? {
                id: ceo._id,
                username: ceo.username,
                profilePictureUrl: ceo.profilePictureUrl,
                email: ceo.email,
                brandName: ceo.brandName,
                followers: ceo.followers || []
            } : null
        };

        res.json({ message: 'Post updated successfully', post: postWithAuthor });
    } catch (err) {
        console.error('Post update error:', err);
        res.status(500).json({ message: 'Failed to update post', error: err.message });
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

module.exports = router;