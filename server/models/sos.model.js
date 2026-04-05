/**
 * SOS Alert Model
 * 
 * Records emergency SOS triggers with location,
 * status tracking, and escalation support.
 * 
 * @module models/Sos
 */

const mongoose = require('mongoose');
const { SOS_STATUS } = require('../utils/constants');

const sosSchema = new mongoose.Schema(
    {
        /**
         * User who triggered the SOS.
         */
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true
        },

        /**
         * Location where SOS was triggered (GeoJSON Point).
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
         * Formatted address (reverse geocoded).
         */
        address: {
            type: String,
            default: ''
        },

        /**
         * SOS status.
         */
        status: {
            type: String,
            enum: Object.values(SOS_STATUS),
            default: SOS_STATUS.ACTIVE,
            index: true
        },

        /**
         * Description / note from the user.
         */
        message: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ''
        },

        /**
         * Type of emergency.
         */
        emergencyType: {
            type: String,
            enum: ['medical', 'crime', 'accident', 'natural_disaster', 'harassment', 'other'],
            default: 'other'
        },

        /**
         * Escalation level (auto-incremented if not resolved).
         */
        escalationLevel: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },

        /**
         * Emergency contacts notified.
         */
        notifiedContacts: [{
            name: String,
            phone: String,
            email: String,
            notifiedAt: { type: Date, default: Date.now }
        }],

        /**
         * Nearest police stations at time of SOS.
         */
        nearestPoliceStations: [{
            stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'PoliceStation' },
            name: String,
            distance: Number, // meters
            phone: String
        }],

        /**
         * Active trip at time of SOS (if any).
         */
        tripId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Trip',
            default: null
        },

        /**
         * When SOS was resolved or cancelled.
         */
        resolvedAt: {
            type: Date,
            default: null
        },

        /**
         * Resolution notes.
         */
        resolutionNotes: {
            type: String,
            trim: true,
            default: ''
        },
    },
    {
        timestamps: true
    }
);

// Geospatial index for location queries
sosSchema.index({ location: '2dsphere' });
sosSchema.index({ userId: 1, status: 1 });
sosSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Sos', sosSchema);
