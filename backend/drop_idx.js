require('dotenv').config();
const mongoose = require('mongoose');

async function checkIndexDefaultDB() {
    try {
        const uri = process.env.MONGO_URI;
        await mongoose.connect(uri);

        console.log("Connected to db:", mongoose.connection.name);

        // Check all collections for the index
        const collections = await mongoose.connection.db.collections();
        console.log("Found collections:", collections.map(c => c.collectionName));

        for (const collection of collections) {
            if (collection.collectionName === 'manufacturings') {
                const indexes = await collection.indexes();
                console.log("Indexes on manufacturings:");
                console.dir(indexes);

                const hasSweetName = indexes.find(i => i.name === 'sweetName_1' || (i.key && i.key.sweetName));
                if (hasSweetName) {
                    console.log(`Found sweetName index in collection: ${collection.collectionName}`);
                    await collection.dropIndex(hasSweetName.name);
                    console.log(`Dropped index ${hasSweetName.name} from ${collection.collectionName}`);
                }
            }
        }
        console.log("Check complete.");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        mongoose.connection.close();
    }
}

checkIndexDefaultDB();
