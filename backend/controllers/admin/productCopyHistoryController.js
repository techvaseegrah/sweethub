const ProductCopyHistory = require('../../models/productCopyHistoryModel');

// Get all product copy history for admin
exports.getAllCopyHistory = async (req, res) => {
  try {
    // Get history sorted by latest first
    const history = await ProductCopyHistory.find()
      .populate('admin', 'name email')
      .sort({ timestamp: -1 })
      .limit(100); // Limit to prevent overload

    res.json(history);
  } catch (error) {
    console.error('Error fetching all product copy history:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Create a copy history entry (invoked from productController)
exports.recordCopyHistory = async (data) => {
  try {
    const historyEntry = new ProductCopyHistory(data);
    await historyEntry.save();
    return historyEntry;
  } catch (error) {
    console.error('Error recording product copy history:', error);
    // Don't throw, just log. We don't want history recording to break the main operation.
  }
};
