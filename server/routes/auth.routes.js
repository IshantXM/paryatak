/**
 * Auth Routes
 * 
 * Two-step OTP-verified signup + login routes.
 * 
 * @module routes/auth
 */
const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireFields, validatePhone, validateEmail } = require('../middleware/validate.middleware');

// ─── Signup (2-step OTP verified) ────────────────────────────────────────────

// Step 1: Send signup data + OTP to email
router.post('/signup/initiate',
    requireFields('name', 'phone_number', 'email'),
    validatePhone(),
    validateEmail(),
    authCtrl.initiateSignup
);

// Step 2: Verify OTP → create user → return tokens
router.post('/signup/verify',
    requireFields('email', 'otp'),
    authCtrl.verifySignup
);

// ─── Login ───────────────────────────────────────────────────────────────────

// Password login
router.post('/login',
    requireFields('phone_number', 'password'),
    authCtrl.login
);

// OTP login step 1: send OTP
router.post('/send-otp',
    requireFields('identifier'),
    authCtrl.sendOtp
);

// OTP login step 2: verify OTP → return tokens
router.post('/verify-otp',
    requireFields('identifier', 'otp'),
    authCtrl.verifyOtp
);

// ─── Token ───────────────────────────────────────────────────────────────────

router.post('/refresh',
    requireFields('refreshToken'),
    authCtrl.refreshToken
);

// ─── Protected ───────────────────────────────────────────────────────────────

router.post('/logout', authenticate, authCtrl.logout);
router.get('/profile', authenticate, authCtrl.getProfile);

module.exports = router;
