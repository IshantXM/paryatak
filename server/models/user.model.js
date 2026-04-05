/**
 * User Model
 * 
 * Represents application users with authentication,
 * emergency contacts, and location tracking fields.
 * 
 * @module models/User
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const emergencyContactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Contact name is required'],
        trim: true,
        maxlength: 100
    },
    phone: {
        type: String,
        required: [true, 'Contact phone is required'],
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    relationship: {
        type: String,
        trim: true,
        enum: ['parent', 'spouse', 'sibling', 'friend', 'guardian', 'other'],
        default: 'other'
    }
}, { _id: true });

const userSchema = new mongoose.Schema(
    {
        /**
         * User's full name.
         */
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [100, 'Name cannot exceed 100 characters']
        },

        /**
         * Phone number (unique identifier for login).
         */
        phone_number: {
            type: String,
            required: [true, 'Phone number is required'],
            unique: true,
            trim: true,
            index: true
        },

        /**
         * Email of the user.
         */
        email: {
            type: String,
            trim: true,
            lowercase: true,
            index: true
        },

        /**
         * Password (bcrypt hashed). Optional — OTP-based login doesn't need it.
         */
        password: {
            type: String,
            trim: true,
            select: false // Don't include in queries by default
        },

        /**
         * User role.
         */
        role: {
            type: String,
            enum: ['user', 'admin', 'security'],
            default: 'user'
        },

        /**
         * Address of the user.
         */
        address: {
            latitude: { type: Number },
            longitude: { type: Number },
            street: { type: String, trim: true },
            city: { type: String, trim: true },
            state: { type: String, trim: true },
            pincode: { type: String, trim: true },
            country: { type: String, trim: true, default: 'India' }
        },

        /**
         * Last known location (GeoJSON Point).
         * Used for real-time tracking and safety features.
         */
        lastKnownLocation: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                default: [0, 0]
            },
            updatedAt: {
                type: Date,
                default: Date.now
            }
        },

        /**
         * Emergency contacts list.
         */
        emergencyContacts: {
            type: [emergencyContactSchema],
            default: [],
            validate: {
                validator: function (v) {
                    return v.length <= 5; // Max 5 emergency contacts
                },
                message: 'Cannot have more than 5 emergency contacts'
            }
        },

        /**
         * Whether user is currently on an active trip.
         */
        isOnTrip: {
            type: Boolean,
            default: false
        },

        /**
         * Reference to active trip.
         */
        activeTrip: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Trip',
            default: null
        },

        /**
         * Whether user has verified their identity.
         */
        isVerified: {
            type: Boolean,
            default: false
        },

        /**
         * Session version for JWT invalidation.
         * Incremented on logout to revoke previously issued tokens.
         */
        tokenVersion: {
            type: Number,
            default: 0,
            min: 0
        },

        /**
         * Device info for push notifications (future use).
         */
        deviceToken: {
            type: String,
            default: null
        },
    },
    {
        timestamps: true
    }
);

// 2dsphere index for geospatial queries on last known location
userSchema.index({ 'lastKnownLocation': '2dsphere' });

/**
 * Hash password before saving (if modified).
 */
userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;
    this.password = await bcrypt.hash(this.password, 12);
});

/**
 * Compare password for login.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Strip sensitive fields from JSON output.
 */
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.__v;
    return obj;
};

module.exports = mongoose.model('User', userSchema);