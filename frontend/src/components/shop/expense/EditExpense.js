import React, { useState, useEffect } from 'react';
import { LuArrowLeft, LuPencil, LuCalendar, LuIndianRupee } from 'react-icons/lu';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../../api/axios';

const EditExpense = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get expense ID from URL params
  
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: '',
    date: '',
    vendor: '',
    paymentMode: ''
  });
  
  const [customCategory, setCustomCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

  const expenseCategories = [
    'Transport',
    'Petrol / Diesel',
    'Electricity',
    'Raw Materials',
    'Salary / Wages',
    'Maintenance',
    'Miscellaneous'
  ];

  const paymentModes = [
    'Cash',
    'UPI',
    'Bank Transfer'
  ];

  // Load existing expense data
  useEffect(() => {
    const loadExpense = async () => {
      try {
        setInitialLoading(true);
        const response = await axios.get(`/shop/expenses/${id}`, {
          withCredentials: true
        });
        
        const expense = response.data;
        setFormData({
          category: expense.category,
          amount: expense.amount.toString(),
          description: expense.description || '',
          date: expense.date.split('T')[0], // Format date for input
          vendor: expense.vendor || '',
          paymentMode: expense.paymentMode || ''
        });
        
        // Check if category is a custom one (not in predefined list)
        if (!expenseCategories.includes(expense.category)) {
          setCustomCategory(expense.category);
        }
      } catch (err) {
        console.error('Error loading expense:', err);
        setError(err.response?.data?.message || 'Failed to load expense details');
      } finally {
        setInitialLoading(false);
      }
    };

    loadExpense();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle category change specially
    if (name === 'category') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // If selecting "Others", clear custom category
      if (value !== 'Others') {
        setCustomCategory('');
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCustomCategoryChange = (e) => {
    const value = e.target.value;
    setCustomCategory(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const categoryToSubmit = formData.category === 'Others' ? customCategory : formData.category;
    
    if (!categoryToSubmit || !formData.amount || !formData.date || !formData.paymentMode) {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Create form data for submission
      const expenseData = {
        category: categoryToSubmit,  // Use the custom category if "Others" was selected
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: formData.date,
        vendor: formData.vendor,
        paymentMode: formData.paymentMode
      };
      
      // Update expense data
      const response = await axios.put(`/shop/expenses/${id}`, expenseData, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });
      
      if (response.status === 200) {
        // Success - navigate back to expenses dashboard
        navigate('/shop/expenses');
      }
    } catch (err) {
      console.error('Error updating expense:', err);
      setError(err.response?.data?.message || 'Failed to update expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/shop/expenses')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LuArrowLeft className="text-gray-600 text-xl" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Edit Expense</h1>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="relative flex justify-center items-center mb-4">
              <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
              <img 
                src="/sweethub-logo.png" 
                alt="Sweet Hub Logo" 
                className="absolute w-8 h-8"
              />
            </div>
            <div className="text-red-500 font-medium">Loading expense details...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/shop/expenses')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          disabled={loading}
        >
          <LuArrowLeft className="text-gray-600 text-xl" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Edit Expense</h1>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Expense Details</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category === customCategory && !expenseCategories.includes(customCategory) ? 'Others' : formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
                disabled={loading}
              >
                <option value="">Select Category</option>
                {expenseCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
                <option value="Others">Others</option>
              </select>
                
                {/* Custom category input when "Others" is selected or when it's a custom category */}
                {(formData.category === 'Others' || (!expenseCategories.includes(formData.category) && formData.category)) && (
                  <div className="mt-2 space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Custom Category *
                    </label>
                    <input
                      type="text"
                      name="customCategory"
                      value={customCategory || formData.category}
                      onChange={handleCustomCategoryChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter custom category"
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500">Enter your custom expense category</p>
                  </div>
                )}
              </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LuIndianRupee className="text-gray-400" />
                </div>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="0.00"
                  required
                  disabled={loading}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LuCalendar className="text-gray-400" />
                </div>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Mode *
              </label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
                disabled={loading}
              >
                <option value="">Select Payment Mode</option>
                {paymentModes.map(mode => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>

            {/* Vendor */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paid To / Vendor
              </label>
              <input
                type="text"
                name="vendor"
                value={formData.vendor}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Vendor or payee name"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description / Notes
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Add any notes or description about this expense"
                disabled={loading}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/shop/expenses')}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <LuPencil className="text-lg" />
                  <span>Update Expense</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpense;