const express = require('express');
const router = express.Router();
const billingController = require('../../controllers/admin/billingController');
const { adminAuth } = require('../../middleware/auth');


router.post('/', adminAuth, billingController.createBill);
router.get('/search-customers', adminAuth, billingController.searchCustomers);
router.post('/hide-customer-suggestions', adminAuth, billingController.hideCustomerSuggestions);
router.get('/report/sales', adminAuth, billingController.getSalesReport);
router.get('/', adminAuth, billingController.getBills);

router.get('/:id', adminAuth, billingController.getBillById);
router.put('/:id', adminAuth, billingController.updateBill);
router.patch('/:id/payment-method', adminAuth, billingController.updatePaymentMethod);
router.delete('/:id', adminAuth, billingController.deleteBill);

// MAKE SURE THIS LINE IS HERE
module.exports = router;