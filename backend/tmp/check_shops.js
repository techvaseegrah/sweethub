require('dotenv').config();
const mongoose = require('mongoose');
const Shop = require('./models/shopModel');

async function checkShops() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://ac-oh5fy8c-shard-00-00.n84fyq1.mongodb.net/test?authSource=admin&replicaSet=atlas-oh5fy8c-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true');
    const shops = await Shop.find({}, 'name shopCode');
    console.log(JSON.stringify(shops, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkShops();
