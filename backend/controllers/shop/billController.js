const Bill = require('../../models/billModel');
const Shop = require('../../models/shopModel');
const Product = require('../../models/productModel');
const User = require('../../models/User');
const mongoose = require('mongoose');
const { sendWhatsAppBill } = require('../../services/whatsappService');
const { generateShopBillId } = require('../../utils/billIdGenerator');
const { convertUnit, areRelatedUnits } = require('../../utils/unitConversion');

exports.createBill = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Identify Shop from Auth Middleware (req.user or req.shopId)
    // Assuming authMiddleware sets req.user.shopId
    const shopId = req.user?.shopId || req.shopId; 

    if (!shopId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Shop identification failed.' });
    }

    const { 
      customerMobileNumber, 
      customerName, 
      items, 
      baseAmount,
      gstPercentage,
      gstAmount,
      totalAmount, 
      paymentMethod, 
      amountPaid,
      discountType,
      discountValue,
      discountAmount,
      worker,
      billType = 'ORDINARY'
      // Note: fromInfo and toInfo are not used for shop bills
    } = req.body;

    // 2. Generate unique bill ID for this shop
    const billId = await generateShopBillId(shopId);

    // 3. Process Items & Deduct Stock
    // Note: This logic assumes Shops sell from the main Product collection 
    // where stockLevel is tracked.
    // 3. Process Items & Deduct Stock (Modified)
    const itemsWithDetails = [];
    
    if (items && items.length > 0) {
      for (const item of items) {
        // Find the product
        const product = await Product.findById(item.product).session(session);
        
        if (!product) {
          throw new Error(`Product with ID ${item.product} not found`);
        }

        // --- STOCK REDUCTION LOGIC ---
        // Deduct the quantity directly from stockLevel
        // We use 'stockLevel' because that is the field name in your Product model
        // Only deduct stock if billType is ORDINARY, skip if REFERENCE
        if (billType !== 'REFERENCE') {
          product.stockLevel = product.stockLevel - item.quantity;
          
          await product.save({ session });
        }
        // -----------------------------

        // Prepare item details for the bill (Required for saving the bill)
        itemsWithDetails.push({
          product: product._id,
          productName: product.name,
          sku: product.sku, 
          unit: item.unit,
          quantity: item.quantity,
          price: item.price,
        });
      }
    }

    // 4. Fetch Shop Details for Bill Creation
    const shopDetails = await Shop.findById(shopId);
    
    // 5. Create Bill
    const newBill = new Bill({
      billId,
      shop: shopId,
      customerMobileNumber,
      customerName,
      items: itemsWithDetails,
      baseAmount,
      gstPercentage,
      gstAmount,
      totalAmount,
      paymentMethod,
      amountPaid,
      // Note: FROM and TO information are not used for shop bills
      // Only admin bills use fromInfo and toInfo
      // Add discount fields
      discountType: discountType || 'none',
      discountValue: discountValue || 0,
      discountAmount: discountAmount || 0,
      billType,
      ...(worker && { worker }),
      // Include shop details for PDF generation
      shopName: shopDetails?.name,
      shopAddress: shopDetails?.location,
      shopGstNumber: shopDetails?.gstNumber,
      shopFssaiNumber: shopDetails?.fssaiNumber,
      shopPhone: shopDetails?.shopPhoneNumber
    });

    await newBill.save({ session });

    await session.commitTransaction();
    session.endSession();

    // 6. Get shop name for WhatsApp
    const shopName = shopDetails ? shopDetails.name : 'Sri Sakthi Sweets';

    // 6. Send WhatsApp only for ordinary bills, not reference bills
    if (billType === 'ORDINARY') {
      sendWhatsAppBill(newBill, shopName);
    }

    // 7. Respond to Frontend
    res.status(201).json({
      ...newBill._doc,
      shop: { name: shopName }
    });

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error('Shop Create Bill Error:', error);
    res.status(500).json({ 
      message: 'Failed to create bill', 
      error: error.message 
    });
  }
};

