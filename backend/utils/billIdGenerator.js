const Bill = require('../models/billModel');
const Shop = require('../models/shopModel');
const DailySchedule = require('../models/dailyScheduleModel');

/**
 * Generate a unique shop code if not exists
 */
const generateShopCodeIfNeeded = async (shop) => {
  // If shop already has a shopCode, return it
  if (shop.shopCode) {
    return shop.shopCode;
  }

  // Generate a shop code based on shop name if not exists
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

  return shopCode;
};

/**
 * Generate a unique bill ID for shop bills
 * Format: SHP-{SHOPCODE}-XXXX (continuous numbering, no date reset)
 */
const generateShopBillId = async (shopId) => {
  try {
    console.log('Looking for shop with ID:', shopId);

    // Get shop details to get the shop code
    let shop = await Shop.findById(shopId);
    console.log('Found shop by ID result:', !!shop);

    if (!shop) {
      // If not found, try to find by user reference
      console.log('Trying to find shop by user ID:', shopId);
      shop = await Shop.findOne({ user: shopId });
      console.log('Found shop by user reference result:', !!shop);

      if (!shop) {
        console.error('Shop not found for ID/UserID:', shopId);
        throw new Error(`Shop not found for ID: ${shopId}`);
      }
    }

    // Generate shop code if not exists
    const shopCode = await generateShopCodeIfNeeded(shop);

    // Find the highest sequence number for this shop's bills.
    // IMPORTANT: We must NOT use .sort({ billId: -1 }) here because billId is a
    // string and lexicographic sorting breaks once sequences exceed single digits
    // (e.g. "SHP-XX-0009" sorts after "SHP-XX-0010"). Instead, we fetch all
    // matching bills and find the true numeric maximum.
    const allShopBills = await Bill.find(
      { billId: { $regex: `^SHP-${shopCode}-` } },
      { billId: 1 } // Projection: only fetch the billId field
    );

    let sequence = 1;
    if (allShopBills && allShopBills.length > 0) {
      let maxSequence = 0;
      for (const bill of allShopBills) {
        if (bill.billId) {
          const parts = bill.billId.split('-');
          // Format is SHP-{SHOPCODE}-{SEQUENCE}, so parts[2] is the sequence
          const seq = parseInt(parts[2]);
          if (!isNaN(seq) && seq > maxSequence) {
            maxSequence = seq;
          }
        }
      }
      sequence = maxSequence + 1;
    }

    const sequenceString = sequence.toString().padStart(4, '0');
    return `SHP-${shopCode}-${sequenceString}`;
  } catch (error) {
    console.error('Error generating shop bill ID:', error);
    throw error;
  }
};

/**
 * Generate a unique bill ID for admin bills
 * Format: ADM-XXXX (continuous numbering, no date reset)
 */
const generateAdminBillId = async () => {
  try {
    // Find all admin bills and compute the true numeric maximum.
    // IMPORTANT: Do NOT sort by billId string — lexicographic order breaks past 9
    // (e.g. "ADM-0009" > "ADM-0010").
    const allAdminBills = await Bill.find(
      { billId: { $regex: `^ADM-` } },
      { billId: 1 }
    );

    let sequence = 1;
    if (allAdminBills && allAdminBills.length > 0) {
      let maxSequence = 0;
      for (const bill of allAdminBills) {
        if (bill.billId) {
          const parts = bill.billId.split('-');
          const seq = parseInt(parts[1]);
          if (!isNaN(seq) && seq > maxSequence) {
            maxSequence = seq;
          }
        }
      }
      sequence = maxSequence + 1;
    }

    const sequenceString = sequence.toString().padStart(4, '0');
    return `ADM-${sequenceString}`;
  } catch (error) {
    console.error('Error generating admin bill ID:', error);
    throw error;
  }
};

/**
 * Generate a unique Batch ID for production schedules
 * Format: PRO-XXX (e.g., PRO-001, PRO-002)
 */
const generateBatchId = async () => {
  try {
    // Find the last schedule with a batchId (specifically matching our pattern)
    const lastSchedule = await DailySchedule.findOne({
      batchId: { $regex: /^PRO-/ }
    }).sort({ batchId: -1 });

    let sequence = 1;
    if (lastSchedule && lastSchedule.batchId) {
      const lastBatchId = lastSchedule.batchId;
      // Extract the number after PRO-
      const lastSequence = parseInt(lastBatchId.split('-')[1]);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }

    const sequenceString = sequence.toString().padStart(3, '0');
    return `PRO-${sequenceString}`;
  } catch (error) {
    console.error('Error generating batch ID:', error);
    throw error;
  }
};

module.exports = {
  generateShopBillId,
  generateAdminBillId,
  generateBatchId
};