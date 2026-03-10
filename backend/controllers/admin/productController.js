const Product = require('../../models/productModel');
const Category = require('../../models/Category');
const { createProductHistory } = require('./productHistoryController');
const mongoose = require('mongoose');

// --- MODIFIED: Add Product to Admin's Own Inventory ---
exports.addProduct = async (req, res) => {
  // Destructure fields, removing 'shop'
  const { name, category, sku, stockLevel, stockAlertThreshold, prices, expiryDate, usedByDate } = req.body;
  const adminId = req.user.id; // Get admin ID from authenticated user

  try {
    // Check if a product with the same SKU already exists for this admin
    let existingProduct = await Product.findOne({ sku, admin: adminId });

    if (existingProduct) {
      // If product exists, update its stock level by adding the new quantity
      const newStockLevel = (parseFloat(existingProduct.stockLevel) || 0) + (parseFloat(stockLevel) || 0);

      // Update the existing product
      existingProduct = await Product.findByIdAndUpdate(
        existingProduct._id,
        {
          stockLevel: newStockLevel,
          stockAlertThreshold: parseFloat(stockAlertThreshold) || existingProduct.stockAlertThreshold,
          prices: prices // Update prices as well
        },
        { new: true }
      );

      // Record product history for the update with added quantity and current stock
      try {
        await createProductHistory(existingProduct, 'Updated', adminId, parseFloat(stockLevel), existingProduct.stockLevel);
      } catch (historyError) {
        console.error('Failed to create product history:', historyError);
      }

      return res.status(200).json({ message: `Product '${existingProduct.name}' updated successfully! Added ${stockLevel} units to existing stock.`, product: existingProduct });
    }

    // Find the category
    const existingCategory = await Category.findById(category);
    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    // Validate prices array
    if (!prices || !Array.isArray(prices) || prices.length === 0) {
      return res.status(400).json({ message: 'At least one price configuration is required.' });
    }

    // Validate each price entry
    for (const price of prices) {
      if (!price.unit || typeof price.netPrice !== 'number' || typeof price.sellingPrice !== 'number') {
        return res.status(400).json({ message: 'Each price entry must include unit, netPrice, and sellingPrice.' });
      }
    }

    // Create the new product and associate it with the admin
    const newProduct = new Product({
      name,
      category,
      sku,
      stockLevel: parseFloat(stockLevel) || 0,
      stockAlertThreshold: parseFloat(stockAlertThreshold) || 0,
      prices, // Include the prices array
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      usedByDate: usedByDate ? new Date(usedByDate) : null,
      admin: adminId, // Assign the admin's ID
    });

    const savedProduct = await newProduct.save();

    // Add the product to the category
    existingCategory.products.push(savedProduct._id);
    await existingCategory.save();

    // Record product history with current stock
    try {
      await createProductHistory(savedProduct, 'Added', adminId, null, savedProduct.stockLevel);
    } catch (historyError) {
      console.error('Failed to create product history:', historyError);
    }

    res.status(201).json({ message: `Product '${savedProduct.name}' created successfully!`, product: savedProduct });
  } catch (error) {
    console.error('Error in addProduct:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// --- MODIFIED: Get Products for the Logged-in Admin Only ---
exports.getProducts = async (req, res) => {
  try {
    // Fetch products that belong to the currently logged-in admin
    const products = await Product.find({ admin: req.user.id }).populate('category', 'name').sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- MODIFIED: Update Product with Authorization Check ---
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      sku,
      stockLevel,
      stockAlertThreshold,
      prices,
      expiryDate,
      usedByDate
    } = req.body;

    const product = await Product.findById(id);

    // Check if the product exists
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Authorization: Check if the product belongs to the logged-in admin
    if (product.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to update this product.' });
    }

    // Prepare update data
    const updateData = {};

    // Validate category if provided
    if (category !== undefined) {
      if (category && category !== '') {
        const existingCategory = await Category.findById(category);
        if (!existingCategory) {
          return res.status(404).json({ message: 'Selected category not found.' });
        }

        // If category is changing, move product in category models
        const oldCategoryId = product.category ? product.category.toString() : null;
        if (oldCategoryId !== category.toString()) {
          // Remove from old category if it existed
          if (oldCategoryId) {
            await Category.findByIdAndUpdate(product.category, { $pull: { products: product._id } });
          }
          // Add to new category
          await Category.findByIdAndUpdate(category, { $push: { products: product._id } });
        }
        updateData.category = category;
      } else if (category === '' || category === null) {
        // If explicitly set to empty/null, remove from old category if it existed
        if (product.category) {
          await Category.findByIdAndUpdate(product.category, { $pull: { products: product._id } });
        }
        updateData.category = null;
      }
    }

    // Track original stock for history
    const originalStock = product.stockLevel;


    if (name !== undefined) updateData.name = name;

    if (sku !== undefined) updateData.sku = sku;
    if (stockLevel !== undefined) {
      const parsedStock = parseFloat(stockLevel);
      updateData.stockLevel = isNaN(parsedStock) ? 0 : parsedStock;
    }
    if (stockAlertThreshold !== undefined) {
      const parsedThreshold = parseFloat(stockAlertThreshold);
      updateData.stockAlertThreshold = isNaN(parsedThreshold) ? 10 : parsedThreshold;
    }
    if (prices !== undefined) updateData.prices = prices;
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (usedByDate !== undefined) updateData.usedByDate = usedByDate ? new Date(usedByDate) : null;

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true }).populate('category', 'name');

    // Record product history
    try {
      // Calculate change if stockLevel was updated
      const stockChange = stockLevel !== undefined ? (parseFloat(stockLevel) - originalStock) : null;
      await createProductHistory(updatedProduct, 'Updated', req.user.id, stockChange, updatedProduct.stockLevel);
    } catch (historyError) {
      console.error('Failed to create product history:', historyError);
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// --- MODIFIED: Delete Product with Authorization Check ---
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    // Check if the product exists
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Authorization: Check if the product belongs to the logged-in admin
    if (product.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete this product.' });
    }

    // Proceed with deletion
    const deletedProduct = await Product.findByIdAndDelete(id);

    // Remove product from its category
    if (deletedProduct && deletedProduct.category) {
      await Category.findByIdAndUpdate(
        deletedProduct.category,
        { $pull: { products: deletedProduct._id } }
      );
    }

    res.status(200).json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/*================================================================================
|  UNCHANGED FUNCTIONALITIES BELOW                                               |
|  The following functions remain as they were, but will now operate securely    |
|  within the context of authorized product access.                              |
================================================================================*/

exports.getUnits = async (req, res) => {
  try {
    // First, find all products for this admin
    const products = await Product.find({ admin: req.user.id }).select('prices.unit');

    // Extract units from products, filtering out any invalid data
    const unitSet = new Set();

    products.forEach((product) => {
      if (product.prices && Array.isArray(product.prices)) {
        product.prices.forEach((price) => {
          if (price && price.unit && typeof price.unit === 'string') {
            unitSet.add(price.unit);
          }
        });
      }
    });

    const unitsArray = Array.from(unitSet);
    res.json(unitsArray);
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.isUnitInUse = async (req, res) => {
  try {
    const { unitName } = req.params;
    const count = await Product.countDocuments({ admin: req.user.id, 'prices.unit': unitName });
    res.json({ inUse: count > 0 });
  } catch (error) {
    console.error("Error checking if unit is in use:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- MODIFIED: This function now groups by admin instead of shop ---
exports.getProductCountByAdmin = async (req, res) => {
  try {
    const counts = await Product.aggregate([
      {
        $group: {
          _id: '$admin',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'adminDetails',
        },
      },
      {
        $project: {
          _id: 0,
          adminId: '$_id',
          adminName: { $ifNull: [{ $arrayElemAt: ['$adminDetails.name', 0] }, 'Unknown Admin'] },
          count: '$count',
        },
      },
      { $sort: { adminName: 1 } }
    ]);
    res.json(counts);
  } catch (error) {
    console.error('Error fetching product count by admin:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get a specific product by ID for the logged-in admin
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id, admin: req.user.id }).populate('category', 'name');

    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// --- MODIFIED: Get stock alert count for the logged-in admin ---
exports.getTotalStockAlertCount = async (req, res) => {
  try {
    const totalCount = await Product.countDocuments({
      admin: req.user.id, // Filter for the logged-in admin
      $expr: { $lte: ['$stockLevel', '$stockAlertThreshold'] }
    });
    res.json({ totalCount });
  } catch (error) {
    console.error('Error fetching total stock alert count:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get expired products for the logged-in admin
exports.getExpiredProducts = async (req, res) => {
  try {
    // Find ALL products for the logged-in admin (both with and without expiry dates)
    const products = await Product.find({
      admin: req.user.id
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

    res.json(sortedProducts);
  } catch (error) {
    console.error('Error in getExpiredProducts:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get all admin products for shop users to view (read-only)
exports.getAllAdminProducts = async (req, res) => {
  try {
    // Fetch all products regardless of admin, but only return essential read-only information
    const products = await Product.find({})
      .populate('category', 'name')
      .sort({ name: 1 });

    // Format the response to include only essential information (no admin details like stock)
    const formattedProducts = products.map(product => ({
      _id: product._id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.prices && product.prices.length > 0 ? product.prices[0].sellingPrice : 0,
      unit: product.prices && product.prices.length > 0 ? product.prices[0].unit : 'N/A'
    }));

    res.json(formattedProducts);
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getExpiredProducts;