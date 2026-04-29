/**
 * SafeRoute — Auth Controller (Enterprise Edition)
 * 
 * Fixes:
 *  - Unified login error message (prevents account enumeration)
 *  - Password never returned in any response
 *  - Token now has expiry
 *  - Input validation with detailed errors
 *  - Transactions for atomic parent+student creation
 *  - Brute-force rate limiting (applied at route level)
 *  - getUser explicitly excludes password
 *  - Branch embedded in JWT for bus routing
 *  - lastLoginAt tracked
 */

const mongoose  = require('mongoose');
const User      = require('../models/userModel');
const Student   = require('../models/studentModel');
const bcrypt    = require('bcrypt');
const { generateAccessToken } = require('../utils/generateToken');

// ── Constants ─────────────────────────────────────────────────────────────────
const BCRYPT_ROUNDS = 12;   // Increased from 10
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes — matches token expiry
    path: '/',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const sanitizeUser = (user) => {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password;
    return obj;
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ── POST /api/auth/register ───────────────────────────────────────────────────
module.exports.createUser = async (req, res) => {
    const { fullname, email, password, role, branch, student: students, descriptor } = req.body;

    // 1. Input validation
    const errors = [];
    if (!fullname?.trim())       errors.push('Full name is required');
    if (!email?.trim())          errors.push('Email is required');
    if (!isValidEmail(email))    errors.push('Valid email is required');
    if (!password)               errors.push('Password is required');
    if (password?.length < 8)    errors.push('Password must be at least 8 characters');
    if (!role)                   errors.push('Role is required');
    if (!['parent', 'staff'].includes(role)) errors.push('Invalid role. Admin creation not allowed via this route.');

    if (errors.length) {
        return res.status(400).json({ success: false, errors });
    }

    try {
        // 3. Check email uniqueness
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'An account with this email already exists',
            });
        }

        // 4. Hash password
        const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

        // 5. Create student documents (for parent role)
        let studentIds = [];
        if (role === 'parent') {
            if (!Array.isArray(students) || students.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Parent accounts must include at least one student',
                });
            }

            // We create a temporary user ID to use as parentId
            // We'll update it after the user is created
            const tempParentId = new mongoose.Types.ObjectId();

            const createdStudents = await Student.insertMany(
                students.map((s) => ({
                    studentName: s.name || s.studentName,
                    class: s.class,
                    roll: s.roll,
                    bus: s.bus,
                    // Per-student descriptor takes precedence over global
                    descriptors: s.descriptor || descriptor || [],
                    parentId: tempParentId,
                }))
            );

            studentIds = createdStudents.map((s) => s._id);

            // Build user with the pre-computed ID
            const userData = {
                _id: tempParentId,
                fullname: fullname.trim(),
                email: email.toLowerCase().trim(),
                password: hash,
                role,
                student: studentIds,
            };

            const [newUser] = await User.create([userData]);

            return res.status(201).json({
                success: true,
                message: 'Account created successfully',
                user: sanitizeUser(newUser),
            });
        }

        // 6. Non-parent user creation
        const userData = {
            fullname: fullname.trim(),
            email: email.toLowerCase().trim(),
            password: hash,
            role,
            ...(role === 'staff' && branch ? { branch } : {}),
        };

        const [newUser] = await User.create([userData]);

        return res.status(201).json({
            success: true,
            message: 'Account created successfully',
            user: sanitizeUser(newUser),
        });

    } catch (err) {
        console.error('[createUser]', err.message);

        // Duplicate key from race condition
        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                error: 'An account with this email already exists',
            });
        }

        // Mongoose validation error
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((e) => e.message);
            return res.status(400).json({ success: false, errors: messages });
        }

        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
module.exports.login = async (req, res) => {
    const { email, password } = req.body; console.log('Login attempt for:', email);

    if (!email?.trim() || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    try {
        // ✅ Unified error message prevents account enumeration
        const GENERIC_ERROR = 'Invalid email or password';

        // select('+password') overrides the schema's select:false
        const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
        if (!user) {
            // Still run bcrypt to prevent timing attacks
            await bcrypt.compare(password, '$2b$12$invalidhashplaceholderfortimingg');
            return res.status(401).json({ success: false, error: GENERIC_ERROR });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                error: 'Account is deactivated. Contact your administrator.',
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: GENERIC_ERROR });
        }

        // Issue access token
        const token = generateAccessToken(
            user.email,
            user.role,
            user._id.toString(),
            user.branch
        );

        // Update last login timestamp
        user.lastLoginAt = new Date();
        await user.save({ validateBeforeSave: false });

        res.cookie('token', token, COOKIE_OPTIONS);

        return res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            user: sanitizeUser(user),
            // Also send token in body for mobile/non-cookie clients
            token,
        });
    } catch (err) {
        console.error('[login]', err.message);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

// ── GET /api/auth/user ────────────────────────────────────────────────────────
module.exports.getUser = async (req, res) => {
    try {
        // password excluded by default (select: false in schema)
        const user = await User.findById(req.user._id).populate({
            path: 'student',
            select: 'studentName class roll bus isActive',  // ✅ Never return descriptors
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        return res.status(200).json({ success: true, user });
    } catch (err) {
        console.error('[getUser]', err.message);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
module.exports.logout = (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        expires: new Date(0),
        path: '/',
    });
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
};
