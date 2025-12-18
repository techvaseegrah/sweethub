const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Role = require('../models/Role');
const Shop = require('../models/shopModel');

const generateToken = (id, role, shopId = null) => {
    return jwt.sign({ id, role, shopId }, process.env.JWT_SECRET, {
        expiresIn: '24h', // Extended from 1h to 24h
    });
};

exports.registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const workerRole = await Role.findOne({ name: 'worker' });
        if (!workerRole) {
            return res.status(500).json({ message: 'Worker role not found' });
        }

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: workerRole._id,
        });

        await newUser.save();

        res.status(201).json({
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: workerRole.name,
            token: generateToken(newUser._id, workerRole.name),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username }).populate('role');
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        let shopId = null;
        // If the user is a shop admin, find their shop ID
        if (user.role.name === 'shop') {
            const shop = await Shop.findOne({ user: user._id });
            if (shop) {
                shopId = shop._id;
            }
        }

        // Add shopId to the token payload
        const token = jwt.sign(
            { id: user._id, role: user.role.name, shopId }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' } // Extended from 1h to 24h
        );

        res.status(200).json({
            _id: user._id,
            name: user.name,
            role: user.role.name,
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};