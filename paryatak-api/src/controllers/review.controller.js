const { getDB } = require('../config/database');
const { sendSuccess, sendError, paginate } = require('../utils/apiResponse');
const cache = require('../config/cache');

const recalcRating = async (destinationId) => {
    const agg = await getDB().review.aggregate({
        where: { destinationId, status: 'APPROVED' },
        _avg: { rating: true },
        _count: { rating: true },
    });
    await getDB().destination.update({
        where: { id: destinationId },
        data: {
            ratingAvg: Math.round((agg._avg.rating || 0) * 10) / 10,
            ratingCount: agg._count.rating,
        },
    });
    await cache.del(`destination:${destinationId}`);
};

// POST /api/reviews
const createReview = async (req, res) => {
    try {
        const { destinationId, rating, title, body, visitedAt } = req.body;
        const dest = await getDB().destination.findUnique({ where: { id: destinationId } });
        if (!dest) return sendError(res, 'Destination not found', 404);
        const existing = await getDB().review.findUnique({
            where: { userId_destinationId: { userId: req.user.userId, destinationId } },
        });
        if (existing) return sendError(res, 'You already reviewed this destination', 409);
        const review = await getDB().review.create({
            data: {
                userId: req.user.userId, destinationId, rating, title, body,
                visitedAt: visitedAt ? new Date(visitedAt) : null,
                status: 'PENDING',
            },
            include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        });
        return sendSuccess(res, 'Review submitted. Pending moderation.', review, 201);
    } catch (err) { return sendError(res, err.message, 500); }
};

// PUT /api/reviews/:id
const updateReview = async (req, res) => {
    try {
        const { rating, title, body } = req.body;
        const review = await getDB().review.findFirst({
            where: { id: req.params.id, userId: req.user.userId },
        });
        if (!review) return sendError(res, 'Review not found', 404);
        const updated = await getDB().review.update({
            where: { id: req.params.id },
            data: { rating, title, body, status: 'PENDING' },
        });
        return sendSuccess(res, 'Review updated', updated);
    } catch (err) { return sendError(res, err.message, 500); }
};

// DELETE /api/reviews/:id
const deleteReview = async (req, res) => {
    try {
        const review = await getDB().review.findFirst({
            where: {
                id: req.params.id,
                OR: [{ userId: req.user.userId }, { ...(req.user.role === 'ADMIN' ? {} : { userId: req.user.userId }) }],
            },
        });
        if (!review && req.user.role !== 'ADMIN') return sendError(res, 'Review not found', 404);
        const target = await getDB().review.findUnique({ where: { id: req.params.id } });
        if (!target) return sendError(res, 'Review not found', 404);
        if (target.userId !== req.user.userId && req.user.role !== 'ADMIN') {
            return sendError(res, 'Forbidden', 403);
        }
        await getDB().review.delete({ where: { id: req.params.id } });
        await recalcRating(target.destinationId);
        return sendSuccess(res, 'Review deleted');
    } catch (err) { return sendError(res, err.message, 500); }
};

// POST /api/admin/reviews/:id/approve
const approveReview = async (req, res) => {
    try {
        const review = await getDB().review.update({
            where: { id: req.params.id },
            data: { status: 'APPROVED' },
        });
        await recalcRating(review.destinationId);
        return sendSuccess(res, 'Review approved', review);
    } catch (err) { return sendError(res, err.message, 500); }
};

// POST /api/admin/reviews/:id/reject
const rejectReview = async (req, res) => {
    try {
        const review = await getDB().review.update({
            where: { id: req.params.id },
            data: { status: 'REJECTED' },
        });
        return sendSuccess(res, 'Review rejected', review);
    } catch (err) { return sendError(res, err.message, 500); }
};

// GET /api/admin/reviews?status=PENDING
const getReviewsAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 20, status = 'PENDING' } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = status ? { status } : {};
        const [total, reviews] = await Promise.all([
            getDB().review.count({ where }),
            getDB().review.findMany({
                where, skip, take: Number(limit),
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    destination: { select: { id: true, name: true, slug: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        return sendSuccess(res, 'Reviews', reviews, 200, paginate(total, Number(page), Number(limit)));
    } catch (err) { return sendError(res, err.message, 500); }
};

module.exports = { createReview, updateReview, deleteReview, approveReview, rejectReview, getReviewsAdmin };
