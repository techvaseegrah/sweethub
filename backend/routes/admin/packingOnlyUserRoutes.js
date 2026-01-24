const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Role = require('../../models/Role');
const bcrypt = require('bcrypt');
const adminAuth = require('../../middleware/auth');

// Before Packing Only User Routes
router.post('/before-packing-only-users', adminAuth, async (req, res) => {
    const { username, password, name } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Find the before-packing-only role
        const beforePackingOnlyRole = await Role.findOne({ name: 'before-packing-only' });
        if (!beforePackingOnlyRole) {
            return res.status(500).json({ message: 'Before packing-only role not found' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create the new user
        const newUser = new User({
            name: name || username,
            username,
            password: hashedPassword,
            role: beforePackingOnlyRole._id,
        });

        await newUser.save();

        res.status(201).json({
            message: 'Before packing-only user created successfully',
            user: {
                _id: newUser._id,
                username: newUser.username,
                name: newUser.name,
                role: 'before-packing-only'
            }
        });
    } catch (error) {
        console.error('Error creating before packing-only user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/before-packing-only-users', adminAuth, async (req, res) => {
    try {
        const beforePackingOnlyRole = await Role.findOne({ name: 'before-packing-only' });
        if (!beforePackingOnlyRole) {
            return res.status(404).json({ message: 'Before packing-only role not found' });
        }

        const users = await User.find({ 
            role: beforePackingOnlyRole._id,
            $or: [
                { shop: { $exists: false } },
                { shop: null }
            ]
        })
            .select('-password')
            .populate('role', 'name');

        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching before packing-only users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/before-packing-only-users/:id', adminAuth, async (req, res) => {
    const { id } = req.params;
    const { username, password, name } = req.body;

    try {
        const user = await User.findOne({ 
            _id: id, 
            $or: [
                { shop: { $exists: false } },
                { shop: null }
            ]
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found or not authorized' });
        }

        const beforePackingOnlyRole = await Role.findOne({ name: 'before-packing-only' });
        if (!beforePackingOnlyRole || user.role.toString() !== beforePackingOnlyRole._id.toString()) {
            return res.status(400).json({ message: 'User is not a before packing-only user' });
        }

        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already exists' });
            }
            user.username = username;
        }

        if (name) {
            user.name = name;
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            user.password = hashedPassword;
        }

        await user.save();

        res.status(200).json({
            message: 'Before packing-only user updated successfully',
            user: {
                _id: user._id,
                username: user.username,
                name: user.name,
                role: 'before-packing-only'
            }
        });
    } catch (error) {
        console.error('Error updating before packing-only user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/before-packing-only-users/:id', adminAuth, async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findOne({ 
            _id: id, 
            $or: [
                { shop: { $exists: false } },
                { shop: null }
            ]
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found or not authorized' });
        }

        const beforePackingOnlyRole = await Role.findOne({ name: 'before-packing-only' });
        if (!beforePackingOnlyRole || user.role.toString() !== beforePackingOnlyRole._id.toString()) {
            return res.status(400).json({ message: 'User is not a before packing-only user' });
        }

        await User.findByIdAndDelete(id);

        res.status(200).json({ message: 'Before packing-only user deleted successfully' });
    } catch (error) {
        console.error('Error deleting before packing-only user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// After Packing Only User Routes
router.post('/after-packing-only-users', adminAuth, async (req, res) => {
    const { username, password, name } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Find the after-packing-only role
        const afterPackingOnlyRole = await Role.findOne({ name: 'after-packing-only' });
        if (!afterPackingOnlyRole) {
            return res.status(500).json({ message: 'After packing-only role not found' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create the new user
        const newUser = new User({
            name: name || username,
            username,
            password: hashedPassword,
            role: afterPackingOnlyRole._id,
        });

        await newUser.save();

        res.status(201).json({
            message: 'After packing-only user created successfully',
            user: {
                _id: newUser._id,
                username: newUser.username,
                name: newUser.name,
                role: 'after-packing-only'
            }
        });
    } catch (error) {
        console.error('Error creating after packing-only user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/after-packing-only-users', adminAuth, async (req, res) => {
    try {
        const afterPackingOnlyRole = await Role.findOne({ name: 'after-packing-only' });
        if (!afterPackingOnlyRole) {
            return res.status(404).json({ message: 'After packing-only role not found' });
        }

        const users = await User.find({ 
            role: afterPackingOnlyRole._id,
            $or: [
                { shop: { $exists: false } },
                { shop: null }
            ]
        })
            .select('-password')
            .populate('role', 'name');

        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching after packing-only users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/after-packing-only-users/:id', adminAuth, async (req, res) => {
    const { id } = req.params;
    const { username, password, name } = req.body;

    try {
        const user = await User.findOne({ 
            _id: id, 
            $or: [
                { shop: { $exists: false } },
                { shop: null }
            ]
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found or not authorized' });
        }

        const afterPackingOnlyRole = await Role.findOne({ name: 'after-packing-only' });
        if (!afterPackingOnlyRole || user.role.toString() !== afterPackingOnlyRole._id.toString()) {
            return res.status(400).json({ message: 'User is not an after packing-only user' });
        }

        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already exists' });
            }
            user.username = username;
        }

        if (name) {
            user.name = name;
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            user.password = hashedPassword;
        }

        await user.save();

        res.status(200).json({
            message: 'After packing-only user updated successfully',
            user: {
                _id: user._id,
                username: user.username,
                name: user.name,
                role: 'after-packing-only'
            }
        });
    } catch (error) {
        console.error('Error updating after packing-only user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/after-packing-only-users/:id', adminAuth, async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findOne({ 
            _id: id, 
            $or: [
                { shop: { $exists: false } },
                { shop: null }
            ]
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found or not authorized' });
        }

        const afterPackingOnlyRole = await Role.findOne({ name: 'after-packing-only' });
        if (!afterPackingOnlyRole || user.role.toString() !== afterPackingOnlyRole._id.toString()) {
            return res.status(400).json({ message: 'User is not an after packing-only user' });
        }

        await User.findByIdAndDelete(id);

        res.status(200).json({ message: 'After packing-only user deleted successfully' });
    } catch (error) {
        console.error('Error deleting after packing-only user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;