const mongoose = require('mongoose');
const Bill = require('../models/billModel');
const Product = require('../models/productModel');
const Category = require('../models/Category'); // Capitalized filename
require('dotenv').config();

async function debugFilter() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Fetch a category (e.g., 'Sweet' or any first category)
        const category = await Category.findOne();
        if (!category) {
            console.log('No categories found.');
            return;
        }
        console.log(`Testing with Category: ${category.name} (ID: ${category._id})`);

        // 2. Find products in this category
        const products = await Product.find({ category: category._id }).select('_id name');
        const productIds = products.map(p => p._id);
        console.log(`Found ${products.length} products in this category.`);
        if (products.length > 0) {
            console.log('Sample Products:', products.slice(0, 3).map(p => p.name));
        }

        // 3. Find bills with these products (Controller Logic)
        const filter = {
            'items.product': { $in: productIds }
        };

        // Also try adding shop filter if applicable, but let's test bare logic first

        const bills = await Bill.find(filter).select('billId items totalAmount');
        console.log(`Found ${bills.length} bills with items from this category.`);

        // 4. Verification: Check a bill
        if (bills.length > 0) {
            const sampleBill = bills[0];
            console.log('Sample Bill ID:', sampleBill.billId);
            // Check which item matched
            const matchedItems = sampleBill.items.filter(item =>
                productIds.some(pid => pid.toString() === item.product.toString())
            );
            console.log(`Matched ${matchedItems.length} items in sample bill.`);
        }

        // 5. Compare with manual check
        // Ensure we are not missing anything due to casting issues
        const allBills = await Bill.find({});
        let manualMatchCount = 0;
        for (const bill of allBills) {
            const hasProduct = bill.items.some(item =>
                productIds.some(pid => pid.toString() === item.product.toString())
            );
            if (hasProduct) manualMatchCount++;
        }

        console.log(`Manual match count: ${manualMatchCount}`);

        if (manualMatchCount !== bills.length) {
            console.log('MISMATCH DETECTED!');
        } else {
            console.log('Logic matches manual check.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugFilter();
