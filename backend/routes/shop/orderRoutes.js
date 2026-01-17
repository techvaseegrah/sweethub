const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  getShopOrders, 
  getShopOrderById 
} = require('../../controllers/shop/shopOrderController');
const { shopAuth } = require('../../middleware/auth');

// --- Order Routes for Shop ---

// @route   POST api/shop/orders
// @desc    Create a new order from shop side
// @access  Private (Shop only)
router.post('/', shopAuth, createOrder);

// @route   GET api/shop/orders
// @desc    Get all orders for the logged-in shop
// @access  Private (Shop only)
router.get('/', shopAuth, getShopOrders);

// @route   GET api/shop/orders/:id
// @desc    Get a specific order by ID for the logged-in shop
// @access  Private (Shop only)
router.get('/:id', shopAuth, getShopOrderById);

module.exports = router;