/**
 * SafeRoute — Attendance Controller (Enterprise Edition)
 * 
 * Fixes:
 *  - Removed hardcoded class '10' — uses payload studentClass
 *  - Division by zero guard on percentage calculation
 *  - Race condition: duplicate prevention now relies on DB unique index
 *  - saveAttendance: idempotent — won't double-mark absents
 *  - Validates descriptor before matching
 *  - Stores matchConfidence on record
 *  - Uses dateKey for clean day-level deduplication
 *  - Fixed typo: attendancePercentge → attendancePercentage
 */

const Student    = require('../models/studentModel');
const Attendance = require('../models/attendanceModel');
const { findBestMatch } = require('../utils/findBestMatch');

// ── Utility: Build today's dateKey (YYYY-MM-DD) ────────────────────────────────
const getTodayKey = () => new Date().toISOString().slice(0, 10); // e.g. "2025-04-29"

const getDayRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

// ── POST /api/attendance ───────────────────────────────────────────────────────
/**
 * Face-recognition attendance marking.
 * Staff only (enforced at route level).
 */
module.exports.markAttendance = async (req, res) => {
    try {
        const { descriptor, studentClass } = req.body;

        // 1. Validate descriptor
        if (!Array.isArray(descriptor) || descriptor.length !== 128) {
            return res.status(400).json({
                success: false,
                error: 'A valid 128-element face descriptor is required',
            });
        }

        // 2. Validate class
        if (!studentClass?.trim()) {
            return res.status(400).json({
                success: false,
                error: 'studentClass is required',
            });
        }

        // 3. Fetch students of the given class (indexed query)
        const students = await Student.find({ class: studentClass, isActive: true });
        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                error: `No active students found in class ${studentClass}`,
            });
        }

        // 4. Run face matching
        const matchResult = findBestMatch(descriptor, students);
        if (!matchResult) {
            return res.status(404).json({
                success: false,
                error: 'Face not recognized. Please try again or contact staff.',
            });
        }

        const { student: matchedStudent, confidence } = matchResult;
        const dateKey = getTodayKey();

        // 5. Mark attendance — unique index on (student, dateKey) prevents duplicates
        //    even under concurrent requests (DB-level guarantee)
        try {
            const attendance = await Attendance.create({
                student:         matchedStudent._id,
                status:          'present',
                teacher:         req.user?._id,
                date:            new Date(),
                dateKey,
                matchConfidence: confidence,
                method:          'face_recognition',
            });

            return res.status(200).json({
                success: true,
                message: `Attendance marked for ${matchedStudent.studentName}`,
                student: matchedStudent.studentName,
                confidence: `${(confidence * 100).toFixed(1)}%`,
                attendance,
            });
        } catch (dbErr) {
            // Duplicate key = already marked today
            if (dbErr.code === 11000) {
                return res.status(400).json({
                    success: false,
                    error: 'Attendance already marked for this student today',
                    student: matchedStudent.studentName,
                });
            }
            throw dbErr;
        }

    } catch (error) {
        console.error('[markAttendance]', error.message);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

// ── POST /api/attendance/save ─────────────────────────────────────────────────
/**
 * End-of-day: marks all un-marked students as absent.
 * Idempotent — safe to call multiple times.
 */
module.exports.saveAttendance = async (req, res) => {
    const { sClass } = req.body;

    if (!sClass?.trim()) {
        return res.status(400).json({ success: false, error: 'sClass (class name) is required' });
    }

    try {
        const students = await Student.find({ class: sClass, isActive: true });
        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                error: `No active students found in class ${sClass}`,
            });
        }

        const dateKey = getTodayKey();
        const { start, end } = getDayRange();

        // Find who's already been marked (present OR absent) today
        const alreadyMarked = await Attendance.find({
            student: { $in: students.map((s) => s._id) },
            date:    { $gte: start, $lte: end },
        }).select('student');

        const markedIds = new Set(alreadyMarked.map((a) => a.student.toString()));

        // Students with no record today
        const absentStudents = students.filter((s) => !markedIds.has(s._id.toString()));

        if (absentStudents.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'All students already have attendance recorded for today',
                absent: 0,
            });
        }

        // Bulk insert absent records
        await Attendance.insertMany(
            absentStudents.map((s) => ({
                student: s._id,
                status:  'absent',
                teacher: req.user?._id,
                date:    new Date(),
                dateKey,
                method:  'bulk',
            })),
            { ordered: false } // Continue on partial failure
        );

        return res.status(200).json({
            success: true,
            message: 'Attendance saved successfully',
            absent:  absentStudents.length,
            present: markedIds.size,
            total:   students.length,
        });
    } catch (err) {
        console.error('[saveAttendance]', err.message);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

// ── GET /api/attendance/:studentId ────────────────────────────────────────────
module.exports.getStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Basic ObjectId validation
        if (!studentId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, error: 'Invalid student ID' });
        }

        const records = await Attendance.find({ student: studentId }).sort({ date: -1 });

        const totalPresent  = records.filter((r) => r.status === 'present').length;
        const totalAbsent   = records.filter((r) => r.status === 'absent').length;
        const totalRecords  = records.length;

        // ✅ Guard against division by zero
        const attendancePercentage = totalRecords > 0
            ? parseFloat(((totalPresent / totalRecords) * 100).toFixed(2))
            : 0;

        return res.status(200).json({
            success: true,
            studentId,
            totalPresent,
            totalAbsent,
            totalRecords,
            attendancePercentage,   // ✅ Fixed typo
            records,
        });
    } catch (error) {
        console.error('[getStudentAttendance]', error.message);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};