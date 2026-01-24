const User = require('../../models/User');
const Role = require('../../models/Role');
const bcrypt = require('bcrypt');

// Create a new raw-materials-only user (admin only)
exports.createRawMaterialOnlyUser = async (req, res) => {
    const { username, password, name } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Find the raw-materials-only role
        const rawMaterialOnlyRole = await Role.findOne({ name: 'raw-materials-only' });
        if (!rawMaterialOnlyRole) {
            return res.status(500).json({ message: 'Raw materials-only role not found' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create the new user - raw materials users are not associated with shops
        const newUser = new User({
            name: name || username, // Use username as name if name is not provided
            username,
            password: hashedPassword,
            role: rawMaterialOnlyRole._id,
            // No shop association for admin raw materials-only users
        });

        await newUser.save();

        res.status(201).json({
            message: 'Raw materials-only user created successfully',
            user: {
                _id: newUser._id,
                username: newUser.username,
                name: newUser.name,
                role: 'raw-materials-only'
            }
        });
    } catch (error) {
        console.error('Error creating raw materials-only user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all raw materials-only users (admin only)
exports.getAllRawMaterialOnlyUsers = async (req, res) => {
    try {
        const rawMaterialOnlyRole = await Role.findOne({ name: 'raw-materials-only' });
        if (!rawMaterialOnlyRole) {
            return res.status(404).json({ message: 'Raw materials-only role not found' });
        }

        // Only return admin raw-materials-only users (those without shop association)
        const users = await User.find({ 
            role: rawMaterialOnlyRole._id,
            $or: [
                { shop: { $exists: false } },  // Users without shop association (admin-created)
                { shop: null }  // Also include users where shop is explicitly null
            ]
        })
            .select('-password') // Don't return password
            .populate('role', 'name');

        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching raw materials-only users:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a raw materials-only user (admin only)
exports.updateRawMaterialOnlyUser = async (req, res) => {
    const { id } = req.params;
    const { username, password, name } = req.body;

    try {
        // Only find admin raw-materials-only users (those without shop association)
        const user = await User.findOne({ 
            _id: id, 
            $or: [
                { shop: { $exists: false } },  // Users without shop association (admin-created)
                { shop: null }  // Also include users where shop is explicitly null
            ]
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found or not authorized' });
        }

        // Verify that the user has raw-materials-only role
        const rawMaterialOnlyRole = await Role.findOne({ name: 'raw-materials-only' });
        if (!rawMaterialOnlyRole || user.role.toString() !== rawMaterialOnlyRole._id.toString()) {
            return res.status(400).json({ message: 'User is not a raw materials-only user' });
        }

        // Check if username is being changed and if the new username already exists
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
            message: 'Raw materials-only user updated successfully',
            user: {
                _id: user._id,
                username: user.username,
                name: user.name,
                role: 'raw-materials-only'
            }
        });
    } catch (error) {
        console.error('Error updating raw materials-only user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a raw materials-only user (admin only)
exports.deleteRawMaterialOnlyUser = async (req, res) => {
    const { id } = req.params;

    try {
        // Only find admin raw-materials-only users (those without shop association)
        const user = await User.findOne({ 
            _id: id, 
            $or: [
                { shop: { $exists: false } },  // Users without shop association (admin-created)
                { shop: null }  // Also include users where shop is explicitly null
            ]
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found or not authorized' });
        }

        // Verify that the user has raw-materials-only role
        const rawMaterialOnlyRole = await Role.findOne({ name: 'raw-materials-only' });
        if (!rawMaterialOnlyRole || user.role.toString() !== rawMaterialOnlyRole._id.toString()) {
            return res.status(400).json({ message: 'User is not a raw materials-only user' });
        }

        await User.findByIdAndDelete(id);

        res.status(200).json({
            message: 'Raw materials-only user deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting raw materials-only user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};