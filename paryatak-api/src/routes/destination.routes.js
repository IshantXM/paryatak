const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/destination.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

router.get('/', optionalAuth, ctrl.getDestinations);
router.get('/featured', ctrl.getFeatured);
router.get('/nearby', optionalAuth, ctrl.getNearby);
router.get('/:slug', optionalAuth, ctrl.getDestinationBySlug);
router.get('/:id/reviews', ctrl.getDestinationReviews);

module.exports = router;
