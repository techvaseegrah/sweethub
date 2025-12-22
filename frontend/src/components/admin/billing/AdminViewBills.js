import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { generateBillPdf } from '../../../utils/generateBillPdf';
import BillDetailView from './BillDetailView';

const BILLS_URL = '/admin/bills';
const SHOPS_URL = '/admin/shops';

function AdminViewBills({ baseUrl = '/admin' }) {
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('admin'); 
  
  const [selectedBill, setSelectedBill] = useState(null);
  const [isBillDetailModalOpen, setIsBillDetailModalOpen] = useState(false);

  const fetchBills = async () => {
    try {
      let params = {};
      if (selectedShop === 'admin') {
        params = { showAdmin: true };
      } else if (selectedShop) {
        params = { shopId: selectedShop };
      }
      
      const response = await axios.get(`${baseUrl}/bills`, {
        params,
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

  const fetchShops = async () => {
    try {
        const response = await axios.get(SHOPS_URL, { withCredentials: true });
        setShops(response.data);
    } catch (err) {
        console.error('Failed to fetch shops:', err);
    }
  };

  useEffect(() => {
    if (baseUrl === '/admin') {
      fetchShops();
    }
    fetchBills();
  }, [baseUrl, selectedShop]);

  // New useEffect hook to handle filtering on the frontend
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
    // Find the shop data for this bill
    const shop = selectedShop === 'admin' 
      ? { name: 'Admin Shop', address: 'Main Admin Location', phone: '7339200636' }
      : shops.find(s => s._id === selectedShop) || bill.shop;
      
    generateBillPdf(bill, shop);
  };
  
  const viewBillDetails = (bill) => {
    setSelectedBill(bill);
    setIsBillDetailModalOpen(true);
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center">
        <div className="relative flex justify-center items-center mb-4">
          <div className="w-16 h-16 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
          <img 
            src="/sweethub-logo.png" 
            alt="Sweet Hub Logo" 
            className="absolute w-10 h-10"
          />
        </div>
        <div className="text-red-500 font-medium">Loading bills...</div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
    <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800">View Bills</h3>

       {/* Add filter dropdown for admin panel */}
       {baseUrl === '/admin' && (
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Filter by Shop</label>
          <select
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {/* Add the new 'Admin Bills Only' option */}
            <option value="admin">Admin Bills Only</option>
            {shops.map((shop) => (
              <option key={shop._id} value={shop._id}>
                {shop.name}
              </option>
            ))}
          </select>
        </div>
      )}
      
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
              {filteredBills.map((bill) => ( // Use filteredBills here
                <tr key={bill._id}>
                 <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{bill.billId || bill._id.slice(-8)}</td>
                 <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{bill.customerName}</div>
                    <div>{bill.customerMobileNumber}</div>
                  </td>
                 <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bill.items.map(item => (
                    <div key={item._id}>
                      {item.productName || (item.product ? item.product.name : '[Deleted Product]')} ({item.quantity} {item.unit || (item.product ? item.product.unit : 'unit')})
                    </div>
                    ))}
                  </td>
                 <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>₹{bill.totalAmount.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">({bill.paymentMethod})</div>
                  </td>
                 <td className="hidden md:table-cell px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(bill.billDate).toLocaleDateString()}</td>
                 <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => viewBillDetails(bill)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-md transition-colors duration-200"
                    >
                      View
                    </button>
                    <button
                      onClick={() => generateInvoice(bill)}
                      className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1 rounded-md transition-colors duration-200"
                    >
                      Generate Invoice
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

export default AdminViewBills;