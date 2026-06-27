const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
};

const errorHandler = (err, req, res, next) => {
    console.error(`❌ [${req.method}] ${req.originalUrl} — ${err.message}`);
    if (process.env.NODE_ENV === 'development') {
        console.error(err.stack);
    }

    // Prisma errors
    if (err.code === 'P2002') {
        const field = err.meta?.target?.join(', ') || 'field';
        return res.status(409).json({ success: false, message: `${field} already exists` });
    }
    if (err.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'Record not found' });
    }
    if (err.code === 'P2003') {
        return res.status(400).json({ success: false, message: 'Invalid reference — related record does not exist' });
    }

    // Zod validation errors
    if (err.name === 'ZodError') {
        const errors = err.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
        return res.status(422).json({ success: false, message: 'Validation failed', errors });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired' });
    }

    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

module.exports = { notFoundHandler, errorHandler };
