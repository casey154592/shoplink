// filepath: shop-with-gloria/app.js
require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');
const auth = require('./middleware/auth');

app.use(express.json());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "https://accounts.google.com",
        "https://apis.google.com",
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com"
      ],
      // ...other directives as needed
    }
  }
}));

// This line serves all files in the public folder as static assets:
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

const signup = require('./api/signup');
app.use('/api', signup.router);

const loginRoute = require('./api/login');
app.use('/api', loginRoute);

// Set up invalidated tokens in auth middleware
auth.setInvalidatedTokens(loginRoute.invalidatedTokens);

// Mount the profile API
const profileRoute = require('./api/profile');
app.use('/api', profileRoute);

const postsRoute = require('./api/posts');
console.log('Posts routes loaded, type:', typeof postsRoute);
console.log('Posts routes stack:', postsRoute.stack ? postsRoute.stack.length : 'no stack');
app.use('/api/posts', postsRoute);
console.log('Posts routes mounted at /api/posts');

const transactionsRoute = require('./api/transactions');
app.use('/api/transactions', transactionsRoute);

const notificationsRoute = require('./api/notifications').router;
app.use('/api/notifications', notificationsRoute);

const usersRouter = require('./api/users');
app.use('/api/users', usersRouter);

// Add your follow and notifications routes here
app.post('/follow/:ceoId', auth, async (req, res) => { /* your implementation here */ });
app.get('/notifications', auth, async (req, res) => { /* your implementation here */ });

// Global 404 handler for unknown API routes
app.use('/api', (req, res, next) => {
    res.status(404).json({ message: 'API endpoint not found.' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error'
    });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shoplink')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Add exit handler for debugging
process.on('exit', (code) => {
    console.log(`Server exiting with code: ${code}`);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});