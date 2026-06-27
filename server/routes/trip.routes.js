/**
 * Trip Routes
 * @module routes/trip
 */
const express = require('express');
const router = express.Router();
const tripCtrl = require('../controllers/trip.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireFields, validateCoordinates, validatePagination } = require('../middleware/validate.middleware');
const { locationLimiter } = require('../middleware/rateLimiter.middleware');

router.use(authenticate);

router.post('/start', requireFields('originLat', 'originLng', 'destLat', 'destLng'), tripCtrl.startTrip);
router.post('/location', locationLimiter, requireFields('latitude', 'longitude'), validateCoordinates(), tripCtrl.updateLocation);
router.post('/end', tripCtrl.endTrip);
router.post('/cancel', tripCtrl.cancelTrip);
router.get('/active', tripCtrl.getActiveTrip);
router.get('/history', validatePagination, tripCtrl.getTripHistory);
router.get('/:tripId/breadcrumbs', tripCtrl.getTripBreadcrumbs);

module.exports = router;
