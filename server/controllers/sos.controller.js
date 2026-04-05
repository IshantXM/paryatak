/**
 * SOS Controller
 * @module controllers/sos
 */
const sosService = require('../services/sos.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const triggerSos = async (req, res) => {
    try {
        const result = await sosService.triggerSos(req.user.userId, req.body, req);
        sendSuccess(res, 'SOS alert triggered! Emergency contacts notified.', result, 201);
    } catch (err) { sendError(res, err.message, 400); }
};

const cancelSos = async (req, res) => {
    try {
        const result = await sosService.cancelSos(req.params.id, req.user.userId, req);
        sendSuccess(res, 'SOS alert cancelled', result);
    } catch (err) { sendError(res, err.message, 400); }
};

const resolveSos = async (req, res) => {
    try {
        const { resolutionNotes } = req.body;
        const result = await sosService.resolveSos(req.params.id, resolutionNotes, req.user.userId, req);
        sendSuccess(res, 'SOS alert resolved', result);
    } catch (err) { sendError(res, err.message, 400); }
};

const getActiveSos = async (req, res) => {
    try {
        const result = await sosService.getActiveSos(req.user.userId);
        sendSuccess(res, 'Active SOS alerts', result);
    } catch (err) { sendError(res, err.message, 500); }
};

const getSosHistory = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const result = await sosService.getSosHistory(req.user.userId, page, limit);
        sendSuccess(res, 'SOS history', result);
    } catch (err) { sendError(res, err.message, 500); }
};

module.exports = { triggerSos, cancelSos, resolveSos, getActiveSos, getSosHistory };
