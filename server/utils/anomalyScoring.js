/**
 * Anomaly Scoring Engine
 * 
 * Detects anomalies in user travel patterns based on multiple factors.
 * Each anomaly type produces a score from 0 (normal) to 1 (highly anomalous).
 * The combined threat level determines the security response.
 * 
 * @module utils/anomalyScoring
 */

const { safety } = require('../config/environment');
const { haversineDistance, minDistanceToPath, calculateSpeed } = require('./haversine');

/**
 * Anomaly types enum.
 */
const ANOMALY_TYPES = {
    SPEED_ANOMALY: 'speed_anomaly',
    ROUTE_DEVIATION: 'route_deviation',
    PROLONGED_STOP: 'prolonged_stop',
    NIGHT_DANGER_ZONE: 'night_danger_zone',
    SUDDEN_DIRECTION_CHANGE: 'sudden_direction_change',
    DEVICE_OFFLINE: 'device_offline',
    ENTERED_DANGER_ZONE: 'entered_danger_zone',
};

/**
 * Threat levels based on combined anomaly score.
 */
const THREAT_LEVELS = {
    NONE: 'none',           // 0 - 0.2
    LOW: 'low',             // 0.2 - 0.4
    MODERATE: 'moderate',   // 0.4 - 0.6
    HIGH: 'high',           // 0.6 - 0.8
    CRITICAL: 'critical',   // 0.8 - 1.0
};

/**
 * Calculate speed anomaly score.
 * @param {number} currentSpeedKmh 
 * @returns {{ score: number, type: string, details: object }}
 */
const detectSpeedAnomaly = (currentSpeedKmh) => {
    const maxSpeed = safety.maxSpeedKmh;

    if (currentSpeedKmh <= 0) {
        return { score: 0, type: ANOMALY_TYPES.SPEED_ANOMALY, details: { currentSpeedKmh, maxSpeed } };
    }

    // Score ramps up as speed exceeds threshold
    const ratio = currentSpeedKmh / maxSpeed;
    let score = 0;

    if (ratio > 1.5) score = 1.0;       // 50% over max → critical
    else if (ratio > 1.2) score = 0.8;  // 20% over → high
    else if (ratio > 1.0) score = 0.5;  // Just over → moderate
    else score = 0;

    return {
        score,
        type: ANOMALY_TYPES.SPEED_ANOMALY,
        details: { currentSpeedKmh, maxSpeed, ratio: Math.round(ratio * 100) / 100 }
    };
};

/**
 * Detect route deviation anomaly.
 * @param {number} currentLat 
 * @param {number} currentLon 
 * @param {Array<{latitude: number, longitude: number}>} plannedPath 
 * @returns {{ score: number, type: string, details: object }}
 */
const detectRouteDeviation = (currentLat, currentLon, plannedPath) => {
    if (!plannedPath || plannedPath.length === 0) {
        return { score: 0, type: ANOMALY_TYPES.ROUTE_DEVIATION, details: { message: 'No planned path' } };
    }

    const deviationMeters = minDistanceToPath(currentLat, currentLon, plannedPath);
    const threshold = safety.pathDeviationMeters;

    let score = 0;
    if (deviationMeters > threshold * 3) score = 1.0;
    else if (deviationMeters > threshold * 2) score = 0.8;
    else if (deviationMeters > threshold) score = 0.5;
    else if (deviationMeters > threshold * 0.5) score = 0.2;

    return {
        score,
        type: ANOMALY_TYPES.ROUTE_DEVIATION,
        details: { deviationMeters: Math.round(deviationMeters), thresholdMeters: threshold }
    };
};

/**
 * Detect prolonged stop anomaly.
 * @param {Date} lastMoveTime - When the user last moved significantly
 * @param {boolean} inDangerZone - Whether the user is in a danger zone
 * @returns {{ score: number, type: string, details: object }}
 */
const detectProlongedStop = (lastMoveTime, inDangerZone = false) => {
    const stopDurationMinutes = (Date.now() - new Date(lastMoveTime).getTime()) / (1000 * 60);
    const threshold = safety.prolongedStopMinutes;

    let score = 0;

    if (inDangerZone) {
        // Stops in danger zones are weighted heavier
        if (stopDurationMinutes > threshold) score = 1.0;
        else if (stopDurationMinutes > threshold * 0.5) score = 0.7;
        else if (stopDurationMinutes > threshold * 0.25) score = 0.3;
    } else {
        if (stopDurationMinutes > threshold * 3) score = 0.8;
        else if (stopDurationMinutes > threshold * 2) score = 0.5;
        else if (stopDurationMinutes > threshold) score = 0.3;
    }

    return {
        score,
        type: ANOMALY_TYPES.PROLONGED_STOP,
        details: { stopDurationMinutes: Math.round(stopDurationMinutes), thresholdMinutes: threshold, inDangerZone }
    };
};

/**
 * Detect night-time travel in danger zone.
 * @param {boolean} inDangerZone 
 * @param {Date} [currentTime] 
 * @returns {{ score: number, type: string, details: object }}
 */
const detectNightDangerZone = (inDangerZone, currentTime = new Date()) => {
    const hour = currentTime.getHours();
    const isNight = hour >= safety.nightStartHour || hour < safety.nightEndHour;

    let score = 0;
    if (isNight && inDangerZone) {
        score = 0.9; // Night + danger zone = near-critical
    } else if (isNight) {
        score = 0.2; // Night alone is mildly concerning
    } else if (inDangerZone) {
        score = 0.4; // Danger zone in daylight is moderate
    }

    return {
        score,
        type: ANOMALY_TYPES.NIGHT_DANGER_ZONE,
        details: { isNight, inDangerZone, hour }
    };
};

/**
 * Compute combined anomaly assessment.
 * @param {Array<{score: number, type: string, details: object}>} anomalies 
 * @returns {{ threatLevel: string, combinedScore: number, anomalies: Array }}
 */
const computeThreatLevel = (anomalies) => {
    if (!anomalies || anomalies.length === 0) {
        return { threatLevel: THREAT_LEVELS.NONE, combinedScore: 0, anomalies: [] };
    }

    // Filter to only significant anomalies
    const significant = anomalies.filter(a => a.score > 0);

    if (significant.length === 0) {
        return { threatLevel: THREAT_LEVELS.NONE, combinedScore: 0, anomalies: [] };
    }

    // Weighted average — max anomaly counts most
    const maxScore = Math.max(...significant.map(a => a.score));
    const avgScore = significant.reduce((sum, a) => sum + a.score, 0) / significant.length;

    // Combined: 60% max + 40% average (max-weighted to avoid dilution)
    const combinedScore = Math.min(1, maxScore * 0.6 + avgScore * 0.4);

    let threatLevel;
    if (combinedScore >= 0.8) threatLevel = THREAT_LEVELS.CRITICAL;
    else if (combinedScore >= 0.6) threatLevel = THREAT_LEVELS.HIGH;
    else if (combinedScore >= 0.4) threatLevel = THREAT_LEVELS.MODERATE;
    else if (combinedScore >= 0.2) threatLevel = THREAT_LEVELS.LOW;
    else threatLevel = THREAT_LEVELS.NONE;

    return {
        threatLevel,
        combinedScore: Math.round(combinedScore * 100) / 100,
        anomalies: significant
    };
};

module.exports = {
    ANOMALY_TYPES,
    THREAT_LEVELS,
    detectSpeedAnomaly,
    detectRouteDeviation,
    detectProlongedStop,
    detectNightDangerZone,
    computeThreatLevel,
};
