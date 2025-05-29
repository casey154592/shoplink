const express = require('express');
const app = express();
const helmet = require('helmet');
const auth = require('./middleware/auth');

// Add Helmet CSP here
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://accounts.google.com"],
      // ...other directives as needed
    }
  }
}));

app.use('/uploads', express.static('uploads'));

// ...other middleware and routes...

const postsRouter = require('./api/posts');
app.use('/api/posts', postsRouter);

const usersRouter = require('./api/users');
app.use('/api/users', usersRouter);

app.post('/follow/:ceoId', auth, async (req, res) => { /* your implementation here */ });
app.get('/notifications', auth, async (req, res) => { /* your implementation here */ });

// ...start your server...