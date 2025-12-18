import React, { useState } from 'react';
import { LuChartBar, LuTrendingUp, LuChartPie, LuEye } from 'react-icons/lu';

function ProfitLossChart({ shopData }) {
  const [activeChart, setActiveChart] = useState('bar');

  // Format currency for charts
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate chart dimensions and data
  const maxRevenue = Math.max(...shopData.map(shop => shop.revenue.totalSales));
  const maxExpense = Math.max(...shopData.map(shop => shop.expenses.totalExpenses));
  const maxValue = Math.max(maxRevenue, maxExpense);

  // Bar Chart Component
  const BarChart = () => (
    <div className="space-y-6">
      {shopData.map((shop, index) => {
        const revenueWidth = (shop.revenue.totalSales / maxValue) * 100;
        const expenseWidth = (shop.expenses.totalExpenses / maxValue) * 100;
        const profitWidth = Math.abs(shop.profitability.netProfit / maxValue) * 100;
        const isProfit = shop.profitability.netProfit >= 0;

        return (
          <div key={shop.shopId} className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-800">{shop.shopName}</h4>
              <span className={`text-sm font-medium ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                Net: {formatCurrency(Math.abs(shop.profitability.netProfit))}
              </span>
            </div>
            
            <div className="space-y-1">
              {/* Revenue Bar */}
              <div className="flex items-center space-x-3">
                <span className="w-16 text-xs text-gray-600">Revenue</span>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                  <div 
                    className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${revenueWidth}%` }}
                  >
                    <span className="text-xs text-white font-medium">
                      {formatCurrency(shop.revenue.totalSales)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Expense Bar */}
              <div className="flex items-center space-x-3">
                <span className="w-16 text-xs text-gray-600">Expenses</span>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                  <div 
                    className="bg-red-500 h-6 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${expenseWidth}%` }}
                  >
                    <span className="text-xs text-white font-medium">
                      {formatCurrency(shop.expenses.totalExpenses)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Profit/Loss Bar */}
              <div className="flex items-center space-x-3">
                <span className="w-16 text-xs text-gray-600">Net P&L</span>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                  <div 
                    className={`h-6 rounded-full flex items-center justify-end pr-2 ${
                      isProfit ? 'bg-green-500' : 'bg-red-600'
                    }`}
                    style={{ width: `${profitWidth}%` }}
                  >
                    <span className="text-xs text-white font-medium">
                      {formatCurrency(Math.abs(shop.profitability.netProfit))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Performance Comparison Component
  const PerformanceComparison = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {shopData.map((shop) => {
        const isProfit = shop.profitability.netProfit >= 0;
        const profitMargin = shop.profitability.profitMargin;
        
        return (
          <div key={shop.shopId} className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="text-center">
              <h4 className="font-semibold text-gray-800">{shop.shopName}</h4>
              <p className="text-xs text-gray-600">{shop.location || 'No location'}</p>
            </div>
            
            {/* Circular Progress for Profit Margin */}
            <div className="flex justify-center">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-300"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${Math.abs(profitMargin) * 2.51} 251`}
                    className={isProfit ? 'text-green-500' : 'text-red-500'}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-sm font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(profitMargin).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-600">Revenue</p>
              <p className="font-semibold text-blue-600">{formatCurrency(shop.revenue.totalSales)}</p>
              
              <p className="text-xs text-gray-600">Net P&L</p>
              <p className={`font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(shop.profitability.netProfit))}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Revenue vs Expense Comparison
  const RevenueExpenseChart = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-center mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="w-4 h-4 bg-blue-500 rounded mx-auto mb-2"></div>
          <p className="text-sm text-blue-600 font-medium">Revenue</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <div className="w-4 h-4 bg-red-500 rounded mx-auto mb-2"></div>
          <p className="text-sm text-red-600 font-medium">Expenses</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shopData.map((shop) => (
          <div key={shop.shopId} className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3 text-center">{shop.shopName}</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Revenue</span>
                <span className="text-sm font-medium text-blue-600">
                  {formatCurrency(shop.revenue.totalSales)}
                </span>
              </div>
              
              <div className="flex space-x-2 h-8">
                <div 
                  className="bg-blue-500 rounded"
                  style={{ 
                    width: `${(shop.revenue.totalSales / (shop.revenue.totalSales + shop.expenses.totalExpenses)) * 100}%` 
                  }}
                ></div>
                <div 
                  className="bg-red-500 rounded"
                  style={{ 
                    width: `${(shop.expenses.totalExpenses / (shop.revenue.totalSales + shop.expenses.totalExpenses)) * 100}%` 
                  }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Expenses</span>
                <span className="text-sm font-medium text-red-600">
                  {formatCurrency(shop.expenses.totalExpenses)}
                </span>
              </div>
              
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-800">Net P&L</span>
                  <span className={`text-sm font-bold ${
                    shop.profitability.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(Math.abs(shop.profitability.netProfit))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!shopData || shopData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-12">
          <LuChartBar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Data Available</h3>
          <p className="text-gray-500">No shop data available for the selected period.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 sm:mb-0">Financial Performance Charts</h3>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveChart('bar')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeChart === 'bar' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <LuChartBar className="h-4 w-4" />
            <span>Bar Chart</span>
          </button>
          
          <button
            onClick={() => setActiveChart('performance')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeChart === 'performance' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <LuChartPie className="h-4 w-4" />
            <span>Performance</span>
          </button>
          
          <button
            onClick={() => setActiveChart('comparison')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeChart === 'comparison' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <LuTrendingUp className="h-4 w-4" />
            <span>Comparison</span>
          </button>
        </div>
      </div>

      <div className="min-h-96">
        {activeChart === 'bar' && <BarChart />}
        {activeChart === 'performance' && <PerformanceComparison />}
        {activeChart === 'comparison' && <RevenueExpenseChart />}
      </div>
    </div>
  );
}

export default ProfitLossChart;