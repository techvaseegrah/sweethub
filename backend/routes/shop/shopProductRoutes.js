const express = require('express');
const router = express.Router();
const { getShopProducts } = require('../../controllers/shop/shopProductController');
const { getUnits, isUnitInUse } = require('../../controllers/admin/productController');
const { shopAuth } = require('../../middleware/auth');

// This route allows a shop user to view products in their shop
router.get('/', shopAuth, getShopProducts);
router.get('/units', shopAuth, getUnits);
router.get('/units/in-use/:unitName', shopAuth, isUnitInUse);

module.exports = router;