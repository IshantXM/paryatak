const { getDB } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// GET /api/bookmarks
const getBookmarks = async (req, res) => {
    try {
        const bookmarks = await getDB().bookmark.findMany({
            where: { userId: req.user.userId },
            include: {
                destination: {
                    select: { id: true, name: true, slug: true, shortDesc: true, ratingAvg: true, city: true,
                        state: { select: { name: true, slug: true } },
                        category: { select: { name: true, icon: true, color: true } },
                        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return sendSuccess(res, 'Bookmarks fetched', bookmarks);
    } catch (err) { return sendError(res, err.message, 500); }
};

// POST /api/bookmarks
const addBookmark = async (req, res) => {
    try {
        const { destinationId } = req.body;
        const dest = await getDB().destination.findUnique({ where: { id: destinationId } });
        if (!dest) return sendError(res, 'Destination not found', 404);
        const bookmark = await getDB().bookmark.upsert({
            where: { userId_destinationId: { userId: req.user.userId, destinationId } },
            create: { userId: req.user.userId, destinationId },
            update: {},
        });
        return sendSuccess(res, 'Bookmarked', bookmark, 201);
    } catch (err) { return sendError(res, err.message, 500); }
};

// DELETE /api/bookmarks/:destinationId
const removeBookmark = async (req, res) => {
    try {
        await getDB().bookmark.deleteMany({
            where: { userId: req.user.userId, destinationId: req.params.destinationId },
        });
        return sendSuccess(res, 'Bookmark removed');
    } catch (err) { return sendError(res, err.message, 500); }
};

module.exports = { getBookmarks, addBookmark, removeBookmark };
