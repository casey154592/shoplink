const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Post = require('../models/Post');
const User = require('../models/User');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(null, false);
        }
    }
});

// CEO creates a post (with optional video)
router.post('/posts', upload.single('video'), async (req, res) => {
    const { email, content } = req.body;
    if (!email || !content) {
        return res.status(400).json({ message: 'Email and content are required.' });
    }
    try {
        const user = await User.findOne({ email, role: 'CEO' });
        if (!user) {
            return res.status(403).json({ message: 'Only CEOs can post.' });
        }
        let videoUrl = '';
        if (req.file) {
            videoUrl = '/uploads/' + req.file.filename;
        }
        const post = new Post({
            author: user._id,
            content,
            videoUrl
        });
        await post.save();
        res.status(201).json({ message: 'Post created.', post });
    } catch (err) {
        console.error('Post creation error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Anyone can view posts
router.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find().populate('author', 'username profilePictureUrl').sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        console.error('Fetch posts error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get posts by a specific user
router.get('/posts/user/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) return res.status(404).json({ message: 'User not found.' });
        const posts = await Post.find({ author: user._id }).sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        console.error('Fetch user posts error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a post by ID (only by the author)
router.delete('/posts/:id', async (req, res) => {
    const { email } = req.body;
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found.' });
        const user = await User.findOne({ email });
        if (!user || !post.author.equals(user._id)) {
            return res.status(403).json({ message: 'Not authorized.' });
        }
        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted.' });
    } catch (err) {
        console.error('Delete post error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Edit a post by ID (only by the author)
router.put('/posts/:id', async (req, res) => {
    const { email, content } = req.body;
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found.' });
        const user = await User.findOne({ email });
        if (!user || !post.author.equals(user._id)) {
            return res.status(403).json({ message: 'Not authorized.' });
        }
        post.content = content;
        await post.save();
        res.json({ message: 'Post updated.', post });
    } catch (err) {
        console.error('Edit post error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;