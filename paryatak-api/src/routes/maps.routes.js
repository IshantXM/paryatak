const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/maps.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

router.get('/destinations', ctrl.getDestinationsGeoJSON);
router.get('/nearby-services', optionalAuth, ctrl.getNearbyServices);

module.exports = router;
