/**
 * SOS Service
 * 
 * Handles SOS alert triggering, cancellation, escalation,
 * and emergency contact notification.
 * 
 * @module services/sos
 */

const sosRepo = require('../repositories/sos.repository');
const userRepo = require('../repositories/user.repository');
const policeStationRepo = require('../repositories/policeStation.repository');
const auditLogRepo = require('../repositories/auditLog.repository');
const notificationService = require('./notification.service');
const { SOS_STATUS, AUDIT_ACTIONS } = require('../utils/constants');
const { safety } = require('../config/environment');

/**
 * Trigger an SOS alert.
 */
const triggerSos = async (userId, sosData, req = null) => {
    const { latitude, longitude, message, emergencyType } = sosData;

    // Get user with emergency contacts
    const user = await userRepo.findById(userId);
    if (!user) throw new Error('User not found');

    // Check for existing active SOS
    const activeSos = await sosRepo.findActiveByUser(userId);
    if (activeSos.length > 0) {
        throw new Error('You already have an active SOS alert. Cancel it first or wait for resolution.');
    }

    // Find nearest police stations
    let nearestStations = [];
    try {
        nearestStations = await policeStationRepo.findNearestWithDistance(longitude, latitude, 10000, 3);
    } catch (err) {
        console.error('Failed to find nearby police stations:', err.message);
    }

    // Create SOS record
    const sos = await sosRepo.create({
        userId,
        location: {
            type: 'Point',
            coordinates: [longitude, latitude]
        },
        message: message || '',
        emergencyType: emergencyType || 'other',
        nearestPoliceStations: nearestStations.map(s => ({
            stationId: s._id,
            name: s.name,
            distance: s.distance,
            phone: s.phone || s.emergencyPhone
        })),
        tripId: user.activeTrip || null,
    });

    // Notify emergency contacts
    let notificationResults = [];
    if (user.emergencyContacts && user.emergencyContacts.length > 0) {
        notificationResults = await notificationService.sendSosAlert(
            user,
            { location: sos.location, message, emergencyType },
            user.emergencyContacts
        );

        // Update SOS with notified contacts
        const notifiedContacts = user.emergencyContacts.map(c => ({
            name: c.name,
            phone: c.phone,
            email: c.email,
            notifiedAt: new Date()
        }));

        await sosRepo.updateStatus(sos._id, SOS_STATUS.ACTIVE, { notifiedContacts });
    }

    // Audit log
    await auditLogRepo.create({
        userId,
        action: AUDIT_ACTIONS.SOS_TRIGGERED,
        resourceType: 'Sos',
        resourceId: sos._id,
        description: `SOS triggered at [${latitude}, ${longitude}]. Type: ${emergencyType}`,
        location: { type: 'Point', coordinates: [longitude, latitude] },
        ipAddress: req?.ip || '',
        userAgent: req?.get('user-agent') || '',
        result: 'success',
        severity: 'critical',
    });

    // Schedule escalation check
    scheduleEscalation(sos._id);

    return {
        sos,
        nearestPoliceStations: nearestStations,
        notificationResults,
    };
};

/**
 * Cancel an SOS alert.
 */
const cancelSos = async (sosId, userId, req = null) => {
    const sos = await sosRepo.findById(sosId);
    if (!sos) throw new Error('SOS alert not found');
    if (sos.userId._id.toString() !== userId.toString()) throw new Error('Unauthorized');
    if (sos.status !== SOS_STATUS.ACTIVE && sos.status !== SOS_STATUS.ESCALATED) {
        throw new Error('SOS alert is not active');
    }

    const updated = await sosRepo.updateStatus(sosId, SOS_STATUS.CANCELLED, {
        resolutionNotes: 'Cancelled by user'
    });

    await auditLogRepo.create({
        userId,
        action: AUDIT_ACTIONS.SOS_CANCELLED,
        resourceType: 'Sos',
        resourceId: sosId,
        description: 'SOS alert cancelled by user',
        ipAddress: req?.ip || '',
        userAgent: req?.get('user-agent') || '',
        result: 'success',
        severity: 'medium',
    });

    return updated;
};

/**
 * Resolve an SOS alert (admin/security).
 */
const resolveSos = async (sosId, resolutionNotes, resolvedBy, req = null) => {
    const sos = await sosRepo.findById(sosId);
    if (!sos) throw new Error('SOS alert not found');

    const updated = await sosRepo.updateStatus(sosId, SOS_STATUS.RESOLVED, {
        resolutionNotes
    });

    await auditLogRepo.create({
        userId: resolvedBy,
        action: AUDIT_ACTIONS.SOS_RESOLVED,
        resourceType: 'Sos',
        resourceId: sosId,
        description: `SOS resolved: ${resolutionNotes}`,
        ipAddress: req?.ip || '',
        userAgent: req?.get('user-agent') || '',
        result: 'success',
        severity: 'medium',
    });

    return updated;
};

/**
 * Get active SOS alerts for a user.
 */
const getActiveSos = async (userId) => {
    return sosRepo.findActiveByUser(userId);
};

/**
 * Get SOS history for a user.
 */
const getSosHistory = async (userId, page = 1, limit = 20) => {
    return sosRepo.findByUser(userId, page, limit);
};

/**
 * Schedule SOS escalation check.
 */
const scheduleEscalation = (sosId) => {
    const delayMs = safety.sosEscalationMinutes * 60 * 1000;

    setTimeout(async () => {
        try {
            const sos = await sosRepo.findById(sosId);
            if (sos && sos.status === SOS_STATUS.ACTIVE) {
                await sosRepo.escalate(sosId);
                await auditLogRepo.create({
                    userId: sos.userId._id || sos.userId,
                    action: AUDIT_ACTIONS.SOS_ESCALATED,
                    resourceType: 'Sos',
                    resourceId: sosId,
                    description: `SOS auto-escalated after ${safety.sosEscalationMinutes} minutes without resolution`,
                    result: 'warning',
                    severity: 'critical',
                });
                console.log(`🚨 SOS ${sosId} escalated — no resolution after ${safety.sosEscalationMinutes} min`);
            }
        } catch (error) {
            console.error(`Failed to escalate SOS ${sosId}:`, error.message);
        }
    }, delayMs);
};

module.exports = {
    triggerSos,
    cancelSos,
    resolveSos,
    getActiveSos,
    getSosHistory,
};
