/**
 * User Repository
 * 
 * Data access layer for User model.
 * 
 * @module repositories/user
 */

const User = require('../models/user.model');

/**
 * Create a new user.
 */
const create = async (userData) => {
    const user = new User(userData);
    return user.save();
};

/**
 * Find user by ID.
 */
const findById = async (id, includePassword = false) => {
    const query = User.findById(id);
    if (includePassword) query.select('+password');
    return query.exec();
};

/**
 * Find user by phone number.
 */
const findByPhone = async (phone) => {
    return User.findOne({ phone_number: phone }).exec();
};

/**
 * Find user by email.
 */
const findByEmail = async (email) => {
    return User.findOne({ email: email.toLowerCase() }).exec();
};

/**
 * Find user by phone or email.
 */
const findByIdentifier = async (identifier) => {
    return User.findOne({
        $or: [
            { phone_number: identifier },
            { email: identifier.toLowerCase() }
        ]
    }).exec();
};

/**
 * Update user by ID.
 */
const updateById = async (id, updateData) => {
    return User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).exec();
};

/**
 * Update user's last known location.
 */
const updateLocation = async (id, longitude, latitude) => {
    return User.findByIdAndUpdate(id, {
        lastKnownLocation: {
            type: 'Point',
            coordinates: [longitude, latitude],
            updatedAt: new Date()
        }
    }, { new: true }).exec();
};

/**
 * Set active trip.
 */
const setActiveTrip = async (userId, tripId) => {
    return User.findByIdAndUpdate(userId, {
        isOnTrip: !!tripId,
        activeTrip: tripId
    }, { new: true }).exec();
};

/**
 * Add emergency contact.
 */
const addEmergencyContact = async (userId, contact) => {
    return User.findByIdAndUpdate(userId, {
        $push: { emergencyContacts: contact }
    }, { new: true, runValidators: true }).exec();
};

/**
 * Remove emergency contact.
 */
const removeEmergencyContact = async (userId, contactId) => {
    return User.findByIdAndUpdate(userId, {
        $pull: { emergencyContacts: { _id: contactId } }
    }, { new: true }).exec();
};

/**
 * Get emergency contacts for a user.
 */
const getEmergencyContacts = async (userId) => {
    const user = await User.findById(userId).select('emergencyContacts').exec();
    return user ? user.emergencyContacts : [];
};

/**
 * Increment token version (invalidate all existing tokens).
 */
const incrementTokenVersion = async (userId) => {
    return User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } }, { new: true }).exec();
};

module.exports = {
    create,
    findById,
    findByPhone,
    findByEmail,
    findByIdentifier,
    updateById,
    updateLocation,
    setActiveTrip,
    addEmergencyContact,
    removeEmergencyContact,
    getEmergencyContacts,
    incrementTokenVersion,
};
