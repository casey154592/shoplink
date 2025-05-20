const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { users } = require('./signup');

const posts = [];

// Set up multer for video uploads
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
        // Accept only video files
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(null, false);
        }
    }
});

// CEO creates a post (with optional video)
router.post('/posts', upload.single('video'), (req, res) => {
    const { email, content } = req.body;
    if (!email || !content) {
        return res.status(400).json({ message: 'Email and content are required.' });
    }
    const user = users.find(u => u.email === email && u.role === 'CEO');
    if (!user) {
        return res.status(403).json({ message: 'Only CEOs can post.' });
    }
    let videoUrl = null;
    if (req.file) {
        videoUrl = '/uploads/' + req.file.filename;
    }
    const post = {
        author: user.username,
        content,
        videoUrl,
        date: new Date()
    };
    posts.push(post);
    res.status(201).json({ message: 'Post created.', post });
});

// Anyone can view posts
router.get('/posts', (req, res) => {
    res.json(posts);
});

module.exports = router;