const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX || '200'),
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20'),
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
});

const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Upload limit reached. Try again later.' },
});

module.exports = { generalLimiter, authLimiter, uploadLimiter };
