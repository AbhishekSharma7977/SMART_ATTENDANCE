/**
 * SafeRoute — Enterprise Server Entry Point
 * 
 * Execution order:
 *  1. Load env (MUST be first — before any module that reads process.env)
 *  2. Validate required env variables
 *  3. Connect DB
 *  4. Boot Express + Socket.IO
 *  5. Apply global security middleware
 *  6. Mount routes
 *  7. Register error handler
 *  8. Graceful shutdown handlers
 */

console.log('🚀 Starting SafeRoute Enterprise Server...');

require('dotenv').config(); // ✅ FIRST — before any import that reads env

// ── Env Validation ────────────────────────────────────────────────────────────
// Default NODE_ENV to production if not set (standard for cloud deployments)
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET_KEY', 'OPEN_ROUTER_KEY'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);

if (missing.length) {
    console.error('❌ CRITICAL: Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('👉 Ensure these are set in your Render.com Environment settings.');
    // Exit after a short delay to allow logs to flush
    setTimeout(() => process.exit(1), 100);
}

// ── Core Imports ──────────────────────────────────────────────────────────────
const express     = require('express');
const http        = require('http');
const { Server }  = require('socket.io');
const cookieParser = require('cookie-parser');
const cors        = require('cors');
const helmet      = require('helmet');
const rateLimit   = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean    = require('xss-clean');
const morgan      = require('morgan');

const connectDB   = require('./config/db');
const { socketAuthMiddleware } = require('./middlewares/authMiddleware');

// ── Route Imports ─────────────────────────────────────────────────────────────
const authRoutes       = require('./routes/authRoutes');
const chatbotRoute     = require('./routes/chatRoutes');
const sessionRoute     = require('./routes/sessionRoutes');
const attendanceRoute  = require('./routes/attendanceRoutes');
const studentRoutes    = require('./routes/studentRoutes');
const busRoutes        = require('./routes/busRoutes');
const statsRoutes      = require('./routes/statsRoutes');
const alertRoutes      = require('./routes/alertRoutes');

// ── Error Handler ─────────────────────────────────────────────────────────────
const { errorHandler } = require('./middlewares/errorHandler');

// ── Database ──────────────────────────────────────────────────────────────────
connectDB();

// ── App Init ──────────────────────────────────────────────────────────────────
const app    = express();

// Trust reverse proxy (Vercel, Render, Railway, AWS) for accurate Rate Limiter IPs
app.set('trust proxy', 1);

const server = http.createServer(app);
const PORT   = process.env.PORT || 3000;

// ── CORS Config ───────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

const corsOptions = {
    origin: (origin, callback) => {
        // Allow direct visits (no origin) or allowed origins
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
});

// ── Socket Auth Middleware ────────────────────────────────────────────────────
io.use(socketAuthMiddleware);

// ── Socket Connection Handler ─────────────────────────────────────────────────
io.on('connection', (socket) => {
    const { role, _id } = socket.user;

    // Auto-join role-specific rooms
    socket.join(`role:${role}`);
    socket.join(`user:${_id}`);

    console.log(`📡 Connected: ${socket.id} | Role: ${role} | User: ${_id}`);

    // Bus drivers join their own bus channel
    if (role === 'staff' && socket.user.branch) {
        socket.join(`bus:${socket.user.branch}`);
    }

    // Alert acknowledgement handler
    socket.on('alert-received', (data) => {
        if (data?.alertId && data?.userId) {
            console.log(`✅ Alert ${data.alertId} acknowledged by ${data.userId}`);
            // Optionally notify admin room
            io.to('role:admin').emit('alert-acknowledged', data);
        }
    });

    socket.on('disconnect', (reason) => {
        console.log(`🔌 Disconnected: ${socket.id} | Reason: ${reason}`);
    });
});

// Store io on app so controllers can access it
app.set('socketio', io);

// ── Global Middleware Stack ───────────────────────────────────────────────────

// 1. Security headers
app.use(helmet());

// 2. Request logging (skip in test env)
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// 3. CORS
app.use(cors(corsOptions));

// 4. Body parsers (10 MB limit — needed for face descriptor payloads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 5. Cookie parser
app.use(cookieParser());

// 6. NoSQL injection sanitisation (express-mongo-sanitize removed due to Express 5 compat)

// 7. XSS sanitisation (xss-clean removed due to Express 5 compatibility)

// 8. Global rate limiter (DISABLED FOR DEMO STABILITY)
/*
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);
*/
app.set('trust proxy', 1);

// ── Health Check & Root ───────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: '🚀 SafeRoute Enterprise API is active',
        documentation: 'https://render.com/docs',
        health: '/health'
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'healthy',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
    });
});

// ── API Routes (v1) ───────────────────────────────────────────────────────────
const API = '/api';
app.use(`${API}/auth`,        authRoutes);
app.use(`${API}/ai/chat`,     chatbotRoute);
app.use(`${API}/ai/session`,  sessionRoute);
app.use(`${API}/attendance`,  attendanceRoute);
app.use(`${API}/student`,     studentRoutes);
app.use(`${API}/bus`,         busRoutes);
app.use(`${API}/stats`,       statsRoutes);
app.use(`${API}/alerts`,      alertRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Server Start ──────────────────────────────────────────────────────────────
server.listen(PORT, () => {
    console.log(`🚀 SafeRoute Server running on PORT ${PORT} [${process.env.NODE_ENV}]`);
});

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
const shutdown = (signal) => {
    console.log(`\n⚠️  ${signal} received — shutting down gracefully...`);
    server.close(() => {
        console.log('🔒 HTTP server closed');
        process.exit(0);
    });
    // Force exit after 10s if pending connections linger
    setTimeout(() => {
        console.error('💀 Forcing exit after timeout');
        process.exit(1);
    }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
    console.error('🔥 Unhandled Promise Rejection:', reason);
    // Don't crash in production — log and continue
    if (process.env.NODE_ENV !== 'production') process.exit(1);
});

module.exports = { app, server, io };