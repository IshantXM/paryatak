/**
 * Police Station Model
 * 
 * Stores police station locations for geospatial proximity queries.
 * Uses 2dsphere index for efficient nearest-neighbor lookups via Haversine.
 * 
 * @module models/PoliceStation
 */

const mongoose = require('mongoose');

const policeStationSchema = new mongoose.Schema(
    {
        /**
         * Name of the police station.
         */
        name: {
            type: String,
            required: [true, 'Station name is required'],
            trim: true,
            maxlength: 200
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
         * Station address.
         */
        address: {
            street: { type: String, trim: true, default: '' },
            city: { type: String, trim: true, default: '' },
            state: { type: String, trim: true, default: '' },
            pincode: { type: String, trim: true, default: '' },
            fullAddress: { type: String, trim: true, default: '' }
        },

        /**
         * Contact phone number.
         */
        phone: {
            type: String,
            trim: true,
            default: ''
        },

        /**
         * Emergency phone number (may differ from main line).
         */
        emergencyPhone: {
            type: String,
            trim: true,
            default: '100' // India's police emergency number
        },

        /**
         * Station type.
         */
        stationType: {
            type: String,
            enum: ['police_station', 'police_outpost', 'traffic_police', 'women_helpdesk', 'cyber_cell', 'other'],
            default: 'police_station'
        },

        /**
         * Operating hours.
         */
        is24x7: {
            type: Boolean,
            default: true
        },

        /**
         * Jurisdiction area (description).
         */
        jurisdiction: {
            type: String,
            trim: true,
            default: ''
        },

        /**
         * Whether the station is active/operational.
         */
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },

        /**
         * Google Maps place ID (for additional info lookup).
         */
        googlePlaceId: {
            type: String,
            default: null
        },
    },
    {
        timestamps: true
    }
);

// 2dsphere index for geospatial nearness queries
policeStationSchema.index({ location: '2dsphere' });
policeStationSchema.index({ isActive: 1 });

module.exports = mongoose.model('PoliceStation', policeStationSchema);
