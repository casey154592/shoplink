const express = require('express');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const router = express.Router();

// Configure your transporter (use real credentials in production)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'shoplink17@gmail.com',      // your Gmail address
        pass: 'pvos zpxd gykr ysng'         // your Gmail app password (not your Gmail password!)
    }
});
const client = new OAuth2Client('842786956290-iupit5adg1633nr9ccbep7p9itpuec3v.apps.googleusercontent.com');

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
router.post('/signup/google', async (req, res) => {
    const { id_token, role } = req.body;
    if (!id_token || !role) return res.status(400).json({ message: 'ID token and role required.' });

    // Verify the token
    const ticket = await client.verifyIdToken({
        idToken: id_token,
        audience: '842786956290-iupit5adg1633nr9ccbep7p9itpuec3v.apps.googleusercontent.com'
    });
    const payload = ticket.getPayload();
    const gmail = payload.email;

    // TODO: Save user to DB if new, etc.

    // Send welcome email with link to feed
    const mailOptions = {
        from: '"Shoplink" <shoplink17@gmail.com>',
        to: gmail,
        subject: 'Welcome to Shoplink!',
        html: `
            <h2>Welcome to Shoplink!</h2>
            <p>Thank you for signing up as a ${role}.</p>
            <p><a href="https://shoplink-h0jk.onrender.com/feed.html">Click here to continue</a></p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${gmail}`);
        res.json({ message: 'Welcome email sent.' });
    } catch (err) {
        console.error('Email error:', err);
        res.status(500).json({ message: 'Failed to send welcome email.' });
    }
});

// Add similar endpoints for Facebook and Apple if needed

module.exports = { router, users };