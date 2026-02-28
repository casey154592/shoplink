const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ceoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    amount: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'in_progress', 'completed', 'cancelled', 'failed'], 
        default: 'pending' 
    },
    description: { type: String, required: true },
    // chat messages associated with this transaction
    messages: [{
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
transactionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;