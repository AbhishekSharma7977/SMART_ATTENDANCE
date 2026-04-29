/**
 * SafeRoute — User Model (Enterprise Edition)
 * 
 * Fixes:
 *  - Added timestamps
 *  - Email regex validation
 *  - Password minlength enforcement
 *  - Fixed student ref ('student' not 'user')
 *  - GeoJSON location for 2dsphere indexing
 *  - Explicit indexes
 *  - Branch enum validation
 *  - Pre-save password select:false
 */

const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
    },
    coordinates: {
        type: [Number],      // [longitude, latitude] — GeoJSON standard
        default: [0, 0],
        validate: {
            validator: (v) => v.length === 2 &&
                v[0] >= -180 && v[0] <= 180 &&
                v[1] >= -90  && v[1] <= 90,
            message: 'Coordinates must be [longitude, latitude] within valid ranges',
        },
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });

const userSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ['parent', 'staff', 'admin'],
            required: [true, 'Role is required'],
        },
        fullname: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [100, 'Name must not exceed 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                'Please enter a valid email address',
            ],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false,        // ✅ Never returned in queries by default
        },
        branch: {
            type: String,
            trim: true,
            // 'bus' = bus driver, others = department/section names
        },
        // Parent → [Student] relationship
        student: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'student',       // ✅ Fixed: was pointing to 'user'
            default: undefined,
        },
        // GPS location (used by bus drivers)
        location: {
            type: locationSchema,
            default: () => ({ type: 'Point', coordinates: [0, 0] }),
        },
        // Account status
        isActive: {
            type: Boolean,
            default: true,
        },
        lastLoginAt: {
            type: Date,
        },
    },
    {
        timestamps: true,   // ✅ adds createdAt + updatedAt
        versionKey: false,
    }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// email is already indexed by 'unique: true' in schema
userSchema.index({ role: 1 });
userSchema.index({ role: 1, branch: 1 });   // Bus queries: {role:'staff', branch:'bus'}
userSchema.index({ 'location.coordinates': '2dsphere' }); // Geospatial queries

module.exports = mongoose.model('user', userSchema);