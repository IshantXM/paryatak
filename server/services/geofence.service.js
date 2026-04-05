/**
 * Geofence Service
 * 
 * Geospatial utilities using Haversine formula.
 * 
 * @module services/geofence
 */

const policeStationRepo = require('../repositories/policeStation.repository');
const dangerZoneRepo = require('../repositories/dangerZone.repository');
const { haversineDistance, isWithinGeofence } = require('../utils/haversine');

const findNearestPoliceStations = async (latitude, longitude, maxDistMeters = 10000, limit = 5) => {
    const stations = await policeStationRepo.findNearestWithDistance(longitude, latitude, maxDistMeters, limit);
    return stations.map(s => ({
        ...s,
        haversineDistance: Math.round(haversineDistance(latitude, longitude, s.location.coordinates[1], s.location.coordinates[0], 'm')),
        distanceKm: Math.round(haversineDistance(latitude, longitude, s.location.coordinates[1], s.location.coordinates[0], 'km') * 10) / 10,
    }));
};

const checkGeofences = async (latitude, longitude) => {
    const zones = await dangerZoneRepo.findZonesContainingPoint(longitude, latitude);
    const order = ['low', 'moderate', 'high', 'critical'];
    let highest = 0;
    for (const z of zones) {
        const idx = order.indexOf(z.severity);
        if (idx > highest) highest = idx;
    }
    return {
        inDangerZone: zones.length > 0,
        zones: zones.map(z => ({ id: z._id, name: z.name, severity: z.severity, dangerType: z.dangerType, distance: Math.round(z.distance), radius: z.radiusMeters })),
        highestSeverity: zones.length > 0 ? order[highest] : null,
    };
};

const isInsideGeofence = (pointLat, pointLon, fenceLat, fenceLon, radiusMeters) => {
    return isWithinGeofence(pointLat, pointLon, fenceLat, fenceLon, radiusMeters);
};

const seedSamplePoliceStations = async () => {
    const PS = require('../models/policeStation.model');
    const count = await PS.countDocuments();
    if (count > 0) { console.log(`ℹ️  ${count} police stations exist, skip seed`); return; }
    const samples = [
        { name: 'Connaught Place PS', location: { type: 'Point', coordinates: [77.2195, 28.6328] }, address: { city: 'New Delhi', state: 'Delhi', fullAddress: 'CP, New Delhi' }, phone: '011-23741100', stationType: 'police_station' },
        { name: 'Parliament Street PS', location: { type: 'Point', coordinates: [77.2129, 28.6236] }, address: { city: 'New Delhi', state: 'Delhi', fullAddress: 'Parliament St, New Delhi' }, phone: '011-23362828', stationType: 'police_station' },
        { name: 'Karol Bagh PS', location: { type: 'Point', coordinates: [77.1906, 28.6519] }, address: { city: 'New Delhi', state: 'Delhi', fullAddress: 'Karol Bagh, New Delhi' }, phone: '011-25720645', stationType: 'police_station' },
        { name: 'Sarojini Nagar PS', location: { type: 'Point', coordinates: [77.1985, 28.5745] }, address: { city: 'New Delhi', state: 'Delhi', fullAddress: 'Sarojini Nagar, New Delhi' }, phone: '011-24100572', stationType: 'police_station' },
        { name: 'Lajpat Nagar PS', location: { type: 'Point', coordinates: [77.2373, 28.5713] }, address: { city: 'New Delhi', state: 'Delhi', fullAddress: 'Lajpat Nagar, New Delhi' }, phone: '011-26832400', stationType: 'police_station' },
    ];
    try { await policeStationRepo.bulkCreate(samples); console.log(`✅ Seeded ${samples.length} police stations`); }
    catch (e) { console.error('Seed failed:', e.message); }
};

module.exports = { findNearestPoliceStations, checkGeofences, isInsideGeofence, seedSamplePoliceStations };
