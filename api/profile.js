const express = require('express');
const multer = require('multer');
const UserModel = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

const upload = multer({ 
    dest: 'public/uploads/',
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Update profile (username, bio, profile picture)
router.put('/profile', auth, upload.single('profilePicture'), async (req, res) => {
    const { username, bio } = req.body;
    if (!username) {
        return res.status(400).json({ message: 'Username is required.' });
    }
    
    // Handle multer errors
    if (req.fileValidationError) {
        return res.status(400).json({ message: req.fileValidationError });
    }
    
    try {
        const update = { username, bio: bio || '' };
        if (req.file) {
            update.profilePictureUrl = '/uploads/' + req.file.filename;
        }
        const user = await UserModel.findOneAndUpdate(
            { _id: req.user.id }, 
            update, 
            { new: true }
        );
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
router.post('/profile/questions', auth, async (req, res) => {
    const { answers } = req.body;
    if (!answers) {
        return res.status(400).json({ message: 'Answers are required.' });
    }
    try {
        const user = await UserModel.findOneAndUpdate(
            { _id: req.user.id },
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