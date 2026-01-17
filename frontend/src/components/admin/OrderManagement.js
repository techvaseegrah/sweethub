import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { LuPackage, LuCalendar, LuDollarSign, LuEye, LuCheckCircle, LuX, LuLoader, LuShoppingCart, LuFileText, LuBox, LuDownload } from 'react-icons/lu';
import InvoiceHistory from './invoice/InvoiceHistory';
import CreateInvoice from './product/CreateInvoice';
import { generateOrderReportPdf } from '../../utils/generateOrderReportPdf';

function AdminOrderManagement() {
  const [activeTab, setActiveTab] = useState('Orders');
  const [orders, setOrders] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] = useState(false);
  const [adminProducts, setAdminProducts] = useState([]);

  // Fetch orders and shops
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersResponse, shopsResponse, productsResponse] = await Promise.all([
          axios.get('/admin/orders'),
          axios.get('/admin/shops'),
          axios.get('/admin/products?showAdmin=true')
        ]);
        
        setOrders(ordersResponse.data);
        setShops(shopsResponse.data);
        setAdminProducts(productsResponse.data);
      } catch (err) {
        if (err.response?.status === 403) {
          setError('Access denied. Please log in again.');
          // Optionally redirect to login
          // window.location.href = '/';
        } else {
          setError(err.response?.data?.message || 'Failed to load data');
        }
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'Orders') {
      fetchData();
    } else {
      setLoading(false); // Make sure loading is false when not on Orders tab
    }
  }, [activeTab]);

  const getShopName = (shopId) => {
    if (!shopId) return 'Unknown Shop';
    const shop = shops.find(s => s._id === shopId);
    return shop ? shop.name : 'Unknown Shop';
  };

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

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };

  const handleCreateInvoice = (order) => {
    setSelectedOrder(order);
    setIsCreateInvoiceModalOpen(true);
  };

  const handleDownloadPdf = (order) => {
    const shopName = getShopName(order.shop?._id);
    generateOrderReportPdf(order, shopName);
  };

  const closeCreateInvoiceModal = () => {
    setIsCreateInvoiceModalOpen(false);
    setSelectedOrder(null);
  };

  const refreshOrders = async () => {
    try {
      const response = await axios.get('/admin/orders');
      setOrders(response.data);
    } catch (err) {
      setError('Failed to refresh orders');
      console.error('Error refreshing orders:', err);
    }
  };

  if (loading && activeTab === 'Orders') return (
    <div className="text-center p-8 flex flex-col items-center justify-center">
      <LuLoader className="w-8 h-8 animate-spin text-red-500 mb-2" />
      <div className="text-red-500 font-medium">Loading orders...</div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <LuShoppingCart className="mr-2" /> Order Management
      </h2>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('Orders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'Orders'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('InvoiceHistory')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'InvoiceHistory'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Invoice History
          </button>
        </nav>
      </div>

      {/* Orders Tab */}
      {activeTab === 'Orders' && (
        <div>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders?.map && orders.map(order => (
                  <tr key={order._id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderId}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{getShopName(order.shop?._id)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <div>{formatDateWithTime(order.orderDate).date}</div>
                        <div className="text-xs text-gray-400">{formatDateWithTime(order.orderDate).time}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">₹{(order.grandTotal || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                        title="View Order"
                      >
                        <LuEye size={18} />
                      </button>
                      <button
                        onClick={() => handleCreateInvoice(order)}
                        className="text-green-600 hover:text-green-900 mr-2"
                        title="Create Invoice"
                        disabled={order.status !== 'Pending'}
                      >
                        <LuFileText size={18} />
                      </button>
                      <button
                        onClick={() => handleDownloadPdf(order)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Download PDF Report"
                      >
                        <LuDownload size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No orders found. Orders placed by shops will appear here.
            </div>
          )}
        </div>
      )}

      {/* Invoice History Tab */}
      {activeTab === 'InvoiceHistory' && (
        <InvoiceHistory />
      )}

      {/* Order Detail Modal */}
      {selectedOrder && !isCreateInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">Order Details</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <LuX size={24} />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-500">Order ID</p>
                  <p className="font-semibold text-gray-800">{selectedOrder.orderId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Shop</p>
                  <p className="font-semibold text-gray-800">{getShopName(selectedOrder.shop?._id)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Order Date</p>
                  <div className="font-semibold text-gray-800">
                    <div>{formatDateWithTime(selectedOrder.orderDate).date}</div>
                    <div className="text-sm text-gray-500">{formatDateWithTime(selectedOrder.orderDate).time}</div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3">Order Items</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.items?.map && selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.productName}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.quantity} {item.unit}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">₹{(item.unitPrice || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">₹{((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-full max-w-xs">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">₹{(selectedOrder.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-semibold">₹{(selectedOrder.tax || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-3 text-xl font-bold bg-gray-100 px-4 rounded-md mt-2">
                    <span>Grand Total:</span>
                    <span>₹{(selectedOrder.grandTotal || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {isCreateInvoiceModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">Create Invoice for Order {selectedOrder.orderId}</h3>
                <button
                  onClick={closeCreateInvoiceModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <LuX size={24} />
                </button>
              </div>
              
              <CreateInvoice 
                closeModal={closeCreateInvoiceModal} 
                adminProducts={adminProducts}
                shopId={selectedOrder.shop?._id}
                orderItems={selectedOrder.items} // Pass the order items to pre-populate
                selectedOrder={selectedOrder} // Pass the selected order for linking
                refreshProducts={refreshOrders}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrderManagement;