require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const testDeps = async () => {
    console.log('Testing Environment Variables...');
    if (!process.env.JWT_SECRET) {
        console.error('ERROR: JWT_SECRET is missing!');
    } else {
        console.log('JWT_SECRET is present (length:', process.env.JWT_SECRET.length, ')');
    }

    console.log('\nTesting bcrypt...');
    const password = 'admin_password_123';
    const hash = '$2b$10$aFnxkOeVUKABw32XsnZrHuSrFRV0noyWTIK1ktQiNr8YkesKfqw4q'; // From user debug output
    try {
        const isMatch = await bcrypt.compare(password, hash);
        console.log('bcrypt.compare result:', isMatch);
    } catch (error) {
        console.error('bcrypt error:', error);
    }

    console.log('\nTesting jsonwebtoken...');
    try {
        const token = jwt.sign({ id: '123', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log('Token generated successfully:', token.substring(0, 20) + '...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified successfully:', decoded);
    } catch (error) {
        console.error('jwt error:', error);
    }
};

testDeps();
