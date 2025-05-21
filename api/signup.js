const express = require('express');
const router = express.Router();

const users = []; // Replace with DB in production

router.post('/signup', (req, res) => {
    const { username, email, password, role, method } = req.body;
    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: 'All fields including role are required.' });
    }
    if (!['CEO', 'Customer'].includes(role)) {
        return res.status(400).json({ message: 'Role must be either CEO or Customer.' });
    }
    const exists = users.find(u => u.email === email);
    if (exists) {
        return res.status(409).json({ message: 'User with this email already exists.' });
    }
    // Save user and profile info
    const newUser = { username, email, password, role };
    users.push(newUser);
    res.json({ message: 'Signup successful', username, role });
});

// Google signup
router.post('/signup/google', (req, res) => {
    const { googleToken, role } = req.body;
    if (!googleToken || !role) {
        return res.status(400).json({ message: 'Google token and role are required.' });
    }
    // Verify Google token here (use Google API)
    // If valid:
    // Send welcome notification and link (simulate with response)
    res.json({
        message: 'Welcome! Click the link to continue.',
        continueUrl: '/feed.html'
    });
});

// Add similar endpoints for Facebook and Apple if needed

module.exports = { router, users };