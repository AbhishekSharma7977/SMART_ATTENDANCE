/**
 * SafeRoute — JWT Token Generator
 * 
 * Fixes:
 *  - Added `expiresIn` — tokens now expire (was missing → immortal tokens)
 *  - Added `jti` (JWT ID) for future revocation support
 *  - Separate access and refresh token generators
 */

const jwt  = require('jsonwebtoken');
const { randomUUID } = require('crypto');

const ACCESS_TOKEN_EXPIRY  = process.env.JWT_ACCESS_EXPIRY  || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

/**
 * Generate a short-lived access token
 * @param {string} email
 * @param {string} role
 * @param {string} id - MongoDB ObjectId string
 * @param {string} [branch] - For staff users
 * @returns {string} signed JWT
 */
const generateAccessToken = (email, role, id, branch) => {
    const payload = {
        email,
        role,
        _id: id,
        jti: randomUUID(),          // Unique token ID for revocation
        ...(branch && { branch }),  // Include branch for staff/bus routing
    };
    return jwt.sign(payload, process.env.JWT_SECRET_KEY, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
        issuer: 'saferoute-api',
        audience: 'saferoute-client',
    });
};

/**
 * Generate a long-lived refresh token (stored in DB or Redis for revocation)
 * @param {string} id - MongoDB ObjectId string
 * @returns {string} signed JWT
 */
const generateRefreshToken = (id) => {
    return jwt.sign(
        { _id: id, jti: randomUUID() },
        process.env.JWT_SECRET_KEY,
        {
            expiresIn: REFRESH_TOKEN_EXPIRY,
            issuer: 'saferoute-api',
            audience: 'saferoute-client',
        }
    );
};

/**
 * Legacy compatibility shim — used by existing authController
 * @deprecated Use generateAccessToken instead
 */
const generateToken = (email, role, id, branch) => {
    return generateAccessToken(email, role, id, branch);
};

module.exports = { generateToken, generateAccessToken, generateRefreshToken };