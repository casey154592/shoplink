const express = require('express');
const router = express.Router();

// Import the users array from signup.js
const { users } = require('./signup'); // Make sure users is exported from signup.js

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

module.exports = router;