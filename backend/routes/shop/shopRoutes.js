const express = require('express');
const router = express.Router();
const { getShops } = require('../../controllers/admin/adminShopController');
const { shopAuth } = require('../../middleware/auth');
const { getShopDashboard, getShopDetails } = require('../../controllers/shop/shopController');
const { getHolidays } = require('../../controllers/admin/holidayController');


router.get('/', shopAuth, getShops);
router.get('/dashboard', shopAuth, getShopDashboard);
router.get('/details', shopAuth, getShopDetails);
router.get('/holidays', shopAuth, getHolidays); 

module.exports = router;