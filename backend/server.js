require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

// Enable CORS for all routes
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));

// ADMIN ROUTES
const adminBillRoutes = require('./routes/admin/adminBillRoutes');
const adminProductRoutes = require('./routes/admin/adminProductRoutes');
const adminWorkerRoutes = require('./routes/admin/adminWorkerRoutes');
const adminDepartmentRoutes = require('./routes/admin/adminDepartmentRoutes');
const adminShopRoutes = require('./routes/admin/adminShopRoutes');
const salaryRoutes = require('./routes/admin/salaryRoutes');
const shopAdminRoutes = require('./routes/admin/adminShopRoutes');
const categoryRoutes = require('./routes/admin/categoryRoutes');
const adminTaskRoutes = require('./routes/admin/adminTaskRoutes');
const adminWarehouseRoutes = require('./routes/admin/adminWarehouseRoutes');
const dailyScheduleRoutes = require('./routes/admin/dailyScheduleRoutes');
const adminReturnProductRoutes = require('./routes/admin/adminReturnProductRoutes');
const revenueRoutes = require('./routes/admin/revenueRoutes');
const adminAttendanceRoutes = require('./routes/admin/adminAttendanceRoutes');
const adminInvoiceRoutes = require('./routes/admin/invoiceRoutes');
const profitLossRoutes = require('./routes/admin/profitLossRoutes');
const adminSettingsRoutes = require('./routes/admin/adminSettingsRoutes');
const incentiveRoutes = require('./routes/admin/incentiveRoutes');
const holidayRoutes = require('./routes/admin/holidayRoutes');
const adminExpenseRoutes = require('./routes/admin/adminExpenseRoutes');
const adminProductHistoryRoutes = require('./routes/admin/adminProductHistoryRoutes');
const adminAttendanceOnlyUserRoutes = require('./routes/admin/attendanceOnlyUserRoutes');
const adminRawMaterialOnlyUserRoutes = require('./routes/admin/rawMaterialOnlyUserRoutes');
const adminOrderRoutes = require('./routes/admin/orderRoutes');
const productionReportRoutes = require('./routes/admin/productionReportRoutes');
const stockReportRoutes = require('./routes/admin/stockReportRoutes');
const gstReportRoutes = require('./routes/admin/gstReportRoutes');
const adminProductBillingUserRoutes = require('./routes/admin/productBillingUserRoutes');


// SHOP ROUTES
const shopRoutes = require('./routes/shop/shopRoutes');
// We use shopBillRoutes (Make sure the file is named exactly this)
const shopBillRoutes = require('./routes/shop/shopBillRoutes');
const shopDepartmentRoutes = require('./routes/shop/shopDepartmentRoutes');
const shopWorkerRoutes = require('./routes/shop/shopWorkerRoutes');
const shopProductRoutes = require('./routes/shop/shopProductRoutes');
const shopCategoryRoutes = require('./routes/shop/shopCategoryRoutes');
const shopAttendanceRoutes = require('./routes/shop/shopAttendanceRoutes');
const shopInvoiceRoutes = require('./routes/shop/invoiceRoutes');
const shopExpenseRoutes = require('./routes/shop/shopExpenseRoutes');
const shopReturnProductRoutes = require('./routes/shop/shopReturnProductRoutes');
// Import shop settings routes
const shopSettingsRoutes = require('./routes/shop/shopSettingsRoutes');
const shopAttendanceOnlyUserRoutes = require('./routes/shop/shopAttendanceOnlyUserRoutes');
const shopOrderRoutes = require('./routes/shop/orderRoutes');
const shopMixedSweetRoutes = require('./routes/shop/mixedSweetRoutes');
const shopProductBillingUserRoutes = require('./routes/shop/shopProductBillingUserRoutes');

const PORT = process.env.PORT || 5000;

