/**
 * Haversine Formula
 * 
 * Calculates the great-circle distance between two points
 * on the Earth's surface given their latitude and longitude.
 * 
 * @module utils/haversine
 */

const EARTH_RADIUS_KM = 6371;
const EARTH_RADIUS_METERS = 6371000;

/**
 * Convert degrees to radians.
 * @param {number} deg 
 * @returns {number}
 */
const toRadians = (deg) => (deg * Math.PI) / 180;

/**
 * Calculate distance between two coordinates using the Haversine formula.
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @param {'km'|'m'|'miles'} [unit='m'] - Unit of measurement
 * @returns {number} Distance in the specified unit
 */
const haversineDistance = (lat1, lon1, lat2, lon2, unit = 'm') => {
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    switch (unit) {
        case 'km':
            return EARTH_RADIUS_KM * c;
        case 'miles':
            return EARTH_RADIUS_KM * c * 0.621371;
        case 'm':
        default:
            return EARTH_RADIUS_METERS * c;
    }
};

/**
 * Calculate bearing between two points.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Bearing in degrees (0-360)
 */
const calculateBearing = (lat1, lon1, lat2, lon2) => {
    const dLon = toRadians(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
    const x =
        Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
        Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);

    let bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
};

/**
 * Check if a point is within a circular geofence.
 * @param {number} pointLat 
 * @param {number} pointLon 
 * @param {number} centerLat 
 * @param {number} centerLon 
 * @param {number} radiusMeters 
 * @returns {boolean}
 */
const isWithinGeofence = (pointLat, pointLon, centerLat, centerLon, radiusMeters) => {
    const distance = haversineDistance(pointLat, pointLon, centerLat, centerLon, 'm');
    return distance <= radiusMeters;
};

/**
 * Calculate speed between two location points in km/h.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @param {Date} time1 
 * @param {Date} time2 
 * @returns {number} Speed in km/h
 */
const calculateSpeed = (lat1, lon1, lat2, lon2, time1, time2) => {
    const distanceKm = haversineDistance(lat1, lon1, lat2, lon2, 'km');
    const timeDiffHours = (new Date(time2) - new Date(time1)) / (1000 * 60 * 60);

    if (timeDiffHours === 0) return 0;
    return distanceKm / timeDiffHours;
};

/**
 * Find the minimum distance from a point to a polyline (path).
 * @param {number} pointLat 
 * @param {number} pointLon 
 * @param {Array<{latitude: number, longitude: number}>} path - Array of coordinates
 * @returns {number} Minimum distance in meters
 */
const minDistanceToPath = (pointLat, pointLon, path) => {
    if (!path || path.length === 0) return Infinity;

    let minDist = Infinity;

    for (let i = 0; i < path.length; i++) {
        const dist = haversineDistance(
            pointLat, pointLon,
            path[i].latitude, path[i].longitude,
            'm'
        );
        if (dist < minDist) {
            minDist = dist;
        }
    }

    return minDist;
};

/**
 * Sort locations by distance from a reference point.
 * @param {number} refLat 
 * @param {number} refLon 
 * @param {Array<{latitude: number, longitude: number}>} locations 
 * @returns {Array<{location: object, distance: number}>}
 */
const sortByDistance = (refLat, refLon, locations) => {
    return locations
        .map(loc => ({
            ...loc,
            _distance: haversineDistance(
                refLat, refLon,
                loc.latitude || loc.location?.coordinates?.[1],
                loc.longitude || loc.location?.coordinates?.[0],
                'm'
            )
        }))
        .sort((a, b) => a._distance - b._distance);
};

module.exports = {
    haversineDistance,
    calculateBearing,
    isWithinGeofence,
    calculateSpeed,
    minDistanceToPath,
    sortByDistance,
    EARTH_RADIUS_KM,
    EARTH_RADIUS_METERS
};
