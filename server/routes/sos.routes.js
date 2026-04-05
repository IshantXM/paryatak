/**
 * SOS Routes
 * @module routes/sos
 */
const express = require('express');
const router = express.Router();
const sosCtrl = require('../controllers/sos.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireFields, validateCoordinates, validatePagination } = require('../middleware/validate.middleware');

router.use(authenticate);

router.post('/trigger', requireFields('latitude', 'longitude'), validateCoordinates(), sosCtrl.triggerSos);
router.post('/:id/cancel', sosCtrl.cancelSos);
router.post('/:id/resolve', sosCtrl.resolveSos);
router.get('/active', sosCtrl.getActiveSos);
router.get('/history', validatePagination, sosCtrl.getSosHistory);

module.exports = router;
