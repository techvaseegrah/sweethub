const Order = require('../../models/orderModel');
const Product = require('../../models/productModel');
const Shop = require('../../models/shopModel');
const mongoose = require('mongoose');

// Create a new order from shop side
exports.createOrder = async (req, res) => {
  console.log('=== CREATE ORDER FROM SHOP REQUEST ===');
  console.log('Request body:', req.body);
  console.log('User:', req.user);
  
  const { items, tax = 0 } = req.body;
  const shopId = req.user.shopId;

  console.log('Items received:', items);
  console.log('Shop ID:', shopId);

  try {
    if (!shopId || !items || items.length === 0) {
      return res.status(400).json({ message: 'Shop ID and at least one item are required.' });
    }

    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found.' });

    let calculatedSubtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product with ID ${item.productId} not found.` });
      }

      const quantity = parseFloat(item.quantity);
      const unit = item.unit;
      const sellingPrice = product.prices.find(price => price.unit === unit)?.sellingPrice || 0;

      if (quantity <= 0) {
        return res.status(400).json({ message: `Quantity must be greater than 0 for product ${product.name}.` });
      }

      const totalPrice = sellingPrice * quantity;
      calculatedSubtotal += totalPrice;

      orderItems.push({
        product: item.productId,
        quantity: quantity,
        unitPrice: sellingPrice,
        sellingPrice: sellingPrice,
        totalPrice: totalPrice,
        productName: product.name,
        sku: product.sku,
        unit: unit,
      });
    }

    const calculatedTax = (calculatedSubtotal * tax) / 100;
    const calculatedGrandTotal = calculatedSubtotal + calculatedTax;

    // Generate order ID manually to ensure it's set before save
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}`;
    
    const lastOrder = await Order.findOne({ orderId: new RegExp(`^${prefix}`) })
                                 .sort({ createdAt: -1 });
    
    let nextSequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderId.split('-')[2]);
      nextSequence = lastSequence + 1;
    }
    
    const sequenceString = nextSequence.toString().padStart(3, '0');
    const orderId = `${prefix}-${sequenceString}`;

    const newOrder = new Order({
      orderId: orderId,
      shop: shopId,
      items: orderItems,
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      grandTotal: calculatedGrandTotal,
      status: 'Pending',
    });

    await newOrder.save();
    console.log('Order saved successfully:', newOrder.orderId);

    res.status(201).json({ message: 'Order created successfully!', order: newOrder });

  } catch (error) {
    console.log('Error creating order:', error.message);
    res.status(400).json({ message: error.message || 'Failed to create order.' });
  }
};

// Get all orders for the logged-in shop
exports.getShopOrders = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    
    const orders = await Order.find({ shop: shopId })
      .populate('shop', 'name address')
      .populate('admin', 'name')
      .sort({ orderDate: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders.', error: error.message });
  }
};

// Get a specific order by ID for the logged-in shop
exports.getShopOrderById = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const orderId = req.params.id;
    
    const order = await Order.findOne({ _id: orderId, shop: shopId })
      .populate('shop', 'name address')
      .populate('items.product', 'name sku prices');

    if (!order) {
      return res.status(404).json({ message: 'Order not found or does not belong to your shop.' });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch order.', error: error.message });
  }
};