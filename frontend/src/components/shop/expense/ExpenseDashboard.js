import React, { useState, useEffect } from 'react';
import { LuReceipt, LuPlus, LuFilter, LuTrendingUp, LuHistory, LuEye, LuDownload, LuCalendar } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import ExpenseDetailModal from '../../common/ExpenseDetailModal';

const ExpenseDashboard = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  // Fetch expenses
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/shop/expenses', {
          withCredentials: true
        });
        setExpenses(response.data);
      } catch (err) {
        console.error('Error fetching expenses:', err);
        setError('Failed to fetch expenses');
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

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
    // For now, just show an alert
    alert(`Downloading expense as PDF:\n${expense.category} - ${formatCurrency(expense.amount)}\nThis feature will generate a PDF receipt in a future implementation.`);
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
          <h1 className="text-2xl font-bold text-gray-800">Shop Expenses</h1>
          <p className="text-gray-600">Track and manage shop expenses</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/shop/expenses/history')}
            className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <LuHistory className="text-lg" />
            <span>History</span>
          </button>
          <button 
            onClick={() => navigate('/shop/expenses/add')}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <LuPlus className="text-lg" />
            <span>Add Expense</span>
          </button>
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
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Recent Expenses</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative flex justify-center items-center mb-4">
                <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
                <img 
                  src="/sweethub-logo.png" 
                  alt="Sweet Hub Logo" 
                  className="absolute w-8 h-8"
                />
              </div>
              <div className="text-red-500 font-medium">Loading expenses...</div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">{error}</div>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12">
              <LuReceipt className="mx-auto text-gray-300 text-4xl mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No expenses recorded yet</h3>
              <p className="text-gray-500 mb-4">Add your first expense to get started</p>
              <button 
                onClick={() => navigate('/shop/expenses/add')}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors mx-auto"
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