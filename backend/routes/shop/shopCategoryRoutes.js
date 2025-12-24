const express = require('express');
const router = express.Router();
const { getCategories, getAllCategories } = require('../../controllers/admin/categoryController');
const { shopAuth } = require('../../middleware/auth');

// This route allows a shop user to view categories in their shop
router.get('/', shopAuth, getCategories);

// This route allows a shop user to view all admin categories for admin products view
router.get('/all', shopAuth, getAllCategories);

module.exports = router;