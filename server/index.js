/**
 * Paryatak Safety Backend Server
 * 
 * Main entry point for the safety/travel API.
 * 
 * Features:
 * - OTP-based authentication via Nodemailer
 * - SOS emergency alerts with escalation
 * - Real-time path tracking with anomaly detection
 * - Danger zone heatmaps
 * - Geofencing with Haversine formula
 * - Nearest police station lookup
 * - Security audit logging
 * 
 * @module server
 */

// Load environment configuration first
const { server } = require('./config/environment');

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Config
const { connectDB } = require('./config/database');
const { corsOptions } = require('./config/cors');

// Middleware
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler.middleware');

// Routes
const authRoutes = require('./routes/auth.routes');
const sosRoutes = require('./routes/sos.routes');
const tripRoutes = require('./routes/trip.routes');
const dangerZoneRoutes = require('./routes/dangerZone.routes');
const safetyRoutes = require('./routes/safety.routes');
const userRoutes = require('./routes/user.routes');
const mapsRoutes = require('./routes/maps.routes');

// =============================================================================
// APP INITIALIZATION
// =============================================================================

const app = express();

// =============================================================================
// MIDDLEWARE
// =============================================================================
app.set('trust proxy', 1);

// CORS
app.use(cors(corsOptions));

// Cookie parser
app.use(cookieParser());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// =============================================================================
// ROUTES
// =============================================================================

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'OK',
        message: 'Paryatak Safety API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/trip', tripRoutes);
app.use('/api/danger-zones', dangerZoneRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/user', userRoutes);
app.use('/api/maps', mapsRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Paryatak Safety API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            sos: '/api/sos',
            trip: '/api/trip',
            dangerZones: '/api/danger-zones',
            safety: '/api/safety',
            user: '/api/user',
            maps: '/api/maps',
        }
    });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================
app.use(notFoundHandler);
app.use(errorHandler);

// =============================================================================
// SERVER STARTUP
// =============================================================================

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Seed sample police stations (dev only)
        if (server.nodeEnv === 'development') {
            const { seedSamplePoliceStations } = require('./services/geofence.service');
            await seedSamplePoliceStations();
        }

        // Start HTTP server
        app.listen(server.port, () => {
            console.log('');
            console.log('╔══════════════════════════════════════════════════════╗');
            console.log('║            🛡️  Paryatak Safety API v1.0.0            ║');
            console.log('╠══════════════════════════════════════════════════════╣');
            console.log(`║  Server:  http://localhost:${server.port}                    ║`);
            console.log(`║  Health:  http://localhost:${server.port}/health              ║`);
            console.log(`║  Env:     ${server.nodeEnv.padEnd(14)}                      ║`);
            console.log('╠══════════════════════════════════════════════════════╣');
            console.log('║  Endpoints:                                          ║');
            console.log('║    /api/auth          Auth + OTP                     ║');
            console.log('║    /api/sos           SOS Alerts                     ║');
            console.log('║    /api/trip          Path Tracking                  ║');
            console.log('║    /api/danger-zones  Heatmap & Zones                ║');
            console.log('║    /api/safety        Anomaly & Geofence             ║');
            console.log('║    /api/user          Profile & Contacts             ║');
            console.log('╚══════════════════════════════════════════════════════╝');
            console.log('');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();

module.exports = app;