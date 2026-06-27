/**
 * Environment Configuration
 * 
 * Validates and exports environment variables.
 * Server will fail fast on startup if required variables are missing.
 * 
 * @module config/environment
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// =============================================================================
// VALIDATION
// =============================================================================

const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];

const missing = requiredVars.filter(v => !process.env[v]);
if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
}

// =============================================================================
// EXPORTED CONFIGURATION
// =============================================================================

/**
 * Server configuration
 */
const server = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
};

/**
 * CORS configuration
 */
const cors = {
    allowedOrigins: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : []
};

/**
 * MongoDB configuration
 */
const database = {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/paryatak',
};

/**
 * JWT configuration
 */
const jwt = {
    secret: process.env.JWT_SECRET || 'paryatak-dev-jwt-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'paryatak-dev-refresh-secret-change-in-production',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
};

/**
 * SMTP / Nodemailer configuration
 */
const smtp = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || '"Paryatak Safety" <noreply@paryatak.app>',
};

/**
 * Google Maps configuration
 */
const googleMaps = {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
};

/**
 * OTP configuration
 */
const otp = {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10),
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
    length: parseInt(process.env.OTP_LENGTH || '6', 10),
};

/**
 * Safety thresholds
 */
const safety = {
    maxSpeedKmh: parseInt(process.env.MAX_SPEED_KMH || '120', 10),
    pathDeviationMeters: parseInt(process.env.PATH_DEVIATION_METERS || '500', 10),
    prolongedStopMinutes: parseInt(process.env.PROLONGED_STOP_MINUTES || '15', 10),
    dangerZoneRadiusMeters: parseInt(process.env.DANGER_ZONE_RADIUS_METERS || '1000', 10),
    sosEscalationMinutes: parseInt(process.env.SOS_ESCALATION_MINUTES || '5', 10),
    nightStartHour: parseInt(process.env.NIGHT_START_HOUR || '22', 10),
    nightEndHour: parseInt(process.env.NIGHT_END_HOUR || '5', 10),
};

module.exports = {
    server,
    cors,
    database,
    jwt: jwt,
    smtp,
    googleMaps,
    otp: otp,
    safety
};