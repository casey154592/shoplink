const express = require('express');
const UserModel = require('../models/User');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const GOOGLE_CLIENT_ID = '842786956290-iupit5adg1633nr9ccbep7p9itpuec3v.apps.googleusercontent.com';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Store invalidated tokens to prevent reuse
const invalidatedTokens = new Set();

// Standard login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    try {
        const emailLower = email.toLowerCase();
        console.log('🔍 Login attempt for:', emailLower);
        
        const user = await UserModel.findOne({ email: emailLower });
        if (!user) {
            console.log('❌ User not found in DB:', emailLower);
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        
        console.log('✓ User found:', user.email);
        console.log('📦 User password field exists:', !!user.password);
        console.log('📦 User password length:', user.password ? user.password.length : 'null');
        
        if (!user.password) {
            console.log('❌ User has no password (Google signup only)');
            return res.status(401).json({ message: 'This account uses Google Sign-In only.' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('🔐 Password match result:', isMatch);
        
        if (!isMatch) {
            console.log('❌ Password does not match');
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        
        console.log('✅ Password matched, generating token');
        // Generate JWT token
        const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ 
            message: 'Login successful',
            id: user._id,
            username: user.username,
            role: user.role,
            email: user.email,
            token
        });
    } catch (err) {
        console.error('❌ Login error:', err);
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
        // Generate JWT token
        const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ 
            message: 'Login successful',
            id: user._id,
            username: user.username,
            role: user.role,
            email: user.email,
            token
        });
    } catch (err) {
        res.status(401).json({ message: 'Invalid Google token or login failed.' });
    }
});

// Logout route
router.post('/logout', auth, async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (token) {
            // Add token to invalidated tokens set
            invalidatedTokens.add(token);
            
            // Optionally, set a timeout to remove expired tokens from memory after 7 days
            setTimeout(() => {
                invalidatedTokens.delete(token);
            }, 7 * 24 * 60 * 60 * 1000); // 7 days
        }
        
        res.json({ message: 'Logout successful' });
    } catch (err) {
        res.status(500).json({ message: 'Logout failed' });
    }
});

// Export invalidated tokens for use in auth middleware
router.invalidatedTokens = invalidatedTokens;

module.exports = router;