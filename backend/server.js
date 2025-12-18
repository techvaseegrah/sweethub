const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Load environment variables first
dotenv.config();

// --- Import Models ---
const User = require('./models/User');
const Role = require('./models/Role');

// --- Import Routes ---
const authRoutes = require('./routes/authRoutes');

// ADMIN ROUTES
// We use adminBillRoutes (Make sure the file is named exactly this)
const adminBillRoutes = require('./routes/admin/adminBillRoutes'); 
const departmentRoutes = require('./routes/admin/adminDepartmentRoutes');
const workerRoutes = require('./routes/admin/adminWorkerRoutes');
const productRoutes = require('./routes/admin/adminProductRoutes');
const productHistoryRoutes = require('./routes/admin/adminProductHistoryRoutes');
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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads', 'faces');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const app = express();
const PORT = process.env.PORT || 5001;

// --- CREATE REQUIRED DIRECTORIES ---
const uploadsDir = path.join(__dirname, 'uploads');
const knownFacesDir = path.join(__dirname, 'known_faces');
const facesDir = path.join(__dirname, 'uploads', 'faces');
const expenseAttachmentsDir = path.join(__dirname, 'uploads', 'expense-attachments');
const modelsDir = path.join(__dirname, 'models');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(knownFacesDir)) fs.mkdirSync(knownFacesDir, { recursive: true });
if (!fs.existsSync(facesDir)) fs.mkdirSync(facesDir, { recursive: true });
if (!fs.existsSync(expenseAttachmentsDir)) fs.mkdirSync(expenseAttachmentsDir, { recursive: true });
if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });

const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(uploadsDir));
app.use('/models', express.static(modelsDir));

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected...');
        initializeRolesAndAdmin();
    })
    .catch(err => console.error('MongoDB connection error:', err));

const initializeRolesAndAdmin = async () => {
    try {
        for (const roleName of ['admin', 'worker', 'shop']) {
            if (!(await Role.findOne({ name: roleName }))) {
                await new Role({ name: roleName }).save();
            }
        }
        const adminRole = await Role.findOne({ name: 'admin' });
        const adminExists = await User.findOne({ role: adminRole._id });

        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);
            await new User({
                name: 'Admin',
                username: 'admin',
                password: hashedPassword,
                role: adminRole._id,
                isVerified: true
            }).save();
            console.log('Default admin user created.');
        }
    } catch (error) {
        console.error('Error initializing roles:', error);
    }
};

// --- ROUTES MOUNTING ---
app.use('/api/auth', authRoutes);

// ADMIN
// === FIX: CHANGED PATH TO INCLUDE /api ===
app.use('/api/admin', adminBillRoutes); 
app.use('/api/admin/departments', departmentRoutes);
app.use('/api/admin/workers', workerRoutes);
app.use('/api/admin/products', productRoutes);
app.use('/api/admin/product-history', productHistoryRoutes);
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

app.get('/', (req, res) => res.send('API is running...'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));