const express = require('express');
const router = express.Router();
const { getPendingInvoiceForShop, getAllInvoicesForShop, confirmInvoice } = require('../../controllers/shop/invoiceController');
const { shopAuth } = require('../../middleware/auth');

// --- Invoice Routes for Shop ---

// @route   GET api/shop/invoices/pending
// @desc    Get the latest pending invoice for the logged-in shop
// @access  Private (Shop only)
router.get('/pending', shopAuth, getPendingInvoiceForShop);

// @route   GET api/shop/invoices/all
// @desc    Get all invoices for the logged-in shop
// @access  Private (Shop only)
router.get('/all', shopAuth, getAllInvoicesForShop);

// @route   POST api/shop/invoices/:invoiceId/confirm
// @desc    Confirm received items in an invoice and add them to the shop's inventory
// @access  Private (Shop only)
router.post('/:invoiceId/confirm', shopAuth, confirmInvoice);

module.exports = router;