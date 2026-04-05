/**
 * Danger Zone Routes
 * @module routes/dangerZone
 */
const express = require('express');
const router = express.Router();
const dzCtrl = require('../controllers/dangerZone.controller');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth.middleware');
const { requireFields, validateCoordinates } = require('../middleware/validate.middleware');

// Public (with optional auth)
router.get('/nearby', optionalAuth, dzCtrl.getNearby);
router.get('/heatmap', optionalAuth, dzCtrl.getHeatmap);
router.get('/', optionalAuth, dzCtrl.getAll);
router.get('/:id', optionalAuth, dzCtrl.getById);

// Protected
router.post('/', authenticate, requireFields('name', 'latitude', 'longitude'), validateCoordinates(), dzCtrl.create);
router.put('/:id/report', authenticate, dzCtrl.report);

// Admin only
router.put('/:id', authenticate, authorize('admin', 'security'), dzCtrl.update);
router.delete('/:id', authenticate, authorize('admin', 'security'), dzCtrl.deactivate);

module.exports = router;
