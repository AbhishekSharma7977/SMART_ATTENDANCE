/**
 * SafeRoute — Alert Model (Enterprise Edition)
 * 
 * Fixes:
 *  - type enum enforced
 *  - Fixed sender ref ('user' lowercase, matching model registration)
 *  - Added structured targeting (role, branch, studentId)
 *  - Added read-receipt tracking
 */

const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: {
                values: ['delay', 'emergency', 'reminder', 'route_change', 'general'],
                message: 'Alert type must be one of: delay, emergency, reminder, route_change, general',
            },
            required: [true, 'Alert type is required'],
        },
        message: {
            type: String,
            required: [true, 'Alert message is required'],
            trim: true,
            minlength: [5, 'Message must be at least 5 characters'],
            maxlength: [500, 'Message must not exceed 500 characters'],
        },
        // Structured targeting
        target: {
            type: String,
            default: 'All',
            // 'All' | role name ('parent','staff') | branch name | student ObjectId string
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',            // ✅ Fixed: matches model name 'user' (lowercase)
            required: true,
        },
        channels: {
            type: [String],
            default: ['socket'],
        },
        sentAt: {
            type: Date,
            default: Date.now,
        },
        // Read-receipt tracking
        readBy: [
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
                readAt: { type: Date, default: Date.now },
            },
        ],
        // Priority level for UI rendering
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium',
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
alertSchema.index({ sentAt: -1 });
alertSchema.index({ type: 1 });
alertSchema.index({ sender: 1 });

module.exports = mongoose.model('Alert', alertSchema);
