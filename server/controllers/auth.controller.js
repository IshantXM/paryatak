/**
 * Auth Controller
 * 
 * Handles all authentication endpoints.
 * Express 5 compatible — no reliance on `next` parameter.
 * 
 * @module controllers/auth
 */
const authService = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Step 1: Initiate signup — sends OTP to user's email.
 * POST /api/auth/signup/initiate
 * Body: { name, phone_number, email, password?, address? }
 */
const initiateSignup = async (req, res) => {
    try {
        const result = await authService.initiateSignup(req.body, req);
        return sendSuccess(res, result.message, {
            email: result.email,
            expiresAt: result.expiresAt,
        });
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

/**
 * Step 2: Verify signup OTP — creates user and returns tokens.
 * POST /api/auth/signup/verify
 * Body: { email, otp }
 */
const verifySignup = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const result = await authService.completeSignup(email, otp, req);
        return sendSuccess(res, 'Account created successfully', result, 201);
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

/**
 * Login with phone + password.
 * POST /api/auth/login
 * Body: { phone_number, password }
 */
const login = async (req, res) => {
    try {
        const { phone_number, password } = req.body;
        const result = await authService.login(phone_number, password, req);
        return sendSuccess(res, 'Login successful', result);
    } catch (err) {
        return sendError(res, err.message, 401);
    }
};

/**
 * Send OTP for login or other purposes.
 * POST /api/auth/send-otp
 * Body: { identifier, purpose? }
 */
const sendOtp = async (req, res) => {
    try {
        const { identifier, purpose } = req.body;
        const result = await authService.sendOtp(identifier, purpose || 'login', req);
        return sendSuccess(res, result.message, { expiresAt: result.expiresAt });
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

/**
 * Verify OTP for login.
 * POST /api/auth/verify-otp
 * Body: { identifier, otp, purpose? }
 */
const verifyOtp = async (req, res) => {
    try {
        const { identifier, otp, purpose } = req.body;
        const result = await authService.verifyOtpAndAuth(identifier, otp, purpose || 'login', req);
        return sendSuccess(res, 'OTP verified successfully', result);
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

/**
 * Refresh access token.
 * POST /api/auth/refresh
 * Body: { refreshToken }
 */
const refreshToken = async (req, res) => {
    try {
        const result = await authService.refreshToken(req.body.refreshToken, req);
        return sendSuccess(res, 'Token refreshed', result);
    } catch (err) {
        return sendError(res, err.message, 401);
    }
};

/**
 * Logout — revoke all tokens.
 * POST /api/auth/logout
 * Headers: Authorization: Bearer <token>
 */
const logout = async (req, res) => {
    try {
        const result = await authService.logout(req.user.userId, req);
        return sendSuccess(res, result.message);
    } catch (err) {
        return sendError(res, err.message, 400);
    }
};

/**
 * Get authenticated user's profile.
 * GET /api/auth/profile
 * Headers: Authorization: Bearer <token>
 */
const getProfile = async (req, res) => {
    try {
        const userRepo = require('../repositories/user.repository');
        const user = await userRepo.findById(req.user.userId);
        if (!user) return sendError(res, 'User not found', 404);
        return sendSuccess(res, 'Profile fetched', user.toJSON());
    } catch (err) {
        return sendError(res, err.message, 500);
    }
};

module.exports = { initiateSignup, verifySignup, login, sendOtp, verifyOtp, refreshToken, logout, getProfile };
