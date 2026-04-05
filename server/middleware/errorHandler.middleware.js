/**
 * Error Handler Middleware — Express 5 compatible.
 * @module middleware/errorHandler
 */

/**
 * 404 Not Found handler.
 */
const notFoundHandler = function handle404(req, res) {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        timestamp: new Date().toISOString(),
    });
};

/**
 * Global error handler (must have 4 params for Express to recognize it).
 */
const errorHandler = function handleError(err, req, res, _next) {
    console.error('❌ Error:', err.message);
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ success: false, message: 'Validation Error', errors: messages, timestamp: new Date().toISOString() });
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(409).json({ success: false, message: `Duplicate value for: ${field}`, timestamp: new Date().toISOString() });
    }

    // Mongoose cast error
    if (err.name === 'CastError') {
        return res.status(400).json({ success: false, message: `Invalid ${err.path}: ${err.value}`, timestamp: new Date().toISOString() });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Invalid or expired token', timestamp: new Date().toISOString() });
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ success: false, message: err.message || 'Internal Server Error', timestamp: new Date().toISOString() });
};

module.exports = { notFoundHandler, errorHandler };
