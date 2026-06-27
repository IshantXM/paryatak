const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/bookmark.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/', ctrl.getBookmarks);
router.post('/', ctrl.addBookmark);
router.delete('/:destinationId', ctrl.removeBookmark);

module.exports = router;
