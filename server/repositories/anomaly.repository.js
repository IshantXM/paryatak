/**
 * Anomaly Repository
 * 
 * Data access layer for Anomaly model.
 * 
 * @module repositories/anomaly
 */

const Anomaly = require('../models/anomaly.model');

/**
 * Create an anomaly record.
 */
const create = async (anomalyData) => {
    const anomaly = new Anomaly(anomalyData);
    return anomaly.save();
};

/**
 * Find anomalies for a user.
 */
const findByUser = async (userId, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        Anomaly.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
        Anomaly.countDocuments({ userId })
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
};

/**
 * Find anomalies for a trip.
 */
const findByTrip = async (tripId) => {
    return Anomaly.find({ tripId }).sort({ createdAt: -1 }).exec();
};

/**
 * Find high-threat anomalies (for security dashboard).
 */
const findHighThreat = async (page = 1, limit = 50) => {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        Anomaly.find({ threatLevel: { $in: ['high', 'critical'] } })
            .populate('userId', 'name phone_number email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec(),
        Anomaly.countDocuments({ threatLevel: { $in: ['high', 'critical'] } })
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
};

/**
 * Acknowledge an anomaly.
 */
const acknowledge = async (id, responseDetails = '') => {
    return Anomaly.findByIdAndUpdate(id, {
        isAcknowledged: true,
        responseTriggered: true,
        responseDetails
    }, { new: true }).exec();
};

module.exports = {
    create,
    findByUser,
    findByTrip,
    findHighThreat,
    acknowledge,
};
