const express = require('express');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/User'); // Import your Mongoose User model
const router = express.Router();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Signup with email/password
router.post('/signup', async (req, res) => {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: 'All fields including role are required.' });
    }
    if (!['CEO', 'CUSTOMER'].includes(role)) {
        return res.status(400).json({ message: 'Role must be either CEO or Customer.' });
    }
    try {
        const emailLower = email.toLowerCase();
        const exists = await UserModel.findOne({ email: emailLower });
        if (exists) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new UserModel({ username, email: emailLower, password: hashedPassword, role });
        await newUser.save();
        // Generate JWT token
        const token = jwt.sign({ id: newUser._id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ 
            message: 'Signup successful',
            id: newUser._id,
            username: newUser.username,
            role: newUser.role,
            email: newUser.email,
            token
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Google signup
router.post('/signup/google', async (req, res) => {
    const { id_token, role } = req.body;
    if (!id_token || !role || !['CEO', 'CUSTOMER'].includes(role)) {
        return res.status(400).json({ message: 'A valid role (CEO or Customer) is required.' });
    }

    try {
        // Verify the token
        const ticket = await client.verifyIdToken({
            idToken: id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const gmail = payload.email;

        // Check if user exists, if not, create
        let user = await UserModel.findOne({ email: gmail });
        if (!user) {
            user = new UserModel({ username: payload.name || gmail, email: gmail, role });
            await user.save();
        }
        // Generate JWT token
        const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ 
            message: 'Signup successful',
            id: user._id,
            username: user.username,
            role: user.role,
            email: user.email,
            token
        });
    } catch (err) {
        console.error('Google signup error:', err);
        res.status(500).json({ message: 'Failed to sign up with Google.' });
    }
});

module.exports = { router };