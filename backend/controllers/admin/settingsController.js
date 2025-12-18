const Setting = require('../../models/settingModel');

// Get GST settings
const getGstSettings = async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: 'gstPercentage' });
    if (!setting) {
      return res.json({ gstPercentage: 0 });
    }
    res.json({ gstPercentage: setting.value });
  } catch (error) {
    console.error('Error fetching GST settings:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update GST settings
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
    
    // Update or create the setting
    const setting = await Setting.findOneAndUpdate(
      { key: 'gstPercentage' },
      { value: numericGst },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    res.json({ message: 'GST settings updated successfully', gstPercentage: setting.value });
  } catch (error) {
    console.error('Error updating GST settings:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get batch settings
const getBatchSettings = async (req, res) => {
  try {
    const settings = await Setting.find({ key: { $regex: '^batch_' } });
    const batches = {};
    
    settings.forEach(setting => {
      // Extract batch ID correctly - it's the part between "batch_" and the setting name
      const keyParts = setting.key.split('_');
      const batchId = keyParts[1]; // batch_{id}_{settingName}
      
      if (!batches[batchId]) {
        batches[batchId] = { id: batchId };
      }
      
      // Parse the value if it's a JSON string
      let value = setting.value;
      if (typeof setting.value === 'string' && setting.value.startsWith('{')) {
        try {
          value = JSON.parse(setting.value);
        } catch (e) {
          // If parsing fails, keep the original value
        }
      }
      
      // The setting name is everything after batch_{id}_
      const settingName = keyParts.slice(2).join('_');
      batches[batchId][settingName] = value;
    });
    
    res.json(Object.values(batches));
  } catch (error) {
    console.error('Error fetching batch settings:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Create or update batch settings
const updateBatchSettings = async (req, res) => {
  try {
    const { batchId, name, workingHours, lunchBreak, breakTime } = req.body;
    
    if (!batchId || !name) {
      return res.status(400).json({ message: 'Batch ID and name are required' });
    }
    
    // Save batch settings
    const settingsToSave = [
      { key: `batch_${batchId}_name`, value: name },
      { key: `batch_${batchId}_workingHours`, value: JSON.stringify(workingHours) },
      { key: `batch_${batchId}_lunchBreak`, value: JSON.stringify(lunchBreak) },
      { key: `batch_${batchId}_breakTime`, value: JSON.stringify(breakTime) }
    ];
    
    // Update or create each setting
    for (const setting of settingsToSave) {
      await Setting.findOneAndUpdate(
        { key: setting.key },
        { value: setting.value },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    }
    
    res.json({ message: 'Batch settings updated successfully', batchId });
  } catch (error) {
    console.error('Error updating batch settings:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Delete batch settings
const deleteBatchSettings = async (req, res) => {
  try {
    const { batchId } = req.params;
    
    if (!batchId) {
      return res.status(400).json({ message: 'Batch ID is required' });
    }
    
    console.log(`Attempting to delete batch with ID: ${batchId}`);
    
    // Check if any workers are using this batch by checking if they have settings that match this batch
    // Note: This is a limitation of the current implementation - we don't store batch references in workers
    
    // Delete all settings for this batch
    const deleteResult = await Setting.deleteMany({ key: { $regex: `^batch_${batchId}_` } });
    
    console.log(`Deleted ${deleteResult.deletedCount} batch settings for batch ID: ${batchId}`);
    
    if (deleteResult.deletedCount === 0) {
      console.log(`No batch settings found for batch ID: ${batchId}`);
    }
    
    res.json({ message: 'Batch deleted successfully', deletedCount: deleteResult.deletedCount });
  } catch (error) {
    console.error('Error deleting batch settings:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getGstSettings,
  updateGstSettings,
  getBatchSettings,
  updateBatchSettings,
  deleteBatchSettings
};