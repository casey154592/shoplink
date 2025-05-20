const express = require('express');
const router = express.Router();
const { users } = require('./signup');

const posts = [];

router.post('/posts', (req, res) => {
    const { email, content } = req.body;
    if (!email || !content) {
        return res.status(400).json({ message: 'Email and content are required.' });
    }
    const user = users.find(u => u.email === email && u.role === 'CEO');
    if (!user) {
        return res.status(403).json({ message: 'Only CEOs can post.' });
    }
    const post = { author: user.username, content, date: new Date() };
    posts.push(post);
    res.status(201).json({ message: 'Post created.', post });
});

// Endpoint for customers to view posts
router.get('/posts', (req, res) => {
    res.json(posts);
});

module.exports = router;