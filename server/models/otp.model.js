/**
 * OTP Model
 * 
 * Stores one-time passwords with TTL-based auto-expiry,
 * brute-force protection via attempt counting.
 * 
 * @module models/Otp
 */

const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
    {
        /**
         * Reference to the user (may be null for unregistered users).
         */
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true
        },

        /**
         * The identifier used to request OTP (email or phone).
         */
        identifier: {
            type: String,
            required: [true, 'Identifier is required'],
            trim: true,
            index: true
        },

        /**
         * The OTP code (hashed for security).
         */
        otp: {
            type: String,
            required: [true, 'OTP is required'],
        },

        /**
         * Purpose of the OTP.
         */
        purpose: {
            type: String,
            required: [true, 'Purpose is required'],
            enum: ['register', 'login', 'forgot_password', 'verify_email', 'address_update'],
        },

        /**
         * Number of verification attempts (brute-force protection).
         */
        attempts: {
            type: Number,
            default: 0,
            max: 5
        },

        /**
         * Whether this OTP has been used.
         */
        isUsed: {
            type: Boolean,
            default: false
        },

        /**
         * Auto-expiry timestamp. MongoDB TTL index will auto-delete.
         */
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 } // TTL index — document deleted when expiresAt is reached
        },
    },
    {
        timestamps: true
    }
);

// Compound index for quick lookups
otpSchema.index({ identifier: 1, purpose: 1, isUsed: 1 });

module.exports = mongoose.model('Otp', otpSchema);