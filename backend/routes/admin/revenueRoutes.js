// backend/routes/admin/revenueRoutes.js
const express = require('express');
const router = express.Router();
const revenueController = require('../../controllers/admin/revenueController');

// @route   GET api/admin/revenue/summary
// @desc    Get revenue and profit summary
// @access  Private/Admin
router.get('/summary', revenueController.getRevenueSummary);

module.exports = router;