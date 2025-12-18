import React from 'react';

const BillDetailView = ({ bill, onClose }) => {
  if (!bill) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Bill Details</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              &times;
            </button>
          </div>

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
              <p className="text-gray-600"><span className="font-medium">Date:</span> {new Date(bill.billDate).toLocaleDateString()}</p>
              <p className="text-gray-600"><span className="font-medium">Payment Method:</span> {bill.paymentMethod}</p>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.productName || (item.product ? item.product.name : '[Deleted Product]')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.unit || (item.product ? item.product.unit : 'N/A')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{item.price?.toFixed(2) || item.unitPrice?.toFixed(2) || '0.00'}
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