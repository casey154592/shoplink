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
app.use('/uploads', express.static('uploads'));

const signup = require('./api/signup');
app.use('/api', signup.router);

const loginRoute = require('./api/login');
app.use('/api', loginRoute);

// Mount the profile API
const profileRoute = require('./api/profile');
app.use('/api', profileRoute);

const postsRoute = require('./api/posts');
app.use('/api', postsRoute);

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