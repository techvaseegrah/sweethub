import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../../api/axios';
import { LuFileCheck, LuInbox, LuEye, LuClock, LuCheck, LuX, LuDownload } from 'react-icons/lu';
import { generateInvoicePdf } from '../../../utils/generateInvoicePdf';

function InvoiceHistory({ closeModal }) {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);

  // Fetches all invoices from the backend
  const fetchAllInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/admin/invoices');
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
  };

  // Back to invoice list
  const handleBackToList = () => {
    setShowDetail(false);
    setSelectedInvoice(null);
    setError('');
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
    } else if (status === 'Confirmed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <LuCheck className="mr-1 h-3 w-3" />
          Confirmed
        </span>
      );
    } else if (status === 'Partial') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <LuFileCheck className="mr-1 h-3 w-3" />
          Partial
        </span>
      );
    }
    return <span className="text-gray-500">{status}</span>;
  };

  // Show invoice detail view
  if (showDetail && selectedInvoice) {
    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-60 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-6xl bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh]">
          <header className="flex justify-between items-center p-4 border-b">
            <h3 className="text-xl font-semibold text-gray-800">Invoice Details</h3>
            <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-200">
              <LuX size={20} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Back button */}
            <button 
              onClick={handleBackToList}
              className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
            >
              ← Back to Invoice List
            </button>

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
                <p className="text-sm font-medium text-gray-500">Sent To Shop</p>
                <p className="font-semibold text-gray-800">{selectedInvoice.shop.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                {getStatusBadge(selectedInvoice.status)}
              </div>
            </div>

            {/* Product List */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-700 mb-3">Invoice Items</h4>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product (SKU)</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Unit</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Unit Price</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total Price</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedInvoice.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.productName} ({item.productSku})
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.unit || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-600">₹{item.unitPrice.toFixed(2)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-800">₹{item.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Grand Total Display */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold text-gray-800">₹{selectedInvoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Tax:</span>
                <span className="font-semibold text-gray-800">₹{selectedInvoice.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-lg font-bold text-gray-800">Grand Total:</span>
                <span className="text-lg font-bold text-gray-800">₹{selectedInvoice.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main modal view - invoice list
  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-7xl bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh]">
        <header className="flex justify-between items-center p-4 border-b">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Invoice History</h3>
            <p className="text-sm text-gray-500">View all invoices sent to shops with date and time.</p>
          </div>
          <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-200">
            <LuX size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg">
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">Loading invoices...</div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <LuInbox className="mx-auto text-5xl text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Invoices Found</h3>
              <p className="text-gray-500">
                You haven't created any invoices yet. Create your first invoice to see it here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent To Shop</th>
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
                          {invoice.shop.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                          ₹{invoice.grandTotal.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleViewInvoice(invoice)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-200 transition-colors"
                          >
                            <LuEye className="mr-1 h-4 w-4" />
                            View
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
      </div>
    </div>
  );
}

export default InvoiceHistory;