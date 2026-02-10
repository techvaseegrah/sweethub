import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LuX, LuPackage, LuCalendar, LuDollarSign, LuCheck } from 'react-icons/lu';
import axios from '../../api/axios';
import InvoiceTemplate from './invoice/InvoiceTemplate';

function ViewOrderDetails({ order, onClose, onInvoiceCreated, adminProducts = [] }) {
  const [availabilityInfo, setAvailabilityInfo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualQuantities, setManualQuantities] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(order);
  const [invoiceData, setInvoiceData] = useState(null);

  // Helper function to format date and time
  const formatDateWithTime = (dateString) => {
    const date = new Date(dateString);

    // Format date as dd/mm/yyyy
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    // Format time as hh:mm am/pm
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12 for 12 AM/PM

    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes} ${ampm}`
    };
  };

  // Function to check product availability and prepare invoice items
  const checkAvailability = useCallback(async () => {
    if (!currentOrder) return;

    setLoading(true);
    setError('');

    try {
      // Call the new backend endpoint to check availability across all stages
      const response = await axios.get(`/admin/orders/${currentOrder._id}/availability`);

      if (response.data && response.data.items) {
        // Map the backend response to our availability info format
        const availabilityResults = response.data.items.map(item => {
          // Determine availability badge color based on location
          let badgeColor = 'bg-red-100 text-red-800'; // Not Available

          if (item.availableIn === 'View Products') {
            badgeColor = 'bg-green-100 text-green-800';
          } else if (item.availableIn === 'After Packing') {
            badgeColor = 'bg-blue-100 text-blue-800';
          } else if (item.availableIn === 'Before Packing') {
            badgeColor = 'bg-yellow-100 text-yellow-800';
          } else if (item.availableIn === 'Production Schedules') {
            badgeColor = 'bg-purple-100 text-purple-800';
          }

          return {
            productName: item.productName,
            requestedQuantity: item.requestedQuantity,
            unit: item.unit,
            unitPrice: item.details?.unitPrice || 0,
            availabilityStatus: item.availableIn,
            availableQuantity: item.availableQuantity,
            isAvailable: item.isAvailable,
            sufficientStock: item.sufficientStock,
            badgeColor: badgeColor,
            details: item.details,
            // For invoice creation - only include if available in View Products
            adminProduct: item.availableIn === 'View Products' ? {
              _id: item.details?.productId,
              sku: item.details?.sku,
              name: item.productName,
              prices: [{
                unit: item.unit,
                sellingPrice: item.details?.unitPrice || 0
              }]
            } : null,
            orderItem: currentOrder.items.find(oi => oi.productName === item.productName)
          };
        });

        setAvailabilityInfo(availabilityResults);

        // Initialize manual quantities with requested quantities
        const initialQuantities = {};
        availabilityResults.forEach((info, index) => {
          initialQuantities[index] = info.requestedQuantity;
        });
        setManualQuantities(initialQuantities);
      }
    } catch (err) {
      setError('Failed to check product availability');
      console.error('Error checking availability:', err);

      // Fallback to original behavior if there's an error
      const fallbackResults = currentOrder.items.map(item => ({
        productName: item.productName || 'Unknown Product',
        requestedQuantity: item.quantity,
        unit: item.unit,
        unitPrice: 0,
        availabilityStatus: 'Available', // Default to available on error
        availableQuantity: 0,
        isAvailable: true,
        sufficientStock: false,
        badgeColor: 'bg-gray-100 text-gray-800',
        details: null,
        adminProduct: null,
        orderItem: item
      }));

      setAvailabilityInfo(fallbackResults);

      // Initialize manual quantities for fallback results
      const fallbackQuantities = {};
      fallbackResults.forEach((info, index) => {
        fallbackQuantities[index] = info.requestedQuantity;
      });
      setManualQuantities(fallbackQuantities);
    } finally {
      setLoading(false);
    }
  }, [currentOrder]);

  // Sync currentOrder with order prop
  useEffect(() => {
    if (order) {
      setCurrentOrder(order);
    }
  }, [order]);

  // Check availability or fetch invoice data when order changes
  useEffect(() => {
    const loadOrderData = async () => {
      if (!currentOrder) return;

      if (currentOrder.status === 'Invoiced' && currentOrder.invoiceId) {
        setLoading(true);
        try {
          // Handle both populated object and string ID
          const invoiceId = typeof currentOrder.invoiceId === 'object'
            ? (currentOrder.invoiceId._id || currentOrder.invoiceId.id)
            : currentOrder.invoiceId;

          if (!invoiceId) {
            console.error('Invoice ID not found in order:', currentOrder);
            checkAvailability();
            return;
          }

          // Fetch historical invoice data
          const response = await axios.get(`/admin/invoices/${invoiceId}`);
          const invoice = response.data;
          setInvoiceData(invoice);

          // Map items more robustly. For invoiced orders, we show the sent matches.
          // We align them with the original order items if possible.
          const orderItems = currentOrder.items || [];
          const invoiceResults = orderItems.map(orderItem => {
            // Find corresponding item in invoice by product ID or SKU
            const invoicedItem = invoice.items.find(invItem =>
              (invItem.product?._id || invItem.product) === (orderItem.product?._id || orderItem.product) ||
              invItem.productSku === orderItem.sku ||
              invItem.productName === orderItem.productName
            );

            if (invoicedItem) {
              return {
                productName: invoicedItem.productName,
                requestedQuantity: invoicedItem.quantity, // In invoice, quantity is what was sent
                unit: invoicedItem.unit,
                unitPrice: invoicedItem.unitPrice,
                availabilityStatus: 'Invoiced',
                availableQuantity: invoicedItem.quantity,
                isAvailable: true,
                sufficientStock: true,
                badgeColor: 'bg-green-100 text-green-800',
                details: null,
                adminProduct: null,
                orderItem: orderItem
              };
            }

            // If an order item wasn't in the invoice (wasn't sent)
            return {
              productName: orderItem.productName,
              requestedQuantity: 0,
              unit: orderItem.unit,
              unitPrice: orderItem.sellingPrice || 0,
              availabilityStatus: 'Not Sent',
              availableQuantity: 0,
              isAvailable: false,
              sufficientStock: false,
              badgeColor: 'bg-gray-100 text-gray-800',
              details: null,
              adminProduct: null,
              orderItem: orderItem
            };
          });

          setAvailabilityInfo(invoiceResults);

          // Initialize manual quantities with invoice quantities
          const initialQuantities = {};
          invoiceResults.forEach((info, index) => {
            initialQuantities[index] = info.requestedQuantity;
          });
          setManualQuantities(initialQuantities);
        } catch (err) {
          console.error('Error fetching invoice data:', err);
          setError('Failed to load invoice details');
          // Fallback to availability check
          checkAvailability();
        } finally {
          setLoading(false);
        }
      } else {
        setInvoiceData(null);
        checkAvailability();
      }
    };

    loadOrderData();
  }, [currentOrder, checkAvailability]);

  // Calculate recalculated totals based on manual quantities and admin prices
  const recalculatedTotals = useMemo(() => {
    // Use invoice data totals if available
    if (invoiceData) {
      return {
        subtotal: invoiceData.subtotal,
        taxAmount: invoiceData.tax,
        grandTotal: invoiceData.grandTotal,
        taxRate: invoiceData.subtotal > 0 ? (invoiceData.tax / invoiceData.subtotal) * 100 : 0
      };
    }

    let subtotal = 0;
    availabilityInfo.forEach((info, index) => {
      const quantity = manualQuantities[index] || 0;
      const unitPrice = info.unitPrice || 0;
      subtotal += quantity * unitPrice;
    });

    // Derive tax rate from original order to maintain consistency
    const originalSubtotal = order.subtotal || 1; // Avoid division by zero
    const taxRate = (order.tax / originalSubtotal) * 100;
    const taxAmount = (subtotal * taxRate) / 100;
    const grandTotal = subtotal + taxAmount;

    return {
      subtotal,
      taxAmount,
      grandTotal,
      taxRate
    };
  }, [availabilityInfo, manualQuantities, order.subtotal, order.tax, invoiceData]);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Processed':
        return 'bg-blue-100 text-blue-800';
      case 'Invoiced':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!order) {
    return (
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Direct Invoice</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <LuX size={24} />
            </button>
          </div>
          <div className="text-center py-8 text-gray-500">
            No order selected.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto">
      <div className="p-6">
        <div className="flex justify-between items-start mb-6 border-b pb-4">
          <div>
            <h3 className="text-xl font-bold">{invoiceData ? 'Sent Invoice Details' : 'Direct Invoice'}</h3>
            <p className="text-gray-600">Order ID: {order.orderId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <LuX size={24} />
          </button>
        </div>

        {invoiceData ? (
          <div className="border rounded-lg bg-gray-50 overflow-hidden shadow-sm">
            <InvoiceTemplate invoice={invoiceData} />
          </div>
        ) : (
          <>
            {/* Order Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <LuPackage className="text-blue-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Shop</p>
                  <p className="font-medium">{order.shop?.name || 'Unknown Shop'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <LuCalendar className="text-green-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="font-medium">{formatDateWithTime(order.orderDate).date}</p>
                  <p className="text-sm text-gray-500">{formatDateWithTime(order.orderDate).time}</p>
                </div>
              </div>
              <div className="flex items-center">
                <LuDollarSign className="text-purple-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-medium">₹{recalculatedTotals.grandTotal?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(currentOrder.status)}`}>
                  {currentOrder.status}
                </span>
              </div>
            </div>

            {/* Success and Error Messages */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-semibold">{successMessage}</p>
              </div>
            )}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-semibold">{error}</p>
              </div>
            )}

            {/* Availability Information */}
            {availabilityInfo.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-lg font-semibold mb-3 text-blue-800">Product Availability Status</h4>
                <div className="space-y-2">
                  {availabilityInfo.map((info, index) => {
                    const manualQty = manualQuantities[index] || 0;
                    const exceedsStock = info.isAvailable && manualQty > info.availableQuantity;
                    const isInvalid = !manualQty || manualQty <= 0 || exceedsStock;

                    return (
                      <div key={index} className={`p-4 bg-white rounded-lg shadow-sm border-2 ${exceedsStock ? 'border-red-300' : 'border-gray-200'
                        }`}>
                        {/* Ordered Quantity Header */}
                        <div className="mb-3">
                          <div className="flex items-baseline">
                            <span className="text-sm font-semibold text-gray-700 mr-2">Ordered Quantity:</span>
                            <span className="font-medium text-gray-900">{info.productName}</span>
                            <span className="text-sm text-gray-600 ml-2">
                              (Requested: {info.requestedQuantity} {info.unit})
                            </span>
                          </div>
                        </div>

                        {/* Send Quantity and Available Stock Section */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {/* Manual Quantity Input */}
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium text-gray-700">Send Quantity:</label>
                              <input
                                type="text"
                                min="0"
                                step="0.01"
                                value={manualQuantities[index] || ''}
                                onChange={(e) => {
                                  if (currentOrder.status === 'Invoiced') return;
                                  const value = parseFloat(e.target.value) || 0;
                                  setManualQuantities(prev => ({
                                    ...prev,
                                    [index]: value
                                  }));
                                }}
                                disabled={currentOrder.status === 'Invoiced'}
                                className={`w-24 px-2 py-1 border rounded text-sm ${exceedsStock ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                  } ${currentOrder.status === 'Invoiced' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                              />
                              <span className="text-sm text-gray-600">{info.unit}</span>
                            </div>

                            {/* Available Stock Display */}
                            {info.isAvailable && info.availableQuantity > 0 && (
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">Available:</span> {info.availableQuantity} {info.unit}
                                {exceedsStock && (
                                  <span className="text-red-600 font-medium ml-2">
                                    ⚠ Exceeds available stock
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Availability Badge */}
                          <div>
                            <span className={`text-sm font-medium px-3 py-1.5 rounded-full whitespace-nowrap ${info.badgeColor || 'bg-gray-100 text-gray-800'
                              }`}>
                              {info.availabilityStatus === 'Not Available' ? 'Product is Not Available' :
                                (info.availabilityStatus === 'Invoiced' ? 'already Invoiced' :
                                  info.availabilityStatus === 'Not Sent' ? 'Not Sent in Invoice' :
                                    `available in ${info.availabilityStatus}`)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
              {(currentOrder.status === 'Pending' || currentOrder.status === 'Processed') && (
                <button
                  onClick={async () => {
                    // Check for invalid quantities
                    const hasInvalidQuantity = availabilityInfo.some((info, index) => {
                      const manualQty = manualQuantities[index] || 0;
                      const exceedsStock = info.isAvailable && manualQty > info.availableQuantity;
                      return !manualQty || manualQty <= 0 || exceedsStock;
                    });

                    if (hasInvalidQuantity) {
                      setError('Please enter valid quantities for all products. Quantities must be greater than 0 and not exceed available stock.');
                      return;
                    }

                    setIsSubmitting(true);
                    setError('');
                    setSuccessMessage('');

                    try {
                      // Prepare invoice items from available products with manual quantities
                      const availableItems = availabilityInfo
                        .filter(info => info.isAvailable && info.adminProduct)
                        .map((info, index) => ({
                          product: info.adminProduct._id,
                          productName: info.productName,
                          quantity: manualQuantities[index] || info.requestedQuantity,
                          unitPrice: info.unitPrice,
                          unit: info.unit
                        }));

                      if (availableItems.length === 0) {
                        setError('No available products to create invoice.');
                        setIsSubmitting(false);
                        return;
                      }

                      // Create invoice directly
                      const payload = {
                        shopId: order.shop._id || order.shop,
                        items: availableItems,
                        orderId: order._id
                      };

                      await axios.post('/admin/invoices', payload, { withCredentials: true });

                      // Update the current order state to reflect the new status
                      setCurrentOrder(prev => ({
                        ...prev,
                        status: 'Invoiced'
                      }));

                      setSuccessMessage(`Invoice created and sent successfully to ${order.shop?.name || 'the shop'}!`);
                      setIsSubmitting(false);

                      // Close modal after 2 seconds
                      setTimeout(() => {
                        onClose();
                        // Optionally refresh the parent component
                        if (onInvoiceCreated) {
                          onInvoiceCreated(null); // Signal that invoice was created
                        }
                      }, 2000);

                    } catch (err) {
                      setError(err.response?.data?.message || 'Failed to create invoice. Please try again.');
                      setIsSubmitting(false);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || availabilityInfo.every(info => !info.isAvailable)}
                >
                  <LuCheck className="mr-2" />
                  {isSubmitting ? 'Creating Invoice...' : 'Create Direct Invoice'}
                </button>
              )}
            </div>

            {/* Order Items */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-3">Order Items</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Unit</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.items?.map((item, index) => {
                      const availability = availabilityInfo[index];
                      return (
                        <tr key={index} className={!availability?.isAvailable ? 'bg-red-50' : ''}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.productName || 'Unknown Product'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                            {item.unit}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                            <span className="font-medium text-gray-900">{manualQuantities[index] || 0}</span>
                            <p className="text-xs text-gray-500">Requested: {item.quantity}</p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                            ₹{availability?.unitPrice?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            ₹{(availability?.unitPrice * (manualQuantities[index] || 0))?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${availability?.badgeColor || 'bg-gray-100 text-gray-800'
                              }`}>
                              {availability?.availabilityStatus === 'Not Available' ? 'Product is Not Available' :
                                (availability?.availabilityStatus === 'Invoiced' ? 'already Invoiced' : `available in ${availability?.availabilityStatus || 'Unknown'}`)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-end">
                <div className="w-56">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{recalculatedTotals.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between py-1 items-center">
                    <span className="text-gray-600">Tax ({recalculatedTotals.taxRate.toFixed(1)}%):</span>
                    <span className="font-medium">₹{recalculatedTotals.taxAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-gray-300 mt-1">
                    <span className="font-semibold">Grand Total:</span>
                    <span className="font-bold text-lg text-blue-800">₹{recalculatedTotals.grandTotal?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ViewOrderDetails;