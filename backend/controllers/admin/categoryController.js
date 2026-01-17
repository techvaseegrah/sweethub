const Category = require('../../models/Category');

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    // Create the new category with the shop ID if it exists on the request
    const newCategory = new Category({
      name,
      ...(req.shopId && { shop: req.shopId }),
    });
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    // If req.shopId exists, filter by it. Otherwise, return all for the main admin.
    const filter = req.shopId ? { shop: req.shopId } : {};
    const categories = await Category.find(filter).populate('products');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    // Add the shopId to the filter to ensure ownership
    const filter = req.shopId ? { _id: id, shop: req.shopId } : { _id: id };
    const deletedCategory = await Category.findOneAndDelete(filter);

    if (!deletedCategory) {
      return res.status(404).json({ message: 'Category not found or not authorized to delete.' });
    }
    
    res.status(200).json({ message: 'Category deleted successfully.' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get all categories for shop users to view admin products
exports.getAllCategories = async (req, res) => {
  try {
    // Return all categories (admin categories) for shop users viewing admin products
    const categories = await Category.find({}).populate('products');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching all categories:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get categories that are used by products in a specific shop
exports.getShopCategories = async (req, res) => {
  try {
    // Import Product model here to avoid circular dependency
    const Product = require('../../models/productModel');
    
    // Get shop ID from the authenticated user
    const shopId = req.user.shopId;
    
    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID not found in user token.' });
    }
    
    // Find all products that belong to this shop
    const shopProducts = await Product.find({ shop: shopId }).select('category').populate('category');
    
    // Extract unique categories from products
    const categoryMap = {};
    const uniqueCategories = [];
    
    shopProducts.forEach(product => {
      if (product.category && !categoryMap[product.category._id]) {
        categoryMap[product.category._id] = true;
        uniqueCategories.push(product.category);
      }
    });
    
    res.json(uniqueCategories);
  } catch (error) {
    console.error('Error fetching shop categories:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};