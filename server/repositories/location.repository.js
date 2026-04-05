/**
 * Location Repository
 * 
 * Data access layer for Location breadcrumbs.
 * 
 * @module repositories/location
 */

const Location = require('../models/location.model');

/**
 * Create a location breadcrumb.
 */
const create = async (locationData) => {
    const location = new Location(locationData);
    return location.save();
};

/**
 * Find locations for a trip.
 */
const findByTrip = async (tripId) => {
    return Location.find({ tripId }).sort({ createdAt: 1 }).exec();
};

/**
 * Find latest location for a user.
 */
const findLatestByUser = async (userId) => {
    return Location.findOne({ userId }).sort({ createdAt: -1 }).exec();
};

/**
 * Find locations for a user within a time range.
 */
const findByUserInRange = async (userId, startTime, endTime) => {
    return Location.find({
        userId,
        createdAt: { $gte: startTime, $lte: endTime }
    }).sort({ createdAt: 1 }).exec();
};

/**
 * Get location count for a trip.
 */
const countByTrip = async (tripId) => {
    return Location.countDocuments({ tripId });
};

/**
 * Find nearby users (for community safety features).
 */
const findNearbyUsers = async (longitude, latitude, maxDistanceMeters = 1000) => {
    return Location.aggregate([
        {
            $geoNear: {
                near: { type: 'Point', coordinates: [longitude, latitude] },
                distanceField: 'distance',
                maxDistance: maxDistanceMeters,
                spherical: true
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $group: {
                _id: '$userId',
                latestLocation: { $first: '$$ROOT' }
            }
        },
        {
            $replaceRoot: { newRoot: '$latestLocation' }
        }
    ]);
};

module.exports = {
    create,
    findByTrip,
    findLatestByUser,
    findByUserInRange,
    countByTrip,
    findNearbyUsers,
};
