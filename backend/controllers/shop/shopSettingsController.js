const Setting = require('../../models/settingModel');

// Get GST settings for a specific shop
const getGstSettings = async (req, res) => {
  try {
    const setting = await Setting.findOne({ 
      key: 'gstPercentage', 
      type: 'shop',
      shop: req.shopId 
    });
    
    if (!setting) {
      return res.json({ gstPercentage: 0 });
    }
    
    res.json({ gstPercentage: setting.value });
  } catch (error) {
    console.error('Error fetching GST settings:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update GST settings for a specific shop
const updateGstSettings = async (req, res) => {
  try {
    const { gstPercentage } = req.body;
    
    // Validate input
    if (gstPercentage === undefined || gstPercentage === null || isNaN(gstPercentage)) {
      return res.status(400).json({ message: 'Invalid GST percentage' });
    }
    
    const numericGst = parseFloat(gstPercentage);
    if (numericGst < 0 || numericGst > 100) {
      return res.status(400).json({ message: 'GST percentage must be between 0 and 100' });
    }
    
    // Update or create the setting for this specific shop
    const setting = await Setting.findOneAndUpdate(
      { key: 'gstPercentage', type: 'shop', shop: req.shopId },
      { 
        value: numericGst,
        type: 'shop',
        shop: req.shopId
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    res.json({ message: 'GST settings updated successfully', gstPercentage: setting.value });
  } catch (error) {
    console.error('Error updating GST settings:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get batch settings for a specific shop
const getBatchSettings = async (req, res) => {
  try {
    const settings = await Setting.find({ 
      key: { $regex: /^batch_/ },
      type: 'shop',
      shop: req.shopId
    });
    
    // Transform the settings into the expected format
    const batches = settings.map(setting => ({
      id: setting._id,
      ...setting.value
    }));
    
    res.json(batches);
  } catch (error) {
    console.error('Error fetching batch settings:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update/Create batch settings for a specific shop
const updateBatchSettings = async (req, res) => {
  try {
    const { batchId, name, workingHours, lunchBreak, breakTime } = req.body;
    
    // Validate input
    if (!batchId || !name) {
      return res.status(400).json({ message: 'Batch ID and name are required' });
    }
    
    // Prepare the batch data
    const batchData = {
      name,
      workingHours: workingHours || { from: '', to: '', included: true },
      lunchBreak: lunchBreak || { from: '', to: '', included: true },
      breakTime: breakTime || { from: '', to: '', included: true }
    };
    
    // Update or create the setting for this specific shop
    const setting = await Setting.findOneAndUpdate(
      { key: `batch_${batchId}`, type: 'shop', shop: req.shopId },
      { 
        value: batchData,
        type: 'shop',
        shop: req.shopId
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    res.json({ message: 'Batch settings updated successfully', batch: { id: setting._id, ...setting.value } });
  } catch (error) {
    console.error('Error updating batch settings:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Delete batch settings for a specific shop
const deleteBatchSettings = async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Delete the setting for this specific shop
    const result = await Setting.deleteOne({ 
      key: `batch_${batchId}`,
      type: 'shop',
      shop: req.shopId
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    
    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getGstSettings,
  updateGstSettings,
  getBatchSettings,
  updateBatchSettings,
  deleteBatchSettings
};