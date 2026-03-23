const express = require('express');
const router = express.Router();
const {
    createProductBillingShopUser,
    getAllProductBillingShopUsers,
    updateProductBillingShopUser,
    deleteProductBillingShopUser
} = require('../../controllers/shop/shopProductBillingUserController');
const { shopAuth } = require('../../middleware/auth'); // Only shop owners/admins can manage these users

// Apply shopAuth middleware to all routes in this router
router.use(shopAuth);

// Routes for product-billing user management (shop side)
router.route('/')
    .post(createProductBillingShopUser)
    .get(getAllProductBillingShopUsers);

router.route('/:id')
    .put(updateProductBillingShopUser)
    .delete(deleteProductBillingShopUser);

module.exports = router;
