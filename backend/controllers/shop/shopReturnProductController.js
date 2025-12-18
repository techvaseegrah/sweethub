// backend/controllers/shop/shopReturnProductController.js

const ReturnProduct = require('../../models/returnProductModel');

// Helper function to generate a unique Return ID
const generateReturnId = async () => {
    const count = await ReturnProduct.countDocuments();
    return `RTN-${(count + 1).toString().padStart(5, '0')}`;
};

// Create a new return product entry from shop side
const createShopReturn = async (req, res) => {
    try {
        const returnId = await generateReturnId();
        const { productName, batchNumber, quantityReturned, reasonForReturn, source, remarks } = req.body;
        
        // Add shop identifier to distinguish shop returns
        const shopId = req.shopId; // From shopAuth middleware
        
        const newReturn = new ReturnProduct({
            returnId,
            productName,
            batchNumber,
            quantityReturned,
            reasonForReturn,
            source: source || 'Shop', // Default to 'Shop' for shop-side returns
            remarks,
            shopId // Add shop identifier
        });

        await newReturn.save();
        res.status(201).json({ message: 'Return product registered successfully', return: newReturn });
    } catch (error) {
        res.status(500).json({ message: 'Failed to register return product', error: error.message });
    }
};

// Get all return product entries for a specific shop
const getShopReturns = async (req, res) => {
    try {
        const shopId = req.shopId; // From shopAuth middleware
        const returns = await ReturnProduct.find({ shopId });
        res.status(200).json(returns);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch return products', error: error.message });
    }
};

module.exports = {
    createShopReturn,
    getShopReturns
};