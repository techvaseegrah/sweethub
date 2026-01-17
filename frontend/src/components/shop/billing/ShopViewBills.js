import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { generateBillPdf } from '../../../utils/generateBillPdf';
import BillDetailView from './BillDetailView';
import { useNavigate } from 'react-router-dom';
import { formatDateToDDMMYYYY, formatDateTime } from '../../../utils/unitConversion';

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
  
  // Time-based filters
  const [timeFilterType, setTimeFilterType] = useState('All'); // 'All', 'Today', 'Yesterday', 'Last7Days', 'ThisWeek', 'ThisMonth', 'PerHour'
  const [selectedHour, setSelectedHour] = useState(''); // For per-hour filter

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

    // Time-based filtering
    const now = new Date();
    
    switch(timeFilterType) {
      case 'Today':
        tempBills = tempBills.filter(bill => {
          const billDate = bill.createdAt ? new Date(bill.createdAt) : new Date(bill.billDate);
          return billDate.toDateString() === now.toDateString();
        });
        break;
      case 'Yesterday':
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        tempBills = tempBills.filter(bill => {
          const billDate = bill.createdAt ? new Date(bill.createdAt) : new Date(bill.billDate);
          return billDate.toDateString() === yesterday.toDateString();
        });
        break;
      case 'Last7Days':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        tempBills = tempBills.filter(bill => {
          const billDate = bill.createdAt ? new Date(bill.createdAt) : new Date(bill.billDate);
          return billDate >= sevenDaysAgo && billDate <= now;
        });
        break;
      case 'ThisWeek':
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        tempBills = tempBills.filter(bill => {
          const billDate = bill.createdAt ? new Date(bill.createdAt) : new Date(bill.billDate);
          return billDate >= startOfWeek;
        });
        break;
      case 'ThisMonth':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        tempBills = tempBills.filter(bill => {
          const billDate = bill.createdAt ? new Date(bill.createdAt) : new Date(bill.billDate);
          return billDate >= startOfMonth;
        });
        break;
      case 'PerHour':
        if (selectedHour) {
          const [hour, minute] = selectedHour.split(':');
          tempBills = tempBills.filter(bill => {
            const billDate = bill.createdAt ? new Date(bill.createdAt) : new Date(bill.billDate);
            return billDate.getHours() === parseInt(hour);
          });
        }
        break;
      default:
        // No time-based filter applied
        break;
    }
    
    // Filter by bill date range
    if (fromDate) {
      const from = new Date(fromDate).setHours(0, 0, 0, 0);
      tempBills = tempBills.filter(bill => {
        const billDate = bill.createdAt ? new Date(bill.createdAt) : new Date(bill.billDate);
        return billDate.getTime() >= from;
      });
    }
    if (toDate) {
      const to = new Date(toDate).setHours(23, 59, 59, 999);
      tempBills = tempBills.filter(bill => {
        const billDate = bill.createdAt ? new Date(bill.createdAt) : new Date(bill.billDate);
        return billDate.getTime() <= to;
      });
    }

    setFilteredBills(tempBills);
  }, [bills, searchTerm, paymentMethodFilter, fromDate, toDate, timeFilterType, selectedHour]);

  const generateInvoice = (bill) => {
    // For shop bills, use the shop data from the bill itself
    generateBillPdf(bill, {
      name: bill.shopName || bill.shop?.name,
      address: bill.shopAddress || bill.shop?.location,
      gstNumber: bill.shopGstNumber || bill.shop?.gstNumber,
      fssaiNumber: bill.shopFssaiNumber || bill.shop?.fssaiNumber,
      phone: bill.shopPhone || bill.shop?.shopPhoneNumber
    });
  };
  
  const viewBillDetails = (bill) => {
    setSelectedBill(bill);
    setIsBillDetailModalOpen(true);
  };
  
  const handleEditBill = (bill) => {
    // Navigate to create bill page in edit mode with bill data
    navigate('/shop/billing/create', { state: { billData: bill, isEditMode: true } });
  };
  
  const handleDeleteClick = (bill) => {
    setBillToDelete(bill);
    setDeletionReason('');
    setCustomDeletionReason('');
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
    // For shop bills, use the shop data from the bill itself
    generateBillPdf(bill, {
      name: bill.shopName || bill.shop?.name,
      address: bill.shopAddress || bill.shop?.location,
      gstNumber: bill.shopGstNumber || bill.shop?.gstNumber,
      fssaiNumber: bill.shopFssaiNumber || bill.shop?.fssaiNumber,
      phone: bill.shopPhone || bill.shop?.shopPhoneNumber
    });
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
          
          <div className="flex-1">
            <label className="block text-gray-700 text-sm font-bold mb-2">Time Filter</label>
            <select
              value={timeFilterType}
              onChange={(e) => setTimeFilterType(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last7Days">Last 7 Days</option>
              <option value="ThisWeek">This Week</option>
              <option value="ThisMonth">This Month</option>
              <option value="PerHour">Per Hour</option>
            </select>
          </div>
          
          {timeFilterType === 'PerHour' && (
            <div className="flex-1">
              <label className="block text-gray-700 text-sm font-bold mb-2">Select Hour</label>
              <input
                type="time"
                value={selectedHour}
                onChange={(e) => setSelectedHour(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          )}
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
                <td className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Worker</td>
                <td className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</td>
                <td className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</td>
                <td className="hidden md:table-cell px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</td>
                <td className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</td>
                <td className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</td>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBills.map((bill) => (
                <tr key={bill._id} className={bill.isDeleted ? 'bg-red-50' : ''}>
                  <td className="px-2 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    {bill.isDeleted && <span className="text-red-600 mr-1">[DELETED]</span>}
                    {bill.billId || bill._id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div className="font-medium text-gray-900">{bill.customerName}</div>
                      <div className="text-gray-500">{bill.customerMobileNumber}</div>
                    </div>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-500">
                    {bill.worker ? bill.worker.name : 'N/A'}
                  </td>
                  <td className="px-2 py-3 text-sm text-gray-500">
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
                  <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div className="font-medium text-gray-900">₹{bill.totalAmount?.toFixed(2) || '0.00'}</div>
                      <div className="text-xs text-gray-500">{bill.paymentMethod}</div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-2 py-3 whitespace-nowrap text-sm text-gray-500">
                    {bill.createdAt ? (
                      <>
                        <div>{formatDateTime(bill.createdAt).date}</div>
                        <div className="text-xs text-gray-500">{formatDateTime(bill.createdAt).time}</div>
                      </>
                    ) : bill.billDate ? (
                      <>
                        <div>{formatDateTime(bill.billDate).date}</div>
                        <div className="text-xs text-gray-500">{formatDateTime(bill.billDate).time}</div>
                      </>
                    ) : (
                      'N/A'
                    )}
                  </td>
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

export default ShopViewBills;

