const Bill = require('../../models/billModel');
const Shop = require('../../models/shopModel');
const Product = require('../../models/productModel');
const User = require('../../models/User');
const mongoose = require('mongoose');
// IMPORT WHATSAPP SERVICE
const { sendWhatsAppBill } = require('../../services/whatsappService');
const { generateAdminBillId, generateShopBillId } = require('../../utils/billIdGenerator');
const { convertUnit, areRelatedUnits } = require('../../utils/unitConversion');

exports.searchCustomers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.length < 3) {
      return res.json([]);
    }

    // Search for unique customers by mobile or name
    const customers = await Bill.aggregate([
      {
        $match: {
          $or: [
            { customerMobileNumber: { $regex: query, $options: 'i' } },
            { customerName: { $regex: query, $options: 'i' } },
            { "toInfo.address": { $regex: query, $options: 'i' } }
          ],
          isDeleted: false,
          hideFromSuggestions: { $ne: true }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$customerMobileNumber',
          customerName: { $first: '$customerName' },
          toInfo: { $first: '$toInfo' }
        }
      },
      {
        $limit: 10
      }
    ]);

    res.json(customers.map(c => ({
      mobile: c._id,
      name: c.customerName,
      address: c.toInfo?.address || ''
    })));
  } catch (error) {
    console.error('Search Customers Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.hideCustomerSuggestions = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ message: 'Mobile number is required' });

    // Mark all matching bills for this mobile as hidden from suggestions
    await Bill.updateMany(
      { customerMobileNumber: mobile },
      { hideFromSuggestions: true }
    );

    res.json({ message: 'Customer suggestions hidden successfully' });
  } catch (error) {
    console.error('Hide Customer Suggestions Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.createBill = async (req, res) => {
  const { shopId: shopIdFromBody, customerMobileNumber, customerName, items, baseAmount, gstPercentage, gstAmount, totalAmount, paymentMethod, amountPaid, fromInfo, toInfo, discountType, discountValue, discountAmount, worker, billType = 'ORDINARY', billDate, isTaxInvoice } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const finalShopId = req.shopId || shopIdFromBody;

    // Validate Shop
    let shopDetails = null;
    if (finalShopId && finalShopId !== 'admin') {
      shopDetails = await Shop.findById(finalShopId).session(session);
      if (!shopDetails) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: 'Shop not found.' });
      }
    }

    // Generate bill ID based on whether it's admin or shop bill
    let billId;
    if (!finalShopId || finalShopId === 'admin') {
      // Admin bill
      billId = await generateAdminBillId();
    } else {
      // Shop bill created by admin
      billId = await generateShopBillId(finalShopId);
    }

    // Prepare items and check stock
    const itemsWithDetails = [];
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
          const productBaseUnit = product.prices[0].unit; // Assuming all prices use the same base unit
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
        sku: product.sku // Good practice to save SKU
      });
    }

    // Create Bill
    const newBill = new Bill({
      billId,
      ...(finalShopId && finalShopId !== 'admin' && {
        shop: finalShopId,
        // Include shop details for PDF generation
        shopName: shopDetails?.name,
        shopAddress: shopDetails?.location,
        shopGstNumber: shopDetails?.gstNumber,
        shopFssaiNumber: shopDetails?.fssaiNumber,
        shopPhone: shopDetails?.shopPhoneNumber
      }),
      customerMobileNumber,
      customerName,
      items: itemsWithDetails,
      baseAmount,
      gstPercentage,
      gstAmount,
      totalAmount,
      paymentMethod,
      amountPaid,
      ...(fromInfo && { fromInfo }),
      ...(toInfo && { toInfo }),
      // Add discount fields
      discountType: discountType || 'none',
      discountValue: discountValue || 0,
      discountAmount: discountAmount || 0,
      billType,
      ...(worker && { worker }),
      isTaxInvoice: isTaxInvoice || false,
      billDate: billDate || Date.now() // Use provided date or default to now
    });

    await newBill.save({ session });

    // Deduct stock - convert quantity to product's unit if units are related
    // Only deduct stock if billType is ORDINARY, skip if REFERENCE
    if (billType !== 'REFERENCE') {
      for (const item of items) {
        const product = await Product.findById(item.product).session(session);

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

    await session.commitTransaction();
    session.endSession();

    // Send WhatsApp message only for ordinary bills, not reference bills
    if (billType === 'ORDINARY') {
      sendWhatsAppBill(newBill, shopDetails ? shopDetails.name : 'Admin');
    }

    res.status(201).json(newBill);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error('Create Bill Error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get a single bill by ID
exports.getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
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
  const { customerMobileNumber, customerName, items, baseAmount, gstPercentage, gstAmount, totalAmount, paymentMethod, amountPaid, fromInfo, toInfo, discountType, discountValue, discountAmount, worker, billType = 'ORDINARY', billDate, isTaxInvoice } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const bill = await Bill.findById(req.params.id).session(session);

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

    // Check if this is a shop bill and user has permission
    const isShopBill = bill.shop;
    if (isShopBill) {
      // Only admin can edit shop bills, or shop user can edit their own bills
      const shopId = req.shopId;
      if (shopId && shopId !== bill.shop.toString()) {
        await session.abortTransaction();
        session.endSession();
        return res.status(403).json({ message: 'Not authorized to edit this bill.' });
      }
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
        fromInfo,
        toInfo,
        discountType: discountType || 'none',
        discountValue: discountValue || 0,
        discountAmount: discountAmount || 0,
        billType,
        ...(worker && { worker }),
        isTaxInvoice: isTaxInvoice !== undefined ? isTaxInvoice : bill.isTaxInvoice,
        ...(billDate && { billDate }), // Update billDate if provided
        isEdited: true // Mark as edited
      },
      { new: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    // Send WhatsApp message only for ordinary bills, not reference bills
    if (updatedBill.billType === 'ORDINARY') {
      const shopDetails = await Shop.findById(updatedBill.shop);
      sendWhatsAppBill(updatedBill, shopDetails ? shopDetails.name : 'Admin');
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Deletion reason is required.' });
    }

    const bill = await Bill.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).session(session);

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found.' });
    }

    // Don't allow deleting already soft deleted bills
    if (bill.isDeleted) {
      return res.status(404).json({ message: 'Bill not found.' });
    }

    // Check if this is a shop bill and user has permission
    const isShopBill = bill.shop;
    if (isShopBill) {
      // Only admin can delete shop bills, or shop user can delete their own bills
      const shopId = req.shopId;
      if (shopId && shopId !== bill.shop.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this bill.' });
      }
    }

    // Restore stock for the items in the bill if it was an ORDINARY bill
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

    // Update the bill to mark as deleted
    const updatedBill = await Bill.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
        deletionReason: reason,
        deletedBy: req.user._id,
        deletedAt: new Date()
      },
      { new: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'Bill deleted successfully', bill: updatedBill });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error('Delete Bill Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get all bills (excluding soft deleted ones)
exports.getBills = async (req, res) => {
  try {
    // For admin, we might want to get all bills or filter by shop
    // If shopId is provided in query, filter by that shop
    const { shopId, categoryId } = req.query;

    let filter = {}; // Include soft deleted bills
    if (shopId && shopId !== 'admin') {
      filter.shop = shopId;
    } else if (shopId === 'admin') {
      // Only admin bills (no shop field or shop is null)
      filter.$or = [
        { shop: null },
        { shop: { $exists: false } },
        { shop: { $eq: null } }
      ];
    }

    // If categoryId is provided, filter bills that have items from this category
    if (categoryId) {
      // Find all products in this category
      const products = await Product.find({ category: categoryId }).select('_id');
      const productIds = products.map(p => p._id);

      // Add to filter: bills where at least one item's product is in productIds
      filter['items.product'] = { $in: productIds };
    }

    const bills = await Bill.find(filter)
      .sort({ createdAt: -1 })
      .populate('items.product', 'name sku')
      .populate('deletedBy', 'name')
      .populate('worker', 'name');

    res.json(bills);
  } catch (error) {
    console.error('Admin Get Bills Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update only the payment method of a bill
exports.updatePaymentMethod = async (req, res) => {
  const { paymentMethod } = req.body;

  if (!['Cash', 'UPI', 'Card'].includes(paymentMethod)) {
    return res.status(400).json({ message: 'Invalid payment method.' });
  }

  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found.' });
    }

    if (bill.isDeleted) {
      return res.status(400).json({ message: 'Cannot update a deleted bill.' });
    }

    bill.paymentMethod = paymentMethod;
    bill.isEdited = true;
    await bill.save();

    res.json({ message: 'Payment method updated successfully', bill });
  } catch (error) {
    console.error('Update Payment Method Error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


// Get Sales Report with aggregation
exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, shopId } = req.query;

    let filter = { isDeleted: false };

    if (startDate && endDate) {
      filter.billDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (shopId && shopId !== 'all') {
      if (shopId === 'admin') {
        filter.$or = [
          { shop: null },
          { shop: { $exists: false } },
          { shop: { $eq: null } }
        ];
      } else {
        filter.shop = new mongoose.Types.ObjectId(shopId);
      }
    }

    // Aggregation for Total Revenue, Total Transactions, and Total Items Sold
    const statsResult = await Bill.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalTransactions: { $sum: 1 },
          totalItemsSold: { $sum: { $sum: '$items.quantity' } }
        }
      }
    ]);

    const stats = statsResult.length > 0 ? statsResult[0] : { totalRevenue: 0, totalTransactions: 0, totalItemsSold: 0 };

    // Aggregation for Product-wise Sales
    const productSales = await Bill.aggregate([
      { $match: filter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productName',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { totalQuantity: -1 } }
    ]);

    // Aggregation for Customer-wise Sales
    const customerSales = await Bill.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$customerMobileNumber',
          customerName: { $first: '$customerName' },
          totalSpent: { $sum: '$totalAmount' },
          totalBills: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 20 } // Limit to top 20 customers
    ]);

    // Aggregation for Shop-wise Sales (only for admin when shopId is 'all')
    let shopSummaries = [];
    if (!req.shopId && shopId === 'all') {
      shopSummaries = await Bill.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$shop',
            shopName: { $first: '$shopName' },
            totalRevenue: { $sum: '$totalAmount' },
            totalTransactions: { $sum: 1 }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]);
    }

    res.json({
      stats,
      productSales: productSales.map(item => ({
        productName: item._id,
        totalQuantity: item.totalQuantity,
        totalRevenue: item.totalRevenue
      })),
      customerSales: customerSales.map(item => ({
        mobile: item._id,
        name: item.customerName || 'Unknown',
        totalSpent: item.totalSpent,
        totalBills: item.totalBills
      })),
      shopSummaries: shopSummaries.map(item => ({
        shopId: item._id || 'admin',
        shopName: item.shopName || 'Admin Factory',
        totalRevenue: item.totalRevenue,
        totalTransactions: item.totalTransactions
      }))
    });
  } catch (error) {
    console.error('Get Sales Report Error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
