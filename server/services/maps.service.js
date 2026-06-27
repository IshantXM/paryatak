/**
 * Maps Service
 *
 * Finds nearby safety-relevant places (police stations, hospitals, pharmacies)
 * using SerpAPI (Google Maps engine). Falls back to seeded MongoDB police
 * station data when no SERPAPI_KEY is configured.
 *
 * @module services/maps
 */

const { getJson } = require('serpapi');
const { findNearestPoliceStations } = require('./geofence.service');

/**
 * Search nearby places via SerpAPI Google Maps engine.
 * @param {number} lat
 * @param {number} lng
 * @param {string} query  e.g. "police station", "hospital"
 * @param {number} radius radius in meters (approx, converted to zoom)
 * @returns {Promise<Array>}
 */
const searchNearbySerpApi = async (lat, lng, query, radius = 5000) => {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey || apiKey === 'your-serpapi-key-here') {
        throw new Error('SERPAPI_KEY not configured');
    }

    // Convert radius to approximate zoom level (higher zoom = smaller area)
    const zoom = radius <= 1000 ? 16 : radius <= 3000 ? 15 : radius <= 5000 ? 14 : 13;

    const data = await getJson({
        engine: 'google_maps',
        q: query,
        ll: `@${lat},${lng},${zoom}z`,
        api_key: apiKey,
        hl: 'en',
    });

    const results = data.local_results || [];

    return results.map((place) => ({
        id: place.place_id || place.data_id,
        name: place.title,
        address: place.address || 'Address unavailable',
        rating: place.rating || null,
        reviews: place.reviews || 0,
        type: place.type || query,
        phone: place.phone || null,
        website: place.website || null,
        openNow: place.open_state
            ? place.open_state.toLowerCase().includes('open')
            : null,
        openState: place.open_state || null,
        thumbnail: place.thumbnail || null,
        distance: place.distance || null,
        coordinates: place.gps_coordinates
            ? {
                  latitude: place.gps_coordinates.latitude,
                  longitude: place.gps_coordinates.longitude,
              }
            : null,
        source: 'serpapi',
    }));
};

/**
 * Fallback: return MongoDB-seeded police stations when SerpAPI unavailable.
 */
const fallbackToMongoPolice = async (lat, lng, query, radius = 10000) => {
    // Only meaningful for police-type queries
    const isPoliceQuery = /police|cop|station|law|enforcement/i.test(query);
    const isHospitalQuery = /hospital|medical|clinic|health|doctor|pharmacy|chemist/i.test(query);

    if (!isPoliceQuery && !isHospitalQuery) {
        return [];
    }

    const stations = await findNearestPoliceStations(lat, lng, radius, 10);

    return stations.map((s) => ({
        id: s._id?.toString() || String(Math.random()),
        name: s.name,
        address: s.address?.fullAddress || s.address?.city || 'Address unavailable',
        rating: null,
        reviews: 0,
        type: isPoliceQuery ? 'Police Station' : 'Safety Point',
        phone: s.phone || null,
        website: null,
        openNow: true, // Police stations are 24/7
        openState: 'Open 24 hours',
        thumbnail: null,
        distance: s.distanceKm ? `${s.distanceKm} km` : null,
        distanceMeters: s.haversineDistance || null,
        coordinates: s.location?.coordinates
            ? {
                  latitude: s.location.coordinates[1],
                  longitude: s.location.coordinates[0],
              }
            : null,
        source: 'local_db',
    }));
};

/**
 * Main entry point — tries SerpAPI first, falls back to MongoDB.
 */
const findNearbyPlaces = async (lat, lng, query = 'police station', radius = 5000) => {
    try {
        const results = await searchNearbySerpApi(lat, lng, query, radius);
        return { results, source: 'serpapi', total: results.length };
    } catch (serpError) {
        console.warn(`⚠️  SerpAPI unavailable (${serpError.message}), using local fallback`);
        const results = await fallbackToMongoPolice(lat, lng, query, radius + 5000);
        return {
            results,
            source: 'local_db',
            total: results.length,
            notice: 'Showing local safety data. Configure SERPAPI_KEY for live search.',
        };
    }
};

module.exports = { findNearbyPlaces };
