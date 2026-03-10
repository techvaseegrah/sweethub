const Order = require('../../models/orderModel');
const Product = require('../../models/productModel');
const AfterPacking = require('../../models/afterPackingModel');
const BeforePacking = require('../../models/beforePackingModel');
const DailySchedule = require('../../models/dailyScheduleModel');
const mongoose = require('mongoose');

/**
 * Helper function to escape regex special characters
 */
const escapeRegExp = (string) => {
    return string ? string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
};


/**
 * Helper function to check availability for a single product across all stages
 */
const getProductAvailabilityInfo = async (productName, requestedQuantity, unit, productId = null) => {
    // Default availability info
    let availabilityInfo = {
        productName: productName,
        requestedQuantity: requestedQuantity,
        unit: unit,
        availableIn: 'Not Available',
        availableQuantity: 0,
        details: null,
        isAvailable: false,
        sufficientStock: false
    };

    // Check ALL locations and collect results
    const allLocations = [];

    // 1. Check in View Products (Admin Products)
    // Try to find by ID if provided and valid, otherwise by name
    let productQuery = { name: { $regex: new RegExp(`^${escapeRegExp(productName)}$`, 'i') } };

    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
        productQuery = {
            $or: [
                { _id: productId },
                { name: { $regex: new RegExp(`^${escapeRegExp(productName)}$`, 'i') } }
            ]
        };
    }

    const adminProduct = await Product.findOne({
        ...productQuery,
        admin: { $exists: true, $ne: null }
    });

    if (adminProduct) {
        const priceInfo = adminProduct.prices.find(p => p.unit === unit);
        const stockLevel = adminProduct.stockLevel || 0;

        // Only add to locations if stock level is greater than 0
        if (stockLevel > 0) {
            allLocations.push({
                location: 'View Products',
                quantity: stockLevel,
                unit: unit,
                sufficientStock: stockLevel >= requestedQuantity,
                priority: 1,
                details: {
                    productId: adminProduct._id,
                    sku: adminProduct.sku,
                    stockLevel: stockLevel,
                    unitPrice: priceInfo ? priceInfo.sellingPrice : 0
                }
            });
        }
    }

    // 2. Check in After Packing (only pending/non-completed items)
    const afterPackingItem = await AfterPacking.findOne({
        productName: { $regex: new RegExp(`^${escapeRegExp(productName)}$`, 'i') },
        status: { $ne: 'Completed' } // Only check pending items
    }).sort({ date: -1 }); // Get the most recent

    if (afterPackingItem && (afterPackingItem.quantity || 0) > 0) {
        allLocations.push({
            location: 'After Packing',
            quantity: afterPackingItem.quantity || 0,
            unit: afterPackingItem.unit,
            sufficientStock: (afterPackingItem.quantity || 0) >= requestedQuantity,
            priority: 2,
            details: {
                scheduleId: afterPackingItem.scheduleId,
                status: afterPackingItem.status,
                date: afterPackingItem.date,
                price: afterPackingItem.price,
                unit: afterPackingItem.unit
            }
        });
    }

    // 3. Check in Before Packing (only pending/non-completed items)
    const beforePackingItem = await BeforePacking.findOne({
        productName: { $regex: new RegExp(`^${escapeRegExp(productName)}$`, 'i') },
        status: { $ne: 'Completed' } // Only check pending items
    }).sort({ date: -1 });

    if (beforePackingItem && (beforePackingItem.quantity || 0) > 0) {
        allLocations.push({
            location: 'Before Packing',
            quantity: beforePackingItem.quantity || 0,
            unit: beforePackingItem.unit,
            sufficientStock: (beforePackingItem.quantity || 0) >= requestedQuantity,
            priority: 3,
            details: {
                scheduleId: beforePackingItem.scheduleId,
                status: beforePackingItem.status,
                date: beforePackingItem.date,
                price: beforePackingItem.price,
                unit: beforePackingItem.unit
            }
        });
    }

    // 4. Check in Production Schedules (only pending/non-completed items)
    const productionSchedule = await DailySchedule.findOne({
        productName: { $regex: new RegExp(`^${escapeRegExp(productName)}$`, 'i') },
        status: { $ne: 'Completed' } // Only check pending items
    }).sort({ date: -1 });

    if (productionSchedule && (productionSchedule.quantity || 0) > 0) {
        allLocations.push({
            location: 'Production Schedules',
            quantity: productionSchedule.quantity || 0,
            unit: productionSchedule.unit,
            sufficientStock: (productionSchedule.quantity || 0) >= requestedQuantity,
            priority: 4,
            details: {
                status: productionSchedule.status,
                date: productionSchedule.date,
                price: productionSchedule.price,
                unit: productionSchedule.unit,
                ingredients: productionSchedule.ingredients
            }
        });
    }

    // Select the best location
    if (allLocations.length > 0) {
        // Sort: sufficient stock first, then by priority, then by quantity
        allLocations.sort((a, b) => {
            if (a.sufficientStock !== b.sufficientStock) {
                return b.sufficientStock ? 1 : -1;
            }
            if (a.sufficientStock && b.sufficientStock) {
                return a.priority - b.priority;
            }
            return b.quantity - a.quantity;
        });

        const bestLocation = allLocations[0];

        availabilityInfo = {
            productName: productName,
            requestedQuantity: requestedQuantity,
            unit: unit,
            availableIn: bestLocation.location,
            availableQuantity: bestLocation.quantity,
            details: bestLocation.details,
            isAvailable: true,
            sufficientStock: bestLocation.sufficientStock
        };
    }

    return availabilityInfo;
};

/**
 * Check product availability across all stages for an order
 */
exports.checkProductAvailability = async (req, res) => {
    try {
        const { orderId } = req.params;

        // Fetch the order with populated items
        const order = await Order.findById(orderId)
            .populate('shop', 'name address')
            .populate('items.product', 'name sku prices');

        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        const availabilityResults = [];

        for (const item of order.items) {
            const info = await getProductAvailabilityInfo(
                item.productName,
                item.quantity,
                item.unit,
                item.product?._id || item.product
            );
            availabilityResults.push(info);
        }

        res.status(200).json({
            orderId: order.orderId,
            orderObjectId: order._id,
            shop: order.shop,
            items: availabilityResults
        });

    } catch (error) {
        console.error('Error checking product availability:', error);
        res.status(500).json({
            message: 'Failed to check product availability.',
            error: error.message
        });
    }
};

/**
 * Check availability for multiple products/items (e.g. for creating a new invoice)
 */
exports.checkMultipleProductsAvailability = async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ message: 'Items array is required.' });
        }

        const availabilityResults = [];

        for (const item of items) {
            const productId = item.productId || item.product;
            const info = await getProductAvailabilityInfo(
                item.productName,
                item.quantity || 0,
                item.unit,
                productId
            );
            // Ensure the result has the original productId for mapping
            info.productId = productId;
            availabilityResults.push(info);
        }

        res.status(200).json({
            items: availabilityResults
        });

    } catch (error) {
        console.error('Error checking multiple products availability:', error);
        res.status(500).json({
            message: 'Failed to check products availability.',
            error: error.message
        });
    }
};

