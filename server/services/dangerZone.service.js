/**
 * Danger Zone Service
 * 
 * CRUD and heatmap operations for danger zones.
 * 
 * @module services/dangerZone
 */

const dangerZoneRepo = require('../repositories/dangerZone.repository');
const auditLogRepo = require('../repositories/auditLog.repository');
const { AUDIT_ACTIONS, DANGER_SEVERITY } = require('../utils/constants');

/**
 * Create a new danger zone.
 */
const createDangerZone = async (userId, zoneData, req = null) => {
    const {
        name, description, latitude, longitude,
        radiusMeters, severity, dangerType, note
    } = zoneData;

    const zone = await dangerZoneRepo.create({
        name,
        description: description || '',
        location: {
            type: 'Point',
            coordinates: [longitude, latitude]
        },
        radiusMeters: radiusMeters || 500,
        severity: severity || DANGER_SEVERITY.MODERATE,
        dangerType: dangerType || 'other',
        reportedBy: [{
            userId,
            reportedAt: new Date(),
            note: note || ''
        }],
    });

    await auditLogRepo.create({
        userId,
        action: AUDIT_ACTIONS.DANGER_ZONE_CREATED,
        resourceType: 'DangerZone',
        resourceId: zone._id,
        description: `Danger zone created: ${name} at [${latitude}, ${longitude}]`,
        location: { type: 'Point', coordinates: [longitude, latitude] },
        ipAddress: req?.ip || '',
        result: 'success',
        severity: 'medium',
    });

    return zone;
};

/**
 * Get nearby danger zones.
 */
const getNearbyDangerZones = async (latitude, longitude, radiusMeters = 5000) => {
    return dangerZoneRepo.findNearby(longitude, latitude, radiusMeters);
};

/**
 * Report / upvote an existing danger zone.
 */
const reportDangerZone = async (zoneId, userId, note = '', req = null) => {
    const zone = await dangerZoneRepo.findById(zoneId);
    if (!zone) throw new Error('Danger zone not found');

    // Check if user already reported
    const alreadyReported = zone.reportedBy.some(
        r => r.userId && r.userId.toString() === userId.toString()
    );
    if (alreadyReported) {
        throw new Error('You have already reported this danger zone');
    }

    const updated = await dangerZoneRepo.addReport(zoneId, userId, note);

    // Auto-escalate severity based on report count
    if (updated.reportCount >= 20 && updated.severity !== DANGER_SEVERITY.CRITICAL) {
        await dangerZoneRepo.updateById(zoneId, { severity: DANGER_SEVERITY.CRITICAL });
    } else if (updated.reportCount >= 10 && updated.severity === DANGER_SEVERITY.LOW) {
        await dangerZoneRepo.updateById(zoneId, { severity: DANGER_SEVERITY.HIGH });
    } else if (updated.reportCount >= 5 && updated.severity === DANGER_SEVERITY.LOW) {
        await dangerZoneRepo.updateById(zoneId, { severity: DANGER_SEVERITY.MODERATE });
    }

    await auditLogRepo.create({
        userId,
        action: AUDIT_ACTIONS.DANGER_ZONE_REPORTED,
        resourceType: 'DangerZone',
        resourceId: zoneId,
        description: `Danger zone reported: ${zone.name}. Total reports: ${updated.reportCount}`,
        ipAddress: req?.ip || '',
        result: 'success',
        severity: 'low',
    });

    return updated;
};

/**
 * Get heatmap data.
 */
const getHeatmapData = async (bounds = null) => {
    const zones = await dangerZoneRepo.getHeatmapData(bounds);

    // Format for client-side heatmap rendering
    return zones.map(zone => ({
        id: zone._id,
        name: zone.name,
        latitude: zone.location.coordinates[1],
        longitude: zone.location.coordinates[0],
        radius: zone.radiusMeters,
        weight: zone.heatmapWeight,
        severity: zone.severity,
        type: zone.dangerType,
        reportCount: zone.reportCount,
    }));
};

/**
 * Get all danger zones (paginated).
 */
const getAllDangerZones = async (page = 1, limit = 50) => {
    return dangerZoneRepo.findAll(page, limit);
};

/**
 * Get danger zone by ID.
 */
const getDangerZoneById = async (id) => {
    const zone = await dangerZoneRepo.findById(id);
    if (!zone) throw new Error('Danger zone not found');
    return zone;
};

/**
 * Update danger zone (admin).
 */
const updateDangerZone = async (id, updateData) => {
    return dangerZoneRepo.updateById(id, updateData);
};

/**
 * Deactivate danger zone (admin).
 */
const deactivateDangerZone = async (id) => {
    return dangerZoneRepo.deactivate(id);
};

module.exports = {
    createDangerZone,
    getNearbyDangerZones,
    reportDangerZone,
    getHeatmapData,
    getAllDangerZones,
    getDangerZoneById,
    updateDangerZone,
    deactivateDangerZone,
};
