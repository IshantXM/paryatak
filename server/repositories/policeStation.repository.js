/**
 * Police Station Repository
 * 
 * Data access layer for PoliceStation model.
 * 
 * @module repositories/policeStation
 */

const PoliceStation = require('../models/policeStation.model');

/**
 * Create a police station.
 */
const create = async (stationData) => {
    const station = new PoliceStation(stationData);
    return station.save();
};

/**
 * Bulk create police stations.
 */
const bulkCreate = async (stations) => {
    return PoliceStation.insertMany(stations, { ordered: false });
};

/**
 * Find nearest police stations using $near (requires 2dsphere index).
 * @param {number} longitude 
 * @param {number} latitude 
 * @param {number} maxDistanceMeters 
 * @param {number} limit 
 */
const findNearest = async (longitude, latitude, maxDistanceMeters = 10000, limit = 5) => {
    return PoliceStation.find({
        isActive: true,
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                $maxDistance: maxDistanceMeters
            }
        }
    }).limit(limit).exec();
};

/**
 * Find nearest with calculated distances (using $geoNear aggregation).
 */
const findNearestWithDistance = async (longitude, latitude, maxDistanceMeters = 10000, limit = 5) => {
    return PoliceStation.aggregate([
        {
            $geoNear: {
                near: { type: 'Point', coordinates: [longitude, latitude] },
                distanceField: 'distance', // distance in meters
                maxDistance: maxDistanceMeters,
                spherical: true,
                query: { isActive: true }
            }
        },
        { $limit: limit },
        {
            $project: {
                name: 1,
                location: 1,
                address: 1,
                phone: 1,
                emergencyPhone: 1,
                stationType: 1,
                is24x7: 1,
                distance: { $round: ['$distance', 0] } // Round to nearest meter
            }
        }
    ]);
};

/**
 * Find station by ID.
 */
const findById = async (id) => {
    return PoliceStation.findById(id).exec();
};

/**
 * Update station.
 */
const updateById = async (id, updateData) => {
    return PoliceStation.findByIdAndUpdate(id, updateData, { new: true }).exec();
};

/**
 * Find all active stations (paginated).
 */
const findAll = async (page = 1, limit = 50) => {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        PoliceStation.find({ isActive: true }).skip(skip).limit(limit).exec(),
        PoliceStation.countDocuments({ isActive: true })
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
};

module.exports = {
    create,
    bulkCreate,
    findNearest,
    findNearestWithDistance,
    findById,
    updateById,
    findAll,
};
