const Bill = require('../../models/billModel');
const Invoice = require('../../models/invoiceModel');
const Product = require('../../models/productModel');
const Shop = require('../../models/shopModel');
const Worker = require('../../models/workerModel');
const Expense = require('../../models/expenseModel'); // Add this import
const mongoose = require('mongoose');

/**
 * Calculate comprehensive Profit & Loss data for all shops
 */
exports.getProfitLossData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end day

    console.log('Calculating P&L for period:', start, 'to', end);

    // Get all shops
    const shops = await Shop.find({}).select('_id name location');
    
    const profitLossData = [];
    let totalConsolidatedRevenue = 0;
    let totalConsolidatedExpenses = 0;
    let totalAdminRevenue = 0;
    let adminBills = [];
    let totalAdminExpenses = 0;
    // Initialize admin expense category variables in wider scope to avoid undefined errors
    let adminTransportExpense = 0;
    let adminPetrolDieselExpense = 0;
    let adminElectricityExpense = 0;
    let adminRawMaterialsExpense = 0;
    let adminMaintenanceExpense = 0;
    let adminMiscellaneousExpense = 0;

    // Calculate admin-side revenue and expenses separately
    try {
      // Get admin-side bills (where shop is null/undefined)
      adminBills = await Bill.find({
        shop: { $exists: false },
        billDate: { $gte: start, $lte: end },
        billType: { $ne: 'REFERENCE' },
        isDeleted: { $ne: true }
      }).populate({
        path: 'items.product',
        select: 'prices'
      });
      
      // Calculate admin revenue using same formula: (Sell Price - Net Price) * Quantity
      for (const bill of adminBills) {
        for (const item of bill.items) {
          if (item.product && item.product.prices && item.product.prices.length > 0) {
            // Find matching price based on unit
            const priceInfo = item.product.prices.find(p => p.unit === item.unit);
            if (priceInfo) {
              const profitPerUnit = priceInfo.sellingPrice - priceInfo.netPrice;
              const itemProfit = profitPerUnit * item.quantity;
              totalAdminRevenue += itemProfit;
            }
          }
        }
      }
      
      // Calculate admin expenses using a more direct approach
      console.log("Querying admin expenses for user:", req.user.id);
      console.log("Date range:", start, "to", end);
      
      // Direct query to find all admin expenses in the date range
      const adminExpenses = await Expense.find({
        $and: [
          { date: { $gte: start, $lte: end } },
          { shop: { $exists: false } }, // Only expenses without shop association
          { admin: req.user.id }  // Expenses associated with this admin user
        ]
      });
      
      console.log("Direct query found admin expenses:", adminExpenses);
      
      // Initialize all admin expense variables to 0
      adminTransportExpense = 0;
      adminPetrolDieselExpense = 0;
      adminElectricityExpense = 0;
      adminRawMaterialsExpense = 0;
      adminMaintenanceExpense = 0;
      adminMiscellaneousExpense = 0;
      
      // Sum up expenses by category
      adminExpenses.forEach(expense => {
        console.log(`Processing admin expense: ${expense.category} - ${expense.amount}`);
        switch (expense.category) {
          case 'Transport':
            adminTransportExpense += expense.amount;
            break;
          case 'Petrol / Diesel':
            adminPetrolDieselExpense += expense.amount;
            break;
          case 'Electricity':
            adminElectricityExpense += expense.amount;
            break;
          case 'Raw Materials':
            adminRawMaterialsExpense += expense.amount;
            break;
          case 'Salary / Wages':
            adminMiscellaneousExpense += expense.amount; // Salary/Wages go under miscellaneous
            break;
          case 'Maintenance':
            adminMaintenanceExpense += expense.amount;
            break;
          case 'Miscellaneous':
            adminMiscellaneousExpense += expense.amount;
            break;
        }
      });
      
      totalAdminExpenses = adminTransportExpense + adminPetrolDieselExpense + adminElectricityExpense + 
                                adminRawMaterialsExpense + adminMaintenanceExpense + adminMiscellaneousExpense;
      console.log("Calculated total admin expenses:", totalAdminExpenses);
      totalConsolidatedExpenses += totalAdminExpenses; // Add admin expenses to total expenses
    } catch (adminError) {
      console.error('Error calculating admin revenue and expenses:', adminError);
    }

    for (const shop of shops) {
      console.log(`Processing shop: ${shop.name}`);
      
      try {
        // 1. Calculate billing profit (Revenue) from bills - (Sell Price - Net Price) * Quantity
        // First, get all bills with their items for the date range
        const bills = await Bill.find({
          shop: shop._id,
          billDate: { $gte: start, $lte: end },
          billType: { $ne: 'REFERENCE' },  // Exclude reference bills
          isDeleted: { $ne: true }  // Exclude deleted bills
        }).populate({
          path: 'items.product',
          select: 'prices'
        });

        let totalBillingProfit = 0;
        let totalBills = 0;

        if (bills.length > 0) {
          totalBills = bills.length;
          
          // Calculate product-level profit: (Sell Price - Net Price) * Quantity
          for (const bill of bills) {
            for (const item of bill.items) {
              if (item.product && item.product.prices && item.product.prices.length > 0) {
                // Find matching price based on unit
                const priceInfo = item.product.prices.find(p => p.unit === item.unit);
                if (priceInfo) {
                  const profitPerUnit = priceInfo.sellingPrice - priceInfo.netPrice;
                  const itemProfit = profitPerUnit * item.quantity;
                  totalBillingProfit += itemProfit;
                }
              }
            }
          }
        }

        // 2. Calculate actual expenses from expense module for this shop (only actual expenses, not product costs)
        const shopExpenses = await Expense.aggregate([
          {
            $match: {
              shop: shop._id,
              date: { $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: '$category',
              total: { $sum: '$amount' }
            }
          }
        ]);

        // Organize expenses by category
        let transportExpense = 0;
        let petrolDieselExpense = 0;
        let electricityExpense = 0;
        let rawMaterialsExpense = 0;
        let maintenanceExpense = 0;
        let miscellaneousExpense = 0;

        shopExpenses.forEach(expense => {
          switch (expense._id) {
            case 'Transport':
              transportExpense += expense.total;
              break;
            case 'Petrol / Diesel':
              petrolDieselExpense += expense.total;
              break;
            case 'Electricity':
              electricityExpense += expense.total;
              break;
            case 'Raw Materials':
              rawMaterialsExpense += expense.total;
              break;
            case 'Salary / Wages':
              miscellaneousExpense += expense.total; // Salary/Wages go under miscellaneous
              break;
            case 'Maintenance':
              maintenanceExpense += expense.total;
              break;
            case 'Miscellaneous':
              miscellaneousExpense += expense.total;
              break;
          }
        });

        // Calculate total actual expenses (only from expense module)
        const totalActualExpenses = transportExpense + petrolDieselExpense + electricityExpense + 
                                  rawMaterialsExpense + maintenanceExpense + miscellaneousExpense;

        // 3. Calculate totals with accurate logic
        const totalRevenue = totalBillingProfit; // Only billing profit as revenue
        const totalExpenses = totalActualExpenses; // Only actual expenses from expense module
        const netProfit = totalRevenue - totalExpenses;

        // Calculate profit margin based on revenue
        const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

        // Add to consolidated totals
        totalConsolidatedRevenue += totalRevenue;
        totalConsolidatedExpenses += totalExpenses;

        const shopData = {
          shopId: shop._id,
          shopName: shop.name,
          location: shop.location,
          revenue: {
            totalBillingProfit: totalRevenue,
            totalBills: totalBills
          },
          expenses: {
            transportExpense: transportExpense,
            petrolDieselExpense: petrolDieselExpense,
            electricityExpense: electricityExpense,
            rawMaterialsExpense: rawMaterialsExpense,
            maintenanceExpense: maintenanceExpense,
            miscellaneousExpense: miscellaneousExpense,
            totalExpenses: totalExpenses
          },
          profitability: {
            netProfit: netProfit,
            profitMargin: profitMargin
          },
          metrics: {
            totalBills: totalBills
          }
        };

        profitLossData.push(shopData);
      } catch (shopError) {
        console.error(`Error processing shop ${shop.name}:`, shopError);
        // Continue with other shops even if one fails
      }
    }

    // Calculate consolidated data including admin revenue
    const totalCombinedRevenue = totalConsolidatedRevenue + totalAdminRevenue;
    const consolidatedNetProfit = totalCombinedRevenue - totalConsolidatedExpenses;
    const consolidatedProfitMargin = totalCombinedRevenue > 0 ? 
      ((consolidatedNetProfit / totalCombinedRevenue) * 100) : 0;

    // Safely find top performing shop
    let topPerformingShop = {};
    if (profitLossData.length > 0) {
      topPerformingShop = profitLossData.reduce((top, current) => {
        const topProfit = top.profitability?.netProfit || 0;
        const currentProfit = current.profitability?.netProfit || 0;
        return currentProfit > topProfit ? current : top;
      }, profitLossData[0]);
    }

    // Add admin data as a separate entry in shopData
    if (totalAdminRevenue > 0 || totalAdminExpenses > 0) {
      const adminData = {
        shopId: 'admin',
        shopName: totalAdminRevenue > 0 ? 'Admin Sales' : 'Admin Expenses',
        location: 'Admin Portal',
        revenue: {
          totalBillingProfit: totalAdminRevenue,
          totalBills: adminBills.length || 0
        },
        expenses: {
          transportExpense: adminTransportExpense,
          petrolDieselExpense: adminPetrolDieselExpense,
          electricityExpense: adminElectricityExpense,
          rawMaterialsExpense: adminRawMaterialsExpense,
          maintenanceExpense: adminMaintenanceExpense,
          miscellaneousExpense: adminMiscellaneousExpense,
          totalExpenses: totalAdminExpenses  // Admin expenses are now included
        },
        profitability: {
          netProfit: totalAdminRevenue - totalAdminExpenses, // Net profit is revenue minus expenses
          profitMargin: totalAdminRevenue > 0 ? 
            (((totalAdminRevenue - totalAdminExpenses) / totalAdminRevenue) * 100) : (totalAdminExpenses > 0 ? -100 : 0)
        },
        metrics: {
          totalBills: adminBills.length || 0
        }
      };
      profitLossData.unshift(adminData); // Add to the beginning of the array
    }

    const response = {
      period: {
        startDate: start,
        endDate: end
      },
      consolidated: {
        totalRevenue: totalCombinedRevenue,
        shopRevenue: totalConsolidatedRevenue,
        adminRevenue: totalAdminRevenue,
        totalExpenses: totalConsolidatedExpenses,
        netProfit: consolidatedNetProfit,
        profitMargin: consolidatedProfitMargin
      },
      shopData: profitLossData,
      summary: {
        totalShops: shops.length + (totalAdminRevenue > 0 ? 1 : 0),
        profitableShops: profitLossData.filter(shop => (shop.profitability?.netProfit || 0) > 0).length,
        topPerformingShop: topPerformingShop
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error calculating profit & loss:', error);
    res.status(500).json({ message: 'Failed to calculate profit & loss data', error: error.message });
  }
};

/**
 * Get detailed expense breakdown for a specific shop
 */
exports.getShopExpenseBreakdown = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let shop, actualExpenses;
    
    if (shopId === 'admin') {
      // Handle admin expenses (expenses without shop association)
      shop = { name: 'Admin Expenses' };
      // For admin, get expenses that don't have a shop association
      actualExpenses = await Expense.find({
        date: { $gte: start, $lte: end },
        shop: { $exists: false }, // Only expenses without shop association
        admin: req.user.id  // Expenses associated with this admin user
      }).sort({ date: -1 });
    } else {
      const shopDoc = await Shop.findById(shopId);
      if (!shopDoc) {
        return res.status(404).json({ message: 'Shop not found' });
      }
      shop = shopDoc;
      
      // Get actual expenses from expense module
      actualExpenses = await Expense.find({
        shop: shopId,
        date: { $gte: start, $lte: end }
      }).sort({ date: -1 });
    }

    // Detailed expense breakdown
    const expenseBreakdown = {
      shopName: shop.name,
      period: { startDate: start, endDate: end },
      expenses: {
        // Actual expenses from expense module
        actualExpenses: actualExpenses.map(expense => ({
          category: expense.category,
          amount: expense.amount,
          date: expense.date,
          description: expense.description,
          paymentMode: expense.paymentMode,
          vendor: expense.vendor
        })),
        transport: 0,
        petrolDiesel: 0,
        electricity: 0,
        rawMaterials: 0,
        maintenance: 0,
        miscellaneous: 0
      }
    };

    // Categorize actual expenses
    actualExpenses.forEach(expense => {
      switch (expense.category) {
        case 'Transport':
          expenseBreakdown.expenses.transport += expense.amount;
          break;
        case 'Petrol / Diesel':
          expenseBreakdown.expenses.petrolDiesel += expense.amount;
          break;
        case 'Electricity':
          expenseBreakdown.expenses.electricity += expense.amount;
          break;
        case 'Raw Materials':
          expenseBreakdown.expenses.rawMaterials += expense.amount;
          break;
        case 'Salary / Wages':
          expenseBreakdown.expenses.miscellaneous += expense.amount; // Salary/Wages go under miscellaneous
          break;
        case 'Maintenance':
          expenseBreakdown.expenses.maintenance += expense.amount;
          break;
        case 'Miscellaneous':
          expenseBreakdown.expenses.miscellaneous += expense.amount;
          break;
      }
    });

    res.status(200).json(expenseBreakdown);

  } catch (error) {
    console.error('Error getting expense breakdown:', error);
    res.status(500).json({ message: 'Failed to get expense breakdown', error: error.message });
  }
};

