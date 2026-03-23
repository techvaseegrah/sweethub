const User = require('../../models/User');
const Role = require('../../models/Role');
const bcrypt = require('bcrypt');

// Create a new product-billing user (shop side)
exports.createProductBillingShopUser = async (req, res) => {
    const { username, password, name } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Find the product-billing-shop role
        const role = await Role.findOne({ name: 'product-billing-shop' });
        if (!role) {
            return res.status(500).json({ message: 'Product-billing-shop role not found' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // For shop side users, associate with the shop of the creating user
        // Ensure the creating user is a shop user
        if (req.user.role !== 'shop' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only shop users or admins can create these users' });
        }

        // Create the new user
        const newUser = new User({
            name: name || username,
            username,
            password: hashedPassword,
            role: role._id,
            shop: req.shopId, // Associated with the same shop
        });

        await newUser.save();

        res.status(201).json({
            message: 'Product-billing user created successfully',
            user: {
                _id: newUser._id,
                username: newUser.username,
                name: newUser.name,
                role: 'product-billing-shop'
            }
        });
    } catch (error) {
        console.error('Error creating product-billing-shop user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all product-billing-shop users for current shop
exports.getAllProductBillingShopUsers = async (req, res) => {
    try {
        const role = await Role.findOne({ name: 'product-billing-shop' });
        if (!role) {
            return res.status(404).json({ message: 'Product-billing-shop role not found' });
        }

        const users = await User.find({ role: role._id, shop: req.shopId })
            .select('-password')
            .populate('role', 'name');

        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching product-billing-shop users:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a product-billing-shop user
exports.updateProductBillingShopUser = async (req, res) => {
    const { id } = req.params;
    const { name, username, password } = req.body;

    try {
        // Only allow updating users from the same shop
        const user = await User.findOne({ _id: id, shop: req.shopId });
        if (!user) {
            return res.status(404).json({ message: 'User not found or not authorized' });
        }

        const role = await Role.findOne({ name: 'product-billing-shop' });
        if (!role || user.role.toString() !== role._id.toString()) {
            return res.status(400).json({ message: 'User is not a product-billing-shop user' });
        }

        if (username && username !== user.username) {
            const existingUser = await User.findOne({ username, _id: { $ne: id } });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already exists' });
            }
            user.username = username;
        }

        if (name) user.name = name;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();

        res.status(200).json({
            message: 'Product-billing-shop user updated successfully',
            user: {
                _id: user._id,
                username: user.username,
                name: user.name,
                role: 'product-billing-shop'
            }
        });
    } catch (error) {
        console.error('Error updating product-billing-shop user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a product-billing-shop user
exports.deleteProductBillingShopUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findOne({ _id: id, shop: req.shopId });
        if (!user) {
            return res.status(404).json({ message: 'User not found or not authorized' });
        }

        const role = await Role.findOne({ name: 'product-billing-shop' });
        if (!role || user.role.toString() !== role._id.toString()) {
            return res.status(400).json({ message: 'User is not a product-billing-shop user' });
        }

        await User.findByIdAndDelete(id);

        res.status(200).json({ message: 'Product-billing-shop user deleted successfully' });
    } catch (error) {
        console.error('Error deleting product-billing-shop user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
