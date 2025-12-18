const express = require('express');
const router = express.Router();
const {
    addProduct,
    getProducts,
    updateProduct,
    deleteProduct,
    getUnits,
    isUnitInUse,
    // MODIFIED: Changed function name to reflect new logic
    getProductCountByAdmin,
    getTotalStockAlertCount,
    getProductById
} = require('../../controllers/admin/productController');
const { adminAuth } = require('../../middleware/auth');

// --- All Product Routes ---
router.post('/', adminAuth, addProduct);
router.get('/', adminAuth, getProducts);

// --- Unit and Price Routes (No changes needed here) ---
router.get('/units', adminAuth, getUnits);
router.get('/units/in-use/:unitName', adminAuth, isUnitInUse);

// --- Specific product routes (must be after units routes) ---
router.get('/:id', adminAuth, getProductById);
router.put('/:id', adminAuth, updateProduct);
router.delete('/:id', adminAuth, deleteProduct);

// --- Analytics Routes ---
// MODIFIED: Updated the route and function to count by admin
router.get('/count-by-admin', adminAuth, getProductCountByAdmin);
router.get('/stock-alerts/count', adminAuth, getTotalStockAlertCount);

module.exports = router;
