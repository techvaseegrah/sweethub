const Expense = require('../../models/expenseModel');
const User = require('../../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for expense attachment uploads
const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/expense-attachments');
    // Ensure the directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'expense-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadAttachment = multer({ 
  storage: attachmentStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
}).single('attachment');

// Upload attachment for an expense
exports.uploadExpenseAttachment = async (req, res) => {
  try {
    uploadAttachment(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Construct the URL for the uploaded file
      const fileUrl = `/uploads/expense-attachments/${req.file.filename}`;
      
      res.status(200).json({ 
        message: 'Attachment uploaded successfully',
        fileUrl: fileUrl,
        fileName: req.file.filename
      });
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ message: 'Failed to upload attachment', error: error.message });
  }
};

// Add a new expense (shop)
exports.addShopExpense = async (req, res) => {
  try {
    const { category, amount, description, date, paymentMode, vendor, attachmentUrl } = req.body;
    
    const newExpense = new Expense({
      category,
      amount,
      description,
      date,
      paymentMode,
      vendor,
      attachmentUrl: attachmentUrl || '', // Save attachment URL if provided
      shop: req.shopId,
      createdBy: req.user.id
    });

    const savedExpense = await newExpense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    console.error('Error adding shop expense:', error);
    res.status(500).json({ message: 'Failed to add expense', error: error.message });
  }
};

// Get all shop expenses
exports.getShopExpenses = async (req, res) => {
  try {
    // Ensure req.shopId is set by authentication middleware
    if (!req.shopId) {
      return res.status(403).json({ message: 'Access denied. No shop associated with this account.' });
    }
    
    const expenses = await Expense.find({ shop: req.shopId })
      .sort({ date: -1, createdAt: -1 });
    
    res.status(200).json(expenses);
  } catch (error) {
    console.error('Error fetching shop expenses:', error);
    res.status(500).json({ message: 'Failed to fetch expenses', error: error.message });
  }
};

// Get expense by ID (shop)
exports.getShopExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({ 
      _id: req.params.id, 
      shop: req.shopId 
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.status(200).json(expense);
  } catch (error) {
    console.error('Error fetching shop expense:', error);
    res.status(500).json({ message: 'Failed to fetch expense', error: error.message });
  }
};

// Update expense (shop)
exports.updateShopExpense = async (req, res) => {
  try {
    const { category, amount, description, date, paymentMode, vendor, attachmentUrl } = req.body;
    
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, shop: req.shopId },
      { category, amount, description, date, paymentMode, vendor, attachmentUrl },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.status(200).json(expense);
  } catch (error) {
    console.error('Error updating shop expense:', error);
    res.status(500).json({ message: 'Failed to update expense', error: error.message });
  }
};

// Delete expense (shop)
exports.deleteShopExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ 
      _id: req.params.id, 
      shop: req.shopId 
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting shop expense:', error);
    res.status(500).json({ message: 'Failed to delete expense', error: error.message });
  }
};

// Get expense summary (shop)
exports.getShopExpenseSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = { shop: req.shopId };
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get total expenses
    const totalExpenses = await Expense.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get expenses by category
    const categoryBreakdown = await Expense.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      total: totalExpenses.length > 0 ? totalExpenses[0].total : 0,
      byCategory: categoryBreakdown
    });
  } catch (error) {
    console.error('Error getting shop expense summary:', error);
    res.status(500).json({ message: 'Failed to get expense summary', error: error.message });
  }
};