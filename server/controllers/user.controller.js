/**
 * User Controller
 * @module controllers/user
 */
const userRepo = require('../repositories/user.repository');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const updateProfile = async (req, res) => {
    try {
        const { name, email, address, deviceToken } = req.body;
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (address) updateData.address = address;
        if (deviceToken !== undefined) updateData.deviceToken = deviceToken;
        const user = await userRepo.updateById(req.user.userId, updateData);
        if (!user) return sendError(res, 'User not found', 404);
        sendSuccess(res, 'Profile updated', user.toJSON());
    } catch (err) { sendError(res, err.message, 400); }
};

const addEmergencyContact = async (req, res) => {
    try {
        const { name, phone, email, relationship } = req.body;
        if (!name || !phone) return sendError(res, 'Name and phone are required', 400);
        const user = await userRepo.addEmergencyContact(req.user.userId, { name, phone, email, relationship });
        sendSuccess(res, 'Emergency contact added', user.emergencyContacts, 201);
    } catch (err) { sendError(res, err.message, 400); }
};

const removeEmergencyContact = async (req, res) => {
    try {
        const user = await userRepo.removeEmergencyContact(req.user.userId, req.params.contactId);
        sendSuccess(res, 'Emergency contact removed', user.emergencyContacts);
    } catch (err) { sendError(res, err.message, 400); }
};

const getEmergencyContacts = async (req, res) => {
    try {
        const contacts = await userRepo.getEmergencyContacts(req.user.userId);
        sendSuccess(res, 'Emergency contacts', contacts);
    } catch (err) { sendError(res, err.message, 500); }
};

const updateLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const user = await userRepo.updateLocation(req.user.userId, parseFloat(longitude), parseFloat(latitude));
        sendSuccess(res, 'Location updated', { lastKnownLocation: user.lastKnownLocation });
    } catch (err) { sendError(res, err.message, 400); }
};

module.exports = { updateProfile, addEmergencyContact, removeEmergencyContact, getEmergencyContacts, updateLocation };
