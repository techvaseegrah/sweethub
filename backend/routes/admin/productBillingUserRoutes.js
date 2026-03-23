const express = require('express');
const router = express.Router();
const {
    createProductBillingAdminUser,
    getAllProductBillingAdminUsers,
    updateProductBillingAdminUser,
    deleteProductBillingAdminUser
} = require('../../controllers/admin/productBillingUserController');
const { adminAuth } = require('../../middleware/auth'); // Only admin can manage these users

// Apply adminAuth middleware to all routes in this router
router.use(adminAuth);

// Routes for product-billing user management
router.route('/')
    .post(createProductBillingAdminUser)
    .get(getAllProductBillingAdminUsers);

router.route('/:id')
    .put(updateProductBillingAdminUser)
    .delete(deleteProductBillingAdminUser);

module.exports = router;
