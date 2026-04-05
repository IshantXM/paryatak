/**
 * Audit Log Repository
 * 
 * Data access layer for AuditLog model.
 * 
 * @module repositories/auditLog
 */

const AuditLog = require('../models/auditLog.model');

/**
 * Create an audit log entry.
 */
const create = async (logData) => {
    const log = new AuditLog(logData);
    return log.save();
};

/**
 * Find logs by user.
 */
const findByUser = async (userId, page = 1, limit = 50) => {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        AuditLog.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
        AuditLog.countDocuments({ userId })
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
};

/**
 * Find logs by action type.
 */
const findByAction = async (action, page = 1, limit = 50) => {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        AuditLog.find({ action }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
        AuditLog.countDocuments({ action })
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
};

/**
 * Find logs with filters.
 */
const findWithFilters = async (filters = {}, page = 1, limit = 50) => {
    const query = {};

    if (filters.userId) query.userId = filters.userId;
    if (filters.action) query.action = filters.action;
    if (filters.result) query.result = filters.result;
    if (filters.severity) query.severity = filters.severity;
    if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        AuditLog.find(query)
            .populate('userId', 'name phone_number email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec(),
        AuditLog.countDocuments(query)
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
};

/**
 * Get audit log statistics.
 */
const getStats = async (userId = null) => {
    const match = userId ? { userId: require('mongoose').Types.ObjectId(userId) } : {};

    return AuditLog.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$action',
                count: { $sum: 1 },
                lastOccurred: { $max: '$createdAt' }
            }
        },
        { $sort: { count: -1 } }
    ]);
};

module.exports = {
    create,
    findByUser,
    findByAction,
    findWithFilters,
    getStats,
};
