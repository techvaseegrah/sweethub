const express = require('express');
const router = express.Router();
const { createShopReturn, getShopReturns } = require('../../controllers/shop/shopReturnProductController');
const { shopAuth } = require('../../middleware/auth');

// Create a new return product entry from shop side
router.post('/', shopAuth, createShopReturn);

// Get all return product entries for a specific shop
router.get('/', shopAuth, getShopReturns);

module.exports = router;