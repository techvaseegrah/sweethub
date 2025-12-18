import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../../api/axios';
import { LuFileCheck, LuInbox, LuSend, LuEye, LuClock, LuCheck, LuDownload, LuTriangleAlert } from 'react-icons/lu';
import { generateInvoicePdf } from '../../../utils/generateInvoicePdf';
import CustomModal from '../../CustomModal'; // Import the CustomModal component

function ViewInvoice() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [receivedQuantities, setReceivedQuantities] = useState({}); // New state for received quantities
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false); // State for confirmation modal
  const [pendingItemsForConfirmation, setPendingItemsForConfirmation] = useState([]); // State for pending items in confirmation

  // Fetches all invoices from the backend
  const fetchAllInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await axios.get('/shop/invoices/all');
      setInvoices(response.data || []);
    } catch (err) {
      setError('Failed to fetch invoices. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllInvoices();
  }, [fetchAllInvoices]);

  // Handle viewing a specific invoice
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDetail(true);
    // Pre-select all items by default for convenience if it's pending
    if (invoice.status === 'Pending') {
      const allItemIds = new Set(invoice.items.map(item => item.product));
      setSelectedItems(allItemIds);
      
      // Initialize received quantities with empty values
      const initialQuantities = {};
      invoice.items.forEach(item => {
        initialQuantities[item.product] = item.receivedQuantity || '';
      });
      setReceivedQuantities(initialQuantities);
    } else {
      setSelectedItems(new Set());
      // Initialize received quantities for existing data
      const initialQuantities = {};
      invoice.items.forEach(item => {
        initialQuantities[item.product] = item.receivedQuantity || '';
      });
      setReceivedQuantities(initialQuantities);
    }
  };

  // Back to invoice list
  const handleBackToList = () => {
    setShowDetail(false);
    setSelectedInvoice(null);
    setSelectedItems(new Set());
    setReceivedQuantities({});
    setError('');
    setMessage('');
  };

  // Handles the "Select All" / "Deselect All" functionality
  const handleToggleAll = () => {
    if (selectedItems.size === selectedInvoice.items.length) {
      setSelectedItems(new Set());
    } else {
      const allItemIds = new Set(selectedInvoice.items.map(item => item.product));
      setSelectedItems(allItemIds);
    }
  };

  // Handles checkbox changes for each product
  const handleSelectItem = (productId) => {
    setSelectedItems(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(productId)) {
        newSelected.delete(productId);
      } else {
        newSelected.add(productId);
      }
      return newSelected;
    });
  };

  // Handle received quantity change
  const handleReceivedQuantityChange = (productId, value) => {
    setReceivedQuantities(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  // Handles the form submission to confirm the invoice
  const handleSubmitConfirmation = async () => {
    if (selectedItems.size === 0 && selectedInvoice.status === 'Pending') {
      setError('You must select at least one item to confirm.');
      return;
    }
    
    // Get all selected items with their current received quantities
    const selectedItemsWithQuantities = selectedInvoice.items
      .filter(item => selectedItems.has(item.product))
      .map(item => {
        // Use the current received quantity from state, or the existing receivedQuantity if not in state
        const receivedQty = receivedQuantities[item.product] || item.receivedQuantity || 0;
        return {
          ...item,
          receivedQuantity: receivedQty
        };
      });
    
    // Store the selected items with their real-time quantities in state to display in the modal
    setPendingItemsForConfirmation(selectedItemsWithQuantities);
    setShowConfirmationModal(true);
  };
  
  // Actual submission function
  const performSubmission = async () => {
    setIsSubmitting(true);
    setError('');
    setMessage('');
    setShowConfirmationModal(false); // Close the modal if it was open
    setPendingItemsForConfirmation([]); // Clear pending items

    try {
      const payload = {
        confirmedItems: Array.from(selectedItems),
        receivedQuantities: receivedQuantities
      };

      const response = await axios.post(`/shop/invoices/${selectedInvoice._id}/confirm`, payload);

      setMessage(response.data.message);
      
      // Refresh the invoice list and go back to list view
      setTimeout(() => {
        fetchAllInvoices();
        handleBackToList();
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm the invoice.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle confirmation modal action
  const handleConfirmSubmit = () => {
    performSubmission();
  };
  
  // Handle cancellation of confirmation modal
  const handleCancelSubmit = () => {
    setShowConfirmationModal(false);
    setPendingItemsForConfirmation([]); // Clear pending items
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Get status badge
  const getStatusBadge = (status) => {
    if (status === 'Pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <LuClock className="mr-1 h-3 w-3" />
          Pending
        </span>
      );
    } else if (status === 'Partial') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <LuTriangleAlert className="mr-1 h-3 w-3" />
          Partial
        </span>
      );
    } else if (status === 'Confirmed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <LuCheck className="mr-1 h-3 w-3" />
          Confirmed
        </span>
      );
    }
    return <span className="text-gray-500">{status}</span>;
  };

  // Render loading state
  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading invoices...</div>;
  }

  // Show invoice detail view
  if (showDetail && selectedInvoice) {
    // Separate items for display when invoice is confirmed or partial
    // Received Products - items that are confirmed and have exact quantity match
    const exactlyMatchedItems = selectedInvoice.items.filter(item => 
      item.shopConfirmed && item.receivedQuantity === item.quantity
    );
    
    // Partial Products - items that are confirmed but have quantity mismatch
    const partialItems = selectedInvoice.items.filter(item => 
      item.shopConfirmed && item.receivedQuantity !== item.quantity
    );
    
    // Pending Products - items that are not yet confirmed
    const pendingItems = selectedInvoice.items.filter(item => !item.shopConfirmed);
    
    const hasExactlyMatchedItems = exactlyMatchedItems.length > 0;
    const hasPartialItems = partialItems.length > 0;
    const hasPendingItems = pendingItems.length > 0;
    
    return (
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        {/* Confirmation Modal */}
        <CustomModal 
          isOpen={showConfirmationModal}
          onClose={handleCancelSubmit}
          title="Confirm Invoice Submission"
        >
          <div className="p-4">
            <p className="text-gray-700 mb-4">
              You are about to confirm the following pending product(s):
            </p>
            <ul className="mb-4 text-gray-700">
              {pendingItemsForConfirmation.map((item, index) => (
                <li key={index} className="mb-2 p-2 bg-yellow-50 rounded">
                  <div className="font-medium">{item.productName} — Quantity: {item.quantity} | Received: {item.receivedQuantity || 0}</div>
                </li>
              ))}
            </ul>
            <p className="text-gray-700 mb-4">
              Do you want to confirm this pending product?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelSubmit}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              >
                Confirm
              </button>
            </div>
          </div>
        </CustomModal>
        
        {/* Back button */}
        <button 
          onClick={handleBackToList}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← Back to Invoice List
        </button>

        <div className="flex items-center justify-between mb-4 border-b pb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
              {selectedInvoice.status === 'Pending' ? 'Review Incoming Invoice' : 'Invoice Details'}
            </h3>
            <p className="text-sm text-gray-500">
              {selectedInvoice.status === 'Pending' 
                ? 'Confirm the items you have received from the admin.'
                : selectedInvoice.status === 'Partial'
                ? 'This invoice has been partially confirmed. You can confirm additional items.'
                : 'This invoice has been fully confirmed.'}
            </p>
          </div>
          <LuFileCheck className="text-3xl text-primary" />
        </div>
        
        {/* Invoice Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-500">Invoice Number</p>
            <p className="font-semibold text-gray-800">{selectedInvoice.invoiceNumber}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Issue Date</p>
            <p className="font-semibold text-gray-800">{formatDateTime(selectedInvoice.issueDate).date}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">From (Admin)</p>
            <p className="font-semibold text-gray-800">{selectedInvoice.admin?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Status</p>
            {getStatusBadge(selectedInvoice.status)}
          </div>
        </div>

        {/* Product List Sections for Confirmed/Partial Invoices */}
        {(selectedInvoice.status === 'Confirmed' || selectedInvoice.status === 'Partial') && (
          <div className="space-y-8">
            {/* Received Products Section - Only items with exact quantity match */}
            {hasExactlyMatchedItems && (
              <div>
                <h4 className="text-lg font-semibold text-gray-700 mb-3 pb-2 border-b border-green-200">✅ Received Products</h4>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-green-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product (SKU)</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Unit</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Received Quantity</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Unit Price</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {exactlyMatchedItems.map((item) => (
                        <tr key={`${item.product}-confirmed`} className="hover:bg-green-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.productName} ({item.productSku})
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {item.unit || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-600">{item.receivedQuantity || '-'}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-600">₹{item.unitPrice.toFixed(2)}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-800">₹{item.totalPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Partial Products Section - Items that are confirmed but have quantity mismatch */}
            {hasPartialItems && (
              <div>
                <h4 className="text-lg font-semibold text-gray-700 mb-3 pb-2 border-b border-blue-200">📋 Partial Products</h4>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product (SKU)</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Unit</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Received Quantity</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Unit Price</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {partialItems.map((item) => (
                        <tr key={`${item.product}-partial`} className="hover:bg-blue-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.productName} ({item.productSku})
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {item.unit || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-600">{item.receivedQuantity || '-'}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-600">₹{item.unitPrice.toFixed(2)}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-800">₹{item.totalPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pending Products Section - Items that are not yet confirmed */}
            {hasPendingItems && (
              <div>
                <h4 className="text-lg font-semibold text-gray-700 mb-3 pb-2 border-b border-yellow-200">⏳ Pending Products</h4>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-yellow-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-12">Confirm</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product (SKU)</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Unit</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Received Quantity</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Unit Price</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingItems.map((item) => (
                        <tr key={`${item.product}-pending`} className="hover:bg-yellow-50">
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(item.product)}
                              onChange={() => handleSelectItem(item.product)}
                              className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                              disabled={selectedInvoice.status === 'Confirmed'} // Disable if already confirmed
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.productName} ({item.productSku})
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {item.unit || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                            <input
                              type="text"
                              min="0"
                              value={receivedQuantities[item.product] || ''}
                              onChange={(e) => handleReceivedQuantityChange(item.product, e.target.value)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                              placeholder="0"
                              disabled={selectedInvoice.status === 'Confirmed'} // Disable if already confirmed
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-600">₹{item.unitPrice.toFixed(2)}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-800">₹{item.totalPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Action Button for Partial Invoices */}
                <div className="mt-6">
                  {error && <p className="mb-4 text-center text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}
                  {message && <p className="mb-4 text-center text-green-600 bg-green-100 p-3 rounded-lg">{message}</p>}
                  <button
                    onClick={handleSubmitConfirmation}
                    disabled={isSubmitting || selectedItems.size === 0}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline flex items-center justify-center transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <LuSend className="mr-2" />
                    {isSubmitting ? 'Submitting...' : `Confirm & Add ${selectedItems.size} Item(s) to Inventory`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Product List for Pending Invoices */}
        {selectedInvoice.status === 'Pending' && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-lg font-semibold text-gray-700">Invoice Items</h4>
              <button
                onClick={handleToggleAll}
                className="text-sm text-primary hover:text-primary-dark font-medium"
              >
                {selectedItems.size === selectedInvoice.items.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-12">Confirm</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product (SKU)</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Unit</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Received Quantity</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Unit Price</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total Price</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedInvoice.items.map((item) => (
                    <tr key={item.product} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.product)}
                          onChange={() => handleSelectItem(item.product)}
                          className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.productName} ({item.productSku})
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.unit || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-600">{item.quantity}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                        <input
                          type="text"
                          min="0"
                          value={receivedQuantities[item.product] || ''}
                          onChange={(e) => handleReceivedQuantityChange(item.product, e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-600">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-800">₹{item.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Grand Total Display */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Total Invoice Amount:</span>
            <span className="font-semibold text-gray-800">₹{selectedInvoice.grandTotal.toFixed(2)}</span>
          </div>
          {(selectedInvoice.status === 'Pending' || selectedInvoice.status === 'Partial') && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Selected Items Total:</span>
              <span className="text-xl font-bold text-primary">
                ₹{selectedInvoice.items
                  .filter(item => selectedItems.has(item.product))
                  .reduce((sum, item) => sum + item.totalPrice, 0)
                  .toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Action Button - Only show for pending invoices */}
        {selectedInvoice.status === 'Pending' && (
          <div className="mt-8">
            {error && <p className="mb-4 text-center text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}
            {message && <p className="mb-4 text-center text-green-600 bg-green-100 p-3 rounded-lg">{message}</p>}
            <button
              onClick={handleSubmitConfirmation}
              disabled={isSubmitting || selectedItems.size === 0}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline flex items-center justify-center transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <LuSend className="mr-2" />
              {isSubmitting ? 'Submitting...' : `Confirm & Add ${selectedItems.size} Item(s) to Inventory`}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Main invoice list view
  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Invoice History</h3>
          <p className="text-sm text-gray-500">
            View all invoices sent by admin with date and time.
          </p>
        </div>
        <LuFileCheck className="text-3xl text-primary" />
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg">
          <p>{error}</p>
        </div>
      )}

      {message && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg">
          <p>{message}</p>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="text-center py-12">
          <LuInbox className="mx-auto text-5xl text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Invoices Found</h3>
          <p className="text-gray-500">
            There are no invoices from admin yet. When admin sends invoices, they will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From Admin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => {
                const { date, time } = formatDateTime(invoice.issueDate);
                return (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div>
                        <div className="font-medium">{date}</div>
                        <div className="text-xs text-gray-500">{time}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {invoice.admin?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                      ₹{invoice.grandTotal.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                      {/* Improved View Button UI */}
                      <button
                        onClick={() => handleViewInvoice(invoice)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-200 transition-colors"
                      >
                        <LuEye className="mr-1 h-4 w-4" />
                        {invoice.status === 'Partial' ? 'View Partial' : 'View'}
                      </button>
                      <button
                        onClick={() => {
                          // Add validation before generating PDF
                          if (!invoice) {
                            console.error('No invoice data provided');
                            return;
                          }
                          generateInvoicePdf(invoice);
                        }}
                        className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-md hover:bg-green-200 transition-colors"
                      >
                        <LuDownload className="mr-1 h-4 w-4" />
                        PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ViewInvoice;