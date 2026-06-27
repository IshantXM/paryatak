const { getDB } = require('../config/database');
const { sendSuccess, sendError, paginate } = require('../utils/apiResponse');

// GET /api/history
const getHistory = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const [total, history] = await Promise.all([
            getDB().travelHistory.count({ where: { userId: req.user.userId } }),
            getDB().travelHistory.findMany({
                where: { userId: req.user.userId },
                skip, take: Number(limit),
                include: {
                    destination: {
                        select: { id: true, name: true, slug: true,
                            state: { select: { name: true } },
                            category: { select: { name: true, icon: true } },
                            images: { where: { isPrimary: true }, take: 1, select: { url: true } },
                        },
                    },
                },
                orderBy: { visitedAt: 'desc' },
            }),
        ]);
        return sendSuccess(res, 'Travel history', history, 200, paginate(total, Number(page), Number(limit)));
    } catch (err) { return sendError(res, err.message, 500); }
};

// POST /api/history
const addHistory = async (req, res) => {
    try {
        const { destinationId, notes, rating, visitedAt } = req.body;
        const dest = await getDB().destination.findUnique({ where: { id: destinationId } });
        if (!dest) return sendError(res, 'Destination not found', 404);
        const entry = await getDB().travelHistory.create({
            data: {
                userId: req.user.userId, destinationId, notes, rating,
                visitedAt: visitedAt ? new Date(visitedAt) : new Date(),
            },
        });
        return sendSuccess(res, 'Added to travel history', entry, 201);
    } catch (err) { return sendError(res, err.message, 500); }
};

module.exports = { getHistory, addHistory };
