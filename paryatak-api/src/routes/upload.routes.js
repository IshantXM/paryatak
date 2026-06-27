const express = require('express');
const multer = require('multer');
const router = express.Router();
const ctrl = require('../controllers/upload.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadLimiter } = require('../middleware/rateLimiter.middleware');

// Memory storage — we send buffer directly to Cloudinary
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

router.post('/image', authenticate, uploadLimiter, upload.single('image'), ctrl.uploadImage);
router.delete('/image', authenticate, authorize('ADMIN', 'MODERATOR'), ctrl.deleteImage);

module.exports = router;
