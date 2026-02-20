const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Request a password reset (sends email if account exists)
router.post('/password-reset/request', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal whether account exists
      return res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpiry = Date.now() + 3600 * 1000; // 1 hour
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password.html?token=${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password reset request',
      text: `You requested a password reset. Use this link to reset your password (valid 1 hour): ${resetUrl}`
    });

    res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
  } catch (err) {
    console.error('Password reset request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Confirm password reset
router.post('/password-reset/confirm', async (req, res) => {
  const { token, username, email, newPassword } = req.body;
  if (!token || !username || !email || !newPassword) {
    return res.status(400).json({ message: 'Token, username, email, and new password are required.' });
  }

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() },
      username: username.toLowerCase(),
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid username, email, or expired token.' });
    }

    user.password = newPassword; // will be hashed by pre-save hook
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error('Password reset confirm error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
