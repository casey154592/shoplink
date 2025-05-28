const express = require('express');
const User = require('../models/User');
const router = express.Router();

router.post('/login', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'No account found with this email.' });
        }
        // No password check!
        res.json({ message: 'Login successful', username: user.username, role: user.role, email: user.email });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;