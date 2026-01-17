const Order = require('../../models/orderModel');
const Product = require('../../models/productModel');
const Shop = require('../../models/shopModel');
const Invoice = require('../../models/invoiceModel');
const mongoose = require('mongoose');

// Create a new order (from shop side)
exports.createOrder = async (req, res) => {
  console.log('=== CREATE ORDER REQUEST ===');
  console.log('Request body:', req.body);
  console.log('User:', req.user);
  
  const { shopId, items, tax = 0 } = req.body;
  const requestingShopId = req.user.shopId || shopId;

  console.log('Items received:', items);

  try {
    if (!requestingShopId || !items || items.length === 0) {
      return res.status(400).json({ message: 'Shop ID and at least one item are required.' });
    }

    const shop = await Shop.findById(requestingShopId);
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
      shop: requestingShopId,
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

// Get all orders for admin (all shops)
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('shop', 'name address')
      .populate('admin', 'name')
      .sort({ orderDate: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders.', error: error.message });
  }
};

// Get orders for a specific shop (from admin perspective)
exports.getOrdersForShop = async (req, res) => {
  try {
    const { shopId } = req.params;
    
    const orders = await Order.find({ shop: shopId })
      .populate('shop', 'name address')
      .populate('admin', 'name')
      .sort({ orderDate: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders for shop.', error: error.message });
  }
};

// Get a specific order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('shop', 'name address')
      .populate('items.product', 'name sku prices');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch order.', error: error.message });
  }
};

// Update order status (when admin processes or invoices the order)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status, invoiceId } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    order.status = status;
    if (invoiceId) {
      order.invoiceId = invoiceId;
    }
    if (status === 'Invoiced') {
      order.admin = req.user.id; // Mark who processed the order
    }

    await order.save();

    res.status(200).json({ message: 'Order updated successfully!', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order.', error: error.message });
  }
};