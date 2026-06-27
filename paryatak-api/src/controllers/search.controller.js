const { getDB } = require('../config/database');
const { sendSuccess, sendError, paginate } = require('../utils/apiResponse');

// GET /api/search?q=&state=&category=&page=&limit=
const search = async (req, res) => {
    try {
        const { q = '', state, category, page = 1, limit = 12, minRating } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        if (!q && !state && !category) {
            return sendError(res, 'Provide at least a search query, state, or category', 400);
        }

        const where = { isActive: true };
        if (state) where.state = { slug: state };
        if (category) where.category = { slug: category };
        if (minRating) where.ratingAvg = { gte: Number(minRating) };
        if (q) {
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { shortDesc: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { city: { contains: q, mode: 'insensitive' } },
                { state: { name: { contains: q, mode: 'insensitive' } } },
                { category: { name: { contains: q, mode: 'insensitive' } } },
            ];
        }

        const [total, results] = await Promise.all([
            getDB().destination.count({ where }),
            getDB().destination.findMany({
                where, skip, take: Number(limit),
                select: {
                    id: true, name: true, slug: true, shortDesc: true, city: true,
                    ratingAvg: true, ratingCount: true, bestTime: true,
                    state: { select: { name: true, slug: true } },
                    category: { select: { name: true, slug: true, icon: true, color: true } },
                    images: { where: { isPrimary: true }, take: 1, select: { url: true } },
                },
                orderBy: { ratingAvg: 'desc' },
            }),
        ]);

        return sendSuccess(res, `Search results for "${q}"`, results, 200, {
            ...paginate(total, Number(page), Number(limit)),
            query: q,
        });
    } catch (err) { return sendError(res, err.message, 500); }
};

module.exports = { search };
