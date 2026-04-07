const MixedSweetProduction = require('../../models/mixedSweetProductionModel');
const Product = require('../../models/productModel');
const Category = require('../../models/Category');

const convertWeight = (value, fromUnit, toUnit) => {
    const val = parseFloat(value) || 0;
    const f = (fromUnit || 'kg').toLowerCase();
    const t = (toUnit || 'kg').toLowerCase();
    if (f === t) return val;
    if (f === 'kg' && t === 'gm') return val * 1000;
    if (f === 'gm' && t === 'kg') return val / 1000;
    return val;
};

exports.createMixedSweetProduction = async (req, res) => {
    try {
        const { name, sku, quantityProduced, sellingPrice, category, components, unit, expiryDate, usedByDate } = req.body;
        const shopId = req.user.shopId;

        console.log('Production Request Received:', { name, sku, quantityProduced, category, shopId });

        if (!shopId) {
            return res.status(400).json({ message: 'Shop ID not found in user token.' });
        }

        if (!name || !sku || !quantityProduced || !components || components.length === 0) {
            return res.status(400).json({ message: 'Missing required fields (Name, SKU, Quantity, Components).' });
        }

        const finalSellingPrice = sellingPrice ? parseFloat(sellingPrice) : 0;
        const finalUnit = unit || 'box';
        const finalCategory = (category && category.trim() !== "") ? category : undefined;

        // 1. Validate stock for each component
        for (const component of components) {
            const product = await Product.findOne({ _id: component.product, shop: shopId });
            if (!product) {
                return res.status(404).json({ message: `Component product ${component.name} not found.` });
            }

            const baseUnit = product.prices?.[0]?.unit || 'kg';
            const normalizedQtyUsed = convertWeight(component.quantityUsed, component.unit, baseUnit);

            if (product.stockLevel < normalizedQtyUsed) {
                return res.status(400).json({ message: `Insufficient stock for ${component.name}. Available: ${product.stockLevel} ${baseUnit}, Required: ${component.quantityUsed} ${component.unit} (${normalizedQtyUsed} ${baseUnit})` });
            }
        }

        // 2. Reduce stock from components
        for (const component of components) {
            const product = await Product.findOne({ _id: component.product, shop: shopId });
            const baseUnit = product.prices?.[0]?.unit || 'kg';
            const normalizedQtyUsed = convertWeight(component.quantityUsed, component.unit, baseUnit);

            await Product.updateOne(
                { _id: component.product, shop: shopId },
                { $inc: { stockLevel: -normalizedQtyUsed } }
            );
        }

        // 3. Find or Create Mixed Product
        // We check by SKU first as it should be unique per shop
        let mixedProduct = await Product.findOne({ sku, shop: shopId });

        if (!mixedProduct) {
            // If not found by SKU, check by name (optional, but good for UX)
            mixedProduct = await Product.findOne({ name, shop: shopId });
        }

        if (!mixedProduct) {
            mixedProduct = new Product({
                name,
                sku,
                category: finalCategory,
                shop: shopId,
                stockLevel: 0,
                isMixedSweet: true,
                prices: [{ unit: finalUnit, netPrice: 0, sellingPrice: finalSellingPrice }]
            });
        } else {
            // Update basic info
            mixedProduct.name = name;
            mixedProduct.isMixedSweet = true;
            mixedProduct.sku = sku;
            if (finalCategory) mixedProduct.category = finalCategory;

            // Update selling price if it exists for the unit, or add it
            const priceIndex = mixedProduct.prices.findIndex(p => p.unit === finalUnit);
            if (priceIndex >= 0) {
                mixedProduct.prices[priceIndex].sellingPrice = finalSellingPrice;
            } else {
                mixedProduct.prices.push({ unit: finalUnit, netPrice: 0, sellingPrice: finalSellingPrice });
            }
        }

        mixedProduct.stockLevel += parseFloat(quantityProduced);
        await mixedProduct.save();

        // 4. Save Production Record
        const productionRecord = new MixedSweetProduction({
            mixedProductId: mixedProduct._id,
            name,
            sku,
            quantityProduced: parseFloat(quantityProduced),
            unit: finalUnit,
            sellingPrice: finalSellingPrice,
            expiryDate,
            usedByDate,
            category: finalCategory,
            components,
            shop: shopId
        });

        await productionRecord.save();

        res.status(201).json({
            message: 'Mixed sweet production completed successfully.',
            productionRecord,
            mixedProduct
        });

    } catch (error) {
        console.error('CRITICAL: Error in Mixed Sweet Production:', error);
        res.status(500).json({
            message: 'Production failed.',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

exports.getMixedSweetProductions = async (req, res) => {
    try {
        const shopId = req.user.shopId;
        const productions = await MixedSweetProduction.find({ shop: shopId })
            .populate('category', 'name')
            .populate('components.product', 'name sku')
            .sort({ createdAt: -1 });
        res.status(200).json(productions);
    } catch (error) {
        console.error('Error fetching mixed sweet productions:', error);
        res.status(500).json({ message: 'Failed to fetch productions.', error: error.message });
    }
};

exports.deleteMixedSweetProduction = async (req, res) => {
    try {
        const { id } = req.params;
        const shopId = req.user.shopId;

        const production = await MixedSweetProduction.findOne({ _id: id, shop: shopId });
        if (!production) {
            return res.status(404).json({ message: 'Production record not found.' });
        }

        await MixedSweetProduction.deleteOne({ _id: id });
        res.status(200).json({ message: 'Production record deleted successfully.' });
    } catch (error) {
        console.error('Error deleting mixed sweet production:', error);
        res.status(500).json({ message: 'Failed to delete record.', error: error.message });
    }
};

exports.getMixedSweetByProductId = async (req, res) => {
    try {
        const { productId } = req.params;
        const shopId = req.user.shopId;

        // Find the latest production record for this mixed product
        const production = await MixedSweetProduction.findOne({ mixedProductId: productId, shop: shopId })
            .populate('components.product', 'name sku')
            .sort({ createdAt: -1 });

        if (!production) {
            return res.status(404).json({ message: 'No mixed sweet production found for this product.' });
        }

        res.status(200).json(production);
    } catch (error) {
        console.error('Error fetching mixed sweet by product ID:', error);
        res.status(500).json({ message: 'Failed to fetch mixed sweet details.', error: error.message });
    }
};
