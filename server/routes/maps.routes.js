/**
 * Maps Routes
 *
 * Nearby safety places search via SerpAPI / MongoDB fallback.
 *
 * @module routes/maps
 */
const express = require('express');
const router = express.Router();
const mapsCtrl = require('../controllers/maps.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All maps endpoints require authentication
router.use(authenticate);

/**
 * GET /api/maps/nearby
 * Query: lat, lng, query (e.g. "police station"), radius (meters, default 5000)
 */
router.get('/nearby', mapsCtrl.getNearbyPlaces);

module.exports = router;
