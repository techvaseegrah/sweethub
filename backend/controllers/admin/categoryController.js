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