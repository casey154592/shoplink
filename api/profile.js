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

// Get user profile
router.get('/profile/:userId', async (req, res) => {
    try {
        const user = await UserModel.findById(req.params.userId, '-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json(user);
    } catch (err) {
        console.error('Profile fetch error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update profile (username, bio, profile picture)
router.put('/profile', auth, upload.single('profilePicture'), async (req, res) => {
    try {
        const { username, bio } = req.body;

        // Validate required fields
        if (!username || username.trim().length === 0) {
            return res.status(400).json({ message: 'Username is required and cannot be empty.' });
        }

        // Prepare update object
        const updateData = {
            username: username.trim(),
            bio: bio ? bio.trim() : ''
        };

        // Handle profile picture upload
        if (req.file) {
            updateData.profilePictureUrl = `/uploads/${req.file.filename}`;
        }

        // Update user in database
        const updatedUser = await UserModel.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Return updated user data (excluding password)
        const userResponse = updatedUser.toObject();
        delete userResponse.password;

        res.json({
            message: 'Profile updated successfully.',
            user: userResponse
        });

    } catch (error) {
        console.error('Profile update error:', error);

        // Handle specific errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Invalid data provided.' });
        }

        if (error.code === 11000) {
            return res.status(409).json({ message: 'Username already exists.' });
        }

        res.status(500).json({ message: 'Server error occurred while updating profile.' });
    }
});

// Save answers to questions
router.post('/profile/questions', auth, async (req, res) => {
    const { answers } = req.body;
    if (!answers) {
        return res.status(400).json({ message: 'Answers are required.' });
    }
    try {
        // Prepare update data
        const updateData = { profileAnswers: answers };

        // If brand name is provided, save it to the user profile
        if (answers.brandName) {
            updateData.brandName = answers.brandName.trim();
        }

        const user = await UserModel.findOneAndUpdate(
            { _id: req.user.id },
            updateData,
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Return user data without password
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({ message: 'Profile answers saved.', user: userResponse });
    } catch (err) {
        console.error('Profile answers error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete user account
router.delete('/profile', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // First delete all posts by this user
        const Post = require('../models/Post');
        await Post.deleteMany({ ceoId: userId });
        
        // Then delete the user
        const user = await UserModel.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json({ message: 'Account deleted successfully.' });
    } catch (err) {
        console.error('Account deletion error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;