/**
 * Get consolidated profit & loss report data
 */
exports.getConsolidatedReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Get all shops
    const shops = await Shop.find({}).select('_id name location');

    const shopDetails = [];
    let overallTotalRevenue = 0;
    let overallTotalExpenses = 0;
    let overallGrossProfit = 0;
    let overallNetProfit = 0;
    
    // Initialize admin revenue and expense variables in wider scope to avoid undefined errors
    let totalAdminRevenue = 0;
    let totalAdminExpenses = 0;
    let adminTransportExpense = 0;
    let adminPetrolDieselExpense = 0;
    let adminElectricityExpense = 0;
    let adminRawMaterialsExpense = 0;
    let adminMaintenanceExpense = 0;
    let adminMiscellaneousExpense = 0;

    try {
      // Calculate admin-side revenue
      const adminBills = await Bill.find({
        shop: { $exists: false },
        billDate: { $gte: start, $lte: end },
        billType: { $ne: 'REFERENCE' },
        isDeleted: { $ne: true }
      }).populate({
        path: 'items.product',
        select: 'prices'
      });

      for (const bill of adminBills) {
        for (const item of bill.items) {
          if (item.product && item.product.prices && item.product.prices.length > 0) {
            const priceInfo = item.product.prices.find(p => p.unit === item.unit);
            if (priceInfo) {
              const profitPerUnit = priceInfo.sellingPrice - priceInfo.netPrice;
              const itemProfit = profitPerUnit * item.quantity;
              totalAdminRevenue += itemProfit;
            }
          }
        }
      }
      
      // Calculate admin expenses using a more direct approach
      console.log("Consolidated report - Querying admin expenses for user:", req.user.id);
      console.log("Consolidated report - Date range:", start, "to", end);
      
      // Direct query to find all admin expenses in the date range
      const adminExpenses = await Expense.find({
        $and: [
          { date: { $gte: start, $lte: end } },
          { shop: { $exists: false } }, // Only expenses without shop association
          { admin: req.user.id }  // Expenses associated with this admin user
        ]
      });
      
      console.log("Consolidated report - Direct query found admin expenses:", adminExpenses);
      
      // Initialize all admin expense variables to 0
      adminTransportExpense = 0;
      adminPetrolDieselExpense = 0;
      adminElectricityExpense = 0;
      adminRawMaterialsExpense = 0;
      adminMaintenanceExpense = 0;
      adminMiscellaneousExpense = 0;
      
      // Sum up expenses by category
      adminExpenses.forEach(expense => {
        console.log(`Consolidated report - Processing admin expense: ${expense.category} - ${expense.amount}`);
        switch (expense.category) {
          case 'Transport':
            adminTransportExpense += expense.amount;
            break;
          case 'Petrol / Diesel':
            adminPetrolDieselExpense += expense.amount;
            break;
          case 'Electricity':
            adminElectricityExpense += expense.amount;
            break;
          case 'Raw Materials':
            adminRawMaterialsExpense += expense.amount;
            break;
          case 'Salary / Wages':
            adminMiscellaneousExpense += expense.amount; // Salary/Wages go under miscellaneous
            break;
          case 'Maintenance':
            adminMaintenanceExpense += expense.amount;
            break;
          case 'Miscellaneous':
            adminMiscellaneousExpense += expense.amount;
            break;
        }
      });
      
      totalAdminExpenses = adminTransportExpense + adminPetrolDieselExpense + adminElectricityExpense + 
                            adminRawMaterialsExpense + adminMaintenanceExpense + adminMiscellaneousExpense;
      console.log("Consolidated report - Calculated total admin expenses:", totalAdminExpenses);

    } catch (adminError) {
      console.error('Error calculating admin revenue and expenses:', adminError);
    }

    for (const shop of shops) {
      // Calculate billing profit (Revenue) from bills - (Sell Price - Net Price) * Quantity
      const bills = await Bill.find({
        shop: shop._id,
        billDate: { $gte: start, $lte: end },
        billType: { $ne: 'REFERENCE' },  // Exclude reference bills
        isDeleted: { $ne: true }  // Exclude deleted bills
      }).populate({
        path: 'items.product',
        select: 'prices'
      });

      let totalRevenue = 0;
      let totalBills = 0;

      if (bills.length > 0) {
        totalBills = bills.length;
        
        // Calculate product-level profit: (Sell Price - Net Price) * Quantity
        for (const bill of bills) {
          for (const item of bill.items) {
            if (item.product && item.product.prices && item.product.prices.length > 0) {
              // Find matching price based on unit
              const priceInfo = item.product.prices.find(p => p.unit === item.unit);
              if (priceInfo) {
                const profitPerUnit = priceInfo.sellingPrice - priceInfo.netPrice;
                const itemProfit = profitPerUnit * item.quantity;
                totalRevenue += itemProfit;
              }
            }
          }
        }
      }

      // Calculate actual expenses from expense module for this shop
      const shopExpenses = await Expense.aggregate([
        {
          $match: {
            shop: shop._id,
            date: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: '$amount' }
          }
        }
      ]);

      const totalExpenses = shopExpenses.length > 0 ? shopExpenses[0].totalExpenses : 0;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

      // Add to overall totals
      overallTotalRevenue += totalRevenue;
      overallTotalExpenses += totalExpenses;
      overallNetProfit += netProfit;

      const shopDetail = {
        shopId: shop._id,
        shopName: shop.name,
        totalRevenue,
        totalExpenses,
        grossProfit: totalRevenue, // In our new model, revenue is the gross profit from billing
        netProfit,
        profitMargin
      };

      shopDetails.push(shopDetail);
    }

    // Add admin data to shopDetails if there's admin revenue or expenses
    if (totalAdminRevenue > 0 || totalAdminExpenses > 0) {
      const adminDetail = {
        shopId: 'admin',
        shopName: totalAdminRevenue > 0 ? 'Admin Sales' : 'Admin Expenses',
        totalRevenue: totalAdminRevenue,
        totalExpenses: totalAdminExpenses,
        grossProfit: totalAdminRevenue, // Gross profit is the revenue
        netProfit: totalAdminRevenue - totalAdminExpenses,
        profitMargin: totalAdminRevenue > 0 ? 
          (((totalAdminRevenue - totalAdminExpenses) / totalAdminRevenue) * 100) : 0
      };
      shopDetails.unshift(adminDetail); // Add to the beginning of the array
    }

    // Update overall totals to include admin revenue and expenses
    const totalRevenueWithAdmin = overallTotalRevenue + totalAdminRevenue;
    const totalExpensesWithAdmin = overallTotalExpenses + totalAdminExpenses;
    const totalNetProfitWithAdmin = overallNetProfit + totalAdminRevenue - totalAdminExpenses;
    
    const overallTotals = {
      totalRevenue: totalRevenueWithAdmin,
      totalExpenses: totalExpensesWithAdmin,
      grossProfit: totalRevenueWithAdmin, // Updated to include admin revenue
      netProfit: totalNetProfitWithAdmin
    };

    const response = {
      shopDetails,
      overallTotals,
      period: {
        startDate: start,
        endDate: end
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error generating consolidated report:', error);
    res.status(500).json({ message: 'Failed to generate consolidated report', error: error.message });
  }
};

