const rateLimit = require('express-rate-limit');

// Rate limiter for authentication routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for location updates (allows more frequent requests but prevents abuse)
const locationLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 requests per minute
    message: 'Too many location update requests',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    authLimiter,
    locationLimiter
};
