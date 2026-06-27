const express = require('express');
const router = express.Router();

// States
const stateCtrl = require('../controllers/state.controller');
router.get('/', stateCtrl.getStates);
router.get('/:slug', stateCtrl.getState);
router.get('/:slug/destinations', stateCtrl.getStateDestinations);

module.exports = router;
