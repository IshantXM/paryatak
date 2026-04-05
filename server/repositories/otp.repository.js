/**
 * OTP Repository
 * 
 * Data access layer for OTP model.
 * 
 * @module repositories/otp
 */

const Otp = require('../models/otp.model');

/**
 * Create a new OTP record.
 */
const create = async (otpData) => {
    // Delete any existing unused OTPs for the same identifier + purpose
    await Otp.deleteMany({
        identifier: otpData.identifier,
        purpose: otpData.purpose,
        isUsed: false
    });

    const otp = new Otp(otpData);
    return otp.save();
};

/**
 * Find the latest valid (unused, non-expired) OTP for an identifier.
 */
const findLatestValid = async (identifier, purpose) => {
    return Otp.findOne({
        identifier,
        purpose,
        isUsed: false,
        expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 }).exec();
};

/**
 * Increment attempts on an OTP.
 */
const incrementAttempts = async (otpId) => {
    return Otp.findByIdAndUpdate(otpId, { $inc: { attempts: 1 } }, { new: true }).exec();
};

/**
 * Mark OTP as used.
 */
const markUsed = async (otpId) => {
    return Otp.findByIdAndUpdate(otpId, { isUsed: true }, { new: true }).exec();
};

/**
 * Delete all OTPs for an identifier.
 */
const deleteByIdentifier = async (identifier) => {
    return Otp.deleteMany({ identifier }).exec();
};

module.exports = {
    create,
    findLatestValid,
    incrementAttempts,
    markUsed,
    deleteByIdentifier,
};
