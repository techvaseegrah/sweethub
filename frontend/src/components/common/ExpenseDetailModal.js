import React from 'react';
import { LuX, LuDownload, LuPrinter, LuCalendar, LuReceipt } from 'react-icons/lu';
import { generateExpensePdf } from '../../utils/generateExpensePdf';

const ExpenseDetailModal = ({ expense, onClose, onDownload }) => {
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
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format datetime
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Download expense as PDF
  const downloadExpense = (expense) => {
    // Immediately generate and download PDF without showing popup
    generateExpensePdf(expense);
  };

  if (!expense) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <LuReceipt className="text-blue-500 text-xl" />
            <h2 className="text-xl font-bold text-gray-800">Expense Details</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LuX className="text-gray-500 text-xl" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Expense Info */}
          <div className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{expense.category}</h3>
                <p className="text-gray-600">{expense.description || 'No description provided'}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-600">{formatCurrency(expense.amount)}</p>
                <p className="text-sm text-gray-500">Expense ID: {expense._id}</p>
              </div>
            </div>
          </div>
          
          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Date</p>
              <p className="font-medium">{formatDate(expense.date)}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Payment Mode</p>
              <p className="font-medium">{expense.paymentMode}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Vendor</p>
              <p className="font-medium">{expense.vendor || 'Not specified'}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Created By</p>
              <p className="font-medium">
                {expense.createdBy?.name || 
                 (expense.admin ? 'Admin' : 
                  (expense.shop ? expense.shop.name : 'Unknown'))}
              </p>
            </div>
            
            {expense.shop && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Shop</p>
                <p className="font-medium">{expense.shop.name}</p>
              </div>
            )}
            
            {expense.admin && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Created By</p>
                <p className="font-medium">Admin</p>
              </div>
            )}
          </div>
          
          {/* Timestamps */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-6 border border-blue-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-sm text-blue-600 mb-1 flex items-center gap-1">
                  <LuCalendar className="text-blue-500" />
                  Created At
                </p>
                <p className="font-medium text-blue-800">{formatDateTime(expense.createdAt)}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-sm text-blue-600 mb-1 flex items-center gap-1">
                  <LuCalendar className="text-blue-500" />
                  Last Updated
                </p>
                <p className="font-medium text-blue-800">{formatDateTime(expense.updatedAt)}</p>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              <LuPrinter className="text-lg" />
              <span>Print</span>
            </button>
            <button 
              onClick={() => downloadExpense(expense)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              <LuDownload className="text-lg" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDetailModal;