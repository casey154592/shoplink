const express = require('express');
const UserModel = require('../models/User');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = '842786956290-iupit5adg1633nr9ccbep7p9itpuec3v.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Standard login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    try {
        const user = await UserModel.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'No account found with this email.' });
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

// Google login
router.post('/login/google', async (req, res) => {
    const { id_token } = req.body;
    if (!id_token) {
        return res.status(400).json({ message: 'Google ID token is required.' });
    }
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: id_token,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const email = payload.email;
        const user = await UserModel.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: 'No account found with this email.' });
        }
        res.json({ message: 'Login successful', username: user.username, role: user.role, email: user.email });
    } catch (err) {
        res.status(401).json({ message: 'Invalid Google token or login failed.' });
    }
});

module.exports = router;