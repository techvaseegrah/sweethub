const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Role = require('../models/Role');

const debugAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const adminUser = await User.findOne({ username: 'admin' }).populate('role');
        console.log('Admin User:', adminUser);

        if (!adminUser) {
            console.log('Admin user not found!');
        } else {
            console.log('Admin Role:', adminUser.role);
            if (!adminUser.role) {
                console.log('Role is null! Attempting to fix...');
                let adminRole = await Role.findOne({ name: 'admin' });
                if (!adminRole) {
                    console.log('Admin role not found in DB! Creating one...');
                    adminRole = new Role({ name: 'admin' });
                    await adminRole.save();
                }
                adminUser.role = adminRole._id;
                await adminUser.save();
                console.log('Admin user role updated.');
            }
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

debugAdmin();
