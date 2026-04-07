const express = require('express');
const router = express.Router();
const { getProductHistory, getAllProductHistory, recordStockIn, recordStockOut } = require('../../controllers/admin/productHistoryController');
const { getAllCopyHistory } = require('../../controllers/admin/productCopyHistoryController');
const { adminAuth } = require('../../middleware/auth');

// Get product history by product ID
router.get('/product/:productId', adminAuth, getProductHistory);

// Get all product history for admin
router.get('/', adminAuth, getAllProductHistory);

// Get all copy history for admin
router.get('/copy', adminAuth, getAllCopyHistory);

module.exports = router;