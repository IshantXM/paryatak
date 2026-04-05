/**
 * SOS Repository
 * 
 * Data access layer for SOS model.
 * 
 * @module repositories/sos
 */

const Sos = require('../models/sos.model');
const { SOS_STATUS } = require('../utils/constants');

/**
 * Create a new SOS alert.
 */
const create = async (sosData) => {
    const sos = new Sos(sosData);
    return sos.save();
};

/**
 * Find SOS by ID.
 */
const findById = async (id) => {
    return Sos.findById(id).populate('userId', 'name phone_number email').exec();
};

/**
 * Find active SOS alerts for a user.
 */
const findActiveByUser = async (userId) => {
    return Sos.find({ userId, status: SOS_STATUS.ACTIVE })
        .sort({ createdAt: -1 })
        .exec();
};

/**
 * Find all SOS alerts for a user.
 */
const findByUser = async (userId, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        Sos.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
        Sos.countDocuments({ userId })
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
};

/**
 * Update SOS status.
 */
const updateStatus = async (id, status, extras = {}) => {
    const updateData = { status, ...extras };
    if (status !== SOS_STATUS.ACTIVE) {
        updateData.resolvedAt = new Date();
    }
    return Sos.findByIdAndUpdate(id, updateData, { new: true }).exec();
};

/**
 * Escalate SOS.
 */
const escalate = async (id) => {
    return Sos.findByIdAndUpdate(id, {
        $inc: { escalationLevel: 1 },
        status: SOS_STATUS.ESCALATED
    }, { new: true }).exec();
};

/**
 * Find SOS alerts that need escalation (active for > N minutes).
 */
const findForEscalation = async (minutesThreshold) => {
    const threshold = new Date(Date.now() - minutesThreshold * 60 * 1000);
    return Sos.find({
        status: SOS_STATUS.ACTIVE,
        createdAt: { $lt: threshold }
    }).populate('userId', 'name phone_number email emergencyContacts').exec();
};

/**
 * Find nearby SOS alerts (within radius in meters).
 */
const findNearby = async (longitude, latitude, maxDistanceMeters = 5000) => {
    return Sos.find({
        status: SOS_STATUS.ACTIVE,
        location: {
            $near: {
                $geometry: { type: 'Point', coordinates: [longitude, latitude] },
                $maxDistance: maxDistanceMeters
            }
        }
    }).exec();
};

module.exports = {
    create,
    findById,
    findActiveByUser,
    findByUser,
    updateStatus,
    escalate,
    findForEscalation,
    findNearby,
};
