const express = require('express');
const router = express.Router();
const billController = require('../../controllers/shop/billController');
const { shopAuth } = require('../../middleware/auth');


router.post('/billing', shopAuth, billController.createBill);
router.get('/billing/search-customers', shopAuth, billController.searchCustomers);
router.post('/billing/hide-customer-suggestions', shopAuth, billController.hideCustomerSuggestions);
router.get('/report/sales', shopAuth, billController.getSalesReport);
router.get('/billing', shopAuth, billController.getBills);

router.get('/billing/:id', shopAuth, billController.getBillById);
router.put('/billing/:id', shopAuth, billController.updateBill);
router.patch('/billing/:id/payment-method', shopAuth, billController.updatePaymentMethod);
router.delete('/billing/:id', shopAuth, billController.deleteBill);

// MAKE SURE THIS LINE IS HERE
module.exports = router;