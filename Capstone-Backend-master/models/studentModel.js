/**
 * SafeRoute — Student Model (Enterprise Edition)
 * 
 * Fixes:
 *  - Added parentId back-reference (critical for data isolation)
 *  - Added compound unique index (class + roll)
 *  - Added indexes on class for attendance queries
 *  - Added timestamps
 *  - descriptor validation (must be 128-element float array for face-api.js)
 */

const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    title:     { type: String, trim: true },
    marks:     { type: Number, min: 0 },
    submitted: { type: Boolean, default: false },
}, { _id: false });

const activitySchema = new mongoose.Schema({
    name:  { type: String, trim: true },
    score: { type: Number, min: 0 },
}, { _id: false });

const studentSchema = new mongoose.Schema(
    {
        studentName: {
            type: String,
            required: [true, 'Student name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
        },
        // ✅ Back-reference to parent user — enables data isolation
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: [true, 'Parent reference is required'],
            index: true,
        },
        class: {
            type: String,
            trim: true,
            index: true,    // ✅ Indexed — attendance queries filter by class
        },
        roll: {
            type: Number,
            min: [1, 'Roll number must be positive'],
        },
        bus: {
            type: String,
            trim: true,
        },
        // Face recognition descriptor — 128-element Float32Array serialized as Number[]
        descriptors: {
            type: [Number],
            default: [],
            validate: {
                validator: (v) => v.length === 0 || v.length === 128,
                message: 'Descriptor must be a 128-element array (face-api.js standard)',
            },
        },
        assignments: {
            type: [assignmentSchema],
            default: [],
        },
        activities: {
            type: [activitySchema],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Unique roll per class — prevents duplicate rolls within same class
studentSchema.index({ class: 1, roll: 1 }, { unique: true, sparse: true });
// parentId is already indexed in the schema definition

module.exports = mongoose.model('student', studentSchema);