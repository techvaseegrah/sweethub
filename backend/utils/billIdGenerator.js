const Bill = require('../models/billModel');
const Shop = require('../models/shopModel');

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
    // Get shop details to get the shop code
    const shop = await Shop.findById(shopId);
    if (!shop) {
      throw new Error('Shop not found');
    }

    // Generate shop code if not exists
    const shopCode = await generateShopCodeIfNeeded(shop);

    // Find the last bill for this shop (regardless of date)
    const lastBill = await Bill.findOne({
      shop: shopId,
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
    // Find the last admin bill (regardless of date)
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
    return `ADM-${sequenceString}`;
  } catch (error) {
    console.error('Error generating admin bill ID:', error);
    throw error;
  }
};

module.exports = {
  generateShopBillId,
  generateAdminBillId
};