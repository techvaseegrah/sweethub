const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Drop legacy index on manufacturings collection if it exists in the live database
    try {
      await mongoose.connection.collection('manufacturings').dropIndex('sweetName_1');
      console.log('Legacy sweetName_1 index dropped successfully.');
    } catch (err) {
      if (err.code !== 27) { // 27 means index not found
        console.error('Error dropping legacy index:', err);
      }
    }

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;