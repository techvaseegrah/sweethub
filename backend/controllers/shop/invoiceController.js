const Invoice = require('../../models/invoiceModel');
const Product = require('../../models/productModel');
const mongoose = require('mongoose');

/**
 * Retrieves the latest pending invoice for the currently logged-in shop.
 * A shop should only have one pending invoice at a time to review.
 */
exports.getPendingInvoiceForShop = async (req, res) => {
  console.log('=== GET PENDING INVOICE REQUEST ===');
  console.log('User:', req.user);
  
  try {
    // Get shop ID from the authenticated user - should be in req.user.shopId
    const shopId = req.user.shopId;
    console.log('Looking for pending invoices for shop ID:', shopId);
    
    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID not found in user token.' });
    }

    const pendingInvoice = await Invoice.findOne({ shop: shopId, status: 'Pending' })
      .populate('admin', 'name') // Populate the admin's name for display
      .populate('shop', 'name location gstNumber shopPhoneNumber') // Populate shop details for PDF generation
      .sort({ createdAt: -1 }); // Get the most recent pending invoice

    console.log('Found pending invoice:', pendingInvoice ? pendingInvoice.invoiceNumber : 'None');
    
    // It's okay if there's no pending invoice, so we don't treat it as an error.
    // The frontend will handle the case where pendingInvoice is null.
    res.status(200).json(pendingInvoice);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending invoice.', error: error.message });
  }
};

/**
 * Retrieves ALL invoices for the currently logged-in shop with date and time.
 * Shows both pending and confirmed invoices.
 */
exports.getAllInvoicesForShop = async (req, res) => {
  console.log('=== GET ALL INVOICES REQUEST ===');
  console.log('User:', req.user);
  
  try {
    // Get shop ID from the authenticated user - should be in req.user.shopId
    const shopId = req.user.shopId;
    console.log('Looking for all invoices for shop ID:', shopId);
    
    if (!shopId) {
      return res.status(400).json({ message: 'Shop ID not found in user token.' });
    }

    const invoices = await Invoice.find({ shop: shopId })
      .populate('admin', 'name') // Populate the admin's name for display
      .populate('shop', 'name location gstNumber shopPhoneNumber') // Populate shop details for PDF generation
      .sort({ createdAt: -1 }); // Get most recent first

    console.log('Found invoices:', invoices.length);
    
    res.status(200).json(invoices);
  } catch (error) {
    console.error('Error fetching all invoices:', error);
    res.status(500).json({ message: 'Failed to fetch invoices.', error: error.message });
  }
};

/**
 * Confirms an invoice based on the items checked by the shop admin.
 * Only the confirmed items are added to the shop's product inventory.
 * This operation is transactional to ensure data integrity.
 */
exports.confirmInvoice = async (req, res) => {
  const { invoiceId } = req.params;
  const { confirmedItems, receivedQuantities } = req.body; // Array of product IDs that the shop confirmed and received quantities
  const shopId = req.user.shopId;
  
  console.log('=== CONFIRM INVOICE REQUEST ===');
  console.log('Invoice ID:', invoiceId);
  console.log('Shop ID:', shopId);
  console.log('Confirmed Items:', confirmedItems);
  console.log('Received Quantities:', receivedQuantities);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate the input
    if (!invoiceId || !Array.isArray(confirmedItems)) {
      throw new Error('Invoice ID and a list of confirmed items are required.');
    }

    // Step 1: Find and validate the invoice
    const invoice = await Invoice.findById(invoiceId).session(session);

    if (!invoice) {
      throw new Error('Invoice not found.');
    }
    if (invoice.shop.toString() !== shopId) {
      throw new Error('This invoice does not belong to your shop.');
    }
    if (invoice.status !== 'Pending' && invoice.status !== 'Partial') {
      throw new Error('This invoice is not pending or partial and cannot be confirmed.');
    }

    // Step 2: Iterate through invoice items and add only CONFIRMED products to shop's inventory
    for (const item of invoice.items) {
      // Check if the product ID of the current item is in the shop's confirmed list
      const isConfirmed = confirmedItems.includes(item.product.toString());

      if (isConfirmed) {
        // Set the received quantity for the item
        const receivedQty = receivedQuantities && receivedQuantities[item.product.toString()] 
          ? parseFloat(receivedQuantities[item.product.toString()]) 
          : 0;
        
        item.receivedQuantity = receivedQty;
        // Mark the item as confirmed by the shop in the invoice record
        item.shopConfirmed = true;

        // Find if a product with the same SKU already exists for this shop
        let shopProduct = await Product.findOne({ sku: item.productSku, shop: shopId }).session(session);

        if (shopProduct) {
          // If product exists, just increase the stock level with the received quantity
          console.log(`Updating existing product ${item.productSku}: ${shopProduct.stockLevel} + ${receivedQty}`);
          shopProduct.stockLevel = parseFloat(shopProduct.stockLevel) + parseFloat(receivedQty);
          await shopProduct.save({ session });
          console.log(`Updated stock level: ${shopProduct.stockLevel}`);
        } else {
          // If product does not exist, create a new one for the shop with the received quantity
          const adminProduct = await Product.findById(item.product).session(session);
          if (!adminProduct) {
            throw new Error(`Original product with SKU ${item.productSku} not found.`);
          }

          console.log(`Creating new shop product: ${adminProduct.name} with quantity ${receivedQty}`);
          const newShopProduct = new Product({
            name: adminProduct.name,
            category: adminProduct.category,
            sku: adminProduct.sku,
            stockLevel: receivedQty,
            stockAlertThreshold: 10, // Default value, can be adjusted by shop later
            shop: shopId, // Assign to the current shop
            prices: adminProduct.prices, // Copy pricing info from admin's product
          });
          await newShopProduct.save({ session });
          console.log(`Created new shop product with ID: ${newShopProduct._id}`);
        }
      }
    }

    // Step 3: Update the overall invoice status based on confirmation and received quantities
    // Count how many items are confirmed
    const confirmedCount = invoice.items.filter(item => item.shopConfirmed).length;
    const totalItems = invoice.items.length;
    
    // NEW LOGIC: Check if all confirmed items have matching quantities
    let allQuantitiesMatch = true;
    let hasAnyReceived = false;
    
    for (const item of invoice.items) {
      if (item.shopConfirmed) {
        const receivedQty = item.receivedQuantity || 0;
        if (receivedQty > 0) {
          hasAnyReceived = true;
        }
        // If received quantity doesn't match the original quantity, mark as not all matching
        if (receivedQty !== item.quantity) {
          allQuantitiesMatch = false;
        }
      }
    }
    
    // DETERMINE STATUS BASED ON THE NEW LOGIC:
    if (confirmedCount === totalItems && allQuantitiesMatch) {
      // All items confirmed and all quantities match exactly - set status to Confirmed
      invoice.status = 'Confirmed';
      invoice.confirmedDate = Date.now();
    } else if (confirmedCount > 0 && hasAnyReceived) {
      // Some items confirmed or quantities don't match exactly - set status to Partial
      invoice.status = 'Partial';
    } else {
      // No items confirmed or no quantities entered - keep status as Pending
      invoice.status = 'Pending';
    }
    
    await invoice.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    console.log('Invoice confirmation completed successfully');
    res.status(200).json({ 
      message: 'Invoice updated successfully!', 
      status: invoice.status,
      confirmedProducts: confirmedItems.length 
    });

  } catch (error) {
    // If any error occurs, abort the transaction
    await session.abortTransaction();
    res.status(400).json({ message: 'Failed to confirm invoice.', error: error.message });
  } finally {
    // Always end the session
    session.endSession();
  }
};