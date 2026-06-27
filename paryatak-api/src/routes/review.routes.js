const express = require('express');
const router = express.Router();
const reviewCtrl = require('../controllers/review.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate, reviewSchema } = require('../middleware/validate.middleware');

router.post('/', authenticate, validate(reviewSchema), reviewCtrl.createReview);
router.put('/:id', authenticate, reviewCtrl.updateReview);
router.delete('/:id', authenticate, reviewCtrl.deleteReview);

module.exports = router;
