/**
 * Danger Zone Repository
 * 
 * Data access layer for DangerZone model.
 * 
 * @module repositories/dangerZone
 */

const DangerZone = require('../models/dangerZone.model');

/**
 * Create a new danger zone.
 */
const create = async (zoneData) => {
    const zone = new DangerZone(zoneData);
    return zone.save();
};

/**
 * Find danger zone by ID.
 */
const findById = async (id) => {
    return DangerZone.findById(id).exec();
};

/**
 * Find active danger zones near a location.
 * @param {number} longitude 
 * @param {number} latitude 
 * @param {number} maxDistanceMeters 
 */
const findNearby = async (longitude, latitude, maxDistanceMeters = 5000) => {
    return DangerZone.find({
        isActive: true,
        location: {
            $near: {
                $geometry: { type: 'Point', coordinates: [longitude, latitude] },
                $maxDistance: maxDistanceMeters
            }
        }
    }).exec();
};

/**
 * Find danger zones containing a point (within their radius).
 * Uses aggregation with $geoNear + custom filtering.
 */
const findZonesContainingPoint = async (longitude, latitude) => {
    const zones = await DangerZone.aggregate([
        {
            $geoNear: {
                near: { type: 'Point', coordinates: [longitude, latitude] },
                distanceField: 'distance',
                maxDistance: 10000, // 10km max search radius
                spherical: true,
                query: { isActive: true }
            }
        },
        {
            // Filter: only zones where the point is within their radius
            $match: {
                $expr: { $lte: ['$distance', '$radiusMeters'] }
            }
        }
    ]);
    return zones;
};

/**
 * Increment report count and add reporter.
 */
const addReport = async (zoneId, userId, note = '') => {
    return DangerZone.findByIdAndUpdate(zoneId, {
        $inc: { reportCount: 1 },
        $push: {
            reportedBy: {
                userId,
                reportedAt: new Date(),
                note
            }
        }
    }, { new: true }).exec();
};

/**
 * Get heatmap data (all active zones with coordinates and weights).
 */
const getHeatmapData = async (bounds = null) => {
    const query = { isActive: true };

    if (bounds) {
        query.location = {
            $geoWithin: {
                $box: [
                    [bounds.swLng, bounds.swLat],
                    [bounds.neLng, bounds.neLat]
                ]
            }
        };
    }

    return DangerZone.find(query)
        .select('location radiusMeters severity heatmapWeight dangerType reportCount name')
        .exec();
};

/**
 * Update danger zone.
 */
const updateById = async (id, updateData) => {
    return DangerZone.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).exec();
};

/**
 * Deactivate a danger zone.
 */
const deactivate = async (id) => {
    return DangerZone.findByIdAndUpdate(id, { isActive: false }, { new: true }).exec();
};

/**
 * Find all active danger zones (paginated).
 */
const findAll = async (page = 1, limit = 50) => {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        DangerZone.find({ isActive: true }).sort({ heatmapWeight: -1 }).skip(skip).limit(limit).exec(),
        DangerZone.countDocuments({ isActive: true })
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
};

module.exports = {
    create,
    findById,
    findNearby,
    findZonesContainingPoint,
    addReport,
    getHeatmapData,
    updateById,
    deactivate,
    findAll,
};
