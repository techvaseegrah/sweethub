require('dotenv').config();
const mongoose = require('mongoose');
const { loginUser } = require('../controllers/authController');

const simulateLogin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const req = {
            body: {
                username: 'admin',
                password: 'admin_password_123'
            }
        };

        const res = {
            status: (code) => {
                console.log(`Response Status: ${code}`);
                return res; // Chainable
            },
            json: (data) => {
                console.log('Response JSON:', data);
            }
        };

        console.log('Calling loginUser...');
        await loginUser(req, res);

        // Wait a bit before exiting in case of async issues
        setTimeout(() => process.exit(), 1000);

    } catch (error) {
        console.error('Simulation Error:', error);
        process.exit(1);
    }
};

simulateLogin();