/**
 * Get detailed shop data for report
 */
exports.getShopDetailedReport = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let shop, bills;
    
    // Initialize admin expense category variables in wider scope to avoid undefined errors
    let adminTransportExpense = 0;
    let adminPetrolDieselExpense = 0;
    let adminElectricityExpense = 0;
    let adminRawMaterialsExpense = 0;
    let adminMaintenanceExpense = 0;
    let adminMiscellaneousExpense = 0;

    if (shopId === 'admin') {
      // Handle admin sales (bills without shop association)
      shop = { _id: 'admin', name: 'Admin Sales' };
      bills = await Bill.find({
        shop: { $exists: false },
        billDate: { $gte: start, $lte: end },
        billType: { $ne: 'REFERENCE' },  // Exclude reference bills
        isDeleted: { $ne: true }  // Exclude deleted bills
      }).populate({
        path: 'items.product',
        select: 'prices'
      });
    } else {
      const shopDoc = await Shop.findById(shopId);
      if (!shopDoc) {
        return res.status(404).json({ message: 'Shop not found' });
      }
      shop = shopDoc;
      
      // Calculate billing profit (Revenue) from bills - (Sell Price - Net Price) * Quantity
      bills = await Bill.find({
        shop: shopId,
        billDate: { $gte: start, $lte: end },
        billType: { $ne: 'REFERENCE' },  // Exclude reference bills
        isDeleted: { $ne: true }  // Exclude deleted bills
      }).populate({
        path: 'items.product',
        select: 'prices'
      });
    }

    let totalRevenue = 0;
    let totalBills = 0;

    if (bills.length > 0) {
      totalBills = bills.length;
      
      // Calculate product-level profit: (Sell Price - Net Price) * Quantity
      for (const bill of bills) {
        for (const item of bill.items) {
          if (item.product && item.product.prices && item.product.prices.length > 0) {
            // Find matching price based on unit
            const priceInfo = item.product.prices.find(p => p.unit === item.unit);
            if (priceInfo) {
              const profitPerUnit = priceInfo.sellingPrice - priceInfo.netPrice;
              const itemProfit = profitPerUnit * item.quantity;
              totalRevenue += itemProfit;
            }
          }
        }
      }
    }

    // Calculate actual expenses from expense module for this shop
    let totalExpenses = 0;
    
    if (shopId !== 'admin') {
      const shopExpenses = await Expense.aggregate([
        {
          $match: {
            shop: shopId,
            date: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: '$amount' }
          }
        }
      ]);
      
      totalExpenses = shopExpenses.length > 0 ? shopExpenses[0].totalExpenses : 0;
    } else {
      // For admin sales, calculate admin expenses using a more direct approach
      console.log("Shop detail report - Querying admin expenses for user:", req.user.id);
      console.log("Shop detail report - Date range:", start, "to", end);
      
      // Direct query to find all admin expenses in the date range
      const adminExpenses = await Expense.find({
        $and: [
          { date: { $gte: start, $lte: end } },
          { shop: { $exists: false } }, // Only expenses without shop association
          { admin: req.user.id }  // Expenses associated with this admin user
        ]
      });
      
      console.log("Shop detail report - Direct query found admin expenses:", adminExpenses);
      
      // Initialize all admin expense variables to 0
      adminTransportExpense = 0;
      adminPetrolDieselExpense = 0;
      adminElectricityExpense = 0;
      adminRawMaterialsExpense = 0;
      adminMaintenanceExpense = 0;
      adminMiscellaneousExpense = 0;
      
      // Sum up expenses by category
      adminExpenses.forEach(expense => {
        console.log(`Shop detail report - Processing admin expense: ${expense.category} - ${expense.amount}`);
        switch (expense.category) {
          case 'Transport':
            adminTransportExpense += expense.amount;
            break;
          case 'Petrol / Diesel':
            adminPetrolDieselExpense += expense.amount;
            break;
          case 'Electricity':
            adminElectricityExpense += expense.amount;
            break;
          case 'Raw Materials':
            adminRawMaterialsExpense += expense.amount;
            break;
          case 'Salary / Wages':
            adminMiscellaneousExpense += expense.amount; // Salary/Wages go under miscellaneous
            break;
          case 'Maintenance':
            adminMaintenanceExpense += expense.amount;
            break;
          case 'Miscellaneous':
            adminMiscellaneousExpense += expense.amount;
            break;
        }
      });
      
      totalExpenses = adminTransportExpense + adminPetrolDieselExpense + adminElectricityExpense + 
                      adminRawMaterialsExpense + adminMaintenanceExpense + adminMiscellaneousExpense;
      console.log("Shop detail report - Calculated total admin expenses:", totalExpenses);
    }
    // For admin sales, we consider expenses from admin expense records
    
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

    const response = {
      shopId: shop._id,
      shopName: shop.name,
      totalRevenue,
      totalExpenses,
      grossProfit: totalRevenue, // In our new model, revenue is the gross profit from billing
      netProfit,
      profitMargin,
      revenueBreakdown: {
        customerSales: {
          amount: totalRevenue,
          transactions: totalBills
        }
      },
      expenseBreakdown: {
        directCosts: {
          productCosts: 0,
          manufacturingCosts: 0,
          materialCosts: 0
        },
        indirectCosts: {
          salaryCosts: 0,
          transportCosts: 0,
          utilityCosts: 0
        }
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error generating shop detailed report:', error);
    res.status(500).json({ message: 'Failed to generate shop detailed report', error: error.message });
  }
};

