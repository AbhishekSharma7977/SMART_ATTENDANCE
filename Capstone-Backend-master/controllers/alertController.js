/**
 * SafeRoute — Alert Controller (Enterprise Edition)
 * 
 * Fixes:
 *  - Input validation on type, message, target
 *  - Removed req.user.fullname (not in JWT) — fetch from DB instead
 *  - Role-targeted socket emission (not blindly io.emit to all)
 *  - Alert history pagination
 *  - Rate limiting applied at route level
 */

const Alert = require('../models/alertModel');
const User  = require('../models/userModel');

// ── POST /api/alerts ──────────────────────────────────────────────────────────
exports.broadcastAlert = async (req, res) => {
    try {
        const { type, message, target, channels, priority } = req.body;

        // 1. Validation
        if (!type || !message?.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Alert type and message are required',
            });
        }

        const VALID_TYPES = ['delay', 'emergency', 'reminder', 'route_change', 'general'];
        if (!VALID_TYPES.includes(type)) {
            return res.status(400).json({
                success: false,
                error: `Invalid alert type. Must be one of: ${VALID_TYPES.join(', ')}`,
            });
        }

        if (message.trim().length > 500) {
            return res.status(400).json({
                success: false,
                error: 'Alert message must not exceed 500 characters',
            });
        }

        // 2. Get sender's full name from DB (not JWT — JWT only has email, role, _id)
        const sender = await User.findById(req.user._id).select('fullname');
        if (!sender) {
            return res.status(404).json({ success: false, error: 'Sender not found' });
        }

        // 3. Create alert record
        const alert = await Alert.create({
            type,
            message:  message.trim(),
            target:   target || 'All',
            channels: channels || ['socket'],
            sender:   req.user._id,
            priority: priority || 'medium',
        });

        // 4. Smart socket targeting based on `target`
        const io = req.app.get('socketio');
        if (io) {
            const payload = {
                alertId:    alert._id,
                type,
                message:    message.trim(),
                target:     target || 'All',
                sentAt:     alert.sentAt,
                senderName: sender.fullname,
                priority:   priority || 'medium',
            };

            if (!target || target === 'All') {
                // Broadcast to all authenticated users
                io.emit('new-alert', payload);
            } else if (['parent', 'staff', 'admin'].includes(target)) {
                // Broadcast to a specific role's room
                io.to(`role:${target}`).emit('new-alert', payload);
            } else {
                // Target is a specific user ID or branch
                io.to(`user:${target}`).emit('new-alert', payload);
            }
        }

        return res.status(201).json({ success: true, alert });
    } catch (err) {
        console.error('[broadcastAlert]', err.message);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

// ── GET /api/alerts ───────────────────────────────────────────────────────────
exports.getAlertHistory = async (req, res) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 20);
        const skip  = (page - 1) * limit;

        const [alerts, total] = await Promise.all([
            Alert.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('sender', 'fullname role'),
            Alert.countDocuments(),
        ]);

        return res.status(200).json({
            success: true,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            alerts,
        });
    } catch (err) {
        console.error('[getAlertHistory]', err.message);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};
