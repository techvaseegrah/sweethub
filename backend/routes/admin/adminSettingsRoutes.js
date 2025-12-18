const express = require('express');
const router = express.Router();
const { 
  getGstSettings, 
  updateGstSettings,
  getBatchSettings,
  updateBatchSettings,
  deleteBatchSettings
} = require('../../controllers/admin/settingsController');
const { adminAuth } = require('../../middleware/auth');

// Apply admin authentication middleware to all routes
router.use(adminAuth);

// GST Settings Routes
router.get('/gst', getGstSettings);
router.post('/gst', updateGstSettings);

// Batch Settings Routes
router.get('/batches', getBatchSettings);
router.post('/batches', updateBatchSettings);
router.delete('/batches/:batchId', deleteBatchSettings);

module.exports = router;