/**
 * Auth Middleware
 * 
 * JWT verification and user extraction — Express 5 compatible.
 * 
 * @module middleware/auth
 */

const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/environment');
const userRepo = require('../repositories/user.repository');
const { sendError } = require('../utils/apiResponse');

/**
 * Verify JWT access token and attach user to request.
 */
const authenticate = function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return sendError(res, 'Access token required', 401);
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
        decoded = jwt.verify(token, jwtConfig.secret);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return sendError(res, 'Access token expired', 401);
        }
        return sendError(res, 'Invalid access token', 401);
    }

    userRepo.findById(decoded.userId)
        .then(user => {
            if (!user) {
                return sendError(res, 'User not found', 401);
            }
            if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
                return sendError(res, 'Token has been revoked', 401);
            }
            req.user = {
                userId: user._id,
                phone: user.phone_number,
                email: user.email,
                name: user.name,
                role: user.role,
            };
            return next();
        })
        .catch(() => {
            return sendError(res, 'Authentication failed', 401);
        });
};

/**
 * Require specific role(s).
 */
const authorize = (...roles) => {
    return function authzMiddleware(req, res, next) {
        if (!req.user) {
            return sendError(res, 'Authentication required', 401);
        }
        if (!roles.includes(req.user.role)) {
            return sendError(res, 'Insufficient permissions', 403);
        }
        return next();
    };
};

/**
 * Optional auth — doesn't fail if no token.
 */
const optionalAuth = function optionalAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = jwt.verify(token, jwtConfig.secret);
    } catch (_) {
        return next();
    }

    userRepo.findById(decoded.userId)
        .then(user => {
            if (user) {
                req.user = { userId: user._id, phone: user.phone_number, email: user.email, name: user.name, role: user.role };
            }
            return next();
        })
        .catch(() => next());
};

module.exports = { authenticate, authorize, optionalAuth };
