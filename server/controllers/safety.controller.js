/**
 * Safety Controller
 * @module controllers/safety
 */
const safetyService = require('../services/safety.service');
const geofenceService = require('../services/geofence.service');
const auditLogRepo = require('../repositories/auditLog.repository');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');

const getAnomalies = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const result = await safetyService.getUserAnomalies(req.user.userId, parseInt(page) || 1, parseInt(limit) || 20);
        sendSuccess(res, 'User anomalies', result);
    } catch (err) { sendError(res, err.message, 500); }
};

const getTripAnomalies = async (req, res) => {
    try {
        const result = await safetyService.getTripAnomalies(req.params.tripId);
        sendSuccess(res, 'Trip anomalies', result);
    } catch (err) { sendError(res, err.message, 500); }
};

const getNearbyPolice = async (req, res) => {
    try {
        const { latitude, longitude, radius, limit } = req.query;
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (isNaN(lat) || isNaN(lng)) return sendError(res, 'latitude and longitude required', 400);
        const result = await geofenceService.findNearestPoliceStations(lat, lng, parseInt(radius) || 10000, parseInt(limit) || 5);
        sendSuccess(res, 'Nearest police stations', result);
    } catch (err) { sendError(res, err.message, 500); }
};

const checkGeofence = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const result = await geofenceService.checkGeofences(parseFloat(latitude), parseFloat(longitude));
        sendSuccess(res, 'Geofence check result', result);
    } catch (err) { sendError(res, err.message, 400); }
};

const getHighThreats = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const result = await safetyService.getHighThreatAnomalies(parseInt(page) || 1, parseInt(limit) || 50);
        sendSuccess(res, 'High threat anomalies', result);
    } catch (err) { sendError(res, err.message, 500); }
};

const getAuditLogs = async (req, res) => {
    try {
        const { page, limit, action, severity, startDate, endDate } = req.query;
        const filters = {};
        if (req.user.role !== 'admin' && req.user.role !== 'security') {
            filters.userId = req.user.userId;
        }
        if (action) filters.action = action;
        if (severity) filters.severity = severity;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
        const result = await auditLogRepo.findWithFilters(filters, parseInt(page) || 1, parseInt(limit) || 50);
        sendSuccess(res, 'Audit logs', result);
    } catch (err) { sendError(res, err.message, 500); }
};

module.exports = { getAnomalies, getTripAnomalies, getNearbyPolice, checkGeofence, getHighThreats, getAuditLogs };
