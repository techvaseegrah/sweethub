const Order = require('../../models/orderModel');
const Product = require('../../models/productModel');
const AfterPacking = require('../../models/afterPackingModel');
const BeforePacking = require('../../models/beforePackingModel');
const DailySchedule = require('../../models/dailyScheduleModel');

/**
 * Check product availability across all stages
 * Checks in order: View Products -> After Packing -> Before Packing -> Production Schedules
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

        // Check availability for each item
        const availabilityResults = [];

        for (const item of order.items) {
            const productName = item.productName;
            const requestedQuantity = item.quantity;
            const unit = item.unit;

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
            const adminProduct = await Product.findOne({
                $or: [
                    { _id: item.product },
                    { name: { $regex: new RegExp(`^${productName}$`, 'i') } }
                ],
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
                sweetName: { $regex: new RegExp(`^${productName}$`, 'i') },
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
                sweetName: { $regex: new RegExp(`^${productName}$`, 'i') },
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
                sweetName: { $regex: new RegExp(`^${productName}$`, 'i') },
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
            // Priority 1: Location with sufficient stock (prefer higher priority location)
            // Priority 2: If no location has sufficient stock, choose location with highest quantity
            // Priority 3: If quantities are equal, choose higher priority location
            if (allLocations.length > 0) {
                // Sort: sufficient stock first, then by priority, then by quantity
                allLocations.sort((a, b) => {
                    // First, prioritize locations with sufficient stock
                    if (a.sufficientStock !== b.sufficientStock) {
                        return b.sufficientStock ? 1 : -1;
                    }
                    // If both have sufficient stock or both don't, prioritize by location priority
                    if (a.sufficientStock && b.sufficientStock) {
                        return a.priority - b.priority;
                    }
                    // If neither has sufficient stock, prioritize by quantity
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

            availabilityResults.push(availabilityInfo);
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
