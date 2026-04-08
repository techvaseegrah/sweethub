const ProductHistory = require('../../models/productHistoryModel');
const Product = require('../../models/productModel');

// Get product history by product ID
exports.getProductHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    const adminId = req.user.id;

    // Build query based on user role
    let productQuery = { _id: productId };

    if (req.shopId) {
      // If it's a shop user, product must belong to their shop
      productQuery.shop = req.shopId;
    } else if (req.user && req.user.role === 'admin') {
      // If it's an admin, they see admin products (no shop)
      productQuery.$or = [
        { shop: { $exists: false } },
        { shop: null }
      ];
    } else {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const product = await Product.findOne(productQuery);
    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }

    // Get history sorted by latest first (all actions on this product)
    const history = await ProductHistory.find({ productId })
      .sort({ timestamp: -1 });

    res.json(history);
  } catch (error) {
    console.error('Error fetching product history:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get all product history for the admin side (for overview)
exports.getAllProductHistory = async (req, res) => {
  try {
    // Get history sorted by latest first
    const history = await ProductHistory.find()
      .sort({ timestamp: -1 })
      .limit(100); // Limit to prevent overload

    res.json(history);
  } catch (error) {
    console.error('Error fetching all product history:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Create a product history entry
exports.createProductHistory = async (product, actionType, adminId, quantity = null, currentStock = null, description = null) => {
  try {
    const historyEntry = new ProductHistory({
      productId: product._id,
      sku: product.sku,
      name: product.name,
      actionType,
      description,
      quantity: quantity !== null ? quantity : product.stockLevel,
      currentStock: currentStock !== null ? currentStock : product.stockLevel,
      admin: adminId
    });

    // Add price information if available (take the first price entry)
    if (product.prices && product.prices.length > 0) {
      historyEntry.netPrice = product.prices[0].netPrice;
      historyEntry.sellingPrice = product.prices[0].sellingPrice;
    }

    await historyEntry.save();
    return historyEntry;
  } catch (error) {
    console.error('Error creating product history entry:', error);
    throw error;
  }
};

// Record stock in operation
exports.recordStockIn = async (product, adminId, quantity, description = null) => {
  try {
    await exports.createProductHistory(product, 'Stock In', adminId, quantity, product.stockLevel, description);
  } catch (error) {
    console.error('Error recording stock in:', error);
    throw error;
  }
};

// Record stock out operation
exports.recordStockOut = async (product, adminId, quantity, description = null) => {
  try {
    await exports.createProductHistory(product, 'Stock Out', adminId, quantity, product.stockLevel, description);
  } catch (error) {
    console.error('Error recording stock out:', error);
    throw error;
  }
};