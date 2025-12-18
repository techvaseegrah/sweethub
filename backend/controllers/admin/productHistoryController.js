const ProductHistory = require('../../models/productHistoryModel');
const Product = require('../../models/productModel');

// Get product history by product ID
exports.getProductHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    const adminId = req.user.id;

    // Verify that the product belongs to this admin
    const product = await Product.findOne({ _id: productId, admin: adminId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }

    // Get history sorted by latest first
    const history = await ProductHistory.find({ productId, admin: adminId })
      .sort({ timestamp: -1 });

    res.json(history);
  } catch (error) {
    console.error('Error fetching product history:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get all product history for an admin (for overview)
exports.getAllProductHistory = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    // Get history sorted by latest first
    const history = await ProductHistory.find({ admin: adminId })
      .sort({ timestamp: -1 })
      .limit(100); // Limit to prevent overload

    res.json(history);
  } catch (error) {
    console.error('Error fetching all product history:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Create a product history entry
exports.createProductHistory = async (product, actionType, adminId, quantity = null, currentStock = null) => {
  try {
    // For "Added" and "Updated" actions, we use the product's current data
    // For "Stock In" and "Stock Out" actions, we might have a specific quantity
    
    const historyEntry = new ProductHistory({
      productId: product._id,
      sku: product.sku,
      name: product.name,
      actionType,
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
exports.recordStockIn = async (product, adminId, quantity) => {
  try {
    await exports.createProductHistory(product, 'Stock In', adminId, quantity, product.stockLevel);
  } catch (error) {
    console.error('Error recording stock in:', error);
    throw error;
  }
};

// Record stock out operation
exports.recordStockOut = async (product, adminId, quantity) => {
  try {
    await exports.createProductHistory(product, 'Stock Out', adminId, quantity, product.stockLevel);
  } catch (error) {
    console.error('Error recording stock out:', error);
    throw error;
  }
};