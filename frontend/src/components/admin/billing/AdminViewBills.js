import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { generateBillPdf } from '../../../utils/generateBillPdf';
import BillDetailView from './BillDetailView';
import { useNavigate } from 'react-router-dom';

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
  const [selectedShop, setSelectedShop] = useState('all'); 
  
  const [selectedBill, setSelectedBill] = useState(null);
  const [isBillDetailModalOpen, setIsBillDetailModalOpen] = useState(false);
  
  // State for edit/delete functionality
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);
  const [deletionReason, setDeletionReason] = useState('');
  const [customDeletionReason, setCustomDeletionReason] = useState('');
  const [deletionLoading, setDeletionLoading] = useState(false);
  
  const navigate = useNavigate();

  const fetchBills = async () => {
    try {
      let params = {};
      if (selectedShop === 'admin') {
        params = { shopId: 'admin' };
      } else if (selectedShop && selectedShop !== 'all') {
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
  
  const handleEditBill = (bill) => {
    // Navigate to create bill page in edit mode with bill data
    navigate('/admin/bills/create', { state: { billData: bill, isEditMode: true } });
  };
  
  const handleDeleteClick = (bill) => {
    setBillToDelete(bill);
    setDeletionReason('');
    setIsDeleteModalOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    let finalReason = deletionReason;
    if (deletionReason === 'Other' && customDeletionReason.trim()) {
      finalReason = customDeletionReason;
    }
    
    if (!finalReason.trim()) {
      alert('Please enter a reason for deletion');
      return;
    }
    
    setDeletionLoading(true);
    try {
      await axios({
        method: 'delete',
        url: `${BILLS_URL}/${billToDelete._id}`,
        data: { reason: finalReason },
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });
      
      // Update the local bills state to mark the bill as deleted instead of refetching
      setBills(prevBills => 
        prevBills.map(bill => 
          bill._id === billToDelete._id 
            ? { ...bill, isDeleted: true, deletionReason: finalReason, deletedBy: { name: 'Current User' }, deletedAt: new Date().toISOString() } 
            : bill
        )
      );
      
      setIsDeleteModalOpen(false);
      setBillToDelete(null);
      setDeletionReason('');
      setCustomDeletionReason('');
    } catch (error) {
      console.error('Error deleting bill:', error);
      alert('Failed to delete bill: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeletionLoading(false);
    }
  };
  
  const handleDownloadPDF = (bill) => {
    // Find the shop data for this bill
    const shop = selectedShop === 'admin' 
      ? { name: 'Admin Shop', address: 'Main Admin Location', phone: '7339200636' }
      : shops.find(s => s._id === selectedShop) || bill.shop;
      
    generateBillPdf(bill, shop);
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
            <option value="all">All Bills</option>
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
        <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
               <td className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill ID</td>
               <td className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</td>
                <td className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</td>
                <td className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</td>
                <td className="hidden md:table-cell px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</td>
                <td className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</td>
                <td className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</td>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBills.map((bill) => ( // Use filteredBills here
                <tr key={bill._id} className={bill.isDeleted ? 'bg-red-50' : ''}>
                 <td className="px-2 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {bill.isDeleted && <span className="text-red-600 mr-1">[DELETED]</span>}
                  {bill.billId || bill._id.slice(-8)}
                 </td>
                 <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-500">
                    <div>{bill.customerName}</div>
                    <div>{bill.customerMobileNumber}</div>
                  </td>
                 <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-500">
                    {bill.items.map(item => (
                    <div key={item._id}>
                      {item.productName || (item.product ? item.product.name : '[Deleted Product]')} ({item.quantity} {item.unit || (item.product ? item.product.unit : 'unit')})
                    </div>
                    ))}
                  </td>
                 <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-500">
                      <div>₹{bill.totalAmount.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">({bill.paymentMethod})</div>
                  </td>
                 <td className="hidden md:table-cell px-2 py-3 whitespace-nowrap text-sm text-gray-500">{new Date(bill.billDate).toLocaleDateString()}</td>
                 <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-500">
                   {bill.isDeleted ? (
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                       Deleted
                     </span>
                   ) : (
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                       Active
                     </span>
                   )}
                 </td>
                 <td className="px-2 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => viewBillDetails(bill)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 p-2 rounded-md transition-colors duration-200"
                      title="View"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    {!bill.isDeleted && (
                      <>
                        <button
                          onClick={() => handleEditBill(bill)}
                          className="text-yellow-600 hover:text-yellow-900 bg-yellow-100 hover:bg-yellow-200 p-2 rounded-md transition-colors duration-200"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(bill)}
                          className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 p-2 rounded-md transition-colors duration-200"
                          title="Download PDF"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      </>
                    )}
                    {!bill.isDeleted && (
                      <button
                        onClick={() => handleDeleteClick(bill)}
                        className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 p-2 rounded-md transition-colors duration-200"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
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
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Bill Deletion</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete this bill? This action cannot be undone.</p>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Reason for Deletion *</label>
              <select
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a reason</option>
                <option value="Wrong item billed">Wrong item billed</option>
                <option value="Wrong quantity / price">Wrong quantity / price</option>
                <option value="Customer cancellation">Customer cancellation</option>
                <option value="Duplicate bill">Duplicate bill</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            {deletionReason === 'Other' && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Please specify reason</label>
                <input
                  type="text"
                  value={customDeletionReason}
                  onChange={(e) => setCustomDeletionReason(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter the reason for deletion"
                />
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200"
                disabled={deletionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                disabled={deletionLoading || !deletionReason.trim()}
              >
                {deletionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminViewBills;