/**
 * SafeRoute — Chat Model (Enterprise Edition)
 * 
 * Fixes:
 *  - Fixed typo: `require: true` → `required: true` on response field
 *  - Added index on session for fast history retrieval
 *  - Added role field for analytics segmentation
 *  - Added tokenCount for AI cost tracking
 */

const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
            index: true,
        },
        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'session',
            required: true,
            index: true,    // ✅ Index for fast session chat lookups
        },
        prompt: {
            type: String,
            required: [true, 'Prompt is required'],
            maxlength: [2000, 'Prompt must not exceed 2000 characters'],
        },
        response: {
            type: String,
            required: [true, 'Response is required'],   // ✅ Fixed typo
        },
        role: {
            type: String,
            enum: ['parent', 'staff', 'admin'],
        },
        // Approximate token usage for cost monitoring
        tokenCount: {
            type: Number,
            default: 0,
        },
        // Model used for this exchange
        modelUsed: {
            type: String,
            default: 'mistralai/Mistral-7B-Instruct-v0.1',
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

module.exports = mongoose.model('chat', chatSchema);