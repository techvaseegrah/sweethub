const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

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

app.get('/', (req, res) => res.send('API is running...'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));