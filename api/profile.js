const express = require('express');
const multer = require('multer');
const User = require('../models/User');
const router = express.Router();

const upload = multer({ dest: 'public/uploads/' });

// Update profile (username, bio, profile picture)
router.put('/profile', upload.single('profilePicture'), async (req, res) => {
    const { email, username, bio } = req.body;
    if (!email || !username) {
        return res.status(400).json({ message: 'Email and username are required.' });
    }
    try {
        const update = { username, bio: bio || '' };
        if (req.file) {
            update.profilePictureUrl = '/uploads/' + req.file.filename;
        }
        const user = await User.findOneAndUpdate({ email }, update, { new: true });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json({ message: 'Profile updated.', user });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Save answers to questions
router.post('/profile/questions', async (req, res) => {
    const { email, answers } = req.body;
    if (!email || !answers) {
        return res.status(400).json({ message: 'Email and answers are required.' });
    }
    try {
        const user = await User.findOneAndUpdate(
            { email },
            { profileAnswers: answers },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json({ message: 'Profile answers saved.', user });
    } catch (err) {
        console.error('Profile answers error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;