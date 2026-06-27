/**
 * Auth Controller — Register, Login, Refresh, Logout, Me
 */
const bcrypt = require('bcrypt');
const { getDB } = require('../config/database');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const SALT_ROUNDS = 12;

// POST /api/auth/register
const register = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        const db = getDB();

        const existing = await db.user.findUnique({ where: { email } });
        if (existing) return sendError(res, 'Email already registered', 409);

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await db.user.create({
            data: { name, email, password: passwordHash, phone },
            select: { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true },
        });

        const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);
        await db.user.update({ where: { id: user.id }, data: { refreshToken } });

        return sendSuccess(res, 'Registration successful', { user, accessToken, refreshToken }, 201);
    } catch (err) {
        return sendError(res, err.message, 500);
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = getDB();

        const user = await db.user.findUnique({ where: { email } });
        if (!user) return sendError(res, 'Invalid email or password', 401);

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return sendError(res, 'Invalid email or password', 401);

        const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);
        await db.user.update({ where: { id: user.id }, data: { refreshToken } });

        const { password: _, refreshToken: __, ...safeUser } = user;
        return sendSuccess(res, 'Login successful', { user: safeUser, accessToken, refreshToken });
    } catch (err) {
        return sendError(res, err.message, 500);
    }
};

// POST /api/auth/refresh
const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return sendError(res, 'Refresh token required', 400);

        const decoded = verifyRefreshToken(refreshToken);
        const db = getDB();

        const user = await db.user.findFirst({
            where: { id: decoded.userId, refreshToken },
        });
        if (!user) return sendError(res, 'Invalid refresh token', 401);

        const tokens = generateTokens(user.id, user.email, user.role);
        await db.user.update({ where: { id: user.id }, data: { refreshToken: tokens.refreshToken } });

        return sendSuccess(res, 'Token refreshed', tokens);
    } catch (err) {
        return sendError(res, 'Invalid or expired refresh token', 401);
    }
};

// POST /api/auth/logout
const logout = async (req, res) => {
    try {
        const db = getDB();
        await db.user.update({ where: { id: req.user.userId }, data: { refreshToken: null } });
        return sendSuccess(res, 'Logged out successfully');
    } catch (err) {
        return sendError(res, err.message, 500);
    }
};

// GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const db = getDB();
        const user = await db.user.findUnique({
            where: { id: req.user.userId },
            select: { id: true, name: true, email: true, role: true, avatarUrl: true, phone: true, bio: true, createdAt: true },
        });
        if (!user) return sendError(res, 'User not found', 404);
        return sendSuccess(res, 'Profile fetched', user);
    } catch (err) {
        return sendError(res, err.message, 500);
    }
};

// PUT /api/auth/me
const updateMe = async (req, res) => {
    try {
        const { name, phone, bio } = req.body;
        const db = getDB();
        const user = await db.user.update({
            where: { id: req.user.userId },
            data: { name, phone, bio },
            select: { id: true, name: true, email: true, role: true, avatarUrl: true, phone: true, bio: true },
        });
        return sendSuccess(res, 'Profile updated', user);
    } catch (err) {
        return sendError(res, err.message, 500);
    }
};

module.exports = { register, login, refresh, logout, getMe, updateMe };
