const express = require('express');
const router = express.Router();
const { createCategory, getCategories, getAllCategories } = require('../../controllers/admin/categoryController');
const { shopAuth } = require('../../middleware/auth');

// Route to create a new category for shop users
router.post('/', shopAuth, createCategory);

// This route allows a shop user to view categories in their shop
router.get('/', shopAuth, getCategories);

// Route to delete a category for shop users
router.delete('/:id', shopAuth, require('../../controllers/admin/categoryController').deleteCategory);

// This route allows a shop user to view all admin categories for admin products view
router.get('/all', shopAuth, getAllCategories);

module.exports = router;