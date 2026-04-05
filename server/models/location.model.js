/**
 * Location Model
 * 
 * Breadcrumb location history for path tracking.
 * Each entry is a point-in-time snapshot of the user's location.
 * 
 * @module models/Location
 */

const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
    {
        /**
         * User who reported this location.
         */
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        /**
         * Associated trip (if on a trip).
         */
        tripId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Trip',
            default: null,
            index: true
        },

        /**
         * Location (GeoJSON Point).
         */
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: true
            }
        },

        /**
         * Altitude in meters.
         */
        altitude: {
            type: Number,
            default: null
        },

        /**
         * Speed in km/h at this point.
         */
        speed: {
            type: Number,
            default: 0
        },

        /**
         * Heading/bearing in degrees (0-360).
         */
        heading: {
            type: Number,
            default: 0
        },

        /**
         * GPS accuracy in meters.
         */
        accuracy: {
            type: Number,
            default: null
        },

        /**
         * Battery level (0-100) at time of reporting.
         */
        batteryLevel: {
            type: Number,
            default: null
        },

        /**
         * Whether the user is in a danger zone at this point.
         */
        inDangerZone: {
            type: Boolean,
            default: false
        },

        /**
         * Deviation from planned path in meters (if on trip).
         */
        pathDeviation: {
            type: Number,
            default: 0
        },

        /**
         * Client-reported timestamp (may differ from server time).
         */
        clientTimestamp: {
            type: Date,
            default: Date.now
        },
    },
    {
        timestamps: true
    }
);

// Geospatial index
locationSchema.index({ location: '2dsphere' });
// Time-series lookups
locationSchema.index({ userId: 1, createdAt: -1 });
locationSchema.index({ tripId: 1, createdAt: 1 });

// Auto-delete location breadcrumbs after 30 days
locationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Location', locationSchema);
