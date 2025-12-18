const express = require('express');
const router = express.Router();
const billingController = require('../../controllers/admin/billingController');
const { adminAuth } = require('../../middleware/auth');

router.post('/billing', adminAuth, billingController.createBill);
router.get('/billing', adminAuth, billingController.getBills);

// MAKE SURE THIS LINE IS HERE
module.exports = router;