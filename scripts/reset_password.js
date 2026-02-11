const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const [,, email, newPassword] = process.argv;

if (!email || !newPassword) {
  console.error('Usage: node scripts/reset_password.js user@example.com newPassword');
  process.exit(1);
}

(async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shoplink';
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    const hashed = await bcrypt.hash(newPassword, 10);

    const result = await User.updateOne(
      { email: email.toLowerCase() },
      { $set: { password: hashed } }
    );

    if ((result.matchedCount !== undefined && result.matchedCount === 0) || (result.n !== undefined && result.n === 0 && result.nModified === 0)) {
      console.error('No user found with that email.');
    } else {
      console.log('Password updated for', email);
    }
  } catch (err) {
    console.error('Error resetting password:', err);
  } finally {
    await mongoose.disconnect();
  }
})();
