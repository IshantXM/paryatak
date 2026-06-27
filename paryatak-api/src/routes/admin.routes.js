const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { sendSuccess, sendError, paginate } = require('../utils/apiResponse');
const { getDB } = require('../config/database');
const reviewCtrl = require('../controllers/review.controller');
const cache = require('../config/cache');

// All admin routes require ADMIN or MODERATOR
router.use(authenticate, authorize('ADMIN', 'MODERATOR'));

// ─── Reviews ─────────────────────────────────────────────────────────────────
router.get('/reviews', reviewCtrl.getReviewsAdmin);
router.post('/reviews/:id/approve', reviewCtrl.approveReview);
router.post('/reviews/:id/reject', reviewCtrl.rejectReview);

// ─── Destinations CRUD ───────────────────────────────────────────────────────
router.get('/destinations', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const [total, destinations] = await Promise.all([
            getDB().destination.count(),
            getDB().destination.findMany({
                skip, take: Number(limit),
                include: {
                    state: { select: { name: true } },
                    category: { select: { name: true } },
                    _count: { select: { reviews: true, bookmarks: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        return sendSuccess(res, 'All destinations', destinations, 200, paginate(total, Number(page), Number(limit)));
    } catch (err) { return sendError(res, err.message, 500); }
});

router.post('/destinations', async (req, res) => {
    try {
        const { name, slug, description, shortDesc, stateId, categoryId, latitude, longitude, address, city, entryFee, timings, bestTime, duration, isFeatured } = req.body;
        const dest = await getDB().destination.create({
            data: { name, slug, description, shortDesc, stateId, categoryId, latitude: parseFloat(latitude), longitude: parseFloat(longitude), address, city, entryFee, timings, bestTime, duration, isFeatured: !!isFeatured },
        });
        await cache.delPattern('destinations:');
        return sendSuccess(res, 'Destination created', dest, 201);
    } catch (err) { return sendError(res, err.message, 500); }
});

router.put('/destinations/:id', async (req, res) => {
    try {
        const { name, slug, description, shortDesc, latitude, longitude, address, city, entryFee, timings, bestTime, duration, isFeatured, isActive, stateId, categoryId } = req.body;
        const dest = await getDB().destination.update({
            where: { id: req.params.id },
            data: { name, slug, description, shortDesc, stateId, categoryId, latitude: latitude ? parseFloat(latitude) : undefined, longitude: longitude ? parseFloat(longitude) : undefined, address, city, entryFee, timings, bestTime, duration, isFeatured, isActive },
        });
        await cache.delPattern('destinations:');
        await cache.del(`destination:${dest.slug}`);
        return sendSuccess(res, 'Destination updated', dest);
    } catch (err) { return sendError(res, err.message, 500); }
});

router.delete('/destinations/:id', async (req, res) => {
    try {
        await getDB().destination.delete({ where: { id: req.params.id } });
        await cache.delPattern('destinations:');
        return sendSuccess(res, 'Destination deleted');
    } catch (err) { return sendError(res, err.message, 500); }
});

// ─── Users ────────────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const [total, users] = await Promise.all([
            getDB().user.count(),
            getDB().user.findMany({
                skip, take: Number(limit),
                select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { trips: true, reviews: true, bookmarks: true } } },
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        return sendSuccess(res, 'Users', users, 200, paginate(total, Number(page), Number(limit)));
    } catch (err) { return sendError(res, err.message, 500); }
});

// ─── Seed ─────────────────────────────────────────────────────────────────────
router.post('/seed', async (req, res) => {
    try {
        const { seedDatabase } = require('../db/seed');
        const result = await seedDatabase();
        return sendSuccess(res, 'Database seeded', result);
    } catch (err) { return sendError(res, err.message, 500); }
});

// ─── Stats ────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
    try {
        const [users, destinations, trips, reviews, pendingReviews] = await Promise.all([
            getDB().user.count(),
            getDB().destination.count(),
            getDB().trip.count(),
            getDB().review.count({ where: { status: 'APPROVED' } }),
            getDB().review.count({ where: { status: 'PENDING' } }),
        ]);
        return sendSuccess(res, 'Stats', { users, destinations, trips, reviews, pendingReviews });
    } catch (err) { return sendError(res, err.message, 500); }
});

module.exports = router;
