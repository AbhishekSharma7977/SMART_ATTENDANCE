/**
 * SafeRoute — MongoDB Atlas Connection Manager
 * 
 * Features:
 *  - Validates MONGO_URI before attempting connection
 *  - Enterprise Connection Pooling for Atlas
 *  - Graceful Shutdown handling (SIGINT/SIGTERM)
 *  - Server selection & socket timeout tuning
 */

const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        console.error('❌ FATAL: MONGO_URI is not defined in environment variables.');
        console.error('👉 Please check your .env file or cloud environment configuration.');
        process.exit(1);
    }

    try {
        console.log(`🔌 Attempting MongoDB connection to host: ${new URL(uri).host}...`);
        const conn = await mongoose.connect(uri, {
            // Enterprise Atlas connection pool settings
            maxPoolSize: 50,          // Atlas scalable pool
            minPoolSize: 5,           // Maintain active connections to reduce cold start latency
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4                 // Use IPv4, skip trying IPv6
        });

        console.log(`✅ MongoDB Atlas connected successfully!`);
        console.log(`🌐 Cluster Host: ${conn.connection.host}`);
    } catch (err) {
        console.error(`❌ MongoDB connection error: ${err.message}`);
        // Atlas diagnostic hint
        if (err.message.includes('bad auth')) {
            console.error('👉 Hint: Check if your MongoDB Atlas username/password in environment variables is correct.');
        } else if (err.message.includes('querySrv') || err.message.includes('timeout')) {
            console.error('👉 Hint: Ensure your network/IP is whitelisted (0.0.0.0/0) in MongoDB Atlas Network Access.');
        }
        
        // Wait briefly for logs to flush before exiting
        setTimeout(() => process.exit(1), 500);
    }
};

// ── Connection Event Listeners ────────────────────────────────────────────────
mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB Atlas disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
    console.info('🔄 MongoDB Atlas reconnected successfully.');
});

mongoose.connection.on('error', (err) => {
    console.error(`❌ MongoDB Atlas runtime error: ${err.message}`);
});

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🛑 MongoDB Atlas connection closed due to app termination (SIGINT).');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await mongoose.connection.close();
    console.log('🛑 MongoDB Atlas connection closed due to app termination (SIGTERM).');
    process.exit(0);
});

module.exports = connectDB;