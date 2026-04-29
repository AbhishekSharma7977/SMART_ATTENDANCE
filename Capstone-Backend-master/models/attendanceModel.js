/**
 * SafeRoute — Attendance Model (Enterprise Edition)
 * 
 * Fixes:
 *  - Compound unique index on (student + day) prevents duplicate records
 *  - Added subject field for per-subject attendance
 *  - Added performance index on student + date
 *  - Added timestamps
 */

const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'student',
            required: [true, 'Student reference is required'],
            index: true,
        },
        status: {
            type: String,
            enum: {
                values: ['present', 'absent'],
                message: 'Status must be either present or absent',
            },
            required: [true, 'Attendance status is required'],
            default: 'present',
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        // Date-only representation for duplicate prevention (YYYY-MM-DD)
        dateKey: {
            type: String,
            required: true,
        },
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
        },
        subject: {
            type: String,
            trim: true,
            default: 'General',
        },
        // Face recognition confidence score (0-1, lower = better match)
        matchConfidence: {
            type: Number,
            min: 0,
            max: 1,
        },
        // How the attendance was recorded
        method: {
            type: String,
            enum: ['face_recognition', 'manual', 'bulk'],
            default: 'face_recognition',
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// ✅ CRITICAL: Prevents duplicate attendance on same day for same student
// Using dateKey (string YYYY-MM-DD) for clean day-level deduplication
attendanceSchema.index(
    { student: 1, dateKey: 1 },
    { unique: true, name: 'unique_student_per_day' }
);

// Fast attendance history lookup
attendanceSchema.index({ student: 1, date: -1 });

// Teacher's attendance records
attendanceSchema.index({ teacher: 1, date: -1 });

module.exports = mongoose.model('attendance', attendanceSchema);