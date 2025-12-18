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
        // 1. Calculate total sales (revenue) from bills
        const salesData = await Bill.aggregate([
          {
            $match: {
              shop: shop._id,
              billDate: { $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: null,
              totalSales: { $sum: '$totalAmount' },
              totalBills: { $sum: 1 }
            }
          }
        ]);

        const totalSales = salesData.length > 0 ? salesData[0].totalSales : 0;
        const totalBills = salesData.length > 0 ? salesData[0].totalBills : 0;

        // 2. Calculate total purchase costs from confirmed invoices
        const purchaseCosts = await Invoice.aggregate([
          {
            $match: {
              shop: shop._id,
              status: 'Confirmed',
              confirmedDate: { $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: null,
              totalPurchaseCost: { $sum: '$grandTotal' },
              totalInvoices: { $sum: 1 }
            }
          }
        ]);

        const totalPurchaseCost = purchaseCosts.length > 0 ? purchaseCosts[0].totalPurchaseCost : 0;
        const totalInvoices = purchaseCosts.length > 0 ? purchaseCosts[0].totalInvoices : 0;

        // 3. Calculate salary expenses for shop workers
        const workers = await Worker.find({ shop: shop._id });
        const totalSalaryExpense = workers.reduce((total, worker) => {
          const monthlySalary = parseFloat(worker.salary) || 0;
          // Calculate daily salary and multiply by days in period
          const daysInPeriod = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
          const dailySalary = monthlySalary / 30; // Assuming 30 days per month
          return total + (dailySalary * daysInPeriod);
        }, 0);

        // 4. Calculate production costs (estimated based on product costs)
        let totalProductionCost = 0;
        try {
          const productionCosts = await Bill.aggregate([
            {
              $match: {
                shop: shop._id,
                billDate: { $gte: start, $lte: end }
              }
            },
            {
              $unwind: '$items'
            },
            {
              $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'productDetails'
              }
            },
            {
              $unwind: '$productDetails'
            },
            {
              $group: {
                _id: null,
                totalProductionCost: {
                  $sum: {
                    $multiply: [
                      '$items.quantity',
                      { $ifNull: [{ $arrayElemAt: ['$productDetails.prices.netPrice', 0] }, 0] }
                    ]
                  }
                }
              }
            }
          ]);

          totalProductionCost = productionCosts.length > 0 ? productionCosts[0].totalProductionCost : 0;
        } catch (productionError) {
          console.error(`Error calculating production costs for shop ${shop.name}:`, productionError);
          totalProductionCost = 0;
        }

        // 5. Get actual expenses from expense module for this shop
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
            case 'Maintenance':
              maintenanceExpense += expense.total;
              break;
            case 'Miscellaneous':
              miscellaneousExpense += expense.total;
              break;
          }
        });

        // Calculate total actual expenses
        const totalActualExpenses = transportExpense + petrolDieselExpense + electricityExpense + 
                                  rawMaterialsExpense + maintenanceExpense + miscellaneousExpense;

        // 6. Calculate totals (using actual expenses instead of estimates)
        const totalExpenses = totalPurchaseCost + totalSalaryExpense + totalProductionCost + totalActualExpenses;
        const grossProfit = totalSales - totalPurchaseCost;
        const netProfit = totalSales - totalExpenses;
        const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100) : 0;

        // Add to consolidated totals
        totalConsolidatedRevenue += totalSales;
        totalConsolidatedExpenses += totalExpenses;

        const shopData = {
          shopId: shop._id,
          shopName: shop.name,
          location: shop.location,
          revenue: {
            totalSales: totalSales,
            totalBills: totalBills
          },
          expenses: {
            purchaseCosts: totalPurchaseCost,
            salaryExpense: totalSalaryExpense,
            productionCost: totalProductionCost,
            transportExpense: transportExpense,
            petrolDieselExpense: petrolDieselExpense,
            electricityExpense: electricityExpense,
            rawMaterialsExpense: rawMaterialsExpense,
            maintenanceExpense: maintenanceExpense,
            miscellaneousExpense: miscellaneousExpense,
            totalExpenses: totalExpenses
          },
          profitability: {
            grossProfit: grossProfit,
            netProfit: netProfit,
            profitMargin: profitMargin
          },
          metrics: {
            totalInvoices: totalInvoices,
            workerCount: workers.length
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
        purchases: [],
        salaries: [],
        production: [],
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

    // Get detailed purchase expenses
    const invoices = await Invoice.find({
      shop: shopId,
      status: 'Confirmed',
      confirmedDate: { $gte: start, $lte: end }
    }).populate('admin', 'name');

    expenseBreakdown.expenses.purchases = invoices.map(invoice => ({
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.confirmedDate,
      amount: invoice.grandTotal,
      adminName: invoice.admin.name,
      itemCount: invoice.items.length
    }));

    // Get worker salary details
    const workers = await Worker.find({ shop: shopId }).populate('department', 'name');
    const daysInPeriod = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    expenseBreakdown.expenses.salaries = workers.map(worker => {
      const monthlySalary = parseFloat(worker.salary) || 0;
      const dailySalary = monthlySalary / 30;
      const periodSalary = dailySalary * daysInPeriod;
      
      return {
        workerName: worker.name,
        department: worker.department?.name || 'N/A',
        monthlySalary: monthlySalary,
        periodSalary: periodSalary
      };
    });

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