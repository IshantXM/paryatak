/**
 * Notification Service
 * 
 * Sends notifications via email for SOS alerts,
 * anomaly warnings, and safety updates.
 * 
 * @module services/notification
 */

const nodemailer = require('nodemailer');
const { smtp } = require('../config/environment');

let transporter = null;

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
        });
    }
    return transporter;
};

/**
 * Send SOS alert to emergency contacts.
 */
const sendSosAlert = async (user, sosData, emergencyContacts) => {
    const { location, message, emergencyType } = sosData;
    const [lng, lat] = location.coordinates;
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    const results = [];

    for (const contact of emergencyContacts) {
        if (!contact.email) continue;

        try {
            await getTransporter().sendMail({
                from: smtp.from,
                to: contact.email,
                subject: `🚨 EMERGENCY SOS — ${user.name} needs help!`,
                html: `
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%); border-radius: 16px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h1 style="color: #fca5a5; margin: 0; font-size: 28px;">🚨 EMERGENCY SOS ALERT</h1>
                        </div>
                        <div style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 24px;">
                            <p style="color: #fef2f2; font-size: 16px; margin: 0 0 12px;">
                                <strong>${user.name}</strong> has triggered an SOS alert and may need immediate assistance.
                            </p>
                            <table style="width: 100%; color: #fecaca; font-size: 14px;">
                                <tr><td style="padding: 6px 0;"><strong>Type:</strong></td><td>${emergencyType || 'Unknown'}</td></tr>
                                <tr><td style="padding: 6px 0;"><strong>Phone:</strong></td><td>${user.phone_number}</td></tr>
                                <tr><td style="padding: 6px 0;"><strong>Time:</strong></td><td>${new Date().toLocaleString('en-IN')}</td></tr>
                                ${message ? `<tr><td style="padding: 6px 0;"><strong>Message:</strong></td><td>${message}</td></tr>` : ''}
                            </table>
                            <div style="text-align: center; margin-top: 20px;">
                                <a href="${mapsUrl}" style="background: #ef4444; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                                    📍 View Location on Map
                                </a>
                            </div>
                        </div>
                        <p style="color: #fca5a5; font-size: 12px; text-align: center; margin-top: 16px;">
                            This is an automated emergency alert from Paryatak Safety.
                        </p>
                    </div>
                `,
                text: `EMERGENCY SOS ALERT: ${user.name} has triggered an SOS! Type: ${emergencyType}. Phone: ${user.phone_number}. Location: ${mapsUrl}. ${message || ''}`,
            });

            results.push({ contact: contact.name, email: contact.email, sent: true });
        } catch (error) {
            console.error(`Failed to send SOS email to ${contact.email}:`, error.message);
            results.push({ contact: contact.name, email: contact.email, sent: false, error: error.message });
        }
    }

    return results;
};

/**
 * Send anomaly warning to user.
 */
const sendAnomalyWarning = async (userEmail, anomalyData) => {
    if (!userEmail) return false;

    try {
        await getTransporter().sendMail({
            from: smtp.from,
            to: userEmail,
            subject: `⚠️ Paryatak Safety Alert — ${anomalyData.threatLevel} Threat Detected`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: linear-gradient(135deg, #78350f 0%, #92400e 100%); border-radius: 16px;">
                    <h1 style="color: #fbbf24; text-align: center; margin: 0 0 16px;">⚠️ Safety Alert</h1>
                    <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 20px;">
                        <p style="color: #fef3c7; font-size: 15px;">
                            We detected a <strong>${anomalyData.threatLevel}</strong> level anomaly during your trip.
                        </p>
                        <p style="color: #fde68a; font-size: 14px;">
                            Type: ${anomalyData.anomalyType}<br>
                            Score: ${Math.round(anomalyData.score * 100)}%
                        </p>
                        <p style="color: #fde68a; font-size: 13px;">
                            If you're safe, no action is needed. If you need help, trigger SOS in the app.
                        </p>
                    </div>
                </div>
            `,
            text: `Paryatak Safety Alert: ${anomalyData.threatLevel} threat detected. Type: ${anomalyData.anomalyType}. If you need help, trigger SOS in the app.`,
        });
        return true;
    } catch (error) {
        console.error('Failed to send anomaly warning:', error.message);
        return false;
    }
};

/**
 * Send trip sharing notification.
 */
const sendTripShareNotification = async (contactEmail, userName, shareLink) => {
    if (!contactEmail) return false;

    try {
        await getTransporter().sendMail({
            from: smtp.from,
            to: contactEmail,
            subject: `📍 ${userName} is sharing their trip with you — Paryatak Safety`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px;">
                    <h1 style="color: #38bdf8; text-align: center; margin: 0 0 16px;">📍 Live Trip Tracking</h1>
                    <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center;">
                        <p style="color: #e2e8f0; font-size: 15px;">
                            <strong>${userName}</strong> is sharing their live trip with you for safety.
                        </p>
                        <a href="${shareLink}" style="display: inline-block; background: #38bdf8; color: #0f172a; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
                            Track Live Location
                        </a>
                    </div>
                </div>
            `,
            text: `${userName} is sharing their trip with you for safety. Track here: ${shareLink}`,
        });
        return true;
    } catch (error) {
        console.error('Failed to send trip share notification:', error.message);
        return false;
    }
};

module.exports = {
    sendSosAlert,
    sendAnomalyWarning,
    sendTripShareNotification,
};
