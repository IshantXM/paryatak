/**
 * Paryatak API — Main Entry Point
 * Tourism Platform REST API
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Config
const { connectDB, disconnectDB } = require('./config/database');

// Middleware
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');
const { generalLimiter } = require('./middleware/rateLimiter.middleware');

// Routes
const authRoutes = require('./routes/auth.routes');
const destinationRoutes = require('./routes/destination.routes');
const stateRoutes = require('./routes/state.routes');
const categoryRoutes = require('./routes/category.routes');
const tripRoutes = require('./routes/trip.routes');
const reviewRoutes = require('./routes/review.routes');
const bookmarkRoutes = require('./routes/bookmark.routes');
const historyRoutes = require('./routes/history.routes');
const mapsRoutes = require('./routes/maps.routes');
const uploadRoutes = require('./routes/upload.routes');
const adminRoutes = require('./routes/admin.routes');
const searchRoutes = require('./routes/search.routes');

const app = express();
const PORT = process.env.PORT || 4000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001',
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(generalLimiter);

// ─── HEALTH ───────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'OK',
        service: 'Paryatak Tourism API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/states', stateRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);

// Root
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🗺️  Paryatak Tourism API',
        version: '1.0.0',
        docs: 'https://github.com/IshantXM/paryatak',
        endpoints: {
            auth: '/api/auth',
            destinations: '/api/destinations',
            states: '/api/states',
            categories: '/api/categories',
            trips: '/api/trips',
            reviews: '/api/reviews',
            bookmarks: '/api/bookmarks',
            history: '/api/history',
            maps: '/api/maps',
            upload: '/api/upload',
            search: '/api/search',
            admin: '/api/admin',
        },
    });
});

// ─── ERROR HANDLING ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── STARTUP ─────────────────────────────────────────────────────────────────
const start = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log('\n╔══════════════════════════════════════════════════════╗');
            console.log('║          🗺️  Paryatak Tourism API v1.0.0             ║');
            console.log('╠══════════════════════════════════════════════════════╣');
            console.log(`║  Server: http://localhost:${PORT}                       ║`);
            console.log(`║  Health: http://localhost:${PORT}/health                ║`);
            console.log(`║  Env:    ${(process.env.NODE_ENV || 'development').padEnd(14)}                      ║`);
            console.log('╚══════════════════════════════════════════════════════╝\n');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

process.on('SIGTERM', async () => {
    await disconnectDB();
    process.exit(0);
});

start();
module.exports = app;
