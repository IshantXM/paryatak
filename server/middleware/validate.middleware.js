/**
 * Validation Middleware
 * 
 * Request body validation for common fields.
 * Compatible with Express 5.
 * 
 * @module middleware/validate
 */

const { sendError } = require('../utils/apiResponse');

/**
 * Validate required fields exist in req.body.
 */
const requireFields = (...fields) => {
    return function validateRequired(req, res, next) {
        const missing = fields.filter(f => {
            const val = req.body[f];
            return val === undefined || val === null || val === '';
        });
        if (missing.length > 0) {
            return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
        }
        return next();
    };
};

/**
 * Validate coordinates (latitude/longitude).
 */
const validateCoordinates = (latField = 'latitude', lngField = 'longitude') => {
    return function validateCoords(req, res, next) {
        const lat = parseFloat(req.body[latField]);
        const lng = parseFloat(req.body[lngField]);

        if (isNaN(lat) || lat < -90 || lat > 90) {
            return sendError(res, `Invalid ${latField}: must be between -90 and 90`, 400);
        }
        if (isNaN(lng) || lng < -180 || lng > 180) {
            return sendError(res, `Invalid ${lngField}: must be between -180 and 180`, 400);
        }

        req.body[latField] = lat;
        req.body[lngField] = lng;
        return next();
    };
};

/**
 * Validate phone number format (basic).
 */
const validatePhone = (field = 'phone_number') => {
    return function validatePhoneNum(req, res, next) {
        const phone = req.body[field];
        if (!phone) return next();
        const cleaned = phone.replace(/[\s\-\(\)]/g, '');
        if (!/^\+?\d{10,15}$/.test(cleaned)) {
            return sendError(res, 'Invalid phone number format', 400);
        }
        req.body[field] = cleaned;
        return next();
    };
};

/**
 * Validate email format (basic).
 */
const validateEmail = (field = 'email') => {
    return function validateEmailFmt(req, res, next) {
        const email = req.body[field];
        if (!email) return next();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return sendError(res, 'Invalid email format', 400);
        }
        req.body[field] = email.toLowerCase();
        return next();
    };
};

/**
 * Validate pagination parameters from query string.
 */
const validatePagination = function validatePage(req, res, next) {
    req.query.page = Math.max(1, parseInt(req.query.page) || 1);
    req.query.limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    return next();
};

module.exports = { requireFields, validateCoordinates, validatePhone, validateEmail, validatePagination };
