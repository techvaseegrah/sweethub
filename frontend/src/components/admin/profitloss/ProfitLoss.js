import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { LuTrendingUp, LuTrendingDown, LuDollarSign, LuChartPie, LuChartBar, LuCalendar, LuRefreshCw, LuDownload } from 'react-icons/lu';
import ProfitLossChart from './ProfitLossChart';
import ExpenseBreakdown from './ExpenseBreakdown';
import ProfitLossCharts from './ProfitLossCharts';
import { generateProfitLossReportPdf } from '../../../utils/generateProfitLossReportPdf';

function ProfitLoss() {
  const [profitLossData, setProfitLossData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedShop, setSelectedShop] = useState(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  
  // Date range state
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Fetch profit & loss data
  const fetchProfitLossData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/admin/profit-loss', {
        params: dateRange
      });
      setProfitLossData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch profit & loss data');
      console.error('Error fetching P&L data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    if (profitLossData) {
      generateProfitLossReportPdf(profitLossData, dateRange.startDate, dateRange.endDate);
    }
  };

  useEffect(() => {
    fetchProfitLossData();
  }, [dateRange]);

  // Handle date range change
  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle shop expense breakdown
  const handleViewExpenses = (shop) => {
    setSelectedShop(shop);
    setShowExpenseModal(true);
  };

  // Get profit/loss indicator
  const getProfitIndicator = (profit) => {
    if (profit > 0) {
      return { color: 'text-green-600', icon: LuTrendingUp, text: 'Profit' };
    } else if (profit < 0) {
      return { color: 'text-red-600', icon: LuTrendingDown, text: 'Loss' };
    } else {
      return { color: 'text-gray-600', icon: LuDollarSign, text: 'Break Even' };
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date range for display
  const formatDateRange = () => {
    const start = new Date(dateRange.startDate).toLocaleDateString('en-IN');
    const end = new Date(dateRange.endDate).toLocaleDateString('en-IN');
    return `${start} - ${end}`;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center justify-center h-64">
        <div className="relative flex justify-center items-center mb-4">
          <div className="w-16 h-16 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
          <img 
            src="/sweethub-logo.png" 
            alt="Sweet Hub Logo" 
            className="absolute w-10 h-10"
          />
        </div>
        <div className="text-red-500 font-medium">Loading profit & loss data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 mb-4">
          <LuTrendingDown className="h-12 w-12 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Error Loading Data</h3>
          <p className="text-sm">{error}</p>
        </div>
        <button 
          onClick={fetchProfitLossData}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!profitLossData) {
    return null;
  }

  const { consolidated, shopData, summary } = profitLossData;
  const consolidatedIndicator = getProfitIndicator(consolidated.netProfit);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Profit & Loss Dashboard</h2>
            <p className="text-gray-600">Financial performance overview for all shops</p>
          </div>
          
          {/* Date Range Selector */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4 lg:mt-0">
            <div className="flex items-center space-x-2">
              <LuCalendar className="h-5 w-5 text-gray-500" />
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchProfitLossData}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <LuRefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={exportToPDF}
                disabled={loading}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <LuDownload className="h-4 w-4" />
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-600 mb-6">
          Period: {formatDateRange()}
        </div>

        {/* Consolidated Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <LuDollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-blue-600 font-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-blue-800">{formatCurrency(consolidated.totalRevenue)}</p>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <LuTrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-sm text-red-600 font-medium">Total Expenses</p>
            <p className="text-2xl font-bold text-red-800">{formatCurrency(consolidated.totalExpenses)}</p>
          </div>
          
          <div className={`${consolidated.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-lg p-4 text-center`}>
            <consolidatedIndicator.icon className={`h-8 w-8 ${consolidatedIndicator.color} mx-auto mb-2`} />
            <p className={`text-sm ${consolidatedIndicator.color} font-medium`}>Net {consolidatedIndicator.text}</p>
            <p className={`text-2xl font-bold ${consolidated.netProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>
              {formatCurrency(Math.abs(consolidated.netProfit))}
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <LuChartPie className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-purple-600 font-medium">Profit Margin</p>
            <p className="text-2xl font-bold text-purple-800">{consolidated.profitMargin.toFixed(1)}%</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">Total Shops</p>
            <p className="text-lg font-bold text-gray-800">{summary.totalShops}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-sm text-green-600">Profitable Shops</p>
            <p className="text-lg font-bold text-green-800">{summary.profitableShops}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-600">Top Performer</p>
            <p className="text-lg font-bold text-blue-800">{summary.topPerformingShop?.shopName || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Shop Performance Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Shop Performance Analysis</h3>
          <LuChartBar className="h-6 w-6 text-gray-600" />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net P&L</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Margin %</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shopData.map((shop) => {
                const indicator = getProfitIndicator(shop.profitability.netProfit);
                return (
                  <tr key={shop.shopId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{shop.shopName}</div>
                        <div className="text-sm text-gray-500">{shop.location || 'No location'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(shop.revenue.totalBillingProfit)}</div>
                      <div className="text-xs text-gray-500">{shop.revenue.totalBills} bills</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(shop.expenses.totalExpenses)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`flex items-center justify-end space-x-1`}>
                        <indicator.icon className={`h-4 w-4 ${indicator.color}`} />
                        <span className={`text-sm font-medium ${indicator.color}`}>
                          {formatCurrency(Math.abs(shop.profitability.netProfit))}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-medium ${indicator.color}`}>
                        {shop.profitability.profitMargin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleViewExpenses(shop)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Section */}
      {shopData && shopData.length > 0 && (
        <ProfitLossCharts shopData={shopData} />
      )}

      {/* Expense Breakdown Modal */}
      {showExpenseModal && selectedShop && (
        <ExpenseBreakdown
          shop={selectedShop}
          dateRange={dateRange}
          onClose={() => {
            setShowExpenseModal(false);
            setSelectedShop(null);
          }}
        />
      )}
    </div>
  );
}

export default ProfitLoss;