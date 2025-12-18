const express = require('express');
const router = express.Router();
const { 
  addShopExpense,
  getShopExpenses,
  getShopExpenseById,
  updateShopExpense,
  deleteShopExpense,
  getShopExpenseSummary,
  uploadExpenseAttachment
} = require('../../controllers/shop/expenseController');
const { shopAuth } = require('../../middleware/auth');

// Upload attachment for an expense
router.post('/upload-attachment', shopAuth, uploadExpenseAttachment);

// Add a new expense
router.post('/', shopAuth, addShopExpense);

// Get all expenses
router.get('/', shopAuth, getShopExpenses);

// Get expense by ID
router.get('/:id', shopAuth, getShopExpenseById);

// Update expense
router.put('/:id', shopAuth, updateShopExpense);

// Delete expense
router.delete('/:id', shopAuth, deleteShopExpense);

// Get expense summary
router.get('/summary', shopAuth, getShopExpenseSummary);

module.exports = router;