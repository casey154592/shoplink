const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { users } = require('./signup'); // Use your shared users array

// Set up multer for profile picture uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});
const upload = multer({ storage: storage });

// Update profile (username, bio, profile picture)
router.put('/profile', upload.single('profilePicture'), (req, res) => {
    const { email, username, bio } = req.body;
    if (!email || !username) {
        return res.status(400).json({ message: 'Email and username are required.' });
    }
    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }
    user.username = username;
    user.bio = bio || '';
    if (req.file) {
        user.profilePictureUrl = '/uploads/' + req.file.filename;
    }
    res.json({ message: 'Profile updated.', user });
});

module.exports = router;