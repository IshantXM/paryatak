/**
 * Trip Model
 * 
 * Represents an active or completed trip with a planned path,
 * real-time tracking, and safety analysis.
 * 
 * @module models/Trip
 */

const mongoose = require('mongoose');
const { TRIP_STATUS } = require('../utils/constants');

const tripSchema = new mongoose.Schema(
    {
        /**
         * User who owns this trip.
         */
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true
        },

        /**
         * Trip name/label.
         */
        name: {
            type: String,
            trim: true,
            default: 'My Trip'
        },

        /**
         * Starting location (GeoJSON Point).
         */
        origin: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: true
            },
            address: { type: String, default: '' }
        },

        /**
         * Destination location (GeoJSON Point).
         */
        destination: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: true
            },
            address: { type: String, default: '' }
        },

        /**
         * Planned path — array of coordinates from Google Maps Directions API.
         */
        plannedPath: [{
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true }
        }],

        /**
         * Trip status.
         */
        status: {
            type: String,
            enum: Object.values(TRIP_STATUS),
            default: TRIP_STATUS.ACTIVE,
            index: true
        },

        /**
         * When the trip started.
         */
        startedAt: {
            type: Date,
            default: Date.now
        },

        /**
         * When the trip ended.
         */
        endedAt: {
            type: Date,
            default: null
        },

        /**
         * Estimated duration in minutes (from Google Maps).
         */
        estimatedDurationMinutes: {
            type: Number,
            default: null
        },

        /**
         * Estimated distance in meters.
         */
        estimatedDistanceMeters: {
            type: Number,
            default: null
        },

        /**
         * Total distance actually traveled in meters.
         */
        actualDistanceMeters: {
            type: Number,
            default: 0
        },

        /**
         * Number of anomalies detected during this trip.
         */
        anomalyCount: {
            type: Number,
            default: 0
        },

        /**
         * Maximum deviation from planned path (meters).
         */
        maxDeviation: {
            type: Number,
            default: 0
        },

        /**
         * Danger zones encountered during this trip.
         */
        dangerZonesEncountered: [{
            zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'DangerZone' },
            enteredAt: Date,
            exitedAt: Date,
            severity: String
        }],

        /**
         * Shared with emergency contacts (live tracking).
         */
        sharedWith: [{
            contactId: String,
            name: String,
            phone: String,
            shareToken: String, // Unique token for live tracking link
        }],

        /**
         * Mode of transport.
         */
        transportMode: {
            type: String,
            enum: ['walking', 'driving', 'cycling', 'transit', 'other'],
            default: 'driving'
        },
    },
    {
        timestamps: true
    }
);

tripSchema.index({ userId: 1, status: 1 });
tripSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Trip', tripSchema);
