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

// Update product prices for shop users
exports.updateShopProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { prices } = req.body;
    
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
    
    // Update only the prices field
    if (prices && Array.isArray(prices)) {
      product.prices = prices;
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
    const { name, sku, category, stockLevel, stockAlertThreshold, prices } = req.body;
    
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