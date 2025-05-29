const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String }, // Not required for Google signup
    role:     { type: String, required: true },
    profileAnswers: { type: Object, default: {} },
    bio: { type: String, default: '' },
    profilePictureUrl: { type: String, default: '' }
});

// Add this pre-save hook:
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Prevent OverwriteModelError
let User;
try {
    User = mongoose.model('User');
} catch (err) {
    if (err.name === 'OverwriteModelError') {
        console.error('OverwriteModelError:', err.message);
        User = mongoose.model('User');
    } else if (err.name === 'MissingSchemaError') {
        User = mongoose.model('User', userSchema);
    } else {
        console.error('Mongoose model error:', err.message);
        User = mongoose.model('User', userSchema);
    }
}

module.exports = User;