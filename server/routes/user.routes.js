/**
 * User Routes
 * @module routes/user
 */
const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireFields, validateCoordinates } = require('../middleware/validate.middleware');

router.use(authenticate);

router.put('/profile', userCtrl.updateProfile);
router.post('/emergency-contacts', requireFields('name', 'phone'), userCtrl.addEmergencyContact);
router.delete('/emergency-contacts/:contactId', userCtrl.removeEmergencyContact);
router.get('/emergency-contacts', userCtrl.getEmergencyContacts);
router.post('/location', requireFields('latitude', 'longitude'), validateCoordinates(), userCtrl.updateLocation);

module.exports = router;
