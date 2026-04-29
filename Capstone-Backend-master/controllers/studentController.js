/**
 * SafeRoute — Student Controller (Enterprise Edition)
 * 
 * Fixes:
 *  - Auth required on all endpoints (route level)
 *  - Descriptors NEVER returned in any response (biometric privacy)
 *  - Pagination added
 *  - Parent data isolation: parent can only see their own children
 *  - Staff/admin can query by class
 *  - Input from req.query only (consistent REST)
 */

const Student = require('../models/studentModel');

// ── GET /api/student ──────────────────────────────────────────────────────────
module.exports.getAllStudents = async (req, res) => {
    try {
        const { sClass, page = 1, limit = 30 } = req.query;

        const pageNum  = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, parseInt(limit));
        const skip     = (pageNum - 1) * limitNum;

        let query = { isActive: true };

        if (req.user.role === 'parent') {
            // ✅ Parents ONLY see their own children — enforce isolation
            // The parent's student array comes from JWT-decoded user or DB
            const User = require('../models/userModel');
            const parent = await User.findById(req.user._id).select('student');
            if (!parent?.student?.length) {
                return res.status(200).json({
                    success: true,
                    message: 'No students linked to your account',
                    students: [],
                    total: 0,
                });
            }
            query._id = { $in: parent.student };
        } else {
            // Staff / admin can filter by class
            if (sClass) query.class = sClass;
        }

        const [students, total] = await Promise.all([
            Student.find(query)
                .select('-descriptors')     // ✅ NEVER return face biometrics
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Student.countDocuments(query),
        ]);

        return res.status(200).json({
            success: true,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            students,
        });
    } catch (err) {
        console.error('[getAllStudents]', err.message);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};