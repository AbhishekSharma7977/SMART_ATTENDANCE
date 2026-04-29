require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/userModel');

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({});
        console.log('--- USERS IN DB ---');
        users.forEach(u => console.log(`Email: ${u.email} | Role: ${u.role}`));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

listUsers();
