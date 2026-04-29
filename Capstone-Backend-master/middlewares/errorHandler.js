/**
 * SafeRoute — Global Error Handler Middleware
 * 
 * Centralises all unhandled errors from controllers.
 * Provides:
 *  - Mongoose validation error formatting
 *  - Duplicate key error (11000) handling
 *  - JWT error handling
 *  - Generic 500 fallback
 *  - No stack traces in production
 */

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message    = err.message    || 'Internal Server Error';

    // ── Mongoose Validation Error ─────────────────────────────────────────────
    if (err.name === 'ValidationError') {
        statusCode = 400;
        const errors = Object.values(err.errors).map((e) => e.message);
        message = errors.join('. ');
    }

    // ── Mongoose Duplicate Key Error ──────────────────────────────────────────
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        message = `Duplicate value for ${field}. Please use a different value.`;
    }

    // ── Mongoose Cast Error (invalid ObjectId) ────────────────────────────────
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid value for ${err.path}: ${err.value}`;
    }

    // ── JWT Errors ────────────────────────────────────────────────────────────
    if (err.name === 'JsonWebTokenError') {
        statusCode = 403;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Session expired. Please log in again.';
    }

    // ── Log (never in production with sensitive details) ──────────────────────
    if (process.env.NODE_ENV !== 'production') {
        console.error(`[ERROR] ${req.method} ${req.originalUrl} → ${statusCode}: ${message}`);
        if (err.stack) console.error(err.stack);
    } else {
        console.error(`[ERROR] ${req.method} ${req.originalUrl} → ${statusCode}`);
    }

    return res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};

/**
 * Async wrapper — eliminates try/catch boilerplate in controllers.
 * Usage: router.get('/route', asyncHandler(myController))
 */
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { errorHandler, asyncHandler };
