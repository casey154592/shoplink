// filepath: shop-with-gloria/app.js
const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));