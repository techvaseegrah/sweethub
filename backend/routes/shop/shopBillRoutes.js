const express = require('express');
const router = express.Router();
const billController = require('../../controllers/shop/billController');
const { shopAuth } = require('../../middleware/auth'); 

router.post('/billing', shopAuth, billController.createBill);
router.get('/billing', shopAuth, billController.getBills);
router.get('/billing/:id', shopAuth, billController.getBillById);
router.put('/billing/:id', shopAuth, billController.updateBill);
router.delete('/billing/:id', shopAuth, billController.deleteBill);

// MAKE SURE THIS LINE IS HERE
module.exports = router;