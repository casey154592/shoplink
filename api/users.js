const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/users
router.get('/', async (req, res) => {
    try {
        const users = await User.find({}, '-password'); // Exclude password field
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch users', error: err.message });
    }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id, '-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch user', error: err.message });
    }
});

module.exports = router;