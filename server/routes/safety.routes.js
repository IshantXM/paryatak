/**
 * Safety Routes
 * @module routes/safety
 */
const express = require('express');
const router = express.Router();
const safetyCtrl = require('../controllers/safety.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { requireFields, validateCoordinates, validatePagination } = require('../middleware/validate.middleware');

router.use(authenticate);

router.get('/anomalies', validatePagination, safetyCtrl.getAnomalies);
router.get('/anomalies/trip/:tripId', safetyCtrl.getTripAnomalies);
router.get('/nearby-police', safetyCtrl.getNearbyPolice);
router.post('/geofence-check', requireFields('latitude', 'longitude'), validateCoordinates(), safetyCtrl.checkGeofence);
router.get('/audit-logs', validatePagination, safetyCtrl.getAuditLogs);

// Admin/security
router.get('/high-threats', authorize('admin', 'security'), validatePagination, safetyCtrl.getHighThreats);

module.exports = router;
