const Product = require('../../models/productModel'); 
const Bill = require('../../models/billModel'); 
const Worker = require('../../models/workerModel'); 
const Department = require('../../models/departmentModel');
const Shop = require('../../models/shopModel');
const mongoose = require('mongoose'); // Added this missing line

exports.getShopDashboard = async (req, res) => {
  try {
    // Fetch total sales for the specific shop using req.shopId from the token
    const sales = await Bill.aggregate([
      { $match: { shop: new mongoose.Types.ObjectId(req.shopId) } },
      { $group: { _id: null, totalSales: { $sum: '$totalAmount' } } },
    ]);
    const totalSales = sales.length > 0 ? sales[0].totalSales : 0;

    // Fetch workers belonging to this shop
    const workers = await Worker.find({ shop: req.shopId }).populate('user', 'name').select('name workingHours');
    
    // Fetch products belonging to this shop
    const products = await Product.find({ shop: req.shopId }).select('name stockLevel unit');
    
    // Fetch departments belonging to this shop
    const departments = await Department.find({ shop: req.shopId }).select('name');
    
    // Fetch invoice count for this shop
    const invoiceCount = await Bill.countDocuments({ shop: req.shopId });

    res.status(200).json({
      message: 'Shop dashboard data retrieved successfully.',
      totalSales,
      workers,
      stockLevels: products,
      departments: departments,
      invoiceCount: invoiceCount
    });
  } catch (error) {
    console.error('Error fetching shop dashboard:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getShopDetails = async (req, res) => {
  try {
    if (!req.shopId) {
      return res.status(400).json({ message: 'Shop ID not found in token.' });
    }
    const shop = await Shop.findById(req.shopId).select('name location shopPhoneNumber gstNumber fssaiNumber');
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found.' });
    }
    res.json(shop);
  } catch (error) {
    console.error('Error fetching shop details:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { newStockLevel } = req.body;

    // Ensure the product belongs to the shop making the request
    const product = await Product.findOne({ _id: productId, shop: req.shopId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found in this shop.' });
    }

    product.stockLevel = parseFloat(newStockLevel);
    await product.save();

    res.status(200).json({ message: 'Stock updated successfully.', product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};