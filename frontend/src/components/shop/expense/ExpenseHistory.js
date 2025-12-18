import React, { useState, useEffect } from 'react';
import { LuArrowLeft, LuEye, LuDownload, LuFilter, LuX, LuPrinter } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import { generateExpensePdf } from '../../../utils/generateExpensePdf';
import { generateExpenseReportPdf } from '../../../utils/generateExpenseReportPdf';
import ExpenseDetailModal from '../../common/ExpenseDetailModal';

const ExpenseHistory = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedExpense, setSelectedExpense] = useState(null);
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState('');
  
  // Unique values for filters
  const categories = [...new Set(expenses.map(expense => expense.category))];
  const paymentModes = [...new Set(expenses.map(expense => expense.paymentMode))];

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Fetch expenses
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/shop/expenses', {
          withCredentials: true
        });
        setExpenses(response.data);
        setFilteredExpenses(response.data);
      } catch (err) {
        console.error('Error fetching expenses:', err);
        setError('Failed to fetch expenses');
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...expenses];
    
    if (categoryFilter) {
      result = result.filter(expense => expense.category === categoryFilter);
    }
    
    if (paymentModeFilter) {
      result = result.filter(expense => expense.paymentMode === paymentModeFilter);
    }
    
    if (dateFrom) {
      result = result.filter(expense => new Date(expense.date) >= new Date(dateFrom));
    }
    
    if (dateTo) {
      result = result.filter(expense => {
        const expenseDate = new Date(expense.date);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // Include the entire end date
        return expenseDate <= toDate;
      });
    }
    
    setFilteredExpenses(result);
  }, [categoryFilter, dateFrom, dateTo, paymentModeFilter, expenses]);

  // Clear all filters
  const clearFilters = () => {
    setCategoryFilter('');
    setDateFrom('');
    setDateTo('');
    setPaymentModeFilter('');
  };

  // Calculate total amount for filtered expenses
  const calculateTotalAmount = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  // View expense details
  const viewExpense = (expenseId) => {
    // Find the expense by ID
    const expense = filteredExpenses.find(exp => exp._id === expenseId);
    if (expense) {
      setSelectedExpense(expense);
    }
  };

  // Download expense as PDF
  const downloadExpense = (expense) => {
    // Immediately generate and download PDF without showing popup
    generateExpensePdf(expense);
  };

  // Close expense detail modal
  const closeExpenseDetail = () => {
    setSelectedExpense(null);
  };

  // Download date range report
  const downloadDateRangeReport = () => {
    if (!dateFrom || !dateTo) {
      // Silently return without showing popup
      return;
    }
    
    // Generate and download the report PDF immediately
    generateExpenseReportPdf(filteredExpenses, dateFrom, dateTo);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/shop/expenses')}
          className="p-3 rounded-xl hover:bg-gray-100 transition-colors shadow-sm hover:shadow-md"
        >
          <LuArrowLeft className="text-gray-600 text-xl" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Expense History</h1>
          <p className="text-gray-600">View and manage all expense records</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <LuFilter className="text-blue-600 text-xl" />
            <h2 className="text-lg font-semibold text-gray-800">Filter Expenses</h2>
          </div>
          <button 
            onClick={clearFilters}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg transition-colors"
          >
            <LuX className="text-lg" />
            <span>Clear Filters</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Payment Mode</label>
            <select
              value={paymentModeFilter}
              onChange={(e) => setPaymentModeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All Modes</option>
              {paymentModes.map(mode => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
        
        {/* Total Amount Display */}
        {(dateFrom || dateTo) && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <LuFilter className="text-blue-600" />
                  <span className="text-blue-800 font-semibold">Filtered Report</span>
                </div>
                <div className="ml-6">
                  <p className="text-blue-700 text-sm">
                    {dateFrom && dateTo 
                      ? `Period: ${formatDate(dateFrom)} to ${formatDate(dateTo)}` 
                      : dateFrom 
                        ? `From: ${formatDate(dateFrom)}` 
                        : `To: ${formatDate(dateTo)}`}
                  </p>
                  <p className="text-blue-800 font-bold text-lg">
                    Total: {formatCurrency(calculateTotalAmount())}
                  </p>
                  <p className="text-blue-600 text-sm">
                    {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button 
                onClick={downloadDateRangeReport}
                disabled={!dateFrom || !dateTo}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  dateFrom && dateTo 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <LuDownload className="text-lg" />
                <span className="font-medium">Download Report</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            All Expenses ({filteredExpenses.length})
          </h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4 text-xl">⚠️</div>
              <div className="text-red-500 mb-4">{error}</div>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                Retry
              </button>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <LuFilter className="mx-auto text-gray-300 text-5xl mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No expenses found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters</p>
              <button 
                onClick={clearFilters}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Mode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        <div className="max-w-xs truncate" title={expense.description || '-'}>
                          {expense.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {expense.paymentMode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expense.vendor || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => viewExpense(expense._id)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <LuEye className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => downloadExpense(expense)}
                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <LuDownload className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Expense Detail Modal */}
      {selectedExpense && (
        <ExpenseDetailModal 
          expense={selectedExpense}
          onClose={closeExpenseDetail}
          onDownload={downloadExpense}
        />
      )}

    </div>
  );
};

export default ExpenseHistory;