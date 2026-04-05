/**
 * Trip Repository
 * 
 * Data access layer for Trip model.
 * 
 * @module repositories/trip
 */

const Trip = require('../models/trip.model');
const { TRIP_STATUS } = require('../utils/constants');

/**
 * Create a new trip.
 */
const create = async (tripData) => {
    const trip = new Trip(tripData);
    return trip.save();
};

/**
 * Find trip by ID.
 */
const findById = async (id) => {
    return Trip.findById(id).exec();
};

/**
 * Find active trip for a user.
 */
const findActiveByUser = async (userId) => {
    return Trip.findOne({ userId, status: TRIP_STATUS.ACTIVE }).exec();
};

/**
 * Find trip history for a user.
 */
const findByUser = async (userId, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        Trip.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
        Trip.countDocuments({ userId })
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
};

/**
 * Update trip.
 */
const updateById = async (id, updateData) => {
    return Trip.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).exec();
};

/**
 * End a trip.
 */
const endTrip = async (id, actualDistanceMeters = 0) => {
    return Trip.findByIdAndUpdate(id, {
        status: TRIP_STATUS.COMPLETED,
        endedAt: new Date(),
        actualDistanceMeters
    }, { new: true }).exec();
};

/**
 * Cancel a trip.
 */
const cancelTrip = async (id) => {
    return Trip.findByIdAndUpdate(id, {
        status: TRIP_STATUS.CANCELLED,
        endedAt: new Date()
    }, { new: true }).exec();
};

/**
 * Increment anomaly count.
 */
const incrementAnomalyCount = async (id) => {
    return Trip.findByIdAndUpdate(id, { $inc: { anomalyCount: 1 } }, { new: true }).exec();
};

/**
 * Update max deviation.
 */
const updateMaxDeviation = async (id, deviation) => {
    return Trip.findByIdAndUpdate(id, {
        $max: { maxDeviation: deviation }
    }, { new: true }).exec();
};

/**
 * Add encountered danger zone.
 */
const addDangerZoneEncounter = async (tripId, encounter) => {
    return Trip.findByIdAndUpdate(tripId, {
        $push: { dangerZonesEncountered: encounter }
    }, { new: true }).exec();
};

module.exports = {
    create,
    findById,
    findActiveByUser,
    findByUser,
    updateById,
    endTrip,
    cancelTrip,
    incrementAnomalyCount,
    updateMaxDeviation,
    addDangerZoneEncounter,
};
