const mongoose = require('mongoose');
require('dotenv').config();

const dropIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const collection = mongoose.connection.collection('manufacturings');
        const indexes = await collection.indexes();
        console.log("Current indexes on 'manufacturings':", JSON.stringify(indexes, null, 2));

        const indexName = 'productName_1';
        const hasIndex = indexes.some(idx => idx.name === indexName);

        if (hasIndex) {
            await collection.dropIndex(indexName);
            console.log(`Successfully dropped index: ${indexName}`);
        } else {
            console.log(`Index ${indexName} not found.`);
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
};

dropIndex();
