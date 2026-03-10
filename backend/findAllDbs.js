const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        try {
            const adminDb = mongoose.connection.db.admin();
            const listDbs = await adminDb.listDatabases();

            console.log("Databases found:");
            for (let dbInfo of listDbs.databases) {
                console.log("- " + dbInfo.name);
                const db = mongoose.connection.client.db(dbInfo.name);
                // List collections
                const collections = await db.listCollections().toArray();
                for (let col of collections) {
                    if (col.name === 'manufacturings') {
                        console.log(`  Found 'manufacturings' in db: ${dbInfo.name}`);
                        const indexes = await db.collection('manufacturings').indexes();
                        console.log(`    Indexes:`, indexes.map(i => i.name));

                        // If sweetName_1 exists, DROP IT
                        if (indexes.find(i => i.name === 'sweetName_1')) {
                            await db.collection('manufacturings').dropIndex('sweetName_1');
                            console.log(`    >>> Successfully dropped sweetName_1 from ${dbInfo.name}.manufacturings`);
                        }
                    }
                }
            }

        } catch (e) {
            console.log("Error:", e);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
