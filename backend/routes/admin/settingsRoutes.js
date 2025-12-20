const express = require('express');
const router = express.Router();
const { getGstSettings, updateGstSettings } = require('../../controllers/admin/settingsController');
const { adminAuth } = require('../../middleware/auth');

// Apply admin authentication middleware to all routes
router.use(adminAuth);

// GST Settings Routes
router.get('/gst', getGstSettings);
router.post('/gst', updateGstSettings);

module.exports = router;