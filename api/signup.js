const express = require('express');
const router = express.Router();

const users = []; // Replace with DB in production

router.post('/signup', (req, res) => {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: 'All fields are required.' });
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
    res.status(201).json({ message: 'Sign-up successful.', username, role });
});

module.exports = { router, users };