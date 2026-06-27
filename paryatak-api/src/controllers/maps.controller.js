const { getDB } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// GET /api/maps/destinations — GeoJSON for all destinations
const getDestinationsGeoJSON = async (req, res) => {
    try {
        const destinations = await getDB().destination.findMany({
            where: { isActive: true },
            select: {
                id: true, name: true, slug: true, latitude: true, longitude: true,
                ratingAvg: true, city: true,
                category: { select: { name: true, icon: true, color: true } },
                state: { select: { name: true } },
                images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
        });

        const geojson = {
            type: 'FeatureCollection',
            features: destinations.map(d => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [d.longitude, d.latitude] },
                properties: {
                    id: d.id, name: d.name, slug: d.slug,
                    category: d.category?.name, categoryIcon: d.category?.icon,
                    categoryColor: d.category?.color,
                    state: d.state?.name, city: d.city,
                    ratingAvg: d.ratingAvg,
                    imageUrl: d.images?.[0]?.url || null,
                },
            })),
        };

        return sendSuccess(res, 'Destinations GeoJSON', geojson);
    } catch (err) { return sendError(res, err.message, 500); }
};

// GET /api/maps/nearby-services?lat=&lng=&radius=&type=
const getNearbyServices = async (req, res) => {
    try {
        const { lat, lng, radius = 10000, type } = req.query;
        if (!lat || !lng) return sendError(res, 'lat and lng required', 400);

        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        const radiusKm = parseFloat(radius) / 1000;

        const where = { isActive: true };
        if (type) where.type = type.toUpperCase();

        const services = await getDB().nearbyService.findMany({ where });

        // Haversine filter
        const R = 6371;
        const nearby = services
            .map(s => {
                const dLat = ((s.latitude - latNum) * Math.PI) / 180;
                const dLon = ((s.longitude - lngNum) * Math.PI) / 180;
                const a = Math.sin(dLat / 2) ** 2 +
                    Math.cos((latNum * Math.PI) / 180) * Math.cos((s.latitude * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
                const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return { ...s, distanceKm: Math.round(dist * 10) / 10 };
            })
            .filter(s => s.distanceKm <= radiusKm)
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, 50);

        return sendSuccess(res, 'Nearby services', nearby);
    } catch (err) { return sendError(res, err.message, 500); }
};

module.exports = { getDestinationsGeoJSON, getNearbyServices };
