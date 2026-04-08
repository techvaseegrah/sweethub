const express = require('express');
const router = express.Router();
const { getProductHistory, getAllProductHistory } = require('../../controllers/admin/productHistoryController');
const { shopAuth } = require('../../middleware/auth');

// Get product history by product ID for shop
router.get('/product/:productId', shopAuth, getProductHistory);

// Get all product history for shop (if needed, but usually limited to shop's own products if the controller handles it)
router.get('/', shopAuth, getAllProductHistory);

module.exports = router;
