require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/userModel.js');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const hashPassword = await bcrypt.hash('admin123', 12);
        const admin = new User({
            fullname: 'Admin User',
            email: 'admin@saferoute.com',
            password: hashPassword,
            role: 'admin',
        });
        await admin.save();
        console.log('Admin user seeded: admin@saferoute.com / admin123');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedAdmin();
