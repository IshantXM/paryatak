const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/trip.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, tripSchema } = require('../middleware/validate.middleware');

router.use(authenticate);

router.post('/', validate(tripSchema), ctrl.createTrip);
router.get('/', ctrl.getTrips);
router.get('/:id', ctrl.getTrip);
router.put('/:id', validate(tripSchema), ctrl.updateTrip);
router.delete('/:id', ctrl.deleteTrip);
router.post('/:id/destinations', ctrl.addDestinationToTrip);
router.delete('/:id/destinations/:destId', ctrl.removeDestinationFromTrip);
router.put('/:id/itinerary', ctrl.updateItinerary);

module.exports = router;
