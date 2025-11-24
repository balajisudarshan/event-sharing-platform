const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 50,
    message: 'Too many requests from this IP, please try again after 10 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS"
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS"
});

const createLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 80,
    message: 'Too many account creation attempts from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS"
});

module.exports = { limiter, authLimiter, createLimiter };
