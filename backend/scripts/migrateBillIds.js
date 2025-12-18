const mongoose = require('mongoose');
const Bill = require('../models/billModel');
const Shop = require('../models/shopModel');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    // First, ensure all shops have shop codes
    const shopsWithoutCodes = await Shop.find({ shopCode: { $exists: false } });
    console.log(`Found ${shopsWithoutCodes.length} shops without shopCode`);
    
    for (const shop of shopsWithoutCodes) {
      try {
        // Generate a shop code based on shop name
        const nameCode = shop.name ? shop.name.substring(0, 2).toUpperCase() : 'SH';
        const regex = new RegExp(`^${nameCode}\\d{2}$`);
        const existingShops = await Shop.find({ shopCode: regex });
        
        let maxSequence = 0;
        existingShops.forEach(existingShop => {
          if (existingShop.shopCode && existingShop.shopCode.length >= 4) {
            const sequence = parseInt(existingShop.shopCode.substring(2));
            if (!isNaN(sequence) && sequence > maxSequence) {
              maxSequence = sequence;
            }
          }
        });
        
        const nextSequence = (maxSequence + 1).toString().padStart(2, '0');
        const shopCode = `${nameCode}${nextSequence}`;
        
        // Update the shop with the new shopCode
        await Shop.findByIdAndUpdate(shop._id, { shopCode });
        console.log(`Updated shop ${shop.name} with shopCode: ${shopCode}`);
      } catch (error) {
        console.error(`Error updating shop ${shop.name}:`, error.message);
      }
    }
    
    // Find all bills without billId
    const billsWithoutBillId = await Bill.find({ billId: { $exists: false } });
    console.log(`Found ${billsWithoutBillId.length} bills without billId`);
    
    let updatedCount = 0;
    
    for (const bill of billsWithoutBillId) {
      try {
        let billId;
        
        if (!bill.shop) {
          // Admin bill - generate ADM format (continuous numbering)
          // Find the last admin bill
          const lastBill = await Bill.findOne({
            $or: [{ shop: null }, { shop: { $exists: false } }],
            billId: { $regex: `^ADM-` }
          }).sort({ createdAt: -1 });
          
          let sequence = 1;
          if (lastBill && lastBill.billId) {
            // Extract the sequence number from the last bill ID
            const lastBillId = lastBill.billId;
            const parts = lastBillId.split('-');
            const lastSequenceStr = parts[1]; // Get the sequence part
            const lastSequence = parseInt(lastSequenceStr);
            if (!isNaN(lastSequence)) {
              sequence = lastSequence + 1;
            }
          }
          
          const sequenceString = sequence.toString().padStart(4, '0');
          billId = `ADM-${sequenceString}`;
        } else {
          // Shop bill - generate SHP format (continuous numbering)
          const shop = await Shop.findById(bill.shop);
          if (shop && shop.shopCode) {
            const shopCode = shop.shopCode;
            
            // Find the last bill for this shop
            const lastBill = await Bill.findOne({
              shop: bill.shop,
              billId: { $regex: `^SHP-${shopCode}-` }
            }).sort({ createdAt: -1 });
            
            let sequence = 1;
            if (lastBill && lastBill.billId) {
              // Extract the sequence number from the last bill ID
              const lastBillId = lastBill.billId;
              const lastSequenceStr = lastBillId.split('-')[2]; // Get the sequence part
              const lastSequence = parseInt(lastSequenceStr);
              if (!isNaN(lastSequence)) {
                sequence = lastSequence + 1;
              }
            }
            
            const sequenceString = sequence.toString().padStart(4, '0');
            billId = `SHP-${shopCode}-${sequenceString}`;
          } else {
            console.log(`Skipping bill ${bill._id} - shop not found or shop code missing`);
            continue;
          }
        }
        
        // Update the bill with the new billId
        await Bill.findByIdAndUpdate(bill._id, { billId });
        console.log(`Updated bill ${bill._id} with billId: ${billId}`);
        updatedCount++;
      } catch (error) {
        console.error(`Error updating bill ${bill._id}:`, error.message);
      }
    }
    
    console.log(`Successfully updated ${updatedCount} bills with bill IDs`);
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
});