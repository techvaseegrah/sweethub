const express = require('express');
const router = express.Router();
const { getProfitLossData, getShopExpenseBreakdown } = require('../../controllers/admin/profitLossController');
const { adminAuth } = require('../../middleware/auth');

// @route   GET /api/admin/profit-loss
// @desc    Get comprehensive profit & loss data for all shops
// @access  Private (Admin only)
router.get('/', adminAuth, getProfitLossData);

// @route   GET /api/admin/profit-loss/shop/:shopId/expenses
// @desc    Get detailed expense breakdown for a specific shop
// @access  Private (Admin only)
router.get('/shop/:shopId/expenses', adminAuth, getShopExpenseBreakdown);

module.exports = router;
