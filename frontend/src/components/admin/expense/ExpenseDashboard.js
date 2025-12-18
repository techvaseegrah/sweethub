import React, { useState, useEffect } from 'react';
import { LuReceipt, LuPlus, LuFilter, LuTrendingUp, LuHistory, LuEye, LuDownload, LuChevronDown, LuCalendar } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import ExpenseDetailModal from '../../common/ExpenseDetailModal';
import { generateExpensePdf } from '../../../utils/generateExpensePdf';

const ExpenseDashboard = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('admin'); // Default to admin expenses
  const [selectedExpense, setSelectedExpense] = useState(null);

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

  // Fetch shops for admin
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await axios.get('/admin/shops', {
          withCredentials: true
        });
        setShops(response.data);
      } catch (err) {
        console.error('Error fetching shops:', err);
      }
    };

    fetchShops();
  }, []);

  // Fetch expenses based on selected shop
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        let response;
        
        if (selectedShop === 'admin') {
          // Fetch only admin expenses
          response = await axios.get('/admin/expenses?filter=admin', {
            withCredentials: true
          });
        } else {
          // Fetch specific shop expenses
          response = await axios.get(`/admin/expenses?shopId=${selectedShop}`, {
            withCredentials: true
          });
        }
        
        // Filter expenses based on selection
        let filteredExpenses = response.data;
        if (selectedShop === 'admin') {
          filteredExpenses = response.data.filter(expense => expense.admin);
        } else {
          filteredExpenses = response.data.filter(expense => expense.shop && expense.shop._id === selectedShop);
        }
        
        setExpenses(filteredExpenses);
      } catch (err) {
        console.error('Error fetching expenses:', err);
        setError('Failed to fetch expenses');
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [selectedShop]);

  // View expense details
  const viewExpense = (expense) => {
    setSelectedExpense(expense);
  };

  // Close expense detail modal
  const closeExpenseDetail = () => {
    setSelectedExpense(null);
  };

  // Download expense as PDF
  const downloadExpense = (expense) => {
    // Immediately generate and download PDF without showing popup
    generateExpensePdf(expense);
  };

  // Calculate summary statistics
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const currentMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const currentDate = new Date();
    return expenseDate.getMonth() === currentDate.getMonth() && 
           expenseDate.getFullYear() === currentDate.getFullYear();
  }).reduce((sum, expense) => sum + expense.amount, 0);
  
  // Calculate this week's expenses
  const thisWeekExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const today = new Date();
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6); // Saturday
    return expenseDate >= firstDayOfWeek && expenseDate <= lastDayOfWeek;
  }).reduce((sum, expense) => sum + expense.amount, 0);

  const categories = [...new Set(expenses.map(expense => expense.category))];
  const pendingExpenses = 0; // For future implementation

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Expenses Management</h1>
          <p className="text-gray-600">Track and manage all expenses</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/admin/expenses/history')}
            className="flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-2 rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            <LuHistory className="text-lg" />
            <span>History</span>
          </button>
          <button 
            onClick={() => navigate('/admin/expenses/add')}
            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            <LuPlus className="text-lg" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Shop Toggle */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <LuReceipt className="text-blue-500" />
            Expense View
          </h2>
          <div className="relative">
            <select
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
            >
              <option value="admin">Admin Expenses</option>
              {shops.map(shop => (
                <option key={shop._id} value={shop._id}>{shop.name}</option>
              ))}
            </select>
            <LuChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="mt-4">
          {selectedShop === 'admin' ? (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-lg">
              <p className="text-blue-800 font-bold text-lg flex items-center gap-2">
                <LuReceipt className="text-blue-600" />
                Currently viewing: <span className="underline">Admin expenses</span>
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-4 rounded-lg">
              <p className="text-green-800 font-bold text-lg flex items-center gap-2">
                <LuReceipt className="text-green-600" />
                Currently viewing: <span className="underline">{shops.find(s => s._id === selectedShop)?.name || 'Shop'} expenses</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm flex items-center gap-1">
                <LuReceipt className="text-gray-400" />
                Total Expenses
              </p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <LuReceipt className="text-red-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm flex items-center gap-1">
                <LuTrendingUp className="text-gray-400" />
                This Month
              </p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {formatCurrency(currentMonthExpenses)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <LuTrendingUp className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm flex items-center gap-1">
                <LuCalendar className="text-gray-400" />
                This Week
              </p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(thisWeekExpenses)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <LuCalendar className="text-green-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Expenses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <LuReceipt className="text-blue-500" />
            Recent Expenses
          </h2>
          <button 
            onClick={() => navigate('/admin/expenses/history')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
          >
            View All
            <LuHistory className="text-sm" />
          </button>
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
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <LuReceipt className="mx-auto text-gray-300 text-5xl mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No expenses recorded yet</h3>
              <p className="text-gray-500 mb-4">Add your first expense to get started</p>
              <button 
                onClick={() => navigate('/admin/expenses/add')}
                className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg mx-auto"
              >
                <LuPlus className="text-lg" />
                <span>Add Expense</span>
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
                  {expenses.slice(0, 5).map((expense) => (
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
                          {expense.paymentMode || '-'}
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
                            onClick={() => viewExpense(expense)}
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

export default ExpenseDashboard;