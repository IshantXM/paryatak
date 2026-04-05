/**
 * Auth Service
 * 
 * Handles user registration with OTP email verification,
 * login, JWT token management, and passwordless auth.
 * 
 * Signup Flow:
 *   1. POST /signup/initiate  → validate data, send OTP to email
 *   2. POST /signup/verify    → verify OTP, create user, return tokens
 * 
 * Login Flow:
 *   - POST /send-otp   →  send OTP to registered email/phone
 *   - POST /verify-otp →  verify OTP, return tokens
 * 
 * @module services/auth
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { jwt: jwtConfig } = require('../config/environment');
const userRepo = require('../repositories/user.repository');
const otpService = require('./otp.service');
const auditLogRepo = require('../repositories/auditLog.repository');
const { AUDIT_ACTIONS } = require('../utils/constants');

// ─── In-memory pending signups (TTL 10 min) ─────────────────────────────────
// Stores signup data temporarily until OTP is verified.
// In production, use Redis or a DB collection with TTL.
const pendingSignups = new Map();

const PENDING_SIGNUP_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Clean up expired pending signups periodically.
 */
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of pendingSignups) {
        if (now - entry.createdAt > PENDING_SIGNUP_TTL) {
            pendingSignups.delete(key);
        }
    }
}, 60 * 1000); // every minute

// ─── Token Generators ────────────────────────────────────────────────────────

const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user._id, phone: user.phone_number, role: user.role, tokenVersion: user.tokenVersion },
        jwtConfig.secret,
        { expiresIn: jwtConfig.accessExpiry }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { userId: user._id, tokenVersion: user.tokenVersion },
        jwtConfig.refreshSecret,
        { expiresIn: jwtConfig.refreshExpiry }
    );
};

const generateTokens = (user) => ({
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
});

// ─── Signup Step 1: Initiate ────────────────────────────────────────────────

/**
 * Initiate signup — validate data and send OTP to the user's email.
 * Does NOT create the user yet.
 * 
 * @param {object} userData - { name, phone_number, email, password(optional), address }
 * @param {object} req - Express request (for audit)
 * @returns {{ message, email, expiresAt }}
 */
const initiateSignup = async (userData, req = null) => {
    const { name, phone_number, email, password, address } = userData;

    if (!email) throw new Error('Email is required for OTP verification');
    if (!name) throw new Error('Name is required');
    if (!phone_number) throw new Error('Phone number is required');

    // Check if phone already exists
    const existingPhone = await userRepo.findByPhone(phone_number);
    if (existingPhone) throw new Error('Phone number already registered');

    // Check if email already exists
    const existingEmail = await userRepo.findByEmail(email);
    if (existingEmail) throw new Error('Email already registered');

    // Store signup data temporarily (keyed by email)
    pendingSignups.set(email.toLowerCase(), {
        name,
        phone_number,
        email: email.toLowerCase(),
        password: password || null,
        address: address || {},
        createdAt: Date.now(),
    });

    // Send OTP to the email
    const otpResult = await otpService.createAndSendOtp(email.toLowerCase(), 'register', null);

    // Audit
    await auditLogRepo.create({
        action: AUDIT_ACTIONS.OTP_SENT,
        description: `Signup OTP sent to ${email} for phone ${phone_number}`,
        ipAddress: req?.ip || '',
        userAgent: req?.get?.('user-agent') || '',
        result: 'success',
        severity: 'low',
    });

    return {
        message: 'OTP sent to your email. Please verify to complete registration.',
        email: email.toLowerCase(),
        expiresAt: otpResult.expiresAt,
    };
};

// ─── Signup Step 2: Verify OTP & Create User ────────────────────────────────

/**
 * Complete signup — verify OTP, create the user, return tokens.
 * 
 * @param {string} email
 * @param {string} otp
 * @param {object} req
 * @returns {{ user, accessToken, refreshToken }}
 */
const completeSignup = async (email, otp, req = null) => {
    const normalizedEmail = email.toLowerCase();

    // Check pending signup exists
    const pending = pendingSignups.get(normalizedEmail);
    if (!pending) {
        throw new Error('No pending signup found for this email. Please initiate signup first.');
    }

    // Check TTL
    if (Date.now() - pending.createdAt > PENDING_SIGNUP_TTL) {
        pendingSignups.delete(normalizedEmail);
        throw new Error('Signup session expired. Please initiate signup again.');
    }

    // Verify OTP
    const verification = await otpService.verifyOtp(normalizedEmail, 'register', otp);
    if (!verification.success) {
        await auditLogRepo.create({
            action: AUDIT_ACTIONS.OTP_FAILED,
            description: `Signup OTP verification failed for ${normalizedEmail}: ${verification.message}`,
            ipAddress: req?.ip || '',
            userAgent: req?.get?.('user-agent') || '',
            result: 'failure',
            severity: 'medium',
        });
        throw new Error(verification.message);
    }

    // Re-check uniqueness (race condition protection)
    const existingPhone = await userRepo.findByPhone(pending.phone_number);
    if (existingPhone) {
        pendingSignups.delete(normalizedEmail);
        throw new Error('Phone number was registered by another user while you were verifying.');
    }
    const existingEmail = await userRepo.findByEmail(normalizedEmail);
    if (existingEmail) {
        pendingSignups.delete(normalizedEmail);
        throw new Error('Email was registered by another user while you were verifying.');
    }

    // Create user (verified)
    const user = await userRepo.create({
        name: pending.name,
        phone_number: pending.phone_number,
        email: normalizedEmail,
        password: pending.password,
        address: pending.address,
        isVerified: true,
    });

    // Clear pending signup
    pendingSignups.delete(normalizedEmail);

    // Generate tokens
    const tokens = generateTokens(user);

    // Audit
    await auditLogRepo.create({
        userId: user._id,
        action: AUDIT_ACTIONS.SIGNUP,
        description: `User registered with OTP-verified email: ${normalizedEmail}`,
        ipAddress: req?.ip || '',
        userAgent: req?.get?.('user-agent') || '',
        result: 'success',
        severity: 'low',
    });

    return { user: user.toJSON(), ...tokens };
};

