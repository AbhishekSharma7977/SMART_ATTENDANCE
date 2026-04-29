/**
 * SafeRoute — Session Controller (Enterprise Edition)
 * 
 * Fixes:
 *  - Pagination on getUserAllSessions (don't populate all chats in list view)
 *  - Session deletion endpoint added
 *  - Ownership verified on all queries
 */

const Session = require('../models/sessionModel');
const Chat    = require('../models/chatModel');

// ── POST /api/ai/session ──────────────────────────────────────────────────────
exports.createSession = async (req, res) => {
    try {
        const { title } = req.body || {};

        const session = await Session.create({
            user:  req.user._id,
            title: title?.trim() || 'New Chat',
        });

        return res.status(201).json({
            success: true,
            message: 'Session created',
            session,
        });
    } catch (err) {
        console.error('[createSession]', err.message);
        return res.status(500).json({ success: false, error: 'Failed to create session' });
    }
};

// ── GET /api/ai/session ───────────────────────────────────────────────────────
exports.getUserAllSessions = async (req, res) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 20);
        const skip  = (page - 1) * limit;

        const [sessions, total] = await Promise.all([
            Session.find({ user: req.user._id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('-chats'), // ✅ Don't populate chats in list — too heavy
            Session.countDocuments({ user: req.user._id }),
        ]);

        return res.status(200).json({
            success: true,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            sessions,
        });
    } catch (err) {
        console.error('[getUserAllSessions]', err.message);
        return res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
    }
};

// ── GET /api/ai/session/:sessionId ────────────────────────────────────────────
exports.getUserSession = async (req, res) => {
    const { sessionId } = req.params;

    try {
        const session = await Session.findOne({
            _id:  sessionId,
            user: req.user._id,       // ✅ Ownership enforced
        }).populate({ path: 'chats', select: 'prompt response createdAt tokenCount' });

        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }

        return res.status(200).json({ success: true, session });
    } catch (err) {
        console.error('[getUserSession]', err.message);
        return res.status(500).json({ success: false, error: 'Failed to fetch session' });
    }
};

// ── DELETE /api/ai/session/:sessionId ────────────────────────────────────────
exports.deleteSession = async (req, res) => {
    const { sessionId } = req.params;

    try {
        const session = await Session.findOneAndDelete({
            _id:  sessionId,
            user: req.user._id,       // ✅ Only owner can delete
        });

        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }

        // Clean up associated chats
        await Chat.deleteMany({ session: sessionId });

        return res.status(200).json({ success: true, message: 'Session deleted' });
    } catch (err) {
        console.error('[deleteSession]', err.message);
        return res.status(500).json({ success: false, error: 'Failed to delete session' });
    }
};