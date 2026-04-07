const User = require('../../models/User');
const Role = require('../../models/Role');
const bcrypt = require('bcrypt');

async function createBeforePackingOnlyUser(req, res) {
    const { username, password, name, allowedCategories } = req.body;

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

        // Create the new user - before packing users are not associated with shops
        const newUser = new User({
            name: name || username, // Use username as name if name is not provided
            username,
            password: hashedPassword,
            role: beforePackingOnlyRole._id,
            allowedCategories: allowedCategories || [],
            // No shop association for admin before packing-only users
        });

        await newUser.save();
        await newUser.populate('allowedCategories', 'name');

        res.status(201).json({
            message: 'Before packing-only user created successfully',
            user: {
                _id: newUser._id,
                username: newUser.username,
                name: newUser.name,
                role: 'before-packing-only',
                allowedCategories: newUser.allowedCategories
            }
        });
    } catch (error) {
        console.error('Error creating before packing-only user:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

async function getAllBeforePackingOnlyUsers(req, res) {
    try {
        const beforePackingOnlyRole = await Role.findOne({ name: 'before-packing-only' });
        if (!beforePackingOnlyRole) {
            return res.status(404).json({ message: 'Before packing-only role not found' });
        }

        // Only return admin before-packing-only users (those without shop association)
        const users = await User.find({ 
            role: beforePackingOnlyRole._id,
            $or: [
                { shop: { $exists: false } },  // Users without shop association (admin-created)
                { shop: null }  // Also include users where shop is explicitly null
            ]
        })
            .select('-password') // Don't return password
            .populate('role', 'name')
            .populate('allowedCategories', 'name');

        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching before packing-only users:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

async function updateBeforePackingOnlyUser(req, res) {
    const { id } = req.params;
    const { username, password, name, allowedCategories } = req.body;

    try {
        // Only find admin before-packing-only users (those without shop association)
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

        // Verify that the user has before-packing-only role
        const beforePackingOnlyRole = await Role.findOne({ name: 'before-packing-only' });
        if (!beforePackingOnlyRole || user.role.toString() !== beforePackingOnlyRole._id.toString()) {
            return res.status(400).json({ message: 'User is not a before packing-only user' });
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

        if (allowedCategories) {
            user.allowedCategories = allowedCategories;
        }

        await user.save();
        await user.populate('allowedCategories', 'name');

        res.status(200).json({
            message: 'Before packing-only user updated successfully',
            user: {
                _id: user._id,
                username: user.username,
                name: user.name,
                role: 'before-packing-only',
                allowedCategories: user.allowedCategories
            }
        });
    } catch (error) {
        console.error('Error updating before packing-only user:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

async function deleteBeforePackingOnlyUser(req, res) {
    const { id } = req.params;

    try {
        // Only find admin before-packing-only users (those without shop association)
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

        // Verify that the user has before-packing-only role
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
}

module.exports = {
    createBeforePackingOnlyUser,
    getAllBeforePackingOnlyUsers,
    updateBeforePackingOnlyUser,
    deleteBeforePackingOnlyUser
};