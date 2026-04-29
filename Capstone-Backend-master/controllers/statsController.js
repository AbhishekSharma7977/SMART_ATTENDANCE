/**
 * SafeRoute — Stats Controller (Enterprise Edition)
 * 
 * Fixes:
 *  - REMOVED all hardcoded mock values (attendanceRate, activeAlerts)
 *  - Added auth (admin only — enforced at route level)
 *  - Real-time attendance rate from today's Attendance collection
 *  - Real-time active alert count from Alert collection
 *  - Parallel DB queries for performance
 *  - Added bus, student, parent, staff counts
 */

const User       = require('../models/userModel');
const Student    = require('../models/studentModel');
const Attendance = require('../models/attendanceModel');
const Alert      = require('../models/alertModel');

// ── GET /api/stats/dashboard ──────────────────────────────────────────────────
module.exports.getDashboardStats = async (req, res) => {
    try {
        const todayKey = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

        // Run all queries in parallel
        const [
            totalStudents,
            totalParents,
            totalStaff,
            activeBuses,
            presentToday,
            absentToday,
            totalAlerts,
            recentAlerts,
        ] = await Promise.all([
            Student.countDocuments({ isActive: true }),
            User.countDocuments({ role: 'parent', isActive: true }),
            User.countDocuments({ role: 'staff',  isActive: true }),
            User.countDocuments({ role: 'staff', branch: /^bus/i, isActive: true }),
            Attendance.countDocuments({ dateKey: todayKey, status: 'present' }),
            Attendance.countDocuments({ dateKey: todayKey, status: 'absent' }),
            Alert.countDocuments(),
            Alert.countDocuments({
                sentAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24h
            }),
        ]);

        const totalMarkedToday = presentToday + absentToday;
        const attendanceRate   = totalMarkedToday > 0
            ? parseFloat(((presentToday / totalMarkedToday) * 100).toFixed(2))
            : 0;

        return res.status(200).json({
            success: true,
            stats: {
                students: {
                    total:        totalStudents,
                    presentToday,
                    absentToday,
                    attendanceRate,     // ✅ Real value, not mock
                },
                users: {
                    parents:      totalParents,
                    staff:        totalStaff,
                },
                buses: {
                    active:       activeBuses,
                },
                alerts: {
                    total:        totalAlerts,
                    last24Hours:  recentAlerts,  // ✅ Real value, not mock
                },
                generatedAt: new Date().toISOString(),
            },
        });
    } catch (err) {
        console.error('[getDashboardStats]', err.message);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};