// ADMIN
app.use('/api/admin/bills', adminBillRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/workers', adminWorkerRoutes);
app.use('/api/admin/departments', adminDepartmentRoutes);
app.use('/api/admin/salary', salaryRoutes);
app.use('/api/admin/shops', shopAdminRoutes);
app.use('/api/admin/categories', categoryRoutes);
app.use('/api/admin/tasks', adminTaskRoutes);
app.use('/api/admin/warehouse', adminWarehouseRoutes);
app.use('/api/admin/daily-schedule', dailyScheduleRoutes);
app.use('/api/admin/returns', adminReturnProductRoutes);
app.use('/api/admin/revenue', revenueRoutes);
app.use('/api/admin/attendance', adminAttendanceRoutes);
app.use('/api/admin/invoices', adminInvoiceRoutes);
app.use('/api/admin/profit-loss', profitLossRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/admin/incentives', incentiveRoutes);
app.use('/api/admin/holidays', holidayRoutes);
app.use('/api/admin/expenses', adminExpenseRoutes);
app.use('/api/admin/product-history', adminProductHistoryRoutes);
app.use('/api/admin/attendance-only-users', adminAttendanceOnlyUserRoutes);
app.use('/api/admin/raw-materials-only-users', adminRawMaterialOnlyUserRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/reports/production', productionReportRoutes);
app.use('/api/admin/reports/stock', stockReportRoutes);
app.use('/api/admin/reports/gst', gstReportRoutes);
app.use('/api/admin/product-billing-users', adminProductBillingUserRoutes);


// SHOP
app.use('/api/shop', shopRoutes);
// === FIX: CHANGED PATH TO INCLUDE /api ===
app.use('/api/shop', shopBillRoutes);
app.use('/api/shop/departments', shopDepartmentRoutes);
app.use('/api/shop/workers', shopWorkerRoutes);
app.use('/api/shop/products', shopProductRoutes);
app.use('/api/shop/categories', shopCategoryRoutes);
app.use('/api/shop/attendance', shopAttendanceRoutes);
app.use('/api/shop/invoices', shopInvoiceRoutes);
app.use('/api/shop/expenses', shopExpenseRoutes);
app.use('/api/shop/returns', shopReturnProductRoutes);
// Register shop settings routes
app.use('/api/shop/settings', shopSettingsRoutes);
// Register shop attendance-only user routes
app.use('/api/shop/attendance-only-users', shopAttendanceOnlyUserRoutes);
app.use('/api/shop/orders', shopOrderRoutes);
app.use('/api/shop/mixed-sweets', shopMixedSweetRoutes);
app.use('/api/shop/product-history', require('./routes/shop/shopProductHistoryRoutes'));
app.use('/api/shop/product-billing-users', shopProductBillingUserRoutes);

// Add Before Packing and After Packing user routes after all other routes
const User = require('./models/User');
const Role = require('./models/Role');
const bcrypt = require('bcrypt');
const { adminAuth } = require('./middleware/auth');

// Before Packing Only User Routes
app.post('/api/admin/before-packing-only-users', adminAuth, async (req, res) => {
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

        // Create the new user
        const newUser = new User({
            name: name || username,
            username,
            password: hashedPassword,
            role: beforePackingOnlyRole._id,
            allowedCategories: allowedCategories || []
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
});

app.get('/api/admin/before-packing-only-users', adminAuth, async (req, res) => {
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
            .populate('role', 'name')
            .populate('allowedCategories', 'name');

        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching before packing-only users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/admin/before-packing-only-users/:id', adminAuth, async (req, res) => {
    const { id } = req.params;
    const { username, password, name, allowedCategories } = req.body;

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

        if (allowedCategories) {
            user.allowedCategories = allowedCategories;
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            user.password = hashedPassword;
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
});

app.delete('/api/admin/before-packing-only-users/:id', adminAuth, async (req, res) => {
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
app.post('/api/admin/after-packing-only-users', adminAuth, async (req, res) => {
    const { username, password, name, allowedCategories } = req.body;

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
            allowedCategories: allowedCategories || []
        });

        await newUser.save();
        await newUser.populate('allowedCategories', 'name');

        res.status(201).json({
            message: 'After packing-only user created successfully',
            user: {
                _id: newUser._id,
                username: newUser.username,
                name: newUser.name,
                role: 'after-packing-only',
                allowedCategories: newUser.allowedCategories
            }
        });
    } catch (error) {
        console.error('Error creating after packing-only user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/admin/after-packing-only-users', adminAuth, async (req, res) => {
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
            .populate('role', 'name')
            .populate('allowedCategories', 'name');

        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching after packing-only users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/admin/after-packing-only-users/:id', adminAuth, async (req, res) => {
    const { id } = req.params;
    const { username, password, name, allowedCategories } = req.body;

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

        if (allowedCategories) {
            user.allowedCategories = allowedCategories;
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            user.password = hashedPassword;
        }

        await user.save();
        await user.populate('allowedCategories', 'name');

        res.status(200).json({
            message: 'After packing-only user updated successfully',
            user: {
                _id: user._id,
                username: user.username,
                name: user.name,
                role: 'after-packing-only',
                allowedCategories: user.allowedCategories
            }
        });
    } catch (error) {
        console.error('Error updating after packing-only user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/admin/after-packing-only-users/:id', adminAuth, async (req, res) => {
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

app.get('/', (req, res) => res.send('API is running...'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));