// Get a single bill by ID
exports.getBillById = async (req, res) => {
  try {
    const shopId = req.user?.shopId || req.shopId;
    
    if (!shopId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const bill = await Bill.findOne({ _id: req.params.id, shop: shopId })
      .populate('items.product', 'name sku unit prices')
      .populate('shop', 'name location gstNumber fssaiNumber shopPhoneNumber')
      .populate('deletedBy', 'name')
      .populate('worker', 'name');
      
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    // Return the bill even if it's soft deleted, so users can see deletion details
    res.json(bill);
  } catch (error) {
    console.error('Get Bill Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update an existing bill
exports.updateBill = async (req, res) => {
  const { customerMobileNumber, customerName, items, baseAmount, gstPercentage, gstAmount, totalAmount, paymentMethod, amountPaid, discountType, discountValue, discountAmount, worker, billType = 'ORDINARY' } = req.body;
  
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const shopId = req.user?.shopId || req.shopId;
    
    if (!shopId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const bill = await Bill.findOne({ _id: req.params.id, shop: shopId }).session(session);
    
    if (!bill) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Bill not found.' });
    }
    
    // Don't allow editing soft deleted bills
    if (bill.isDeleted) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Bill not found.' });
    }
    
    // Prepare items and check stock
    const itemsWithDetails = [];
    
    // First, restore original stock for the items in the original bill
    // Only restore stock if the original bill was ORDINARY, skip if REFERENCE
    if (bill.billType !== 'REFERENCE') {
      for (const originalItem of bill.items) {
        const product = await Product.findById(originalItem.product).session(session);
        
        if (product) {
          let originalQuantityInProductUnit = originalItem.quantity;
          if (product.prices && product.prices.length > 0) {
            const productBaseUnit = product.prices[0].unit;
            if (areRelatedUnits(originalItem.unit, productBaseUnit)) {
              originalQuantityInProductUnit = convertUnit(originalItem.quantity, originalItem.unit, productBaseUnit);
            }
          }
          
          // Add back the original quantity
          await Product.findByIdAndUpdate(
            originalItem.product,
            { $inc: { stockLevel: originalQuantityInProductUnit } },
            { session }
          );
        }
      }
    }
    
    // Process new items and deduct new stock
    for (const item of items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: `Product with ID ${item.product} not found.` });
      }
      
      // Check Stock - convert item quantity to product's unit if units are related
      // Only check stock if billType is ORDINARY, skip if REFERENCE
      if (billType !== 'REFERENCE') {
        let itemQuantityInProductUnit = item.quantity;
        if (product.prices && product.prices.length > 0) {
          const productBaseUnit = product.prices[0].unit;
          if (areRelatedUnits(item.unit, productBaseUnit)) {
            itemQuantityInProductUnit = convertUnit(item.quantity, item.unit, productBaseUnit);
          }
        }
        
        if (parseFloat(product.stockLevel) < parseFloat(itemQuantityInProductUnit)) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ message: `Insufficient stock for product ${product.name}. Available: ${product.stockLevel} ${product.prices && product.prices[0] ? product.prices[0].unit : 'units'}, requested: ${item.quantity} ${item.unit}` });
        }
      }

      itemsWithDetails.push({
        product: product._id,
        productName: product.name,
        unit: item.unit,
        quantity: item.quantity,
        price: item.price,
        sku: product.sku
      });

      // Deduct new stock
      // Only deduct stock if billType is ORDINARY, skip if REFERENCE
      if (billType !== 'REFERENCE') {
        let quantityToDeduct = item.quantity;
        if (product.prices && product.prices.length > 0) {
          const productBaseUnit = product.prices[0].unit;
          if (areRelatedUnits(item.unit, productBaseUnit)) {
            quantityToDeduct = convertUnit(item.quantity, item.unit, productBaseUnit);
          }
        }
        
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stockLevel: -quantityToDeduct } },
          { session }
        );
      }
    }

    // Update Bill
    const updatedBill = await Bill.findByIdAndUpdate(
      req.params.id,
      {
        customerMobileNumber,
        customerName,
        items: itemsWithDetails,
        baseAmount,
        gstPercentage,
        gstAmount,
        totalAmount,
        paymentMethod,
        amountPaid,
        discountType: discountType || 'none',
        discountValue: discountValue || 0,
        discountAmount: discountAmount || 0,
        billType,
        ...(worker && { worker }),
        isEdited: true // Mark as edited
      },
      { new: true, session }
    );
    
    await session.commitTransaction();
    session.endSession();
    
    // Send WhatsApp message only for ordinary bills, not reference bills
    if (updatedBill.billType === 'ORDINARY') {
      const shopDetails = await Shop.findById(updatedBill.shop);
      sendWhatsAppBill(updatedBill, shopDetails ? shopDetails.name : 'Sri Sakthi Sweets');
    }

    res.json(updatedBill);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error('Update Bill Error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Soft delete a bill
exports.deleteBill = async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Deletion reason is required.' });
    }
    
    const shopId = req.user?.shopId || req.shopId;
    
    if (!shopId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const bill = await Bill.findOne({ _id: req.params.id, shop: shopId, isDeleted: { $ne: true } });
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found.' });
    }
    
    // Don't allow deleting already soft deleted bills
    if (bill.isDeleted) {
      return res.status(404).json({ message: 'Bill not found.' });
    }
    
    // Update the bill to mark as deleted
    const updatedBill = await Bill.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
        deletionReason: reason,
        deletedBy: req.user._id,
        deletedAt: new Date()
      },
      { new: true }
    );
    
    res.json({ message: 'Bill deleted successfully', bill: updatedBill });
  } catch (error) {
    console.error('Delete Bill Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get all bills (excluding soft deleted ones)
exports.getBills = async (req, res) => {
  try {
    const shopId = req.user?.shopId || req.shopId;
    
    if (!shopId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const bills = await Bill.find({ shop: shopId })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name sku')
      .populate('deletedBy', 'name')
      .populate('worker', 'name');

    res.json(bills);
  } catch (error) {
    console.error('Shop Get Bills Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

