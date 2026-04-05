/**
 * Danger Zone Model
 * 
 * Community-reported and admin-managed danger zones
 * with heatmap support and GeoJSON geofencing.
 * 
 * @module models/DangerZone
 */

const mongoose = require('mongoose');
const { DANGER_SEVERITY, DANGER_TYPES } = require('../utils/constants');

const dangerZoneSchema = new mongoose.Schema(
    {
        /**
         * Name/title of the danger zone.
         */
        name: {
            type: String,
            required: [true, 'Danger zone name is required'],
            trim: true,
            maxlength: 200
        },

        /**
         * Description.
         */
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ''
        },

        /**
         * Center location (GeoJSON Point).
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
         * Radius of the danger zone in meters.
         */
        radiusMeters: {
            type: Number,
            required: [true, 'Radius is required'],
            min: 50,
            max: 10000,
            default: 500
        },

        /**
         * Severity level.
         */
        severity: {
            type: String,
            enum: Object.values(DANGER_SEVERITY),
            default: DANGER_SEVERITY.MODERATE,
            index: true
        },

        /**
         * Type of danger.
         */
        dangerType: {
            type: String,
            enum: Object.values(DANGER_TYPES),
            default: DANGER_TYPES.OTHER,
            index: true
        },

        /**
         * Number of times this zone has been reported.
         * Higher counts increase credibility and severity.
         */
        reportCount: {
            type: Number,
            default: 1,
            min: 1
        },

        /**
         * Users who reported this zone.
         */
        reportedBy: [{
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            reportedAt: { type: Date, default: Date.now },
            note: { type: String, maxlength: 500 }
        }],

        /**
         * Weight for heatmap rendering (calculated from severity + report count).
         */
        heatmapWeight: {
            type: Number,
            default: 1,
            min: 0,
            max: 10
        },

        /**
         * Whether this zone is active.
         */
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },

        /**
         * Expiry date (temporary danger zones).
         */
        expiresAt: {
            type: Date,
            default: null
        },

        /**
         * Time-based activity (some zones are more dangerous at night).
         */
        activeHours: {
            startHour: { type: Number, default: 0 },   // 0-23
            endHour: { type: Number, default: 24 },     // 0-24
            allDay: { type: Boolean, default: true }
        },

        /**
         * Formatted address.
         */
        address: {
            type: String,
            default: ''
        },

        /**
         * Admin-verified flag.
         */
        isVerified: {
            type: Boolean,
            default: false
        },
    },
    {
        timestamps: true
    }
);

// Geospatial index for proximity queries
dangerZoneSchema.index({ location: '2dsphere' });
dangerZoneSchema.index({ isActive: 1, severity: 1 });

/**
 * Pre-save hook to compute heatmap weight.
 */
dangerZoneSchema.pre('save', function (next) {
    const severityWeights = {
        [DANGER_SEVERITY.LOW]: 1,
        [DANGER_SEVERITY.MODERATE]: 2,
        [DANGER_SEVERITY.HIGH]: 4,
        [DANGER_SEVERITY.CRITICAL]: 8,
    };

    const severityWeight = severityWeights[this.severity] || 1;
    // Weight = severity * log2(reportCount + 1) for diminishing returns
    this.heatmapWeight = Math.min(10, severityWeight * Math.log2(this.reportCount + 1));
    next();
});

module.exports = mongoose.model('DangerZone', dangerZoneSchema);
