const express = require('express');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const router = express.Router();

const GOOGLE_CLIENT_ID = '842786956290-iupit5adg1633nr9ccbep7p9itpuec3v.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// In-memory store for demo (use a database or cache in production)
const verificationCodes = {}; // { email: { code, expiresAt } }

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        res.json({ message: 'Login successful', username: user.username, role: user.role, email: user.email });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Google OAuth login endpoint
router.post('/login/google', async (req, res) => {
    const { id_token } = req.body;
    if (!id_token) return res.status(400).json({ message: 'ID token required.' });

    try {
        // Verify the Google ID token
        const ticket = await client.verifyIdToken({
            idToken: id_token,
            audience: GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const email = payload.email;

        // TODO: Find or create user in your database here if needed

        // Respond with 200 OK and user info
        return res.json({ email, message: 'Google login successful.' });
    } catch (err) {
        console.error('Google login error:', err);
        return res.status(401).json({ message: 'Invalid Google ID token.' });
    }
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