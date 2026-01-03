import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { LuX, LuDollarSign, LuShoppingCart, LuUsers, LuTruck, LuEllipsis, LuRefreshCw, LuFileText } from 'react-icons/lu';

function ExpenseBreakdown({ shop, dateRange, onClose }) {
  const [expenseData, setExpenseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('other');

  // Fetch detailed expense breakdown
  const fetchExpenseBreakdown = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/admin/profit-loss/shop/${shop.shopId}/expenses`, {
        params: dateRange
      });
      setExpenseData(response.data);
    } catch (err) {
      console.error('Error fetching expense breakdown:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenseBreakdown();
  }, [shop, dateRange]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-60 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl">
          <div className="p-6 flex flex-col items-center justify-center h-64">
            <div className="relative flex justify-center items-center mb-4">
              <div className="w-16 h-16 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
              <img 
                src="/sweethub-logo.png" 
                alt="Sweet Hub Logo" 
                className="absolute w-10 h-10"
              />
            </div>
            <div className="text-red-500 font-medium">Loading expense details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!expenseData) {
    return null;
  }

  const { expenses } = expenseData;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Expense Breakdown</h3>
            <p className="text-gray-600">{shop.shopName} - {expenseData.shopName}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <LuX className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('other')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'other'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <LuEllipsis className="h-4 w-4" />
                <span>Expenses</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'other' && (
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Expenses</h4>
              
              {/* Expense categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <LuTruck className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800">Transport Expenses</h5>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-800">
                    {formatCurrency(expenses.transport)}
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <LuFileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800">Petrol / Diesel</h5>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-800">
                    {formatCurrency(expenses.petrolDiesel)}
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <LuFileText className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800">Electricity</h5>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-yellow-800">
                    {formatCurrency(expenses.electricity)}
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <LuFileText className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800">Raw Materials</h5>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-purple-800">
                    {formatCurrency(expenses.rawMaterials)}
                  </div>
                </div>
                
                <div className="bg-red-50 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <LuFileText className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800">Maintenance</h5>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-red-800">
                    {formatCurrency(expenses.maintenance)}
                  </div>
                </div>
                
                <div className="bg-indigo-50 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <LuEllipsis className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800">Miscellaneous</h5>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-indigo-800">
                    {formatCurrency(expenses.miscellaneous)}
                  </div>
                </div>
              </div>
              
              {/* Detailed expense list */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h5 className="font-medium text-gray-800">Detailed Expense Records</h5>
                </div>
                
                {expenses.actualExpenses.length === 0 ? (
                  <div className="p-6 text-center">
                    <LuFileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Expenses</h3>
                    <p className="text-gray-500">No expenses recorded for this period.</p>
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
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {expenses.actualExpenses.map((expense, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(expense.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {expense.category}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {expense.description || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {expense.paymentMode}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                              {formatCurrency(expense.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan="4" className="px-6 py-3 text-sm font-medium text-gray-900">
                            Total Expenses
                          </td>
                          <td className="px-6 py-3 text-sm font-bold text-gray-900 text-right">
                            {formatCurrency(
                              expenses.transport + 
                              expenses.petrolDiesel + 
                              expenses.electricity + 
                              expenses.rawMaterials + 
                              expenses.maintenance + 
                              expenses.miscellaneous
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 rounded-b-lg">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExpenseBreakdown;