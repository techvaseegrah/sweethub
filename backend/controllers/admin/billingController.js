const Bill = require('../../models/billModel');
const Shop = require('../../models/shopModel');
const Product = require('../../models/productModel');
const mongoose = require('mongoose');
// IMPORT WHATSAPP SERVICE
const { sendWhatsAppBill } = require('../../services/whatsappService');
const { generateAdminBillId, generateShopBillId } = require('../../utils/billIdGenerator');

exports.createBill = async (req, res) => {
  const { shopId: shopIdFromBody, customerMobileNumber, customerName, items, baseAmount, gstPercentage, gstAmount, totalAmount, paymentMethod, amountPaid, fromInfo, toInfo, discountType, discountValue, discountAmount } = req.body;
  
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
      if (product.stockLevel < item.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Insufficient stock for product ${product.name}. Available: ${product.stockLevel}` });
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
      ...(finalShopId && finalShopId !== 'admin' && { shop: finalShopId }),
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
      discountAmount: discountAmount || 0
    });
    
    await newBill.save({ session });

    // Deduct stock
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stockLevel: -item.quantity } },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    // Send WhatsApp message
    sendWhatsAppBill(newBill, shopDetails ? shopDetails.name : 'Admin');

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

// Add the getBills function
exports.getBills = async (req, res) => {
  try {
    // For admin, we might want to get all bills or filter by shop
    // If shopId is provided in query, filter by that shop
    const { shopId } = req.query;
    
    let filter = {};
    if (shopId && shopId !== 'admin') {
      filter.shop = shopId;
    } else if (shopId === 'admin') {
      // Only admin bills (no shop field or shop is null)
      filter.$or = [{ shop: null }, { shop: { $exists: false } }];
    }
    
    const bills = await Bill.find(filter)
      .sort({ createdAt: -1 })
      .populate('items.product', 'name sku');
      
    res.json(bills);
  } catch (error) {
    console.error('Admin Get Bills Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};