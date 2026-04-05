/**
 * Safety Service
 * 
 * Anomaly detection and security response engine.
 * 
 * @module services/safety
 */

const anomalyRepo = require('../repositories/anomaly.repository');
const tripRepo = require('../repositories/trip.repository');
const locationRepo = require('../repositories/location.repository');
const auditLogRepo = require('../repositories/auditLog.repository');
const geofenceService = require('./geofence.service');
const notificationService = require('./notification.service');
const userRepo = require('../repositories/user.repository');
const { AUDIT_ACTIONS } = require('../utils/constants');
const { detectSpeedAnomaly, detectRouteDeviation, detectProlongedStop, detectNightDangerZone, computeThreatLevel } = require('../utils/anomalyScoring');
const { minDistanceToPath } = require('../utils/haversine');

/**
 * Analyze a location update for anomalies.
 */
const analyzeLocation = async (userId, trip, locationData) => {
    const { latitude, longitude, speed } = locationData;
    const anomalies = [];

    // 1. Speed anomaly
    const speedResult = detectSpeedAnomaly(speed);
    if (speedResult.score > 0) anomalies.push(speedResult);

    // 2. Route deviation
    let pathDeviation = 0;
    if (trip.plannedPath && trip.plannedPath.length > 0) {
        const deviationResult = detectRouteDeviation(latitude, longitude, trip.plannedPath);
        pathDeviation = deviationResult.details.deviationMeters || 0;
        if (deviationResult.score > 0) anomalies.push(deviationResult);
    }

    // 3. Geofence check (danger zones)
    const geofenceResult = await geofenceService.checkGeofences(latitude, longitude);
    const inDangerZone = geofenceResult.inDangerZone;

    if (inDangerZone) {
        await auditLogRepo.create({
            userId,
            action: AUDIT_ACTIONS.DANGER_ZONE_ENTERED,
            resourceType: 'Trip',
            resourceId: trip._id,
            description: `Entered danger zone(s): ${geofenceResult.zones.map(z => z.name).join(', ')}`,
            location: { type: 'Point', coordinates: [longitude, latitude] },
            result: 'warning',
            severity: 'high',
        });

        // Add danger zone encounter to trip
        for (const zone of geofenceResult.zones) {
            await tripRepo.addDangerZoneEncounter(trip._id, {
                zoneId: zone.id,
                enteredAt: new Date(),
                severity: zone.severity,
            });
        }
    }

    // 4. Prolonged stop detection
    const lastLocation = await locationRepo.findLatestByUser(userId);
    if (lastLocation) {
        const stopResult = detectProlongedStop(lastLocation.createdAt, inDangerZone);
        if (stopResult.score > 0) anomalies.push(stopResult);
    }

    // 5. Night-time danger zone check
    const nightResult = detectNightDangerZone(inDangerZone);
    if (nightResult.score > 0) anomalies.push(nightResult);

    // Compute overall threat level
    const threat = computeThreatLevel(anomalies);

    // Save significant anomalies to DB
    if (threat.combinedScore >= 0.3) {
        for (const a of threat.anomalies) {
            await anomalyRepo.create({
                userId,
                tripId: trip._id,
                anomalyType: a.type,
                score: a.score,
                threatLevel: threat.threatLevel,
                location: { type: 'Point', coordinates: [longitude, latitude] },
                details: a.details,
            });
        }
        await tripRepo.incrementAnomalyCount(trip._id);

        // Security response for high/critical threats
        if (threat.threatLevel === 'high' || threat.threatLevel === 'critical') {
            await triggerSecurityResponse(userId, trip._id, threat, { latitude, longitude });
        }
    }

    return {
        threatLevel: threat.threatLevel,
        combinedScore: threat.combinedScore,
        anomalies: threat.anomalies,
        inDangerZone,
        dangerZones: geofenceResult.zones,
        pathDeviation,
    };
};

/**
 * Trigger security response for high-level threats.
 */
const triggerSecurityResponse = async (userId, tripId, threat, location) => {
    const user = await userRepo.findById(userId);
    if (!user) return;

    // Send warning email to user
    if (user.email) {
        await notificationService.sendAnomalyWarning(user.email, {
            threatLevel: threat.threatLevel,
            anomalyType: threat.anomalies.map(a => a.type).join(', '),
            score: threat.combinedScore,
        });
    }

    // Log critical security event
    await auditLogRepo.create({
        userId,
        action: AUDIT_ACTIONS.ANOMALY_DETECTED,
        resourceType: 'Trip',
        resourceId: tripId,
        description: `${threat.threatLevel.toUpperCase()} threat: ${threat.anomalies.map(a => a.type).join(', ')}. Score: ${threat.combinedScore}`,
        location: { type: 'Point', coordinates: [location.longitude, location.latitude] },
        result: 'warning',
        severity: threat.threatLevel === 'critical' ? 'critical' : 'high',
        metadata: { threat },
    });
};

/**
 * Get anomalies for a user.
 */
const getUserAnomalies = async (userId, page = 1, limit = 20) => {
    return anomalyRepo.findByUser(userId, page, limit);
};

/**
 * Get anomalies for a trip.
 */
const getTripAnomalies = async (tripId) => {
    return anomalyRepo.findByTrip(tripId);
};

/**
 * Get high-threat anomalies (admin/security).
 */
const getHighThreatAnomalies = async (page = 1, limit = 50) => {
    return anomalyRepo.findHighThreat(page, limit);
};

module.exports = { analyzeLocation, getUserAnomalies, getTripAnomalies, getHighThreatAnomalies };
