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
        const posts = await Post.find().populate('author', 'username role');
        res.json(posts);
    } catch (err) {
        console.error('Fetch posts error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;