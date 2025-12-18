const express = require('express');
const router = express.Router();
const billController = require('../../controllers/shop/billController');
const { shopAuth } = require('../../middleware/auth'); 

router.post('/billing', shopAuth, billController.createBill);
router.get('/billing', shopAuth, billController.getBills);

// MAKE SURE THIS LINE IS HERE
module.exports = router;