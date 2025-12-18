const express = require('express');
const router = express.Router();
const { createReturn, getReturns, getShopSpecificReturns, updateReturnAndStock } = require('../../controllers/admin/returnProductController');

// Add this new route for fetching products
router.get('/products', async (req, res) => {
    try {
        // If you have a Product model, use it. Otherwise use Manufacturing model
        const Manufacturing = require('../../models/manufacturingModel');
        const products = await Manufacturing.find({});
        const formattedProducts = products.map(item => ({
            _id: item._id,
            productName: item.sweetName
        }));
        res.json(formattedProducts);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch products', error: error.message });
    }
});

router.post('/', createReturn);
router.get('/', getReturns);
router.get('/shop/:shopId', getShopSpecificReturns); // New route for shop-specific returns
router.put('/:id', updateReturnAndStock);

module.exports = router;