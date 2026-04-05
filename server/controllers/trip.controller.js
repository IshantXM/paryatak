/**
 * Trip Controller
 * @module controllers/trip
 */
const tripService = require('../services/trip.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const startTrip = async (req, res) => {
    try {
        const result = await tripService.startTrip(req.user.userId, req.body, req);
        sendSuccess(res, 'Trip started', result, 201);
    } catch (err) { sendError(res, err.message, 400); }
};

const updateLocation = async (req, res) => {
    try {
        const result = await tripService.updateLocation(req.user.userId, req.body);
        sendSuccess(res, 'Location updated', result);
    } catch (err) { sendError(res, err.message, 400); }
};

const endTrip = async (req, res) => {
    try {
        const result = await tripService.endTrip(req.user.userId, req);
        sendSuccess(res, 'Trip ended', result);
    } catch (err) { sendError(res, err.message, 400); }
};

const cancelTrip = async (req, res) => {
    try {
        const result = await tripService.cancelTrip(req.user.userId, req);
        sendSuccess(res, 'Trip cancelled', result);
    } catch (err) { sendError(res, err.message, 400); }
};

const getActiveTrip = async (req, res) => {
    try {
        const result = await tripService.getActiveTrip(req.user.userId);
        sendSuccess(res, result ? 'Active trip found' : 'No active trip', result);
    } catch (err) { sendError(res, err.message, 500); }
};

const getTripHistory = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const result = await tripService.getTripHistory(req.user.userId, page, limit);
        sendSuccess(res, 'Trip history', result);
    } catch (err) { sendError(res, err.message, 500); }
};

const getTripBreadcrumbs = async (req, res) => {
    try {
        const result = await tripService.getTripBreadcrumbs(req.params.tripId);
        sendSuccess(res, 'Trip breadcrumbs', result);
    } catch (err) { sendError(res, err.message, 500); }
};

module.exports = { startTrip, updateLocation, endTrip, cancelTrip, getActiveTrip, getTripHistory, getTripBreadcrumbs };
