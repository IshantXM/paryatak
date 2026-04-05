/**
 * Anomaly Model
 * 
 * Records detected anomalies in user travel patterns.
 * 
 * @module models/Anomaly
 */

const mongoose = require('mongoose');
const { ANOMALY_TYPES, THREAT_LEVELS } = require('../utils/anomalyScoring');

const anomalySchema = new mongoose.Schema(
    {
        /**
         * User associated with this anomaly.
         */
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        /**
         * Trip associated with this anomaly (if any).
         */
        tripId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Trip',
            default: null,
            index: true
        },

        /**
         * Type of anomaly detected.
         */
        anomalyType: {
            type: String,
            enum: Object.values(ANOMALY_TYPES),
            required: true,
            index: true
        },

        /**
         * Anomaly score (0-1).
         */
        score: {
            type: Number,
            required: true,
            min: 0,
            max: 1
        },

        /**
         * Overall threat level at time of detection.
         */
        threatLevel: {
            type: String,
            enum: Object.values(THREAT_LEVELS),
            default: THREAT_LEVELS.NONE
        },

        /**
         * Location where anomaly was detected (GeoJSON Point).
         */
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                required: true
            }
        },

        /**
         * Detailed anomaly information.
         */
        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        /**
         * Whether this anomaly was acknowledged/reviewed.
         */
        isAcknowledged: {
            type: Boolean,
            default: false
        },

        /**
         * Whether a security response was triggered.
         */
        responseTriggered: {
            type: Boolean,
            default: false
        },

        /**
         * Security response details.
         */
        responseDetails: {
            type: String,
            default: ''
        },
    },
    {
        timestamps: true
    }
);

anomalySchema.index({ location: '2dsphere' });
anomalySchema.index({ userId: 1, createdAt: -1 });
anomalySchema.index({ threatLevel: 1 });

// Auto-delete anomaly records after 90 days
anomalySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('Anomaly', anomalySchema);
