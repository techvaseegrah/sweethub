// backend/controllers/admin/revenueController.js
const Bill = require('../../models/billModel');
const mongoose = require('mongoose');

exports.getRevenueSummary = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required.' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the entire end day

        const summary = await Bill.aggregate([
            {
                $match: {
                    billDate: { $gte: start, $lte: end }
                }
            },
            {
                $unwind: '$items'
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            {
                $addFields: {
                    productDoc: { $arrayElemAt: ['$productDetails', 0] }
                }
            },
            {
                $group: {
                    _id: '$_id',
                    totalAmount: { $first: '$totalAmount' },
                    shop: { $first: '$shop' },
                    totalCost: {
                        $sum: {
                            $multiply: [
                                { $ifNull: ['$productDoc.netPrice', 0] },
                                '$items.quantity'
                            ]
                        }
                    }
                }
            },
            {
                // Group by a placeholder if shop is null
                $group: {
                    _id: { $ifNull: ['$shop', 'admin_warehouse'] },
                    totalRevenue: { $sum: '$totalAmount' },
                    totalProfit: { $sum: { $subtract: ['$totalAmount', '$totalCost'] } }
                }
            },
            {
                $lookup: {
                    from: 'shops',
                    localField: '_id', // This will be an ObjectId or the placeholder string
                    foreignField: '_id',
                    as: 'shopInfo'
                }
            },
            {
                $project: {
                    _id: 0,
                    shopId: '$_id',
                    // Conditionally set the name based on the placeholder
                    shopName: {
                        $cond: {
                            if: { $eq: ['$_id', 'admin_warehouse'] },
                            then: 'Admin/Warehouse',
                            else: { $arrayElemAt: ['$shopInfo.name', 0] }
                        }
                    },
                    totalRevenue: 1,
                    totalProfit: 1
                }
            },
            {
                $sort: { shopName: 1 }
            }
        ]);

        const overallTotalRevenue = summary.reduce((acc, shop) => acc + shop.totalRevenue, 0);
        const overallTotalProfit = summary.reduce((acc, shop) => acc + shop.totalProfit, 0);
        
        res.json({
            overallTotalRevenue,
            overallTotalProfit,
            revenueByShop: summary
        });

    } catch (error) {
        console.error('Error fetching revenue summary:', error);
        res.status(500).json({ message: 'Server error fetching revenue summary.' });
    }
};