// ─── Login (password-based) ─────────────────────────────────────────────────

const login = async (phone_number, password, req = null) => {
    const user = await userRepo.findByPhone(phone_number);
    if (!user) {
        await auditLogRepo.create({
            action: AUDIT_ACTIONS.LOGIN_FAILED,
            description: `Login attempt for non-existent phone: ${phone_number}`,
            ipAddress: req?.ip || '',
            userAgent: req?.get?.('user-agent') || '',
            result: 'failure',
            severity: 'medium',
        });
        throw new Error('Invalid credentials');
    }

    const User = require('../models/user.model');
    const userWithPassword = await User.findById(user._id).select('+password').exec();

    if (!userWithPassword.password) {
        throw new Error('This account uses OTP login. Please use Send OTP instead.');
    }

    const isMatch = await bcrypt.compare(password, userWithPassword.password);
    if (!isMatch) {
        await auditLogRepo.create({
            userId: user._id,
            action: AUDIT_ACTIONS.LOGIN_FAILED,
            description: 'Invalid password attempt',
            ipAddress: req?.ip || '',
            userAgent: req?.get?.('user-agent') || '',
            result: 'failure',
            severity: 'medium',
        });
        throw new Error('Invalid credentials');
    }

    const tokens = generateTokens(user);

    await auditLogRepo.create({
        userId: user._id,
        action: AUDIT_ACTIONS.LOGIN_SUCCESS,
        description: 'Password login successful',
        ipAddress: req?.ip || '',
        userAgent: req?.get?.('user-agent') || '',
        result: 'success',
        severity: 'low',
    });

    return { user: user.toJSON(), ...tokens };
};

// ─── OTP Login (passwordless) ───────────────────────────────────────────────

const sendOtp = async (identifier, purpose = 'login', req = null) => {
    const user = await userRepo.findByIdentifier(identifier);

    // For login purpose, user must already exist
    if (purpose === 'login' && !user) {
        throw new Error('No account found with this email/phone. Please sign up first.');
    }

    const result = await otpService.createAndSendOtp(
        identifier,
        purpose,
        user ? user._id : null
    );

    await auditLogRepo.create({
        userId: user ? user._id : null,
        action: AUDIT_ACTIONS.OTP_SENT,
        description: `OTP sent to ${identifier} for ${purpose}`,
        ipAddress: req?.ip || '',
        userAgent: req?.get?.('user-agent') || '',
        result: 'success',
        severity: 'low',
    });

    return result;
};

const verifyOtpAndAuth = async (identifier, otp, purpose = 'login', req = null) => {
    const verification = await otpService.verifyOtp(identifier, purpose, otp);

    if (!verification.success) {
        await auditLogRepo.create({
            action: AUDIT_ACTIONS.OTP_FAILED,
            description: `OTP verification failed for ${identifier}: ${verification.message}`,
            ipAddress: req?.ip || '',
            userAgent: req?.get?.('user-agent') || '',
            result: 'failure',
            severity: 'medium',
        });
        throw new Error(verification.message);
    }

    const user = await userRepo.findByIdentifier(identifier);
    if (!user) {
        throw new Error('User not found. Please register first.');
    }

    if (!user.isVerified) {
        await userRepo.updateById(user._id, { isVerified: true });
    }

    const tokens = generateTokens(user);

    await auditLogRepo.create({
        userId: user._id,
        action: AUDIT_ACTIONS.OTP_VERIFIED,
        description: `OTP verified for ${identifier} (${purpose})`,
        ipAddress: req?.ip || '',
        userAgent: req?.get?.('user-agent') || '',
        result: 'success',
        severity: 'low',
    });

    return { user: user.toJSON(), ...tokens };
};

// ─── Token Refresh ──────────────────────────────────────────────────────────

const refreshToken = async (token, req = null) => {
    let decoded;
    try {
        decoded = jwt.verify(token, jwtConfig.refreshSecret);
    } catch (_) {
        throw new Error('Invalid or expired refresh token');
    }

    const user = await userRepo.findById(decoded.userId);
    if (!user) throw new Error('User not found');

    if (decoded.tokenVersion !== user.tokenVersion) {
        throw new Error('Token has been revoked');
    }

    const newAccessToken = generateAccessToken(user);

    await auditLogRepo.create({
        userId: user._id,
        action: AUDIT_ACTIONS.TOKEN_REFRESHED,
        description: 'Access token refreshed',
        ipAddress: req?.ip || '',
        userAgent: req?.get?.('user-agent') || '',
        result: 'success',
        severity: 'low',
    });

    return { accessToken: newAccessToken };
};

// ─── Logout ─────────────────────────────────────────────────────────────────

const logout = async (userId, req = null) => {
    await userRepo.incrementTokenVersion(userId);

    await auditLogRepo.create({
        userId,
        action: AUDIT_ACTIONS.LOGOUT,
        description: 'User logged out, all tokens invalidated',
        ipAddress: req?.ip || '',
        userAgent: req?.get?.('user-agent') || '',
        result: 'success',
        severity: 'low',
    });

    return { message: 'Logged out successfully' };
};

module.exports = {
    initiateSignup,
    completeSignup,
    login,
    sendOtp,
    verifyOtpAndAuth,
    refreshToken,
    logout,
    generateTokens,
};
