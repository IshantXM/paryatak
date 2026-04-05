/**
 * API Response Helpers
 * 
 * Standardized response format for all API endpoints.
 * 
 * @module utils/apiResponse
 */

/**
 * Send a success response.
 * @param {object} res - Express response
 * @param {string} message 
 * @param {object} [data] 
 * @param {number} [statusCode=200] 
 */
const sendSuccess = (res, message, data = null, statusCode = 200) => {
    const response = {
        success: true,
        message,
        timestamp: new Date().toISOString(),
    };

    if (data !== null && data !== undefined) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

/**
 * Send an error response.
 * @param {object} res - Express response
 * @param {string} message  
 * @param {number} [statusCode=400] 
 * @param {object} [errors] - Validation errors or extra info
 */
const sendError = (res, message, statusCode = 400, errors = null) => {
    const response = {
        success: false,
        message,
        timestamp: new Date().toISOString(),
    };

    if (errors) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

/**
 * Send a paginated response.
 * @param {object} res 
 * @param {string} message 
 * @param {Array} data 
 * @param {object} pagination - { page, limit, total, totalPages }
 */
const sendPaginated = (res, message, data, pagination) => {
    return res.status(200).json({
        success: true,
        message,
        data,
        pagination,
        timestamp: new Date().toISOString(),
    });
};

module.exports = { sendSuccess, sendError, sendPaginated };
