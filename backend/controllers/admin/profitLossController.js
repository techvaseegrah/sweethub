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

    for (const shop of shops) {
      console.log(`Processing shop: ${shop.name}`);
      
      try {
        // 1. Calculate billing profit (Revenue) from bills - (Sell Price - Net Price) * Quantity
        // First, get all bills with their items for the date range
        const bills = await Bill.find({
          shop: shop._id,
          billDate: { $gte: start, $lte: end }
        }).populate({
          path: 'items.product',
          select: 'prices'
        });

        let totalBillingProfit = 0;
        let totalBills = 0;

        if (bills.length > 0) {
          totalBills = bills.length;
          
          // Calculate profit for each item in each bill
          for (const bill of bills) {
            for (const item of bill.items) {
              // Find the price for the specific unit in the product's prices array
              const unitPrice = item.product.prices.find(price => price.unit === item.unit);
              
              if (unitPrice) {
                const profitPerItem = (unitPrice.sellingPrice - unitPrice.netPrice) * item.quantity;
                totalBillingProfit += profitPerItem;
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

    // Calculate consolidated data
    const consolidatedNetProfit = totalConsolidatedRevenue - totalConsolidatedExpenses;
    const consolidatedProfitMargin = totalConsolidatedRevenue > 0 ? 
      ((consolidatedNetProfit / totalConsolidatedRevenue) * 100) : 0;

    // Safely find top performing shop
    let topPerformingShop = {};
    if (profitLossData.length > 0) {
      topPerformingShop = profitLossData.reduce((top, current) => {
        const topProfit = top.profitability?.netProfit || 0;
        const currentProfit = current.profitability?.netProfit || 0;
        return currentProfit > topProfit ? current : top;
      }, profitLossData[0]);
    }

    const response = {
      period: {
        startDate: start,
        endDate: end
      },
      consolidated: {
        totalRevenue: totalConsolidatedRevenue,
        totalExpenses: totalConsolidatedExpenses,
        netProfit: consolidatedNetProfit,
        profitMargin: consolidatedProfitMargin
      },
      shopData: profitLossData,
      summary: {
        totalShops: shops.length,
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

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Detailed expense breakdown
    const expenseBreakdown = {
      shopName: shop.name,
      period: { startDate: start, endDate: end },
      expenses: {
        // Actual expenses from expense module
        actualExpenses: [],
        transport: 0,
        petrolDiesel: 0,
        electricity: 0,
        rawMaterials: 0,
        maintenance: 0,
        miscellaneous: 0
      }
    };

    // Get actual expenses from expense module
    const actualExpenses = await Expense.find({
      shop: shopId,
      date: { $gte: start, $lte: end }
    }).sort({ date: -1 });

    expenseBreakdown.expenses.actualExpenses = actualExpenses.map(expense => ({
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      description: expense.description,
      paymentMode: expense.paymentMode,
      vendor: expense.vendor
    }));

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

    for (const shop of shops) {
      // Calculate billing profit (Revenue) from bills - (Sell Price - Net Price) * Quantity
      const bills = await Bill.find({
        shop: shop._id,
        billDate: { $gte: start, $lte: end }
      }).populate({
        path: 'items.product',
        select: 'prices'
      });

      let totalRevenue = 0;
      let totalBills = 0;

      if (bills.length > 0) {
        totalBills = bills.length;
        
        // Calculate profit for each item in each bill
        for (const bill of bills) {
          for (const item of bill.items) {
            // Find the price for the specific unit in the product's prices array
            const unitPrice = item.product.prices.find(price => price.unit === item.unit);
            
            if (unitPrice) {
              const profitPerItem = (unitPrice.sellingPrice - unitPrice.netPrice) * item.quantity;
              totalRevenue += profitPerItem;
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

    const overallTotals = {
      totalRevenue: overallTotalRevenue,
      totalExpenses: overallTotalExpenses,
      grossProfit: overallTotalRevenue, // In our new model, revenue is the gross profit from billing
      netProfit: overallNetProfit
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

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Calculate billing profit (Revenue) from bills - (Sell Price - Net Price) * Quantity
    const bills = await Bill.find({
      shop: shopId,
      billDate: { $gte: start, $lte: end }
    }).populate({
      path: 'items.product',
      select: 'prices'
    });

    let totalRevenue = 0;
    let totalBills = 0;

    if (bills.length > 0) {
      totalBills = bills.length;
      
      // Calculate profit for each item in each bill
      for (const bill of bills) {
        for (const item of bill.items) {
          // Find the price for the specific unit in the product's prices array
          const unitPrice = item.product.prices.find(price => price.unit === item.unit);
          
          if (unitPrice) {
            const profitPerItem = (unitPrice.sellingPrice - unitPrice.netPrice) * item.quantity;
            totalRevenue += profitPerItem;
          }
        }
      }
    }

    // Calculate actual expenses from expense module for this shop
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

    const totalExpenses = shopExpenses.length > 0 ? shopExpenses[0].totalExpenses : 0;
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
      billDate: { $gte: start, $lte: end }
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

      for (const item of bill.items) {
        const unitPrice = item.product.prices.find(price => price.unit === item.unit);
        
        if (unitPrice) {
          const profitPerItem = (unitPrice.sellingPrice - unitPrice.netPrice) * item.quantity;
          dailyRevenue[billDate] += profitPerItem;
        }
      }
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