import React from 'react';
import { LuCheck, LuCircleAlert, LuClock } from 'react-icons/lu';

const PartialInvoiceDetailView = ({ invoice }) => {
  if (!invoice) {
    return <div className="text-center p-8">No invoice data to display.</div>;
  }

  // Separate items based on their confirmation status
  const exactlyMatchedItems = invoice.items.filter(item => 
    item.shopConfirmed && item.receivedQuantity === item.quantity
  );
  
  const partialItems = invoice.items.filter(item => 
    item.shopConfirmed && item.receivedQuantity !== item.quantity
  );
  
  const pendingItems = invoice.items.filter(item => !item.shopConfirmed);
  
  const hasExactlyMatchedItems = exactlyMatchedItems.length > 0;
  const hasPartialItems = partialItems.length > 0;
  const hasPendingItems = pendingItems.length > 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
            Invoice Details - {invoice.invoiceNumber}
          </h3>
          <p className="text-sm text-gray-500">
            Detailed view of received and pending items
          </p>
        </div>
      </div>
      
      {/* Invoice Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-500">Invoice Number</p>
          <p className="font-semibold text-gray-800">{invoice.invoiceNumber}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Issue Date</p>
          <p className="font-semibold text-gray-800">
            {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Shop</p>
          <p className="font-semibold text-gray-800">{invoice.shop?.name || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Status</p>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            invoice.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 
            invoice.status === 'Partial' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {invoice.status}
          </span>
        </div>
      </div>

      {/* Received Products Section - Only items with exact quantity match */}
      {hasExactlyMatchedItems && (
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-700 mb-3 pb-2 border-b border-green-200 flex items-center">
            <LuCheck className="text-green-500 mr-2" />
            ✅ Fully Received Products
          </h4>
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
                {exactlyMatchedItems.map((item, index) => (
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
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-700 mb-3 pb-2 border-b border-blue-200 flex items-center">
            <LuCircleAlert className="text-blue-500 mr-2" />
            📋 Partially Received Products
          </h4>
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
                {partialItems.map((item, index) => (
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
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-700 mb-3 pb-2 border-b border-yellow-200 flex items-center">
            <LuClock className="text-yellow-500 mr-2" />
            ⏳ Not Yet Received Products
          </h4>
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-yellow-50">
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
                {pendingItems.map((item, index) => (
                  <tr key={`${item.product}-pending`} className="hover:bg-yellow-50">
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

      {/* Summary Section */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-100 rounded-lg">
            <p className="text-sm text-gray-600">Fully Received Items</p>
            <p className="text-xl font-bold text-green-800">{exactlyMatchedItems.length}</p>
          </div>
          <div className="text-center p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-gray-600">Partially Received Items</p>
            <p className="text-xl font-bold text-blue-800">{partialItems.length}</p>
          </div>
          <div className="text-center p-3 bg-yellow-100 rounded-lg">
            <p className="text-sm text-gray-600">Not Received Items</p>
            <p className="text-xl font-bold text-yellow-800">{pendingItems.length}</p>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <span className="text-gray-600">Total Invoice Amount:</span>
          <span className="font-semibold text-gray-800">₹{invoice.grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default PartialInvoiceDetailView;