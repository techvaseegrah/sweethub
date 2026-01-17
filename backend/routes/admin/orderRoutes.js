const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  getOrders, 
  getOrdersForShop, 
  getOrderById, 
  updateOrderStatus 
} = require('../../controllers/admin/orderController');
const { adminAuth } = require('../../middleware/auth');

// --- Order Routes for Admin ---

// @route   POST api/admin/orders
// @desc    Create a new order (can be used by admin for testing)
// @access  Private (Admin only)
router.post('/', adminAuth, createOrder);

// @route   GET api/admin/orders
// @desc    Get all orders created by all shops
// @access  Private (Admin only)
router.get('/', adminAuth, getOrders);

// @route   GET api/admin/orders/shop/:shopId
// @desc    Get all orders for a specific shop
// @access  Private (Admin only)
router.get('/shop/:shopId', adminAuth, getOrdersForShop);

// @route   GET api/admin/orders/:id
// @desc    Get a specific order by ID
// @access  Private (Admin only)
router.get('/:id', adminAuth, getOrderById);

// @route   PUT api/admin/orders/update-status
// @desc    Update order status
// @access  Private (Admin only)
router.put('/update-status', adminAuth, updateOrderStatus);

module.exports = router;