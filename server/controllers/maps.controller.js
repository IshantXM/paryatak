/**
 * Maps Controller
 *
 * Handles requests for nearby places (police stations, hospitals, etc.)
 * using SerpAPI with a MongoDB fallback.
 *
 * @module controllers/maps
 */
const mapsService = require('../services/maps.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * GET /api/maps/nearby
 * Query params: lat, lng, query, radius
 */
const getNearbyPlaces = async (req, res) => {
    try {
        const { lat, lng, query = 'police station', radius = '5000' } = req.query;

        if (!lat || !lng) {
            return sendError(res, 'lat and lng query parameters are required', 400);
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusMeters = parseInt(radius, 10);

        if (isNaN(latitude) || isNaN(longitude)) {
            return sendError(res, 'Invalid lat/lng values', 400);
        }

        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return sendError(res, 'Coordinates out of valid range', 400);
        }

        const data = await mapsService.findNearbyPlaces(latitude, longitude, query, radiusMeters);

        return sendSuccess(res, 'Nearby places retrieved', data);
    } catch (err) {
        return sendError(res, err.message, 500);
    }
};

module.exports = { getNearbyPlaces };
