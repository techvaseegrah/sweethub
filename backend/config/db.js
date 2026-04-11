const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Helper function to drop index safely
    const dropIndexSafely = async (collectionName, indexName) => {
      try {
        await mongoose.connection.collection(collectionName).dropIndex(indexName);
        console.log(`Index ${indexName} dropped successfully from ${collectionName}.`);
      } catch (err) {
        // 27 is the error code for IndexNotFound
        if (err.code === 27 || err.message.includes('index not found')) {
          console.log(`Index ${indexName} not found or already dropped from ${collectionName}.`);
        } else {
          console.warn(`Note: Could not drop index ${indexName} from ${collectionName}: ${err.message}`);
        }
      }
    };

    // Drop legacy indexes if they exist
    await dropIndexSafely('manufacturings', 'sweetName_1');
    await dropIndexSafely('manufacturings', 'productName_1');

  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Only exit on actual connection failure, not index cleanup issues
    if (!mongoose.connection.readyState) {
      process.exit(1);
    }
  }
};

module.exports = connectDB;