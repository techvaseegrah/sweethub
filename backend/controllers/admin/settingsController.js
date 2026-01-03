const Setting = require('../../models/settingModel');

// Get GST settings for admin
const getGstSettings = async (req, res) => {
  try {
    const setting = await Setting.findOne({ 
      key: 'gstPercentage',
      type: 'admin' // Only get admin settings
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

// Update GST settings for admin
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
    
    // Update or create the setting for admin only
    const setting = await Setting.findOneAndUpdate(
      { key: 'gstPercentage', type: 'admin' },
      { 
        value: numericGst,
        type: 'admin'
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    res.json({ message: 'GST settings updated successfully', gstPercentage: setting.value });
  } catch (error) {
    console.error('Error updating GST settings:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get batch settings for admin
const getBatchSettings = async (req, res) => {
  try {
    const settings = await Setting.find({ 
      key: { $regex: /^batch_/ },
      type: 'admin' // Only get admin settings
    });
    
    // Transform the settings into the expected format
    const batches = settings.map(setting => {
      // Extract the original batchId from the key (e.g., "batch_1234567890" -> "1234567890")
      const batchId = setting.key.replace('batch_', '');
      return {
        id: batchId,
        ...setting.value
      };
    });
    
    res.json(batches);
  } catch (error) {
    console.error('Error fetching batch settings:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update/Create batch settings for admin
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
    
    // Update or create the setting for admin only
    const setting = await Setting.findOneAndUpdate(
      { key: `batch_${batchId}`, type: 'admin' },
      { 
        value: batchData,
        type: 'admin'
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    // Return the original batchId in the response
    res.json({ message: 'Batch settings updated successfully', batch: { id: batchId, ...setting.value } });
  } catch (error) {
    console.error('Error updating batch settings:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Delete batch settings for admin
const deleteBatchSettings = async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Delete the setting for admin only using the batchId parameter
    const result = await Setting.deleteOne({ 
      key: `batch_${batchId}`,
      type: 'admin'
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