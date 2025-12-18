import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { generateBillPdf } from '../../../utils/generateBillPdf';
import BillDetailView from './BillDetailView';

const BILLS_URL = '/shop/billing';

function ShopViewBills() {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [selectedBill, setSelectedBill] = useState(null);
  const [isBillDetailModalOpen, setIsBillDetailModalOpen] = useState(false);

  const fetchBills = async () => {
    try {
      const response = await axios.get(BILLS_URL, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      const sorted = [...response.data].sort((a, b) => {
        const aTime = a.billDate
          ? new Date(a.billDate).getTime()
          : parseInt(a._id.slice(0, 8), 16) * 1000;
        const bTime = b.billDate
          ? new Date(b.billDate).getTime()
          : parseInt(b._id.slice(0, 8), 16) * 1000;
        return bTime - aTime;
      });
      setBills(sorted);
    } catch (err) {
      setError('Failed to fetch bills.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  // Filter bills on the frontend
  useEffect(() => {
    let tempBills = [...bills];

    // Filter by search term (customer name or mobile number)
    if (searchTerm) {
      tempBills = tempBills.filter(bill =>
        bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.customerMobileNumber.includes(searchTerm)
      );
    }

    // Filter by payment method
    if (paymentMethodFilter !== 'All') {
      tempBills = tempBills.filter(bill => bill.paymentMethod === paymentMethodFilter);
    }

    // Filter by date range
    if (fromDate) {
      const from = new Date(fromDate).getTime();
      tempBills = tempBills.filter(bill => new Date(bill.billDate).getTime() >= from);
    }
    if (toDate) {
      const to = new Date(toDate).getTime();
      tempBills = tempBills.filter(bill => new Date(bill.billDate).getTime() <= to + 86400000); // Add 1 day to include the toDate
    }

    setFilteredBills(tempBills);
  }, [bills, searchTerm, paymentMethodFilter, fromDate, toDate]);

  const generateInvoice = (bill) => {
    // For shop bills, use the shop data from the bill itself
    generateBillPdf(bill, bill.shop);
  };
  
  const viewBillDetails = (bill) => {
    setSelectedBill(bill);
    setIsBillDetailModalOpen(true);
  };

  if (loading) {
    return <div className="p-6 text-center">Loading bills...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800">View Bills</h3>
      
      {/* Filter and Search Section */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label className="block text-gray-700 text-sm font-bold mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by name or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="flex-1">
            <label className="block text-gray-700 text-sm font-bold mb-2">Payment Method</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="All">All</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-gray-700 text-sm font-bold mb-2">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div className="flex-1">
            <label className="block text-gray-700 text-sm font-bold mb-2">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {filteredBills.length === 0 ? (
        <p>No bills found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <td className="px-2 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill ID</td>
                <td className="px-2 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</td>
                <td className="px-2 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items Purchased</td>
                <td className="px-2 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</td>
                <td className="hidden md:table-cell px-2 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Date</td>
                <td className="px-2 sm:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</td>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBills.map((bill) => (
                <tr key={bill._id}>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {bill.billId || bill._id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div className="font-medium text-gray-900">{bill.customerName}</div>
                      <div className="text-gray-500">{bill.customerMobileNumber}</div>
                    </div>
                  </td>
                  <td className="px-2 sm:px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs">
                      {bill.items.slice(0, 2).map((item, index) => (
                        <div key={index} className="text-xs">
                          {item.productName} x{item.quantity}
                        </div>
                      ))}
                      {bill.items.length > 2 && (
                        <div className="text-xs text-gray-400">
                          +{bill.items.length - 2} more items
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div className="font-medium text-gray-900">₹{bill.totalAmount?.toFixed(2) || '0.00'}</div>
                      <div className="text-xs text-gray-500">{bill.paymentMethod}</div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bill.billDate ? new Date(bill.billDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => viewBillDetails(bill)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-md transition-colors duration-200"
                    >
                      View
                    </button>
                    <button
                      onClick={() => generateInvoice(bill)}
                      className="text-indigo-600 hover:text-indigo-900 bg-indigo-100 hover:bg-indigo-200 px-3 py-1 rounded-md transition-colors duration-200"
                    >
                      Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Bill Detail Modal */}
      {isBillDetailModalOpen && selectedBill && (
        <BillDetailView 
          bill={selectedBill} 
          onClose={() => setIsBillDetailModalOpen(false)} 
        />
      )}
    </div>
  );
}

export default ShopViewBills;