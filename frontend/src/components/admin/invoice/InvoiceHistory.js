import React, { useState, useEffect, useMemo } from 'react';
import axios from '../../../api/axios';
import { LuFilter, LuEye, LuDownload } from 'react-icons/lu';

// NOTE: These are new components we will create in the next steps.
// For now, we will import them so the code is ready.
import InvoiceTemplate from './InvoiceTemplate'; 
import PartialInvoiceDetailView from './PartialInvoiceDetailView'; // NEW: Import the partial invoice detail view
import { generateInvoicePdf } from '../../../utils/generateInvoicePdf';

const InvoiceHistory = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State for filters
  const [filters, setFilters] = useState({
    status: 'All',
    shop: 'All',
    startDate: '',
    endDate: '',
  });

  // State for viewing a single invoice
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('standard'); // NEW: Track view mode (standard or partial detail)
  
  // Fetch invoices on component mount
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await axios.get('/admin/invoices', { withCredentials: true });
        setInvoices(response.data);
      } catch (err) {
        setError('Failed to fetch invoice history.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Memoized filtering logic for performance
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const issueDate = new Date(invoice.issueDate);
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;

      if (startDate && issueDate < startDate) return false;
      if (endDate && issueDate > endDate) return false;
      if (filters.status !== 'All' && invoice.status !== filters.status) return false;
      if (filters.shop !== 'All' && invoice.shop._id !== filters.shop) return false;
      
      return true;
    });
  }, [invoices, filters]);

  // Unique list of shops for the filter dropdown
  const shops = useMemo(() => {
    const shopMap = new Map();
    invoices.forEach(inv => shopMap.set(inv.shop._id, inv.shop.name));
    return Array.from(shopMap, ([_id, name]) => ({ _id, name }));
  }, [invoices]);

  const viewInvoice = (invoice, mode = 'standard') => {
    setSelectedInvoice(invoice);
    setViewMode(mode); // NEW: Set the view mode
    setIsModalOpen(true);
  };

  const downloadInvoice = (invoice) => {
    // Add validation before generating PDF
    if (!invoice) {
      console.error('No invoice data provided');
      return;
    }
    generateInvoicePdf(invoice);
  };

  if (loading) return (
    <div className="text-center p-8 flex flex-col items-center justify-center">
      <div className="relative flex justify-center items-center mb-4">
        <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
        <img 
          src="/sweethub-logo.png" 
          alt="Sweet Hub Logo" 
          className="absolute w-8 h-8"
        />
      </div>
      <div className="text-red-500 font-medium">Loading invoice history...</div>
    </div>
  );
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Invoice History</h2>

      {/* Filter Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 border rounded-md bg-gray-50">
        <select name="status" value={filters.status} onChange={handleFilterChange} className="input-style">
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Partial">Partial</option>
          <option value="Confirmed">Confirmed</option>
        </select>
        <select name="shop" value={filters.shop} onChange={handleFilterChange} className="input-style">
          <option value="All">All Shops</option>
          {shops.map(shop => <option key={shop._id} value={shop._id}>{shop.name}</option>)}
        </select>
        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="input-style" />
        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="input-style" />
      </div>

      {/* Invoices Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="th-style">Invoice #</th>
              <th className="th-style">Shop Name</th>
              <th className="th-style">Date</th>
              <th className="th-style">Amount</th>
              <th className="th-style">Status</th>
              <th className="th-style text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvoices.map(invoice => (
              <tr key={invoice._id}>
                <td className="td-style font-medium text-blue-600">{invoice.invoiceNumber}</td>
                <td className="td-style">{invoice.shop?.name || 'N/A'}</td>
                <td className="td-style">
                                  {invoice.issueDate ? (
                                    <div>
                                      <div>{new Date(invoice.issueDate).toLocaleDateString('en-GB')}</div>
                                      <div className="text-xs text-gray-500">
                                        {new Date(invoice.issueDate).toLocaleTimeString('en-US', { 
                                          hour: 'numeric', 
                                          minute: '2-digit', 
                                          hour12: true 
                                        }).toLowerCase()}
                                      </div>
                                    </div>
                                  ) : 'N/A'}
                                </td>
                <td className="td-style">₹{(invoice.grandTotal || 0).toFixed(2)}</td>
                <td className="td-style">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    invoice.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 
                    invoice.status === 'Partial' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {invoice.status || 'N/A'}
                  </span>
                </td>
                <td className="td-style text-right space-x-2">
                  {/* Standard View Button */}
                  <button 
                    onClick={() => viewInvoice(invoice, 'standard')} 
                    className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-200 transition-colors"
                  >
                    <LuEye className="mr-1 h-4 w-4" />
                    View
                  </button>
                  {/* NEW: Improved Partial View Button with distinct styling */}
                  {invoice.status === 'Partial' && (
                    <button 
                      onClick={() => viewInvoice(invoice, 'partial-detail')} 
                      className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 text-sm font-medium rounded-md hover:bg-purple-200 transition-colors"
                      title="View Partial Details"
                    >
                      <LuEye className="mr-1 h-4 w-4" />
                      <span className="flex items-center">
                        Partial
                        <span className="ml-1 bg-purple-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">!</span>
                      </span>
                    </button>
                  )}
                  <button onClick={() => downloadInvoice(invoice)} className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-md hover:bg-green-200 transition-colors">
                    <LuDownload className="mr-1 h-4 w-4" />
                    PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invoice Detail Modal */}
      {isModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-4 sm:p-8 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            {/* NEW: Conditional rendering based on view mode */}
            {viewMode === 'partial-detail' ? (
              <PartialInvoiceDetailView invoice={selectedInvoice} />
            ) : (
              <InvoiceTemplate invoice={selectedInvoice} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable styles for this component
const style = document.createElement('style');
style.innerHTML = `
  .input-style { padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; width: 100%; }
  .th-style { padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 500; color: #6b7280; text-transform: uppercase; }
  .td-style { padding: 0.75rem 1rem; font-size: 0.875rem; color: #111827; }
`;
document.head.appendChild(style);

export default InvoiceHistory;