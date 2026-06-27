const { getDB } = require('../config/database');
const { sendSuccess, sendError, paginate } = require('../utils/apiResponse');

// POST /api/trips
const createTrip = async (req, res) => {
    try {
        const { title, description, startDate, endDate, budgetEstimated, status } = req.body;
        const trip = await getDB().trip.create({
            data: {
                userId: req.user.userId, title, description,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                budgetEstimated: budgetEstimated || 0,
                status: status || 'PLANNING',
            },
            include: { destinations: { include: { destination: { select: { id: true, name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } } } } } },
        });
        return sendSuccess(res, 'Trip created', trip, 201);
    } catch (err) { return sendError(res, err.message, 500); }
};

// GET /api/trips
const getTrips = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { userId: req.user.userId };
        if (status) where.status = status;
        const [total, trips] = await Promise.all([
            getDB().trip.count({ where }),
            getDB().trip.findMany({
                where, skip, take: Number(limit),
                include: {
                    destinations: {
                        include: { destination: { select: { id: true, name: true, slug: true, images: { where: { isPrimary: true }, take: 1, select: { url: true } } } } },
                        orderBy: [{ dayNumber: 'asc' }, { orderInDay: 'asc' }],
                    },
                    _count: { select: { destinations: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        return sendSuccess(res, 'Trips fetched', trips, 200, paginate(total, Number(page), Number(limit)));
    } catch (err) { return sendError(res, err.message, 500); }
};

// GET /api/trips/:id
const getTrip = async (req, res) => {
    try {
        const trip = await getDB().trip.findFirst({
            where: { id: req.params.id, userId: req.user.userId },
            include: {
                destinations: {
                    include: {
                        destination: {
                            select: { id: true, name: true, slug: true, city: true, latitude: true, longitude: true, entryFee: true, timings: true, images: { where: { isPrimary: true }, take: 1 } },
                        },
                    },
                    orderBy: [{ dayNumber: 'asc' }, { orderInDay: 'asc' }],
                },
            },
        });
        if (!trip) return sendError(res, 'Trip not found', 404);
        return sendSuccess(res, 'Trip details', trip);
    } catch (err) { return sendError(res, err.message, 500); }
};

// PUT /api/trips/:id
const updateTrip = async (req, res) => {
    try {
        const { title, description, startDate, endDate, budgetEstimated, budgetSpent, status } = req.body;
        const existing = await getDB().trip.findFirst({ where: { id: req.params.id, userId: req.user.userId } });
        if (!existing) return sendError(res, 'Trip not found', 404);
        const trip = await getDB().trip.update({
            where: { id: req.params.id },
            data: {
                title, description, status, budgetEstimated, budgetSpent,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
            },
        });
        return sendSuccess(res, 'Trip updated', trip);
    } catch (err) { return sendError(res, err.message, 500); }
};

// DELETE /api/trips/:id
const deleteTrip = async (req, res) => {
    try {
        const existing = await getDB().trip.findFirst({ where: { id: req.params.id, userId: req.user.userId } });
        if (!existing) return sendError(res, 'Trip not found', 404);
        await getDB().trip.delete({ where: { id: req.params.id } });
        return sendSuccess(res, 'Trip deleted');
    } catch (err) { return sendError(res, err.message, 500); }
};

// POST /api/trips/:id/destinations
const addDestinationToTrip = async (req, res) => {
    try {
        const { destinationId, dayNumber = 1, orderInDay = 0, notes, durationHours, estimatedCost } = req.body;
        const trip = await getDB().trip.findFirst({ where: { id: req.params.id, userId: req.user.userId } });
        if (!trip) return sendError(res, 'Trip not found', 404);
        const td = await getDB().tripDestination.upsert({
            where: { tripId_destinationId: { tripId: req.params.id, destinationId } },
            create: { tripId: req.params.id, destinationId, dayNumber, orderInDay, notes, durationHours, estimatedCost },
            update: { dayNumber, orderInDay, notes, durationHours, estimatedCost },
            include: { destination: { select: { id: true, name: true, slug: true } } },
        });
        return sendSuccess(res, 'Destination added to trip', td, 201);
    } catch (err) { return sendError(res, err.message, 500); }
};

// DELETE /api/trips/:id/destinations/:destId
const removeDestinationFromTrip = async (req, res) => {
    try {
        const trip = await getDB().trip.findFirst({ where: { id: req.params.id, userId: req.user.userId } });
        if (!trip) return sendError(res, 'Trip not found', 404);
        await getDB().tripDestination.deleteMany({
            where: { tripId: req.params.id, destinationId: req.params.destId },
        });
        return sendSuccess(res, 'Destination removed from trip');
    } catch (err) { return sendError(res, err.message, 500); }
};

// PUT /api/trips/:id/itinerary — bulk update day assignments
const updateItinerary = async (req, res) => {
    try {
        const { items } = req.body; // [{ id, dayNumber, orderInDay, notes }]
        if (!Array.isArray(items)) return sendError(res, 'items array required', 400);
        const trip = await getDB().trip.findFirst({ where: { id: req.params.id, userId: req.user.userId } });
        if (!trip) return sendError(res, 'Trip not found', 404);
        const updates = await Promise.all(items.map(item =>
            getDB().tripDestination.update({
                where: { id: item.id },
                data: { dayNumber: item.dayNumber, orderInDay: item.orderInDay, notes: item.notes },
            })
        ));
        return sendSuccess(res, 'Itinerary updated', updates);
    } catch (err) { return sendError(res, err.message, 500); }
};

module.exports = { createTrip, getTrips, getTrip, updateTrip, deleteTrip, addDestinationToTrip, removeDestinationFromTrip, updateItinerary };
