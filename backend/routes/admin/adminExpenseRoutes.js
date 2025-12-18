const express = require('express');
const router = express.Router();
const { 
  addAdminExpense,
  getAdminExpenses,
  getAdminExpenseById,
  updateAdminExpense,
  deleteAdminExpense,
  getAdminExpenseSummary,
  uploadExpenseAttachment
} = require('../../controllers/admin/expenseController');
const { adminAuth } = require('../../middleware/auth');

// Upload attachment for an expense
router.post('/upload-attachment', adminAuth, uploadExpenseAttachment);

// Add a new expense
router.post('/', adminAuth, addAdminExpense);

// Get all expenses
router.get('/', adminAuth, getAdminExpenses);

// Get expense by ID
router.get('/:id', adminAuth, getAdminExpenseById);

// Update expense
router.put('/:id', adminAuth, updateAdminExpense);

// Delete expense
router.delete('/:id', adminAuth, deleteAdminExpense);

// Get expense summary
router.get('/summary', adminAuth, getAdminExpenseSummary);

module.exports = router;