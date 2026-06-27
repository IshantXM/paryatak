const sendSuccess = (res, message, data = null, statusCode = 200, meta = null) => {
    const response = { success: true, message };
    if (data !== null) response.data = data;
    if (meta !== null) response.meta = meta;
    return res.status(statusCode).json(response);
};

const sendError = (res, message, statusCode = 400, errors = null) => {
    const response = { success: false, message };
    if (errors !== null) response.errors = errors;
    return res.status(statusCode).json(response);
};

const paginate = (total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
});

module.exports = { sendSuccess, sendError, paginate };
