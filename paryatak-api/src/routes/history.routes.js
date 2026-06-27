const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/history.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/', ctrl.getHistory);
router.post('/', ctrl.addHistory);

module.exports = router;
