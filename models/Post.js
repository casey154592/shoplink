const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    ceoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // new field supporting multiple images/videos
    media: [{
        url: { type: String, required: true },
        type: { type: String, enum: ['image', 'video'], required: true }
    }],
    // keep old field for backwards compatibility; will be migrated on the fly if needed
    imageUrl: { type: String },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    negotiable: { type: Boolean, default: false },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        text: String,
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);