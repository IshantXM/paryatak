const { getDB } = require('../config/database');
const cache = require('../config/cache');
const { sendSuccess, sendError, paginate } = require('../utils/apiResponse');

// GET /api/categories
const getCategories = async (req, res) => {
    try {
        const cached = await cache.get('categories:all');
        if (cached) return sendSuccess(res, 'Categories (cached)', cached);
        const categories = await getDB().category.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { destinations: true } } },
        });
        await cache.set('categories:all', categories, 600);
        return sendSuccess(res, 'Categories fetched', categories);
    } catch (err) { return sendError(res, err.message, 500); }
};

// GET /api/categories/:slug/destinations
const getCategoryDestinations = async (req, res) => {
    try {
        const { page = 1, limit = 12, state } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const category = await getDB().category.findUnique({ where: { slug: req.params.slug } });
        if (!category) return sendError(res, 'Category not found', 404);
        const where = { categoryId: category.id, isActive: true };
        if (state) where.state = { slug: state };
        const [total, destinations] = await Promise.all([
            getDB().destination.count({ where }),
            getDB().destination.findMany({
                where, skip, take: Number(limit),
                select: {
                    id: true, name: true, slug: true, shortDesc: true,
                    ratingAvg: true, ratingCount: true, bestTime: true, city: true,
                    state: { select: { name: true, slug: true } },
                    images: { where: { isPrimary: true }, take: 1, select: { url: true } },
                },
                orderBy: { ratingAvg: 'desc' },
            }),
        ]);
        return sendSuccess(res, `${category.name} destinations`, destinations, 200, paginate(total, Number(page), Number(limit)));
    } catch (err) { return sendError(res, err.message, 500); }
};

module.exports = { getCategories, getCategoryDestinations };
