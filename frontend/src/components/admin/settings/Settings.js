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

const Settings = () => {
  const [gstPercentage, setGstPercentage] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // success or error
  
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
  
  // Fetch current GST settings on component mount
  useEffect(() => {
    const fetchGstSettings = async () => {
      try {
        const response = await axios.get('/admin/settings/gst');
        setGstPercentage(response.data.gstPercentage || '');
      } catch (error) {
        console.error('Error fetching GST settings:', error);
        setMessage('Failed to load GST settings.');
        setMessageType('error');
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
    
    fetchGstSettings();
    fetchBatchSettings();
  }, []);

  const handleSaveGst = async () => {
    if (gstPercentage === '' || isNaN(gstPercentage) || gstPercentage < 0) {
      setMessage('Please enter a valid GST percentage.');
      setMessageType('error');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post('/admin/settings/gst', { gstPercentage });
      
      setMessage(response.data.message);
      setMessageType('success');
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving GST settings:', error);
      setMessage('Failed to save GST settings. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };
  
  // Batch functions
  const handleAddBatch = async () => {
    if (!newBatch.name) {
      setMessage('Please enter a batch name.');
      setMessageType('error');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const batchId = editingBatchId || Date.now().toString();
      const response = await axios.post('/admin/settings/batches', {
        batchId,
        name: newBatch.name,
        workingHours: newBatch.workingHours,
        lunchBreak: newBatch.lunchBreak,
        breakTime: newBatch.breakTime
      });
      
      setMessage(response.data.message);
      setMessageType('success');
      
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
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving batch settings:', error);
      setMessage('Failed to save batch settings. Please try again.');
      setMessageType('error');
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
      setMessage(response.data.message);
      setMessageType('success');
      
      // Refresh batches
      const batchResponse = await axios.get('/admin/settings/batches');
      setBatches(batchResponse.data);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error deleting batch:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setMessage(`Failed to delete batch: ${error.response.data.message}`);
      } else {
        setMessage('Failed to delete batch. Please try again.');
      }
      setMessageType('error');
    } finally {
      setDeleteConfirmation(null);
    }
  };

  const cancelDeleteBatch = () => {
    setDeleteConfirmation(null);
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
      
      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}
      
      {/* GST Management Section */}
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
      
      {/* Batch Management Section */}
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
                onChange={(e) => setNewBatch({...newBatch, name: e.target.value})}
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
                    workingHours: {...newBatch.workingHours, from: e.target.value}
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
                    workingHours: {...newBatch.workingHours, to: e.target.value}
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
                      workingHours: {...newBatch.workingHours, included: e.target.checked}
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
                    lunchBreak: {...newBatch.lunchBreak, from: e.target.value}
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
                    lunchBreak: {...newBatch.lunchBreak, to: e.target.value}
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
                      lunchBreak: {...newBatch.lunchBreak, included: e.target.checked}
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
                    breakTime: {...newBatch.breakTime, from: e.target.value}
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
                    breakTime: {...newBatch.breakTime, to: e.target.value}
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
                      breakTime: {...newBatch.breakTime, included: e.target.checked}
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
    </div>
  );
};

export default Settings;

