const express = require('express');
const router = express.Router();
const { addShop, getShops, updateShop, deleteShop, updateShopAccess } = require('../../controllers/admin/adminShopController');
const { adminAuth } = require('../../middleware/auth');

router.post('/', adminAuth, addShop);
router.get('/', adminAuth, getShops);
router.put('/:id', adminAuth, updateShop);
router.delete('/:id', adminAuth, deleteShop);
router.put('/:id/access', adminAuth, updateShopAccess);

module.exports = router;