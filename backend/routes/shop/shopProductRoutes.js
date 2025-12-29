const express = require('express');
const router = express.Router();
const { getShopProducts, updateShopProduct } = require('../../controllers/shop/shopProductController');
const { getUnits, isUnitInUse } = require('../../controllers/admin/productController');
const { shopAuth } = require('../../middleware/auth');

// This route allows a shop user to view products in their shop
router.get('/', shopAuth, getShopProducts);
router.get('/units', shopAuth, getUnits);
router.get('/units/in-use/:unitName', shopAuth, isUnitInUse);

// Route to get all admin products for shop users to view (read-only)
router.get('/admin-products', shopAuth, require('../../controllers/admin/productController').getAllAdminProducts);

// Route to update product prices for shop users
router.put('/:id', shopAuth, updateShopProduct);

module.exports = router;