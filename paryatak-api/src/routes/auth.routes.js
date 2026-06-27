const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, registerSchema, loginSchema } = require('../middleware/validate.middleware');
const { authLimiter } = require('../middleware/rateLimiter.middleware');

router.post('/register', authLimiter, validate(registerSchema), ctrl.register);
router.post('/login', authLimiter, validate(loginSchema), ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', authenticate, ctrl.logout);
router.get('/me', authenticate, ctrl.getMe);
router.put('/me', authenticate, ctrl.updateMe);

module.exports = router;
