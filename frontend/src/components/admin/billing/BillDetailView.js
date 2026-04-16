import React, { useState } from 'react';
import { formatDateToDDMMYYYY, formatDateTime } from '../../../utils/unitConversion';
import axios from '../../../api/axios';
import { generateBillPdf, generateTaxInvoicePdf, printBill } from '../../../utils/generateBillPdf';

const BillDetailView = ({ bill, onClose, onUpdate, initialEditMode = false }) => {
  const [isEditingPayment, setIsEditingPayment] = useState(initialEditMode);
  const [paymentMethod, setPaymentMethod] = useState(bill?.paymentMethod || 'Cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!bill) return null;

  const handleUpdatePaymentMethod = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.patch(`/admin/bills/${bill._id}/payment-method`, {
        paymentMethod
      }, { withCredentials: true });

      setIsEditingPayment(false);
      if (onUpdate) {
        onUpdate(); // Trigger refresh in parent
      } else {
        // Fallback: alert user or reload
        window.location.reload();
      }
    } catch (err) {
      console.error('Error updating payment method:', err);
      setError(err.response?.data?.message || 'Failed to update payment method');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const shopData = bill.shop || { name: 'Admin Shop', address: 'Main Admin Location', phone: '7339200636' };
    if (bill.isTaxInvoice) {
      generateTaxInvoicePdf(bill, shopData, false);
    } else {
      generateBillPdf(bill, shopData);
    }
  };

  const handlePrint = () => {
    const shopData = bill.shop || { name: 'Admin Shop', address: 'Main Admin Location', phone: '7339200636' };
    if (bill.isTaxInvoice) {
      generateTaxInvoicePdf(bill, shopData, true);
    } else {
      printBill(bill, shopData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Bill Details</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="bg-green-100 text-green-600 hover:bg-green-200 p-2 rounded-md transition-colors duration-200 flex items-center gap-1 text-sm font-medium"
                title="Download PDF"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
              <button
                onClick={handlePrint}
                className="bg-purple-100 text-purple-600 hover:bg-purple-200 p-2 rounded-md transition-colors duration-200 flex items-center gap-1 text-sm font-medium"
                title="Print"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold ml-2"
              >
                &times;
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* FROM and TO Information */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">FROM & TO Information (Optional)</h3>
            <p className="text-sm text-gray-500">The following information is optional and may not be present on all bills.</p>
          </div>
          {(bill.fromInfo || bill.toInfo) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* FROM Information */}
              {bill.fromInfo && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">FROM (Sweet Production Factory)</h3>
                  <p className="text-gray-600 font-medium">{bill.fromInfo.name || ''}</p>
                  <p className="text-gray-600">{bill.fromInfo.address || ''}</p>
                  {bill.fromInfo.gstin && <p className="text-gray-600">GSTIN: {bill.fromInfo.gstin}</p>}
                  {bill.fromInfo.state && <p className="text-gray-600">State: {bill.fromInfo.state}</p>}
                  {bill.fromInfo.stateCode && <p className="text-gray-600">State Code: {bill.fromInfo.stateCode}</p>}
                  {bill.fromInfo.phone && <p className="text-gray-600">Phone: {bill.fromInfo.phone}</p>}
                  {bill.fromInfo.email && <p className="text-gray-600">Email: {bill.fromInfo.email}</p>}
                </div>
              )}

              {/* TO Information */}
              {bill.toInfo && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">TO (Receiving Branch / Shop)</h3>
                  <p className="text-gray-600 font-medium">{bill.toInfo.name || ''}</p>
                  <p className="text-gray-600">{bill.toInfo.address || ''}</p>
                  {bill.toInfo.gstin && <p className="text-gray-600">GSTIN: {bill.toInfo.gstin}</p>}
                  {bill.toInfo.state && <p className="text-gray-600">State: {bill.toInfo.state}</p>}
                  {bill.toInfo.stateCode && <p className="text-gray-600">State Code: {bill.toInfo.stateCode}</p>}
                  {bill.toInfo.phone && <p className="text-gray-600">Phone: {bill.toInfo.phone}</p>}
                </div>
              )}
            </div>
          )}

          {/* Bill Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Bill Information</h3>
              <p className="text-gray-600"><span className="font-medium">Bill ID:</span> {bill.billId || bill._id}</p>
              <p className="text-gray-600">
                <span className="font-medium">Date & Time:</span>{" "}
                {bill.billDate ? (
                  <>
                    {(() => {
                      const dt = formatDateTime(bill.billDate);
                      return `${dt.date} ${dt.time}`;
                    })()}
                  </>
                ) : bill.createdAt ? (
                  <>
                    {(() => {
                      const dt = formatDateTime(bill.createdAt);
                      return `${dt.date} ${dt.time}`;
                    })()}
                  </>
                ) : (
                  "N/A"
                )}
              </p>

              <div className="flex items-center space-x-2 mt-1">
                <span className="text-gray-600 font-medium">Payment Method:</span>
                {isEditingPayment ? (
                  <div className="flex items-center space-x-2">
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                    </select>
                    <button
                      onClick={handleUpdatePaymentMethod}
                      disabled={loading}
                      className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                    >
                      {loading ? '...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setIsEditingPayment(false)}
                      disabled={loading}
                      className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">{paymentMethod}</span>
                  </div>
                )}
              </div>

              {bill.worker && (
                <p className="text-gray-600 mt-1"><span className="font-medium">Worker:</span> {bill.worker.name}</p>
              )}
              {bill.isDeleted && (
                <div className="mt-2 p-3 bg-red-100 rounded-lg">
                  <p className="text-red-800 font-semibold">Status: Deleted</p>
                  <p className="text-red-700 text-sm mt-1"><span className="font-medium">Reason:</span> {bill.deletionReason}</p>
                  <p className="text-red-700 text-sm mt-1">
                    <span className="font-medium">Deleted by:</span> {bill.deletedBy?.name || bill.deletedBy || 'Unknown'}
                  </p>
                  <p className="text-red-700 text-sm mt-1">
                    <span className="font-medium">Deleted at:</span> {bill.deletedAt ? new Date(bill.deletedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Customer Information</h3>
              <p className="text-gray-600"><span className="font-medium">Name:</span> {bill.customerName}</p>
              <p className="text-gray-600"><span className="font-medium">Mobile:</span> {bill.customerMobileNumber}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Purchased Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bill.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 break-words align-top">
                        {item.productName || (item.product ? item.product.name : '[Deleted Product]')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.unit || (item.product ? item.product.unit : 'N/A')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{(item.price % 1 === 0 ? Math.floor(item.price) : item.price?.toFixed(2)) || (item.unitPrice % 1 === 0 ? Math.floor(item.unitPrice) : item.unitPrice?.toFixed(2)) || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{item.totalPrice?.toFixed(2) || ((item.price || item.unitPrice || 0) * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Summary with GST */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-end">
              <div className="w-full max-w-xs">
                {bill.gstPercentage > 0 ? (
                  <>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Base Amount:</span>
                      <span className="font-medium">₹{bill.baseAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">GST ({bill.gstPercentage}%):</span>
                      <span className="font-medium">₹{bill.gstAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-t border-gray-300 mt-2">
                      <span className="text-lg font-bold text-gray-800">Total Amount:</span>
                      <span className="text-lg font-bold text-gray-800">₹{bill.totalAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">₹{bill.totalAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                )}
                {bill.amountPaid > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium">₹{bill.amountPaid?.toFixed(2) || '0.00'}</span>
                  </div>
                )}
                {bill.balance > 0 && (
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Balance:</span>
                    <span className="font-medium">₹{bill.balance?.toFixed(2) || '0.00'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillDetailView;
