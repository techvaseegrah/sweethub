const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndices() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect('mongodb+srv://techvaseegrah:J21UwbM8M0hXEt7a@cluster0.n84fyq1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
        console.log('Connected!');

        const db = mongoose.connection.db;
        const collection = db.collection('products');

        console.log('Fetching active indices...');
        const indexes = await collection.indexes();
        console.log('Current indexes:', JSON.stringify(indexes, null, 2));

        // Dropping problematic unique SKU indexes to allow recreation with correct partial filter
        const toDrop = ['sku_1_admin_1', 'sku_1_shop_1'];
        for (const indexName of toDrop) {
            const exists = indexes.find(idx => idx.name === indexName);
            if (exists) {
                console.log(`Dropping index ${indexName}...`);
                await collection.dropIndex(indexName);
                console.log(`Dropped ${indexName}`);
            } else {
                console.log(`Index ${indexName} not found, skipping.`);
            }
        }

        console.log('Finished dropping indices. Mongoose will rebuild them on next server restart with the new partialFilterExpression.');
        process.exit(0);
    } catch (err) {
        console.error('Error fixing indices:', err);
        process.exit(1);
    }
}

fixIndices();
