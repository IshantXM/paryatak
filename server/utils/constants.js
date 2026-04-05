/**
 * Application Constants
 * 
 * Centralized constants used throughout the application.
 * 
 * @module utils/constants
 */

/**
 * SOS alert statuses.
 */
const SOS_STATUS = {
    ACTIVE: 'active',
    CANCELLED: 'cancelled',
    RESOLVED: 'resolved',
    ESCALATED: 'escalated',
};

/**
 * Trip statuses.
 */
const TRIP_STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    PAUSED: 'paused',
};

/**
 * Danger zone severity levels.
 */
const DANGER_SEVERITY = {
    LOW: 'low',
    MODERATE: 'moderate',
    HIGH: 'high',
    CRITICAL: 'critical',
};

/**
 * Danger zone types.
 */
const DANGER_TYPES = {
    CRIME: 'crime',
    ACCIDENT: 'accident',
    NATURAL_HAZARD: 'natural_hazard',
    POOR_LIGHTING: 'poor_lighting',
    ISOLATED_AREA: 'isolated_area',
    CONSTRUCTION: 'construction',
    WILDLIFE: 'wildlife',
    OTHER: 'other',
};

/**
 * Audit log action types.
 */
const AUDIT_ACTIONS = {
    // Auth
    LOGIN_SUCCESS: 'login_success',
    LOGIN_FAILED: 'login_failed',
    LOGOUT: 'logout',
    OTP_SENT: 'otp_sent',
    OTP_VERIFIED: 'otp_verified',
    OTP_FAILED: 'otp_failed',
    TOKEN_REFRESHED: 'token_refreshed',
    SIGNUP: 'signup',

    // SOS
    SOS_TRIGGERED: 'sos_triggered',
    SOS_CANCELLED: 'sos_cancelled',
    SOS_RESOLVED: 'sos_resolved',
    SOS_ESCALATED: 'sos_escalated',

    // Trip
    TRIP_STARTED: 'trip_started',
    TRIP_ENDED: 'trip_ended',
    TRIP_CANCELLED: 'trip_cancelled',

    // Safety
    ROUTE_DEVIATION: 'route_deviation',
    DANGER_ZONE_ENTERED: 'danger_zone_entered',
    DANGER_ZONE_EXITED: 'danger_zone_exited',
    SPEED_ANOMALY_DETECTED: 'speed_anomaly_detected',
    PROLONGED_STOP_DETECTED: 'prolonged_stop_detected',
    ANOMALY_DETECTED: 'anomaly_detected',
    GEOFENCE_BREACH: 'geofence_breach',

    // User
    PROFILE_UPDATED: 'profile_updated',
    EMERGENCY_CONTACT_ADDED: 'emergency_contact_added',
    EMERGENCY_CONTACT_REMOVED: 'emergency_contact_removed',

    // Danger Zones
    DANGER_ZONE_CREATED: 'danger_zone_created',
    DANGER_ZONE_REPORTED: 'danger_zone_reported',
};

/**
 * User roles.
 */
const USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin',
    SECURITY: 'security',
};

/**
 * OTP purposes.
 */
const OTP_PURPOSES = {
    REGISTER: 'register',
    LOGIN: 'login',
    FORGOT_PASSWORD: 'forgot_password',
    VERIFY_EMAIL: 'verify_email',
    ADDRESS_UPDATE: 'address_update',
};

module.exports = {
    SOS_STATUS,
    TRIP_STATUS,
    DANGER_SEVERITY,
    DANGER_TYPES,
    AUDIT_ACTIONS,
    USER_ROLES,
    OTP_PURPOSES,
};
