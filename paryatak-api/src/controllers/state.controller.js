const { getDB } = require('../config/database');
const cache = require('../config/cache');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// GET /api/states
const getStates = async (req, res) => {
    try {
        const cached = await cache.get('states:all');
        if (cached) return sendSuccess(res, 'States (cached)', cached);
        const states = await getDB().state.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { destinations: true } } },
        });
        await cache.set('states:all', states, 600);
        return sendSuccess(res, 'States fetched', states);
    } catch (err) { return sendError(res, err.message, 500); }
};

// GET /api/states/:slug
const getState = async (req, res) => {
    try {
        const state = await getDB().state.findUnique({
            where: { slug: req.params.slug },
            include: {
                festivals: { orderBy: { month: 'asc' } },
                _count: { select: { destinations: true } },
            },
        });
        if (!state) return sendError(res, 'State not found', 404);
        return sendSuccess(res, 'State details', state);
    } catch (err) { return sendError(res, err.message, 500); }
};

// GET /api/states/:slug/destinations
const getStateDestinations = async (req, res) => {
    try {
        const { page = 1, limit = 12, category } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const state = await getDB().state.findUnique({ where: { slug: req.params.slug } });
        if (!state) return sendError(res, 'State not found', 404);
        const where = { stateId: state.id, isActive: true };
        if (category) where.category = { slug: category };
        const [total, destinations] = await Promise.all([
            getDB().destination.count({ where }),
            getDB().destination.findMany({
                where, skip, take: Number(limit),
                select: {
                    id: true, name: true, slug: true, shortDesc: true,
                    ratingAvg: true, ratingCount: true, bestTime: true,
                    category: { select: { name: true, slug: true, icon: true, color: true } },
                    images: { where: { isPrimary: true }, take: 1, select: { url: true } },
                },
                orderBy: { ratingAvg: 'desc' },
            }),
        ]);
        const { paginate } = require('../utils/apiResponse');
        return sendSuccess(res, `Destinations in ${state.name}`, destinations, 200, paginate(total, Number(page), Number(limit)));
    } catch (err) { return sendError(res, err.message, 500); }
};

module.exports = { getStates, getState, getStateDestinations };
