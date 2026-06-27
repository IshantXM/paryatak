/**
 * Destination Controller — Browse, Detail, Nearby, Featured
 */
const { getDB } = require('../config/database');
const cache = require('../config/cache');
const { sendSuccess, sendError, paginate } = require('../utils/apiResponse');

// Haversine distance in km
const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const DEST_SELECT = {
    id: true, name: true, slug: true, shortDesc: true,
    city: true, latitude: true, longitude: true,
    entryFee: true, bestTime: true, timings: true, duration: true,
    ratingAvg: true, ratingCount: true, isFeatured: true,
    state: { select: { id: true, name: true, slug: true } },
    category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
    images: { where: { isPrimary: true }, take: 1, select: { url: true, caption: true } },
};

// GET /api/destinations
const getDestinations = async (req, res) => {
    try {
        const { page = 1, limit = 12, state, category, search, featured, minRating } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const cacheKey = `destinations:${JSON.stringify(req.query)}`;
        const cached = await cache.get(cacheKey);
        if (cached) return sendSuccess(res, 'Destinations (cached)', cached.data, 200, cached.meta);

        const where = { isActive: true };
        if (state) where.state = { slug: state };
        if (category) where.category = { slug: category };
        if (featured !== undefined) where.isFeatured = featured === 'true' || featured === true;
        if (minRating) where.ratingAvg = { gte: Number(minRating) };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { shortDesc: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [total, destinations] = await Promise.all([
            getDB().destination.count({ where }),
            getDB().destination.findMany({
                where, skip, take: Number(limit),
                select: DEST_SELECT,
                orderBy: [{ isFeatured: 'desc' }, { ratingAvg: 'desc' }],
            }),
        ]);

        const meta = paginate(total, Number(page), Number(limit));
        await cache.set(cacheKey, { data: destinations, meta }, 120);
        return sendSuccess(res, 'Destinations fetched', destinations, 200, meta);
    } catch (err) {
        return sendError(res, err.message, 500);
    }
};

// GET /api/destinations/featured
const getFeatured = async (req, res) => {
    try {
        const cached = await cache.get('destinations:featured');
        if (cached) return sendSuccess(res, 'Featured destinations (cached)', cached);

        const destinations = await getDB().destination.findMany({
            where: { isFeatured: true, isActive: true },
            take: 8,
            select: DEST_SELECT,
            orderBy: { ratingAvg: 'desc' },
        });

        await cache.set('destinations:featured', destinations, 300);
        return sendSuccess(res, 'Featured destinations', destinations);
    } catch (err) {
        return sendError(res, err.message, 500);
    }
};

// GET /api/destinations/:slug
const getDestinationBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const cacheKey = `destination:${slug}`;
        const cached = await cache.get(cacheKey);
        if (cached) return sendSuccess(res, 'Destination (cached)', cached);

        const dest = await getDB().destination.findUnique({
            where: { slug },
            include: {
                state: true,
                category: true,
                images: { orderBy: { isPrimary: 'desc' } },
                _count: { select: { reviews: { where: { status: 'APPROVED' } } } },
            },
        });

        if (!dest || !dest.isActive) return sendError(res, 'Destination not found', 404);

        await cache.set(cacheKey, dest, 300);
        return sendSuccess(res, 'Destination details', dest);
    } catch (err) {
        return sendError(res, err.message, 500);
    }
};

// GET /api/destinations/nearby?lat=&lng=&radius=
const getNearby = async (req, res) => {
    try {
        const { lat, lng, radius = 50 } = req.query;
        if (!lat || !lng) return sendError(res, 'lat and lng are required', 400);

        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        const radiusKm = parseFloat(radius);

        const all = await getDB().destination.findMany({
            where: { isActive: true },
            select: { ...DEST_SELECT, latitude: true, longitude: true },
        });

        const nearby = all
            .map(d => ({ ...d, distanceKm: haversine(latNum, lngNum, d.latitude, d.longitude) }))
            .filter(d => d.distanceKm <= radiusKm)
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, 20);

        return sendSuccess(res, 'Nearby destinations', nearby);
    } catch (err) {
        return sendError(res, err.message, 500);
    }
};

// GET /api/destinations/:id/reviews
const getDestinationReviews = async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [total, reviews] = await Promise.all([
            getDB().review.count({ where: { destinationId: id, status: 'APPROVED' } }),
            getDB().review.findMany({
                where: { destinationId: id, status: 'APPROVED' },
                skip, take: Number(limit),
                include: {
                    user: { select: { id: true, name: true, avatarUrl: true } },
                    images: { select: { url: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        return sendSuccess(res, 'Reviews fetched', reviews, 200, paginate(total, Number(page), Number(limit)));
    } catch (err) {
        return sendError(res, err.message, 500);
    }
};

module.exports = { getDestinations, getFeatured, getDestinationBySlug, getNearby, getDestinationReviews };
