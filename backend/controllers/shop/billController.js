const Bill = require('../../models/billModel');
const Shop = require('../../models/shopModel');
const Product = require('../../models/productModel');
const mongoose = require('mongoose');
const { sendWhatsAppBill } = require('../../services/whatsappService');
const { generateShopBillId } = require('../../utils/billIdGenerator');

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
      totalAmount, 
      paymentMethod, 
      amountPaid,
      discountType,
      discountValue,
      discountAmount,
      fromInfo, // Add FROM information
      toInfo    // Add TO information
    } = req.body;

    // 2. Generate unique bill ID for this shop
    const billId = await generateShopBillId(shopId);

    // 3. Process Items & Deduct Stock
    // Note: This logic assumes Shops sell from the main Product collection 
    // where stockLevel is tracked.
    const itemsWithDetails = [];
    
    for (const item of items) {
      const product = await Product.findById(item.product).session(session);
      
      if (!product) {
        throw new Error(`Product ${item.productName} not found`);
      }

      // Optional: Check Stock
      if (product.stockLevel < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockLevel}`);
      }

      itemsWithDetails.push({
        product: product._id,
        productName: product.name,
        sku: product.sku,
        unit: item.unit,
        quantity: item.quantity,
        price: item.price,
      });

      // Update Stock
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stockLevel: -item.quantity } },
        { session }
      );
    }

    // 4. Create Bill
    const newBill = new Bill({
      billId,
      shop: shopId,
      customerMobileNumber,
      customerName,
      items: itemsWithDetails,
      totalAmount,
      paymentMethod,
      amountPaid,
      // Add FROM and TO information
      ...(fromInfo && { fromInfo }),
      ...(toInfo && { toInfo }),
      // Add discount fields
      discountType: discountType || 'none',
      discountValue: discountValue || 0,
      discountAmount: discountAmount || 0
    });

    await newBill.save({ session });

    await session.commitTransaction();
    session.endSession();

    // 5. Fetch Shop Details for WhatsApp Name
    const shopDetails = await Shop.findById(shopId);
    const shopName = shopDetails ? shopDetails.name : 'Sri Sakthi Sweets';

    // 6. Send WhatsApp
    sendWhatsAppBill(newBill, shopName);

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

exports.getBills = async (req, res) => {
  try {
    const shopId = req.user?.shopId || req.shopId;
    
    if (!shopId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const bills = await Bill.find({ shop: shopId })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name sku');

    res.json(bills);
  } catch (error) {
    console.error('Shop Get Bills Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};