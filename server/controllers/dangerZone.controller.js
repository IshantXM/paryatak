/**
 * Danger Zone Controller
 * @module controllers/dangerZone
 */
const dangerZoneService = require('../services/dangerZone.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const create = async (req, res) => {
    try {
        const result = await dangerZoneService.createDangerZone(req.user.userId, req.body, req);
        sendSuccess(res, 'Danger zone created', result, 201);
    } catch (err) { sendError(res, err.message, 400); }
};

const getNearby = async (req, res) => {
    try {
        const { latitude, longitude, radius } = req.query;
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (isNaN(lat) || isNaN(lng)) return sendError(res, 'latitude and longitude are required', 400);
        const result = await dangerZoneService.getNearbyDangerZones(lat, lng, parseInt(radius) || 5000);
        sendSuccess(res, 'Nearby danger zones', result);
    } catch (err) { sendError(res, err.message, 500); }
};

const report = async (req, res) => {
    try {
        const { note } = req.body;
        const result = await dangerZoneService.reportDangerZone(req.params.id, req.user.userId, note, req);
        sendSuccess(res, 'Danger zone reported', result);
    } catch (err) { sendError(res, err.message, 400); }
};

const getHeatmap = async (req, res) => {
    try {
        const { swLat, swLng, neLat, neLng } = req.query;
        let bounds = null;
        if (swLat && swLng && neLat && neLng) {
            bounds = { swLat: parseFloat(swLat), swLng: parseFloat(swLng), neLat: parseFloat(neLat), neLng: parseFloat(neLng) };
        }
        const result = await dangerZoneService.getHeatmapData(bounds);
        sendSuccess(res, 'Heatmap data', result);
    } catch (err) { sendError(res, err.message, 500); }
};

const getAll = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const result = await dangerZoneService.getAllDangerZones(parseInt(page) || 1, parseInt(limit) || 50);
        sendSuccess(res, 'All danger zones', result);
    } catch (err) { sendError(res, err.message, 500); }
};

const getById = async (req, res) => {
    try {
        const result = await dangerZoneService.getDangerZoneById(req.params.id);
        sendSuccess(res, 'Danger zone details', result);
    } catch (err) { sendError(res, err.message, 404); }
};

const update = async (req, res) => {
    try {
        const result = await dangerZoneService.updateDangerZone(req.params.id, req.body);
        sendSuccess(res, 'Danger zone updated', result);
    } catch (err) { sendError(res, err.message, 400); }
};

const deactivate = async (req, res) => {
    try {
        const result = await dangerZoneService.deactivateDangerZone(req.params.id);
        sendSuccess(res, 'Danger zone deactivated', result);
    } catch (err) { sendError(res, err.message, 400); }
};

module.exports = { create, getNearby, report, getHeatmap, getAll, getById, update, deactivate };
