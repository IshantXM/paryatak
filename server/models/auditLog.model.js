/**
 * Audit Log Model
 * 
 * Security audit trail recording all critical actions
 * for compliance and forensic analysis.
 * 
 * @module models/AuditLog
 */

const mongoose = require('mongoose');
const { AUDIT_ACTIONS } = require('../utils/constants');

const auditLogSchema = new mongoose.Schema(
    {
        /**
         * User who performed the action.
         */
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true
        },

        /**
         * Action performed.
         */
        action: {
            type: String,
            enum: Object.values(AUDIT_ACTIONS),
            required: [true, 'Action is required'],
            index: true
        },

        /**
         * Resource type (e.g., 'User', 'Trip', 'SOS').
         */
        resourceType: {
            type: String,
            trim: true,
            default: ''
        },

        /**
         * Resource ID (e.g., tripId, sosId).
         */
        resourceId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },

        /**
         * Detailed description of the action.
         */
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ''
        },

        /**
         * Additional metadata.
         */
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        /**
         * Location where the action occurred (GeoJSON Point).
         */
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                default: [0, 0]
            }
        },

        /**
         * Client IP address.
         */
        ipAddress: {
            type: String,
            default: ''
        },

        /**
         * User agent string.
         */
        userAgent: {
            type: String,
            default: ''
        },

        /**
         * Result of the action.
         */
        result: {
            type: String,
            enum: ['success', 'failure', 'warning', 'info'],
            default: 'info'
        },

        /**
         * Severity of the audit event.
         */
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'low'
        },
    },
    {
        timestamps: true
    }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, action: 1 });

// Auto-delete audit logs after 1 year
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
