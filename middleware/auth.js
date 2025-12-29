const jwt = require('jsonwebtoken');

// This will be set by the login route
let invalidatedTokens = new Set();

module.exports = function(req, res, next) {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        // Check if token has been invalidated (logged out)
        if (token && invalidatedTokens.has(token)) {
            return res.status(401).json({ message: 'Session has ended. Please login again.' });
        }
        
        if (!token) {
            return next(); // Allow requests without token, endpoints can handle accordingly
        }
        
        const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired. Please login again.' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token.' });
        }
        next(); // For other errors, proceed and let endpoint handle
    }
};

// Function to set invalidated tokens from login route
module.exports.setInvalidatedTokens = function(tokens) {
    invalidatedTokens = tokens;
};