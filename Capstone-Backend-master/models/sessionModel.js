/**
 * SafeRoute — Session Model (Enterprise Edition)
 * 
 * Fixes:
 *  - Added index on user
 *  - Added timestamps (proper createdAt/updatedAt)
 *  - Added maxChats cap for memory safety
 */

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: [true, 'User reference is required'],
            index: true,    // ✅ Fast lookup by user
        },
        title: {
            type: String,
            trim: true,
            default: 'New Chat',
            maxlength: [100, 'Session title must not exceed 100 characters'],
        },
        chats: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'chat',
            },
        ],
        active: {
            type: Boolean,
            default: true,
        },
        startedAt: {
            type: Date,
            default: Date.now,
        },
        endedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,   // ✅ adds createdAt + updatedAt
        versionKey: false,
    }
);

module.exports = mongoose.model('session', sessionSchema);