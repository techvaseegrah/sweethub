const Product = require('../../models/productModel');
const StoreRoomItem = require('../../models/storeRoomItemModel');
const PackingMaterial = require('../../models/packingMaterialModel');
const Shop = require('../../models/shopModel');
const Category = require('../../models/Category');

// @desc    Get stock report data
// @route   GET /api/admin/reports/stock
// @access  Private/Admin
const getStockReport = async (req, res) => {
    try {
        const { shopId, categoryId } = req.query;

        let adminProducts = [];
        let shopProducts = [];
        let storeRoomItems = [];
        let packingMaterials = [];

        // 1. Fetch Store Room Items (Admin/Factory Raw Materials)
        if (!shopId || shopId === 'all' || shopId === 'admin') {
            let srQuery = {};
            storeRoomItems = await StoreRoomItem.find(srQuery).sort({ name: 1 });
            packingMaterials = await PackingMaterial.find(srQuery).sort({ name: 1 });
        }

        // 2. Fetch Products
        let productQuery = {};
        if (shopId && shopId !== 'all') {
            if (shopId === 'admin') {
                productQuery.admin = { $exists: true };
            } else {
                productQuery.shop = shopId;
            }
        }

        if (categoryId) {
            productQuery.category = categoryId;
        }

        const products = await Product.find(productQuery)
            .populate('category', 'name')
            .populate('shop', 'name')
            .sort({ name: 1 });

        // Separate products into admin and shop
        products.forEach(p => {
            if (p.admin) {
                adminProducts.push(p);
            } else if (p.shop) {
                shopProducts.push(p);
            }
        });

        // Group shop products by shop for easier frontend display
        const shopStockGrouped = {};
        shopProducts.forEach(p => {
            const sId = p.shop?._id?.toString() || 'unknown';
            const sName = p.shop?.name || 'Unknown Shop';
            if (!shopStockGrouped[sId]) {
                shopStockGrouped[sId] = {
                    shopId: sId,
                    shopName: sName,
                    items: []
                };
            }
            shopStockGrouped[sId].items.push(p);
        });

        res.json({
            adminStock: {
                products: adminProducts,
                rawMaterials: storeRoomItems,
                packingMaterials: packingMaterials
            },
            shopStock: Object.values(shopStockGrouped),
            summary: {
                totalAdminItems: adminProducts.length + storeRoomItems.length + packingMaterials.length,
                totalShopItems: shopProducts.length,
                lowStockCount: products.filter(p => p.stockLevel <= p.stockAlertThreshold).length
            }
        });
    } catch (error) {
        console.error('Error fetching stock report:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getStockReport
};
