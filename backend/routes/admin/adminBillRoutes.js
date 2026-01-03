const express = require('express');
const router = express.Router();
const billingController = require('../../controllers/admin/billingController');
const { adminAuth } = require('../../middleware/auth');

router.post('/', adminAuth, billingController.createBill);
router.get('/', adminAuth, billingController.getBills);
router.get('/:id', adminAuth, billingController.getBillById);
router.put('/:id', adminAuth, billingController.updateBill);
router.delete('/:id', adminAuth, billingController.deleteBill);

// MAKE SURE THIS LINE IS HERE
module.exports = router;