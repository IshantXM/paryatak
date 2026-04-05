/**
 * Trip Service
 * 
 * Manages trip lifecycle: start, track, end.
 * Integrates with anomaly detection on each location update.
 * 
 * @module services/trip
 */

const tripRepo = require('../repositories/trip.repository');
const locationRepo = require('../repositories/location.repository');
const userRepo = require('../repositories/user.repository');
const auditLogRepo = require('../repositories/auditLog.repository');
const safetyService = require('./safety.service');
const { TRIP_STATUS, AUDIT_ACTIONS } = require('../utils/constants');
const { haversineDistance } = require('../utils/haversine');

/**
 * Start a new trip.
 */
const startTrip = async (userId, tripData, req = null) => {
    // Check for existing active trip
    const existing = await tripRepo.findActiveByUser(userId);
    if (existing) {
        throw new Error('You already have an active trip. End it before starting a new one.');
    }

    const {
        name,
        originLat, originLng, originAddress,
        destLat, destLng, destAddress,
        plannedPath,
        transportMode,
        estimatedDurationMinutes,
        estimatedDistanceMeters
    } = tripData;

    // Create trip
    const trip = await tripRepo.create({
        userId,
        name: name || 'My Trip',
        origin: {
            type: 'Point',
            coordinates: [originLng, originLat],
            address: originAddress || ''
        },
        destination: {
            type: 'Point',
            coordinates: [destLng, destLat],
            address: destAddress || ''
        },
        plannedPath: plannedPath || [],
        transportMode: transportMode || 'driving',
        estimatedDurationMinutes,
        estimatedDistanceMeters,
        status: TRIP_STATUS.ACTIVE,
        startedAt: new Date(),
    });

    // Update user's active trip
    await userRepo.setActiveTrip(userId, trip._id);

    // Log first location
    await locationRepo.create({
        userId,
        tripId: trip._id,
        location: { type: 'Point', coordinates: [originLng, originLat] },
        speed: 0,
        heading: 0,
    });

    // Audit
    await auditLogRepo.create({
        userId,
        action: AUDIT_ACTIONS.TRIP_STARTED,
        resourceType: 'Trip',
        resourceId: trip._id,
        description: `Trip started: ${originAddress || 'Origin'} → ${destAddress || 'Destination'}`,
        location: { type: 'Point', coordinates: [originLng, originLat] },
        ipAddress: req?.ip || '',
        result: 'success',
        severity: 'low',
    });

    return trip;
};

/**
 * Update location during a trip (breadcrumb).
 * Also runs anomaly detection.
 */
const updateLocation = async (userId, locationData) => {
    const { latitude, longitude, speed, heading, accuracy, batteryLevel, clientTimestamp } = locationData;

    // Find active trip
    const trip = await tripRepo.findActiveByUser(userId);

    // Save location breadcrumb
    const locationRecord = await locationRepo.create({
        userId,
        tripId: trip ? trip._id : null,
        location: { type: 'Point', coordinates: [longitude, latitude] },
        speed: speed || 0,
        heading: heading || 0,
        accuracy,
        batteryLevel,
        clientTimestamp: clientTimestamp || new Date(),
    });

    // Update user's last known location
    await userRepo.updateLocation(userId, longitude, latitude);

    // Run safety analysis (anomaly detection + geofencing)
    let safetyResult = null;
    if (trip) {
        safetyResult = await safetyService.analyzeLocation(userId, trip, {
            latitude,
            longitude,
            speed: speed || 0,
        });

        // Update trip stats if there was deviation
        if (safetyResult && safetyResult.pathDeviation > 0) {
            await tripRepo.updateMaxDeviation(trip._id, safetyResult.pathDeviation);
            locationRecord.pathDeviation = safetyResult.pathDeviation;
            locationRecord.inDangerZone = safetyResult.inDangerZone;
            await locationRecord.save();
        }
    }

    return {
        location: locationRecord,
        safety: safetyResult,
    };
};

/**
 * End a trip.
 */
const endTrip = async (userId, req = null) => {
    const trip = await tripRepo.findActiveByUser(userId);
    if (!trip) throw new Error('No active trip found');

    // Calculate actual distance from breadcrumbs
    const breadcrumbs = await locationRepo.findByTrip(trip._id);
    let totalDistance = 0;

    for (let i = 1; i < breadcrumbs.length; i++) {
        const prev = breadcrumbs[i - 1].location.coordinates;
        const curr = breadcrumbs[i].location.coordinates;
        totalDistance += haversineDistance(prev[1], prev[0], curr[1], curr[0], 'm');
    }

    // End trip
    const ended = await tripRepo.endTrip(trip._id, Math.round(totalDistance));

    // Clear user's active trip
    await userRepo.setActiveTrip(userId, null);

    // Audit
    await auditLogRepo.create({
        userId,
        action: AUDIT_ACTIONS.TRIP_ENDED,
        resourceType: 'Trip',
        resourceId: trip._id,
        description: `Trip ended. Distance: ${Math.round(totalDistance)}m, Anomalies: ${trip.anomalyCount}`,
        ipAddress: req?.ip || '',
        result: 'success',
        severity: 'low',
    });

    return ended;
};

/**
 * Cancel a trip.
 */
const cancelTrip = async (userId, req = null) => {
    const trip = await tripRepo.findActiveByUser(userId);
    if (!trip) throw new Error('No active trip found');

    const cancelled = await tripRepo.cancelTrip(trip._id);
    await userRepo.setActiveTrip(userId, null);

    await auditLogRepo.create({
        userId,
        action: AUDIT_ACTIONS.TRIP_CANCELLED,
        resourceType: 'Trip',
        resourceId: trip._id,
        description: 'Trip cancelled by user',
        ipAddress: req?.ip || '',
        result: 'success',
        severity: 'low',
    });

    return cancelled;
};

/**
 * Get active trip for a user.
 */
const getActiveTrip = async (userId) => {
    return tripRepo.findActiveByUser(userId);
};

/**
 * Get trip history.
 */
const getTripHistory = async (userId, page = 1, limit = 20) => {
    return tripRepo.findByUser(userId, page, limit);
};

/**
 * Get trip breadcrumbs (location trail).
 */
const getTripBreadcrumbs = async (tripId) => {
    return locationRepo.findByTrip(tripId);
};

module.exports = {
    startTrip,
    updateLocation,
    endTrip,
    cancelTrip,
    getActiveTrip,
    getTripHistory,
    getTripBreadcrumbs,
};
