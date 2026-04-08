const Invoice = require('../../models/invoiceModel');
const Product = require('../../models/productModel');
const Order = require('../../models/orderModel');
const Shop = require('../../models/shopModel');
const User = require('../../models/User');
const { recordStockOut } = require('./productHistoryController');
const mongoose = require('mongoose');

/**
 * Creates a new invoice to send products to a shop from admin side.
 * This happens when admin processes an order and creates an invoice for the shop.
 */
exports.createInvoice = async (req, res) => {
  console.log('=== CREATE INVOICE REQUEST ===');
  console.log('Request body:', req.body);
  console.log('User:', req.user);

  const { shopId, items, orderId } = req.body;

  try {
    // Validate inputs
    if (!shopId || !items || items.length === 0) {
      return res.status(400).json({ message: 'Shop ID and items are required.' });
    }

    // Find the shop
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found.' });
    }

    // Find admin creating the invoice
    const admin = await User.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin user not found.' });
    }

    // Calculate totals
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product with ID ${item.product} not found.` });
      }

      const quantity = parseFloat(item.quantity);
      const unitPrice = parseFloat(item.unitPrice);
      const totalPrice = quantity * unitPrice;

      subtotal += totalPrice;

      // --- ADDED: Decrease product stock level in admin inventory ---
      if (product.stockLevel !== undefined) {
        product.stockLevel = (parseFloat(product.stockLevel) || 0) - quantity;
        await product.save();
        console.log(`Decreased stock for ${product.name} by ${quantity}. New stock: ${product.stockLevel}`);

        // Record stock out history
        try {
          // Note: invoiceNumber is generated below, but we can use it here if we reorder or just use a generic message
          await recordStockOut(product, req.user.id, quantity, `Sent to Shop: ${shop.name}`);
        } catch (historyError) {
          console.error('Failed to record stock out history:', historyError);
        }
      }

      processedItems.push({
        product: item.product,
        productName: product.name,
        productSku: product.sku,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        unit: item.unit,
        receivedQuantity: 0, // Initially 0, updated when shop confirms
        shopConfirmed: false // Initially false, updated when shop confirms
      });
    }

    // Tax calculation (if applicable)
    const taxRate = 0; // Assuming no tax for simplicity, can be modified
    const tax = (subtotal * taxRate) / 100;
    const grandTotal = subtotal + tax;

    // Generate invoice number
    const year = new Date().getFullYear();
    const prefix = `INV-${year}`;

    const lastInvoice = await Invoice.findOne({ invoiceNumber: new RegExp(`^${prefix}`) })
      .sort({ createdAt: -1 });

    let nextSequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
      nextSequence = lastSequence + 1;
    }

    const sequenceString = nextSequence.toString().padStart(3, '0');
    const invoiceNumber = `${prefix}-${sequenceString}`;

    // Create the invoice
    const newInvoice = new Invoice({
      invoiceNumber,
      admin: req.user.id,
      shop: shopId,
      items: processedItems,
      subtotal,
      tax,
      grandTotal,
      status: 'Pending', // Awaiting shop confirmation
      issueDate: new Date(),
      order: orderId || null,
      sourceOrderId: null // Will be updated below if orderId exists
    });

    // If an order ID was provided, update the order status and get human-readable orderId
    if (orderId) {
      const order = await Order.findById(orderId);
      if (order) {
        order.status = 'Invoiced';
        order.invoiceId = newInvoice._id;
        await order.save();
        console.log(`Order ${order.orderId} updated to Invoiced status`);

        // Store human-readable orderId in the invoice
        newInvoice.sourceOrderId = order.orderId;
      }
    }

    await newInvoice.save();
    console.log('Invoice created successfully:', newInvoice.invoiceNumber);

    res.status(201).json({
      message: 'Invoice created successfully!',
      invoice: newInvoice
    });

  } catch (error) {
    console.error('Error creating invoice:', error.message);
    res.status(400).json({ message: error.message || 'Failed to create invoice.' });
  }
};

/**
 * Gets all invoices created by the admin (across all shops).
 * Populates shop and admin information for display.
 */
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({})
      .populate('shop', 'name address')
      .populate('admin', 'name')
      .sort({ issueDate: -1 });

    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch invoices.', error: error.message });
  }
};

/**
 * Gets a specific invoice by ID.
 * Populates shop and admin information.
 */
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('shop', 'name address')
      .populate('admin', 'name');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch invoice.', error: error.message });
  }
};
