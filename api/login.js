const express = require('express');
const router = express.Router();

// Import the users array from signup.js
const { users } = require('./signup'); // Make sure users is exported from signup.js

// In-memory store for demo (use a database or cache in production)
const verificationCodes = {}; // { email: { code, expiresAt } }

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    // Find user in the users array
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        return res.json({ username: user.username, role: user.role, message: 'Login successful.' });
    } else {
        return res.status(401).json({ message: 'Invalid email or password.' });
    }
});

// Send code (Google login)
router.post('/login/google', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required.' });

    // Generate code, save with expiry, send to Gmail
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 60 * 1000;
    verificationCodes[email] = { code, expiresAt };

    // TODO: Send code to user's Gmail (use nodemailer in production)
    console.log(`Verification code for ${email}: ${code} (expires in 1 min)`);

    res.json({ message: 'Verification code sent to your Gmail.' });
});

// Resend code endpoint
router.post('/login/google/resend', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required.' });

    // Generate new code and expiry
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 60 * 1000;
    verificationCodes[email] = { code, expiresAt };

    // TODO: Send code to user's email
    console.log(`Resent verification code for ${email}: ${code} (expires in 1 min)`);

    res.json({ message: 'Verification code resent to your email.' });
});

// Verify code
router.post('/login/google/verify', (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and code required.' });

    const entry = verificationCodes[email];
    if (!entry) {
        return res.status(401).json({ message: 'No code sent or code expired. Please request a new code.' });
    }
    if (Date.now() > entry.expiresAt) {
        delete verificationCodes[email];
        return res.status(401).json({ message: 'Verification code expired. Please request a new code.' });
    }
    if (entry.code === code) {
        delete verificationCodes[email];
        // TODO: Find or create user in your database
        const user = { email }; // Replace with real user object
        res.json({ user, message: 'Verified' });
    } else {
        res.status(401).json({ message: 'Invalid verification code' });
    }
});

module.exports = router;