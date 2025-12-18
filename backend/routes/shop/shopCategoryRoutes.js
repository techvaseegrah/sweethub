const express = require('express');
const router = express.Router();
const { getCategories } = require('../../controllers/admin/categoryController');
const { shopAuth } = require('../../middleware/auth');

// This route allows a shop user to view categories in their shop
router.get('/', shopAuth, getCategories);

module.exports = router;