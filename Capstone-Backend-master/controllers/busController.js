/**
 * SafeRoute — Bus Controller (Enterprise Edition)
 * 
 * Fixes:
 *  - Fixed io key: was 'io', must be 'socketio' to match index.js
 *  - GPS coordinate validation (range checks, numeric type)
 *  - Bus-specific Socket.IO room broadcasts (not global emit)
 *  - getAllBusLocations now requires auth
 *  - GeoJSON coordinates (longitude, latitude order)
 *  - Structured busId from branch field (not fragile fullname parsing)
 *  - Location staleness indicator
 */

const User = require('../models/userModel');

// Location freshness threshold: 5 minutes
const STALE_THRESHOLD_MS = 5 * 60 * 1000;

// ── POST /api/bus/update-location ─────────────────────────────────────────────
module.exports.updateLocation = async (req, res) => {
    try {
        const { lat, lng, x, y } = req.body;

        // Accept both lat/lng (preferred) and legacy x/y for compatibility
        const latitude  = lat !== undefined ? lat : y;
        const longitude = lng !== undefined ? lng : x;

        // 1. Validate coordinates
        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Latitude and longitude are required (lat, lng) or legacy (x, y)',
            });
        }

        const lat_n = parseFloat(latitude);
        const lng_n = parseFloat(longitude);

        if (isNaN(lat_n) || isNaN(lng_n)) {
            return res.status(400).json({
                success: false,
                error: 'Latitude and longitude must be numeric values',
            });
        }

        if (lat_n < -90 || lat_n > 90) {
            return res.status(400).json({
                success: false,
                error: 'Latitude must be between -90 and 90',
            });
        }

        if (lng_n < -180 || lng_n > 180) {
            return res.status(400).json({
                success: false,
                error: 'Longitude must be between -180 and 180',
            });
        }

        // 2. Update in DB — GeoJSON format [longitude, latitude]
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                'location.coordinates': [lng_n, lat_n],
                'location.lastUpdated': new Date(),
            },
            { new: true, runValidators: true }
        ).select('fullname branch location');

        if (!updatedUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // 3. Emit to targeted bus room (not all clients)
        //    Bus branch is embedded in JWT and stored on user (e.g. 'bus-B11')
        const io = req.app.get('socketio');
        const busId = updatedUser.branch || updatedUser.fullname;

        const locationPayload = {
            busId,
            lat: lat_n,
            lng: lng_n,
            // Legacy support for frontend using x/y
            x: lat_n,
            y: lng_n,
            updatedAt: updatedUser.location.lastUpdated,
        };

        if (io) {
            // Emit to bus-specific room + parents room + admin room
            io.to(`bus:${busId}`).emit('bus-location-updated', locationPayload);
            io.to('role:parent').emit('bus-location-updated', locationPayload);
            io.to('role:admin').emit('bus-location-updated', locationPayload);
        }

        return res.status(200).json({
            success: true,
            message: 'Location updated and broadcasted',
            data: locationPayload,
        });

    } catch (err) {
        console.error('[updateLocation]', err.message);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

// ── GET /api/bus/all ──────────────────────────────────────────────────────────
module.exports.getAllBusLocations = async (req, res) => {
    try {
        const buses = await User.find({ role: 'staff', branch: /^bus/i })
            .select('branch location fullname')
            .lean();

        const now = Date.now();

        const formattedBuses = buses.map((bus) => {
            const [lng, lat] = bus.location?.coordinates || [0, 0];
            const lastUpdated = bus.location?.lastUpdated;
            const isStale = lastUpdated
                ? now - new Date(lastUpdated).getTime() > STALE_THRESHOLD_MS
                : true;

            return {
                busId:       bus.branch || bus.fullname,
                driverName:  bus.fullname,
                lat,
                lng,
                // Legacy x/y for frontend compatibility
                x: lat,
                y: lng,
                updatedAt:   lastUpdated,
                isStale,     // true if location not updated in last 5 minutes
            };
        });

        return res.status(200).json({
            success: true,
            count: formattedBuses.length,
            data:  formattedBuses,
        });
    } catch (err) {
        console.error('[getAllBusLocations]', err.message);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};
