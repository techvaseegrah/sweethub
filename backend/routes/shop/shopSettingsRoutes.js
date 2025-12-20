const express = require('express');
const router = express.Router();
const { 
  getGstSettings, 
  updateGstSettings,
  getBatchSettings,
  updateBatchSettings,
  deleteBatchSettings
} = require('../../controllers/shop/shopSettingsController');
const { shopAuth } = require('../../middleware/auth');

// Apply shop authentication middleware to all routes
router.use(shopAuth);

// GST Settings Routes
router.get('/gst', getGstSettings);
router.post('/gst', updateGstSettings);

// Batch Settings Routes
router.get('/batches', getBatchSettings);
router.post('/batches', updateBatchSettings);
router.delete('/batches/:batchId', deleteBatchSettings);

module.exports = router;