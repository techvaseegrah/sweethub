const User = require('../../models/User');
const Role = require('../../models/Role');
const bcrypt = require('bcrypt');

// Create a new attendance-only user (admin only)
exports.createAttendanceOnlyUser = async (req, res) => {
    const { username, password, name } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Find the attendance-only role
        const attendanceOnlyRole = await Role.findOne({ name: 'attendance-only' });
        if (!attendanceOnlyRole) {
            return res.status(500).json({ message: 'Attendance-only role not found' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create the new user - admin attendance users are not associated with shops
        const newUser = new User({
            name: name || username, // Use username as name if name is not provided
            username,
            password: hashedPassword,
            role: attendanceOnlyRole._id,
            // No shop association for admin attendance-only users
        });

        await newUser.save();

        res.status(201).json({
            message: 'Attendance-only user created successfully',
            user: {
                _id: newUser._id,
                username: newUser.username,
                name: newUser.name,
                role: 'attendance-only'
            }
        });
    } catch (error) {
        console.error('Error creating attendance-only user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all attendance-only users (admin only)
exports.getAllAttendanceOnlyUsers = async (req, res) => {
    try {
        const attendanceOnlyRole = await Role.findOne({ name: 'attendance-only' });
        if (!attendanceOnlyRole) {
            return res.status(404).json({ message: 'Attendance-only role not found' });
        }

        // Only return admin attendance-only users (those without shop association)
        const users = await User.find({ 
            role: attendanceOnlyRole._id,
            $or: [
                { shop: { $exists: false } },  // Users without shop association (admin-created)
                { shop: null }  // Also include users where shop is explicitly null
            ]
        })
            .select('-password') // Don't return password
            .populate('role', 'name');

        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching attendance-only users:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update an attendance-only user (admin only)
exports.updateAttendanceOnlyUser = async (req, res) => {
    const { id } = req.params;
    const { name, username, password } = req.body;

    try {
        // Only find admin attendance-only users (those without shop association)
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

        // Verify that the user has attendance-only role
        const attendanceOnlyRole = await Role.findOne({ name: 'attendance-only' });
        if (!attendanceOnlyRole || user.role.toString() !== attendanceOnlyRole._id.toString()) {
            return res.status(400).json({ message: 'User is not an attendance-only user' });
        }

        // Check if username is being changed and if it already exists
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username, _id: { $ne: id } });
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
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();

        res.status(200).json({
            message: 'Attendance-only user updated successfully',
            user: {
                _id: user._id,
                username: user.username,
                name: user.name,
                role: 'attendance-only'
            }
        });
    } catch (error) {
        console.error('Error updating attendance-only user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete an attendance-only user (admin only)
exports.deleteAttendanceOnlyUser = async (req, res) => {
    const { id } = req.params;

    try {
        // Only find admin attendance-only users (those without shop association)
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

        // Verify that the user has attendance-only role
        const attendanceOnlyRole = await Role.findOne({ name: 'attendance-only' });
        if (!attendanceOnlyRole || user.role.toString() !== attendanceOnlyRole._id.toString()) {
            return res.status(400).json({ message: 'User is not an attendance-only user' });
        }

        await User.findByIdAndDelete(id);

        res.status(200).json({
            message: 'Attendance-only user deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting attendance-only user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};