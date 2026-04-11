import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

// Add a utility function to convert 24-hour time to 12-hour format with AM/PM
const formatTimeTo12Hour = (time24) => {
  if (!time24) return '--:--';

  const [hours, minutes] = time24.split(':');
  let hoursInt = parseInt(hours, 10);
  const ampm = hoursInt >= 12 ? 'PM' : 'AM';

  // Convert to 12-hour format
  hoursInt = hoursInt % 12 || 12;

  return `${hoursInt}:${minutes} ${ampm}`;
};

const MessageAlert = ({ status, onClose }) => {
  if (!status || !status.message) return null;
  return (
    <div className={`mb-4 p-4 rounded-lg flex justify-between items-center animate-fade-in ${status.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
      <div className="flex items-center">
        {status.type === 'success' ? (
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )}
        <span className="font-medium">{status.message}</span>
      </div>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

const Settings = () => {
  const [gstPercentage, setGstPercentage] = useState('');
  const [loading, setLoading] = useState(false);

  // Section-specific status states
  const [gstStatus, setGstStatus] = useState({ message: '', type: '' });
  const [accessStatus, setAccessStatus] = useState({ message: '', type: '' });
  const [copyStatus, setCopyStatus] = useState({ message: '', type: '' });
  const [batchStatus, setBatchStatus] = useState({ message: '', type: '' });

  // Function to show message and auto-dismiss
  const showSectionMessage = (section, message, type = 'success') => {
    const setters = {
      gst: setGstStatus,
      access: setAccessStatus,
      copy: setCopyStatus,
      batch: setBatchStatus,
      category: setCategoryAccessStatus
    };

    const setter = setters[section];
    if (setter) {
      setter({ message, type });
      setTimeout(() => {
        setter({ message: '', type: '' });
      }, 5000);
    }
  };

  // Batch states
  const [batches, setBatches] = useState([]);
  const [newBatch, setNewBatch] = useState({
    name: '',
    workingHours: { from: '', to: '', included: true },
    lunchBreak: { from: '', to: '', included: true },
    breakTime: { from: '', to: '', included: true }
  });
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null); // State for delete confirmation modal

  // Product Shifting state
  const [sourceShopId, setSourceShopId] = useState('');
  const [destinationShopId, setDestinationShopId] = useState('');
  const [copyIncludeQty, setCopyIncludeQty] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // Access control state
  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedShopForCategories, setSelectedShopForCategories] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categoryAccessStatus, setCategoryAccessStatus] = useState({ message: '', type: '' });

  // Copy History state
  const [copyHistory, setCopyHistory] = useState([]);
  const [showCopyHistoryModal, setShowCopyHistoryModal] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

  // Fetch current GST settings on component mount
  useEffect(() => {
    const fetchGstSettings = async () => {
      try {
        const response = await axios.get('/admin/settings/gst');
        setGstPercentage(response.data.gstPercentage || '');
      } catch (error) {
        console.error('Error fetching GST settings:', error);
        showSectionMessage('gst', 'Failed to load GST settings.', 'error');
      }
    };

    const fetchBatchSettings = async () => {
      try {
        const response = await axios.get('/admin/settings/batches');
        setBatches(response.data);
      } catch (error) {
        console.error('Error fetching batch settings:', error);
        // Don't show error message for batches as it's not critical
      }
    };

    const fetchShops = async () => {
      try {
        const response = await axios.get('/admin/shops');
        setShops(response.data);
      } catch (error) {
        console.error('Error fetching shops:', error);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await axios.get('/admin/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchGstSettings();
    fetchBatchSettings();
    fetchShops();
    fetchCategories();
  }, []);

  const handleSaveGst = async () => {
    if (gstPercentage === '' || isNaN(gstPercentage) || gstPercentage < 0) {
      showSectionMessage('gst', 'Please enter a valid GST percentage.', 'error');
      return;
    }

    setLoading(true);
    setGstStatus({ message: '', type: '' });

    try {
      const response = await axios.post('/admin/settings/gst', { gstPercentage });

      showSectionMessage('gst', 'GST settings updated successfully', 'success');
    } catch (error) {
      console.error('Error saving GST settings:', error);
      showSectionMessage('gst', 'Failed to save GST settings. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Batch functions
  const handleAddBatch = async () => {
    if (!newBatch.name) {
      showSectionMessage('batch', 'Please enter a batch name.', 'error');
      return;
    }

    setLoading(true);
    setBatchStatus({ message: '', type: '' });

    try {
      const batchId = editingBatchId || Date.now().toString();
      const response = await axios.post('/admin/settings/batches', {
        batchId,
        name: newBatch.name,
        workingHours: newBatch.workingHours,
        lunchBreak: newBatch.lunchBreak,
        breakTime: newBatch.breakTime
      });

      showSectionMessage('batch', editingBatchId ? 'Batch updated successfully' : 'Batch added successfully', 'success');

      // Reset form
      setNewBatch({
        name: '',
        workingHours: { from: '', to: '', included: true },
        lunchBreak: { from: '', to: '', included: true },
        breakTime: { from: '', to: '', included: true }
      });
      setEditingBatchId(null);

      // Refresh batches
      const batchResponse = await axios.get('/admin/settings/batches');
      setBatches(batchResponse.data);
    } catch (error) {
      console.error('Error saving batch settings:', error);
      showSectionMessage('batch', 'Failed to save batch settings. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleShopChangeForCategories = async (shopId) => {
    setSelectedShopForCategories(shopId);
    if (shopId) {
      try {
        setLoading(true);
        // Fetch categories used by this specific shop
        const catResponse = await axios.get(`/admin/categories/shop-specific?shopId=${shopId}`);
        setCategories(catResponse.data);

        const shop = shops.find(s => s._id === shopId);
        if (shop && shop.allowedCategories) {
          // Extract IDs from shop.allowedCategories which might be objects or strings
          const allowedIds = shop.allowedCategories.map(cat => typeof cat === 'object' ? cat._id : cat);
          setSelectedCategories(allowedIds);
        } else {
          setSelectedCategories([]);
        }
      } catch (error) {
        console.error('Error fetching shop-specific categories:', error);
        showSectionMessage('category', 'Failed to load shop categories.', 'error');
      } finally {
        setLoading(false);
      }
    } else {
      setSelectedCategories([]);
      // Reset to all categories when no shop is selected
      try {
        const response = await axios.get('/admin/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Error resetting categories:', error);
      }
    }
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSaveCategoryPermissions = async () => {
    if (!selectedShopForCategories) {
      showSectionMessage('category', 'Please select a shop first.', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(`/admin/shops/${selectedShopForCategories}/category-permissions`, {
        allowedCategories: selectedCategories
      });

      // Update local shops state
      setShops(prevShops => prevShops.map(shop =>
        shop._id === selectedShopForCategories
          ? { ...shop, allowedCategories: response.data.shop.allowedCategories }
          : shop
      ));

      showSectionMessage('category', 'Category permissions updated successfully', 'success');
    } catch (error) {
      console.error('Error saving category permissions:', error);
      showSectionMessage('category', 'Failed to update category permissions.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTaxInvoiceAccess = async (shopId, currentStatus) => {
    try {
      setLoading(true);
      const newStatus = !currentStatus;
      await axios.put(`/admin/shops/${shopId}/access`, { hasTaxInvoiceAccess: newStatus });
      setShops(shops.map(shop => shop._id === shopId ? { ...shop, hasTaxInvoiceAccess: newStatus } : shop));
      showSectionMessage('access', `Access for ${shops.find(s => s._id === shopId)?.name} updated successfully`, 'success');
    } catch (error) {
      console.error('Error updating access:', error);
      showSectionMessage('access', 'Failed to update access. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProductEditAccess = async (shopId, currentStatus) => {
    try {
      setLoading(true);
      const newStatus = !currentStatus;
      await axios.put(`/admin/shops/${shopId}/access`, { canEditProducts: newStatus });
      setShops(shops.map(shop => shop._id === shopId ? { ...shop, canEditProducts: newStatus } : shop));
      showSectionMessage('access', `Product edit access for ${shops.find(s => s._id === shopId)?.name} updated successfully`, 'success');
    } catch (error) {
      console.error('Error updating product edit access:', error);
      showSectionMessage('access', 'Failed to update access. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBatch = (batch) => {
    setNewBatch({
      name: batch.name,
      workingHours: batch.workingHours || { from: '', to: '', included: true },
      lunchBreak: batch.lunchBreak || { from: '', to: '', included: true },
      breakTime: batch.breakTime || { from: '', to: '', included: true }
    });
    setEditingBatchId(batch.id);
  };

  const handleDeleteBatch = async (batchId) => {
    setDeleteConfirmation(batchId);
  };

  const confirmDeleteBatch = async (batchId) => {
    try {
      const response = await axios.delete(`/admin/settings/batches/${batchId}`);
      showSectionMessage('batch', 'Batch deleted successfully', 'success');

      // Refresh batches
      const batchResponse = await axios.get('/admin/settings/batches');
      setBatches(batchResponse.data);
    } catch (error) {
      console.error('Error deleting batch:', error);
      const errorMsg = error.response?.data?.message || 'Failed to delete batch. Please try again.';
      showSectionMessage('batch', errorMsg, 'error');
    } finally {
      setDeleteConfirmation(null);
    }
  };

  const cancelDeleteBatch = () => {
    setDeleteConfirmation(null);
  };

  const handleCopyProducts = async () => {
    if (!sourceShopId || !destinationShopId) {
      showSectionMessage('copy', 'Please select both source and destination shops.', 'error');
      return;
    }

    if (sourceShopId === destinationShopId) {
      showSectionMessage('copy', 'Source and destination cannot be the same.', 'error');
      return;
    }

    setIsCopying(true);
    setCopyStatus({ message: '', type: '' });

    try {
      const response = await axios.post('/admin/products/copy', {
        sourceShopId: sourceShopId,
        destinationShopId: destinationShopId,
        includeQty: copyIncludeQty
      });

      showSectionMessage('copy', 'Products and inventory details copied successfully', 'success');

      // Reset form
      setSourceShopId('');
      setDestinationShopId('');
      setCopyIncludeQty(false);
    } catch (error) {
      console.error('Error copying products:', error);
      showSectionMessage('copy', error.response?.data?.message || 'Failed to copy products.', 'error');
    } finally {
      setIsCopying(false);
    }
  };

  const fetchCopyHistory = async () => {
    setIsFetchingHistory(true);
    try {
      const response = await axios.get('/admin/product-history/copy');
      setCopyHistory(response.data);
      setShowCopyHistoryModal(true);
    } catch (error) {
      console.error('Error fetching copy history:', error);
      showSectionMessage('copy', 'Failed to load copy history.', 'error');
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Calculate example values for display
  const calculateGstExample = (totalAmount = 100) => {
    const gstPercent = parseFloat(gstPercentage) || 0;
    if (gstPercent <= 0) {
      return {
        baseAmount: totalAmount.toFixed(2),
        gstAmount: '0.00',
        totalAmount: totalAmount.toFixed(2)
      };
    }

    // Calculate base amount and GST
    const baseAmount = totalAmount / (1 + gstPercent / 100);
    const gstAmount = totalAmount - baseAmount;

    return {
      baseAmount: baseAmount.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2)
    };
  };

  const example = calculateGstExample(100);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Settings</h1>
      <p className="text-gray-600 mb-8">Configure application settings and preferences.</p>

      {/* GST Management Section */}
      <MessageAlert status={gstStatus} onClose={() => setGstStatus({ message: '', type: '' })} />
      <div className="border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">GST Management</h2>
        <p className="text-gray-600 mb-6">Configure GST settings for billing and invoices.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GST Percentage
            </label>
            <div className="relative">
              <input
                type="text"
                step="0.01"
                min="0"
                max="100"
                value={gstPercentage}
                onChange={(e) => setGstPercentage(e.target.value)}
                placeholder="Enter GST percentage"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-primary focus:border-primary"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500">%</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Enter the GST percentage to be applied to all bills and invoices.
            </p>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleSaveGst}
              disabled={loading}
              className={`w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Saving...' : 'Save GST Settings'}
            </button>
          </div>
        </div>

        {/* Example Calculation */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-3">GST Calculation Example</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded border">
              <p className="text-sm text-gray-600">Base Amount</p>
              <p className="text-lg font-semibold">₹{example.baseAmount}</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-sm text-gray-600">GST ({gstPercentage || 0}%)</p>
              <p className="text-lg font-semibold">₹{example.gstAmount}</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-lg font-semibold">₹{example.totalAmount}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-600">
            When a {gstPercentage || 0}% GST is applied to a ₹100 bill, the calculation is shown above.
          </p>
        </div>
      </div>

      {/* Access Control Section */}
      <MessageAlert status={accessStatus} onClose={() => setAccessStatus({ message: '', type: '' })} />
      <div className="border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Access Control</h2>
        <p className="text-gray-600 mb-6">Manage access rights for different shops globally.</p>

        <div className="bg-white rounded border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shop Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tax Invoice Access
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Edit Access
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shops.map((shop) => (
                <tr key={shop._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{shop.name}</div>
                    <div className="text-sm text-gray-500">{shop.location || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={shop.hasTaxInvoiceAccess || false}
                          onChange={() => handleToggleTaxInvoiceAccess(shop._id, shop.hasTaxInvoiceAccess)}
                          disabled={loading}
                        />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${shop.hasTaxInvoiceAccess ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${shop.hasTaxInvoiceAccess ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                      <div className="ml-3 text-sm font-medium text-gray-700">
                        {shop.hasTaxInvoiceAccess ? 'Enabled' : 'Disabled'}
                      </div>
                    </label>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={shop.canEditProducts !== false} // Default to true if undefined
                          onChange={() => handleToggleProductEditAccess(shop._id, shop.canEditProducts !== false)}
                          disabled={loading}
                        />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${shop.canEditProducts !== false ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${shop.canEditProducts !== false ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                      <div className="ml-3 text-sm font-medium text-gray-700">
                        {shop.canEditProducts !== false ? 'Enabled' : 'Disabled'}
                      </div>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {shops.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500">No shops available.</div>
          )}
        </div>
      </div>

      {/* Category Access Control Section */}
      <MessageAlert status={categoryAccessStatus} onClose={() => setCategoryAccessStatus({ message: '', type: '' })} />
      <div className="border border-gray-200 rounded-lg p-6 mb-8 bg-green-50">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Category Access Control
        </h2>
        <div className="flex flex-col gap-1 mb-6">
          <p className="text-gray-600 font-medium">Select a shop and control which categories are visible to them in filters and reports.</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-green-200">View Products</span>
            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-green-200">Track Stock</span>
            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-green-200">Stock Alerts</span>
            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-green-200">Sales Report</span>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Shop</label>
          <select
            value={selectedShopForCategories}
            onChange={(e) => handleShopChangeForCategories(e.target.value)}
            className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-primary focus:border-primary bg-white shadow-sm"
          >
            <option value="">Select Shop</option>
            {shops.map(shop => (
              <option key={shop._id} value={shop._id}>{shop.name}</option>
            ))}
          </select>
        </div>

        {selectedShopForCategories && (
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm animate-fade-in">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex justify-between items-center">
              <span>Allowed Categories for {shops.find(s => s._id === selectedShopForCategories)?.name}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCategories(categories.map(c => c._id))}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setSelectedCategories([])}
                  className="text-xs text-red-600 hover:underline"
                >
                  Deselect All
                </button>
              </div>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {categories.map((category) => (
                <label key={category._id} className="flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category._id)}
                    onChange={() => handleCategoryToggle(category._id)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700 font-medium">{category.name}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveCategoryPermissions}
                disabled={loading}
                className={`bg-green-600 text-white font-semibold py-2 px-8 rounded-md hover:bg-green-700 transition duration-200 shadow-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        )}
      </div>

      <MessageAlert status={copyStatus} onClose={() => setCopyStatus({ message: '', type: '' })} />
      <div className="border border-gray-200 rounded-lg p-6 mb-8 bg-blue-50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Product Copying / Shifting
          </h2>
          <button
            onClick={fetchCopyHistory}
            disabled={isFetchingHistory}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors flex items-center gap-1 text-sm font-medium"
            title="View Copy History"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isFetchingHistory ? 'Loading...' : 'History'}
          </button>
        </div>
        <p className="text-gray-600 mb-6 font-medium">Duplicate all products from one shop to another. This is useful for setting up new shops quickly.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Source Shop (From)</label>
            <select
              value={sourceShopId}
              onChange={(e) => setSourceShopId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-primary focus:border-primary bg-white shadow-sm"
            >
              <option value="">Select Source</option>
              <option value="admin">Admin Side (Base Products)</option>
              {shops.map(shop => (
                <option key={shop._id} value={shop._id}>{shop.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Destination Shop (To)</label>
            <select
              value={destinationShopId}
              onChange={(e) => setDestinationShopId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-primary focus:border-primary bg-white shadow-sm"
            >
              <option value="">Select Destination</option>
              <option value="admin">Admin Side (Base Products)</option>
              {shops.map(shop => (
                <option key={shop._id} value={shop._id}>{shop.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center mb-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={copyIncludeQty}
                onChange={(e) => setCopyIncludeQty(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">Include Stock QTY</span>
            </label>
          </div>

          <div>
            <button
              onClick={handleCopyProducts}
              disabled={isCopying}
              className={`w-full bg-blue-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-blue-700 transition duration-200 shadow-md ${isCopying ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isCopying ? 'Processing...' : 'Copy Products'}
            </button>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-500 italic">
          * Note: Products are matched by SKU. If a product already exists in the destination, its details (except stock, unless toggled) will be synced.
        </p>
      </div>

      {/* Batch Management Section */}

      <MessageAlert status={batchStatus} onClose={() => setBatchStatus({ message: '', type: '' })} />
      <div className="border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Batch Management</h2>
        <p className="text-gray-600 mb-6">Configure work batches with predefined working hours, lunch breaks, and break times.</p>

        {/* Add/Edit Batch Form */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            {editingBatchId ? 'Edit Batch' : 'Add New Batch'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch Name
              </label>
              <input
                type="text"
                value={newBatch.name}
                onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                placeholder="Enter batch name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* Working Hours */}
          <div className="mb-4 p-3 bg-white rounded border">
            <h4 className="font-medium text-gray-800 mb-2">Working Hours</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From</label>
                <input
                  type="time"
                  value={newBatch.workingHours.from}
                  onChange={(e) => setNewBatch({
                    ...newBatch,
                    workingHours: { ...newBatch.workingHours, from: e.target.value }
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To</label>
                <input
                  type="time"
                  value={newBatch.workingHours.to}
                  onChange={(e) => setNewBatch({
                    ...newBatch,
                    workingHours: { ...newBatch.workingHours, to: e.target.value }
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={newBatch.workingHours.included}
                    onChange={(e) => setNewBatch({
                      ...newBatch,
                      workingHours: { ...newBatch.workingHours, included: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  Included in work time
                </label>
              </div>
            </div>
          </div>

          {/* Lunch Break */}
          <div className="mb-4 p-3 bg-white rounded border">
            <h4 className="font-medium text-gray-800 mb-2">Lunch Break</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From</label>
                <input
                  type="time"
                  value={newBatch.lunchBreak.from}
                  onChange={(e) => setNewBatch({
                    ...newBatch,
                    lunchBreak: { ...newBatch.lunchBreak, from: e.target.value }
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To</label>
                <input
                  type="time"
                  value={newBatch.lunchBreak.to}
                  onChange={(e) => setNewBatch({
                    ...newBatch,
                    lunchBreak: { ...newBatch.lunchBreak, to: e.target.value }
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={newBatch.lunchBreak.included}
                    onChange={(e) => setNewBatch({
                      ...newBatch,
                      lunchBreak: { ...newBatch.lunchBreak, included: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  Included in work time
                </label>
              </div>
            </div>
          </div>

          {/* Break Time */}
          <div className="mb-4 p-3 bg-white rounded border">
            <h4 className="font-medium text-gray-800 mb-2">Break Time</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From</label>
                <input
                  type="time"
                  value={newBatch.breakTime.from}
                  onChange={(e) => setNewBatch({
                    ...newBatch,
                    breakTime: { ...newBatch.breakTime, from: e.target.value }
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To</label>
                <input
                  type="time"
                  value={newBatch.breakTime.to}
                  onChange={(e) => setNewBatch({
                    ...newBatch,
                    breakTime: { ...newBatch.breakTime, to: e.target.value }
                  })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={newBatch.breakTime.included}
                    onChange={(e) => setNewBatch({
                      ...newBatch,
                      breakTime: { ...newBatch.breakTime, included: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  Included in work time
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddBatch}
              disabled={loading}
              className={`px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Saving...' : (editingBatchId ? 'Update Batch' : 'Add Batch')}
            </button>
            {editingBatchId && (
              <button
                type="button"
                onClick={() => {
                  setNewBatch({
                    name: '',
                    workingHours: { from: '', to: '', included: true },
                    lunchBreak: { from: '', to: '', included: true },
                    breakTime: { from: '', to: '', included: true }
                  });
                  setEditingBatchId(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition duration-200"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Batches List */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Existing Batches</h3>
          {batches.length === 0 ? (
            <p className="text-gray-600 text-center py-4">No batches configured yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {batches.map((batch) => (
                <div key={batch.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-gray-800">{batch.name}</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditBatch(batch)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBatch(batch.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Working Hours</p>
                      <p className="text-gray-600">
                        {batch.workingHours?.from ? formatTimeTo12Hour(batch.workingHours.from) : '--:--'} -
                        {batch.workingHours?.to ? formatTimeTo12Hour(batch.workingHours.to) : '--:--'}
                        {!batch.workingHours?.included && ' (Excluded)'}
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-gray-700">Lunch Break</p>
                      <p className="text-gray-600">
                        {batch.lunchBreak?.from ? formatTimeTo12Hour(batch.lunchBreak.from) : '--:--'} -
                        {batch.lunchBreak?.to ? formatTimeTo12Hour(batch.lunchBreak.to) : '--:--'}
                        {batch.lunchBreak?.included !== undefined && !batch.lunchBreak?.included && ' (Excluded)'}
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-gray-700">Break Time</p>
                      <p className="text-gray-600">
                        {batch.breakTime?.from ? formatTimeTo12Hour(batch.breakTime.from) : '--:--'} -
                        {batch.breakTime?.to ? formatTimeTo12Hour(batch.breakTime.to) : '--:--'}
                        {batch.breakTime?.included !== undefined && !batch.breakTime?.included && ' (Excluded)'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                Delete Batch
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this batch?
                </p>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="button"
                onClick={() => confirmDeleteBatch(deleteConfirmation)}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={cancelDeleteBatch}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Copy History Modal */}
      {showCopyHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Product Copy History</h3>
              <button
                onClick={() => setShowCopyHistoryModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {copyHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No copy history found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Copied</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty Incl.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {copyHistory.map((history) => (
                        <tr key={history._id}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>{formatDate(history.timestamp)}</div>
                            <div className="text-xs text-gray-500">{formatTime(history.timestamp)}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{history.sourceShop}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">{history.destinationShop}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-700">{history.copiedCount}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700">{history.updatedCount}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-500">{history.totalProducts}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                            {history.includeQty ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Yes</span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">No</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{history.admin?.name || 'Unknown'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowCopyHistoryModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

