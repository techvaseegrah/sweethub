const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("Connected to DB");
        try {
            // Also list all indexes to be sure
            const indexes = await mongoose.connection.collection('manufacturings').indexes();
            console.log("Indexes on manufacturings:", indexes);

            await mongoose.connection.collection('manufacturings').dropIndex('sweetName_1');
            console.log("Dropped sweetName_1 index");
        } catch (e) {
            console.log("Error dropping index:", e.message);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
