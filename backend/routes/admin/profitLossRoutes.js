const express = require('express');
const router = express.Router();
const { getProfitLossData, getShopExpenseBreakdown, getConsolidatedReport, getShopDetailedReport, getProfitLossTrends } = require('../../controllers/admin/profitLossController');
const { adminAuth } = require('../../middleware/auth');

// @route   GET /api/admin/profit-loss
// @desc    Get comprehensive profit & loss data for all shops
// @access  Private (Admin only)
router.get('/', adminAuth, getProfitLossData);

// @route   GET /api/admin/profit-loss/shop/:shopId/expenses
// @desc    Get detailed expense breakdown for a specific shop
// @access  Private (Admin only)
router.get('/shop/:shopId/expenses', adminAuth, getShopExpenseBreakdown);

// @route   GET /api/admin/profit-loss/report
// @desc    Get consolidated profit & loss report
// @access  Private (Admin only)
router.get('/report', adminAuth, getConsolidatedReport);

// @route   GET /api/admin/profit-loss/shop/:shopId
// @desc    Get detailed report for a specific shop
// @access  Private (Admin only)
router.get('/shop/:shopId', adminAuth, getShopDetailedReport);

// @route   GET /api/admin/profit-loss/trends
// @desc    Get profit & loss trends
// @access  Private (Admin only)
router.get('/trends', adminAuth, getProfitLossTrends);

module.exports = router;