const mongoose = require('mongoose');
const Role = require('./models/Role');
const dotenv = require('dotenv');

dotenv.config();

const createRoles = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const roles = [
            'product-billing-admin',
            'product-billing-shop'
        ];

        for (const roleName of roles) {
            const existingRole = await Role.findOne({ name: roleName });
            if (!existingRole) {
                await new Role({ name: roleName }).save();
                console.log(`Role ${roleName} created`);
            } else {
                console.log(`Role ${roleName} already exists`);
            }
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error creating roles:', error);
        process.exit(1);
    }
};

createRoles();
