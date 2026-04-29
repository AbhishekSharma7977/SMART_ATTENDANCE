/**
 * SafeRoute — Auth Middleware (Enterprise Edition)
 * 
 * Fixes:
 *  - Removed token/PII logging from production
 *  - Differentiates TokenExpiredError (401) from invalid token (403)
 *  - Added socketAuthMiddleware for Socket.IO auth
 *  - Cleaner error handling
 */

const jwt = require('jsonwebtoken');

// ── HTTP Auth Middleware ───────────────────────────────────────────────────────
/**
 * Verifies the JWT from the HTTP-only cookie.
 * Attaches decoded payload to req.user.
 */
module.exports.authMiddleware = (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized: No token provided',
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY, {
            issuer: 'saferoute-api',
            audience: 'saferoute-client',
        });
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Session expired. Please log in again.',
                code: 'TOKEN_EXPIRED',
            });
        }
        return res.status(403).json({
            success: false,
            error: 'Forbidden: Invalid token',
        });
    }
};

// ── Role Authorization Middleware ──────────────────────────────────────────────
/**
 * Factory middleware — restricts route to specific roles.
 * Usage: authorizeRoles('admin', 'staff')
 */
module.exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `Access denied. Required role: ${roles.join(' or ')}`,
            });
        }
        next();
    };
};

// ── Socket.IO Auth Middleware ──────────────────────────────────────────────────
/**
 * Authenticates Socket.IO connections.
 * Reads token from:
 *  1. socket.handshake.auth.token (preferred for WS clients)
 *  2. cookie header (for browser clients that send cookies)
 */
module.exports.socketAuthMiddleware = (socket, next) => {
    try {
        // Try auth object first (sent by socket.io client as auth: { token })
        let token = socket.handshake.auth?.token;

        // Fallback: parse cookie header
        if (!token && socket.handshake.headers.cookie) {
            const cookieStr = socket.handshake.headers.cookie;
            const match = cookieStr.match(/token=([^;]+)/);
            if (match) token = match[1];
        }

        if (!token) {
            return next(new Error('Socket authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY, {
            issuer: 'saferoute-api',
            audience: 'saferoute-client',
        });

        socket.user = decoded; // Attach user to socket instance
        next();
    } catch (err) {
        next(new Error('Socket authentication failed: invalid or expired token'));
    }
};
