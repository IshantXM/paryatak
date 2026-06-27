/**
 * OTP Service
 * 
 * Handles OTP generation, sending via Nodemailer, and verification.
 * 
 * @module services/otp
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { smtp, otp: otpConfig } = require('../config/environment');
const otpRepo = require('../repositories/otp.repository');

// Create reusable transporter
let transporter = null;
console.log(smtp);
const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            auth: {
                user: smtp.user,
                pass: smtp.pass,
            },
            tls: {
                rejectUnauthorized: false,
            }
        });
    }
    return transporter;
};

/**
 * Generate a random numeric OTP.
 * @param {number} [length] - OTP length
 * @returns {string}
 */
const generateOtp = (length = otpConfig.length) => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return crypto.randomInt(min, max + 1).toString();
};

/**
 * Send OTP via email using Nodemailer.
 * @param {string} email 
 * @param {string} otp 
 * @param {string} purpose 
 */
const sendOtpEmail = async (email, otp, purpose) => {
    const purposeLabels = {
        register: 'Account Registration',
        login: 'Login Verification',
        forgot_password: 'Password Reset',
        verify_email: 'Email Verification',
        address_update: 'Address Update',
    };

    const label = purposeLabels[purpose] || 'Verification';

    const mailOptions = {
        from: smtp.from,
        to: email,
        subject: `Paryatak Safety - ${label} OTP`,
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #38bdf8; margin: 0; font-size: 28px;">🛡️ Paryatak Safety</h1>
                    <p style="color: #94a3b8; margin-top: 4px; font-size: 14px;">${label}</p>
                </div>
                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; text-align: center;">
                    <p style="color: #e2e8f0; margin: 0 0 16px;">Your One-Time Password is:</p>
                    <div style="background: rgba(56,189,248,0.1); border: 2px dashed #38bdf8; border-radius: 8px; padding: 16px; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #38bdf8;">
                        ${otp}
                    </div>
                    <p style="color: #94a3b8; margin: 16px 0 0; font-size: 13px;">
                        This OTP expires in <strong style="color: #f59e0b;">${otpConfig.expiryMinutes} minutes</strong>.
                    </p>
                </div>
                <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 20px;">
                    If you did not request this, please ignore this email.<br>
                    Do not share this OTP with anyone.
                </p>
            </div>
        `,
        text: `Your Paryatak Safety ${label} OTP is: ${otp}. It expires in ${otpConfig.expiryMinutes} minutes. Do not share this OTP.`,
    };

    try {
        const mail = getTransporter();
        await mail.sendMail(mailOptions);
        console.log(`📧 OTP email sent to ${email} for ${purpose}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send OTP email to ${email}:`, error.message);
        // In development, log the OTP to console as fallback
        if (process.env.NODE_ENV !== 'production') {
            console.log(`🔑 DEV FALLBACK — OTP for ${email}: ${otp}`);
        }
        return false;
    }
};

/**
 * Create and send an OTP.
 * @param {string} identifier - Email or phone
 * @param {string} purpose 
 * @param {string} [userId] - Optional user ID
 * @returns {{ success: boolean, message: string }}
 */
const createAndSendOtp = async (identifier, purpose, userId = null) => {
    // Generate plain OTP
    const plainOtp = generateOtp();

    // Hash OTP for storage
    const hashedOtp = await bcrypt.hash(plainOtp, 10);

    // Calculate expiry
    const expiresAt = new Date(Date.now() + otpConfig.expiryMinutes * 60 * 1000);

    // Store hashed OTP
    await otpRepo.create({
        userId,
        identifier,
        otp: hashedOtp,
        purpose,
        expiresAt,
    });

    // Send OTP via email (check if identifier looks like an email)
    const isEmail = identifier.includes('@');
    if (isEmail) {
        await sendOtpEmail(identifier, plainOtp, purpose);
    } else {
        // For phone numbers, log to console (SMS integration would go here)
        console.log(`📱 OTP for ${identifier}: ${plainOtp}`);
    }

    return {
        success: true,
        message: `OTP sent to ${isEmail ? 'email' : 'phone'}`,
        expiresAt,
    };
};

/**
 * Verify an OTP.
 * @param {string} identifier 
 * @param {string} purpose 
 * @param {string} plainOtp 
 * @returns {{ success: boolean, message: string }}
 */
const verifyOtp = async (identifier, purpose, plainOtp) => {
    // Find latest valid OTP
    const otpRecord = await otpRepo.findLatestValid(identifier, purpose);

    if (!otpRecord) {
        return { success: false, message: 'OTP expired or not found' };
    }

    // Check max attempts
    if (otpRecord.attempts >= otpConfig.maxAttempts) {
        await otpRepo.markUsed(otpRecord._id);
        return { success: false, message: 'Maximum OTP attempts exceeded. Please request a new OTP.' };
    }

    // Increment attempts
    await otpRepo.incrementAttempts(otpRecord._id);

    // Verify OTP (compare with bcrypt hash)
    const isMatch = await bcrypt.compare(plainOtp, otpRecord.otp);

    if (!isMatch) {
        const remaining = otpConfig.maxAttempts - otpRecord.attempts - 1;
        return {
            success: false,
            message: `Invalid OTP. ${remaining} attempt(s) remaining.`
        };
    }

    // Mark as used
    await otpRepo.markUsed(otpRecord._id);

    return { success: true, message: 'OTP verified successfully' };
};

module.exports = {
    generateOtp,
    sendOtpEmail,
    createAndSendOtp,
    verifyOtp,
};
