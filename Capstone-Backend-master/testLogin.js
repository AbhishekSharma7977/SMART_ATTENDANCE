require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/userModel');
const bcrypt = require('bcrypt');

const testReg = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const hash = await bcrypt.hash('secret123', 12);
        console.log('Generated hash:', hash);
        
        const userData = {
            fullname: 'Test User',
            email: 'test3@saferoute.com',
            password: hash,
            role: 'staff'
        };

        const [newUser] = await User.create([userData]);
        console.log('User created:', newUser.email, newUser.password);
        
        const dbUser = await User.findOne({email: 'test3@saferoute.com'}).select('+password');
        console.log('User retrieved:', dbUser.password);
        
        const isMatch = await bcrypt.compare('secret123', dbUser.password);
        console.log('Password matches?', isMatch);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

testReg();
