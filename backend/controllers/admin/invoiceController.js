const Invoice = require('../../models/invoiceModel');
const Product = require('../../models/productModel');
const Shop = require('../../models/shopModel');
const mongoose = require('mongoose');

const generateInvoiceNumber = async () => {
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
  return `${prefix}-${sequenceString}`;
};

exports.createInvoice = async (req, res) => {
  console.log('=== CREATE INVOICE REQUEST ===');
  console.log('Request body:', req.body);
  console.log('User:', req.user);
  
  const { shopId, items, tax = 0 } = req.body;
  const adminId = req.user.id;

  console.log('Items received:', items);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!shopId || !items || items.length === 0) {
      throw new Error('Shop ID and at least one item are required.');
    }
    const shop = await Shop.findById(shopId).session(session);
    if (!shop) throw new Error('Shop not found.');

    let calculatedSubtotal = 0;
    const invoiceItems = [];

    for (const item of items) {
      const quantity = parseFloat(item.quantity);
      const unitPrice = parseFloat(item.unitPrice);
      const unit = item.unit; // Extract unit from the item

      if (isNaN(quantity) || quantity <= 0) {
        throw new Error(`Invalid quantity provided for product ID ${item.productId}.`);
      }
      if (isNaN(unitPrice) || unitPrice < 0) {
        throw new Error(`Invalid unit price provided for product ID ${item.productId}.`);
      }
      if (!unit) {
        throw new Error(`Unit is required for product ID ${item.productId}.`);
      }

      const product = await Product.findById(item.productId).session(session);
      if (!product) throw new Error(`Product with ID ${item.productId} not found.`);
      if (product.admin.toString() !== adminId) throw new Error(`Product "${product.name}" is not in your inventory.`);
      
      // --- MODIFICATION: The stock level check has been removed ---
      // if (product.stockLevel < quantity) throw new Error(`Not enough stock for "${product.name}". Available: ${product.stockLevel}, Requested: ${quantity}.`);

      // The stock level is still decreased as before
      product.stockLevel = parseFloat(product.stockLevel) - parseFloat(quantity);
      await product.save({ session });
      
      const totalPrice = unitPrice * quantity;
      calculatedSubtotal += totalPrice;

      invoiceItems.push({
        product: item.productId,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        productName: product.name,
        productSku: product.sku,
        unit: unit, // Include unit information
      });
    }

    const calculatedTax = (calculatedSubtotal * tax) / 100;
    const calculatedGrandTotal = calculatedSubtotal + calculatedTax;
    
    const newInvoiceNumber = await generateInvoiceNumber();

    const newInvoice = new Invoice({
      invoiceNumber: newInvoiceNumber,
      admin: adminId,
      shop: shopId,
      items: invoiceItems,
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      grandTotal: calculatedGrandTotal,
      status: 'Pending',
    });
    
    await newInvoice.save({ session });
    console.log('Invoice saved successfully:', newInvoiceNumber);

    await session.commitTransaction();
    console.log('Transaction committed successfully');
    res.status(201).json({ message: 'Invoice created successfully!', invoice: newInvoice });

  } catch (error) {
    console.log('Error creating invoice:', error.message);
    await session.abortTransaction();
    res.status(400).json({ message: error.message || 'Failed to create invoice.' });
  } finally {
    session.endSession();
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ admin: req.user.id })
      .populate('shop', 'name address')
      .sort({ issueDate: -1 });

    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch invoices.', error: error.message });
  }
};