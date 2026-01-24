const Product = require('../../models/productModel');
const Category = require('../../models/Category');

/**
 * Retrieves all products that belong to the currently logged-in shop.
 * This is used to display the shop's inventory.
 */
exports.getShopProducts = async (req, res) => {
  console.log('=== GET SHOP PRODUCTS REQUEST ===');
  console.log('User:', req.user);
  
  try {
    // Get shop ID from the authenticated user - should be in req.user.shopId
    const shopId = req.user.shopId;
    console.log('Looking for products for shop ID:', shopId);
    
    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID not found in user token.' });
    }

    // Find all products where the 'shop' field matches the logged-in shop's ID
    const products = await Product.find({ shop: shopId })
      .populate('category', 'name') // Optionally show category names
      .sort({ name: 1 }); // Sort alphabetically by product name

    console.log('Found shop products:', products.length);
    console.log('Products:', products.map(p => ({ name: p.name, sku: p.sku, stock: p.stockLevel })));
    
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching shop products:', error);
    res.status(500).json({ message: 'Failed to fetch shop products.', error: error.message });
  }
};

// Update product for shop users (can update prices, stock, thresholds, etc.)
exports.updateShopProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Get shop ID from the authenticated user
    const shopId = req.user.shopId;
    
    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID not found in user token.' });
    }
    
    // Find the product that belongs to this shop
    const product = await Product.findOne({ _id: id, shop: shopId });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found or does not belong to your shop.' });
    }
    
    // Update allowed fields
    if (updateData.prices && Array.isArray(updateData.prices)) {
      product.prices = updateData.prices;
    }
    
    if (updateData.stockLevel !== undefined) {
      product.stockLevel = parseFloat(updateData.stockLevel);
    }
    
    if (updateData.stockAlertThreshold !== undefined) {
      product.stockAlertThreshold = parseFloat(updateData.stockAlertThreshold);
    }
    
    if (updateData.category !== undefined) {
      product.category = updateData.category;
    }
    
    if (updateData.name !== undefined) {
      product.name = updateData.name;
    }
    
    if (updateData.sku !== undefined) {
      product.sku = updateData.sku;
    }
    
    if (updateData.expiryDate !== undefined) {
      product.expiryDate = updateData.expiryDate ? new Date(updateData.expiryDate) : null;
    }
    
    if (updateData.usedByDate !== undefined) {
      product.usedByDate = updateData.usedByDate ? new Date(updateData.usedByDate) : null;
    }
    
    const updatedProduct = await product.save();
    
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error('Error updating shop product:', error);
    res.status(500).json({ message: 'Failed to update product.', error: error.message });
  }
};

// Create a new product for shop users
exports.createShopProduct = async (req, res) => {
  try {
    const { name, sku, category, stockLevel, stockAlertThreshold, prices, expiryDate, usedByDate } = req.body;
    
    // Get shop ID from the authenticated user
    const shopId = req.user.shopId;
    
    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID not found in user token.' });
    }
    
    // Validate required fields
    if (!name || !sku) {
      return res.status(400).json({ message: 'Name and SKU are required.' });
    }
    
    // Check if category exists and is valid
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: 'Invalid category ID.' });
      }
    }
    
    // Check if product with same SKU already exists for this shop
    const existingProduct = await Product.findOne({ sku, shop: shopId });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product with this SKU already exists in your shop.' });
    }
    
    // Create new product
    const newProduct = new Product({
      name,
      sku,
      category,
      stockLevel: stockLevel || 0,
      stockAlertThreshold: stockAlertThreshold || 0,
      prices: prices || [],
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      usedByDate: usedByDate ? new Date(usedByDate) : null,
      shop: shopId
    });
    
    const savedProduct = await newProduct.save();
    
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error creating shop product:', error);
    res.status(500).json({ message: 'Failed to create product.', error: error.message });
  }
};

// Delete a product for shop users
exports.deleteShopProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get shop ID from the authenticated user
    const shopId = req.user.shopId;
    
    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID not found in user token.' });
    }
    
    // Find the product that belongs to this shop
    const product = await Product.findOne({ _id: id, shop: shopId });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found or does not belong to your shop.' });
    }
    
    // Delete the product
    await Product.deleteOne({ _id: id });
    
    res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Error deleting shop product:', error);
    res.status(500).json({ message: 'Failed to delete product.', error: error.message });
  }
};

// Get expired products for the logged-in shop
exports.getShopExpiredProducts = async (req, res) => {
  try {
    // Get shop ID from the authenticated user
    const shopId = req.user.shopId;
    
    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID not found in user token.' });
    }
    
    // Find all products for this shop (both with and without expiry dates)
    const products = await Product.find({ 
      shop: shopId
    }).populate('category', 'name');
    
    // Sort products: first expired/near expiry items (by expiry date), then items with good expiry dates, then items without expiry dates
    const sortedProducts = products.sort((a, b) => {
      const today = new Date();
      
      // Items without expiry dates go last
      if (!a.expiryDate && !b.expiryDate) return 0;
      if (!a.expiryDate) return 1;  // a goes last
      if (!b.expiryDate) return -1; // b goes last
      
      // Both have expiry dates - sort by expiry date (earliest first)
      const aExpiry = new Date(a.expiryDate);
      const bExpiry = new Date(b.expiryDate);
      
      // Calculate days remaining
      const aDiffTime = aExpiry - today;
      const aDiffDays = Math.ceil(aDiffTime / (1000 * 60 * 60 * 24));
      
      const bDiffTime = bExpiry - today;
      const bDiffDays = Math.ceil(bDiffTime / (1000 * 60 * 60 * 24));
      
      // Items expiring soonest come first
      return aDiffDays - bDiffDays;
    });
    
    res.status(200).json(sortedProducts);
  } catch (error) {
    console.error('Error fetching shop expired products:', error);
    res.status(500).json({ message: 'Failed to fetch expired products.', error: error.message });
  }
};

// Get stock alert products for the logged-in shop
exports.getShopStockAlerts = async (req, res) => {
  try {
    // Get shop ID from the authenticated user
    const shopId = req.user.shopId;
    
    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID not found in user token.' });
    }
    
    // Find products for this shop where stock level is less than or equal to alert threshold
    const lowStockProducts = await Product.find({ 
      shop: shopId,
      $expr: { $lte: ['$stockLevel', '$stockAlertThreshold'] }
    }).populate('category', 'name');
    
    res.status(200).json(lowStockProducts);
  } catch (error) {
    console.error('Error fetching shop stock alerts:', error);
    res.status(500).json({ message: 'Failed to fetch stock alerts.', error: error.message });
  }
};

exports.getShopExpiredProducts;