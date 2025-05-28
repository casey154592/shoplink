// filepath: shop-with-gloria/app.js
require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');

app.use(express.json());
app.use(helmet());

// This line serves all files in the public folder as static assets:
app.use(express.static(path.join(__dirname, 'public')));

const signup = require('./api/signup');
app.use('/api', signup.router);

const loginRoute = require('./api/login');
app.use('/api', loginRoute);

// Mount the profile API
const profileRoute = require('./api/profile');
app.use('/api', profileRoute);

const postsRoute = require('./api/posts');
app.use('/api', postsRoute);

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