/**
 * Get profit & loss trends
 */
exports.getProfitLossTrends = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Get all shops
    const shops = await Shop.find({}).select('_id name');

    // Get bills for the period
    const bills = await Bill.find({
      billDate: { $gte: start, $lte: end },
      billType: { $ne: 'REFERENCE' },  // Exclude reference bills
      isDeleted: { $ne: true }  // Exclude deleted bills
    }).populate({
      path: 'items.product',
      select: 'prices'
    });

    // Calculate daily revenue (billing profit)
    const dailyRevenue = {};
    const dailyExpenses = {};
    const dailyNetProfit = {};

    // Process bills to calculate daily revenue
    for (const bill of bills) {
      const billDate = bill.billDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      if (!dailyRevenue[billDate]) {
        dailyRevenue[billDate] = 0;
      }

      // Calculate product-level profit for this bill: (Sell Price - Net Price) * Quantity
      let billRevenue = 0;
      for (const item of bill.items) {
        if (item.product && item.product.prices && item.product.prices.length > 0) {
          // Find matching price based on unit
          const priceInfo = item.product.prices.find(p => p.unit === item.unit);
          if (priceInfo) {
            const profitPerUnit = priceInfo.sellingPrice - priceInfo.netPrice;
            const itemProfit = profitPerUnit * item.quantity;
            billRevenue += itemProfit;
          }
        }
      }
      dailyRevenue[billDate] += billRevenue;
    }

    // Process expenses to calculate daily expenses
    const expenses = await Expense.find({
      date: { $gte: start, $lte: end }
    });

    for (const expense of expenses) {
      const expenseDate = expense.date.toISOString().split('T')[0];
      
      if (!dailyExpenses[expenseDate]) {
        dailyExpenses[expenseDate] = 0;
      }
      
      dailyExpenses[expenseDate] += expense.amount;
    }

    // Calculate daily net profit
    const allDates = new Set([
      ...Object.keys(dailyRevenue),
      ...Object.keys(dailyExpenses)
    ]);

    for (const date of allDates) {
      const revenue = dailyRevenue[date] || 0;
      const expenses = dailyExpenses[date] || 0;
      dailyNetProfit[date] = revenue - expenses;
    }

    // Sort dates
    const sortedDates = Array.from(allDates).sort();

    const revenueTrend = sortedDates.map(date => ({
      date,
      revenue: dailyRevenue[date] || 0
    }));

    const expenseTrend = sortedDates.map(date => ({
      date,
      expenses: dailyExpenses[date] || 0
    }));

    const netProfitTrend = sortedDates.map(date => ({
      date,
      netProfit: dailyNetProfit[date] || 0
    }));

    res.status(200).json({
      revenueTrend,
      expenseTrend,
      netProfitTrend,
      period: {
        startDate: start,
        endDate: end
      }
    });

  } catch (error) {
    console.error('Error getting profit & loss trends:', error);
    res.status(500).json({ message: 'Failed to get profit & loss trends', error: error.message });
  }
};

































