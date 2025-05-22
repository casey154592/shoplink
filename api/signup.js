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
router.post('/signup/google', async (req, res) => {
    const { gmail, role } = req.body;
    if (!gmail || !role) return res.status(400).json({ message: 'Gmail and role required.' });

    // TODO: Save user to DB if new, etc.

    // TODO: Send welcome email with link to feed.html (use nodemailer in production)
    // Example:
    // await sendMail(gmail, 'Welcome to Shoplink', 'Click here to continue: https://yourdomain.com/feed.html');

    console.log(`Sent welcome email to ${gmail} with link to feed.html`);
    res.json({ message: 'Welcome email sent.' });
});

// Add similar endpoints for Facebook and Apple if needed

module.exports = { router, users };