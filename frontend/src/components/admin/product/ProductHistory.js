import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../../api/axios';
import { LuClock, LuPlus, LuPencil, LuArrowUp, LuArrowDown, LuX } from 'react-icons/lu';

function ProductHistory({ closeModal, productId }) {
  const [history, setHistory] = useState([]);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Fetch product history from the backend
  const fetchProductHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let url = '/admin/product-history';
      if (productId) {
        url += `/product/${productId}`;
      }
      
      const response = await axios.get(url);
      setHistory(response.data || []);
      
      // If we have a specific product, also fetch its details
      if (productId) {
        try {
          const productResponse = await axios.get(`/admin/products/${productId}`, { withCredentials: true });
          setProduct(productResponse.data);
        } catch (productError) {
          console.error('Failed to fetch product details:', productError);
        }
      }
    } catch (err) {
      setError('Failed to fetch product history. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProductHistory();
  }, [fetchProductHistory]);

  // Format date and time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Get action type badge
  const getActionBadge = (actionType) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (actionType) {
      case 'Added':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <LuPlus className="mr-1 h-3 w-3" />
            Added
          </span>
        );
      case 'Updated':
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            <LuPencil className="mr-1 h-3 w-3" />
            Updated
          </span>
        );
      case 'Stock In':
        return (
          <span className={`${baseClasses} bg-purple-100 text-purple-800`}>
            <LuArrowUp className="mr-1 h-3 w-3" />
            Stock In
          </span>
        );
      case 'Stock Out':
        return (
          <span className={`${baseClasses} bg-orange-100 text-orange-800`}>
            <LuArrowDown className="mr-1 h-3 w-3" />
            Stock Out
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            {actionType}
          </span>
        );
    }
  };

  // Get action description
  const getActionDescription = (entry) => {
    switch (entry.actionType) {
      case 'Added':
        return `Product "${entry.name}" was added to inventory with ${entry.quantity} units at ₹${entry.netPrice || 0} net price and ₹${entry.sellingPrice || 0} selling price. Current stock: ${entry.currentStock != null ? entry.currentStock : 'N/A'} units.`;
      case 'Updated':
        return `Product "${entry.name}" details were updated. Added ${entry.quantity} units. Current stock: ${entry.currentStock != null ? entry.currentStock : 'N/A'} units at ₹${entry.netPrice || 0} net price and ₹${entry.sellingPrice || 0} selling price.`;
      case 'Stock In':
        return `Added ${entry.quantity} units to "${entry.name}". Current stock: ${entry.currentStock != null ? entry.currentStock : 'N/A'} units.`;
      case 'Stock Out':
        return `Removed ${entry.quantity} units from "${entry.name}". Current stock: ${entry.currentStock != null ? entry.currentStock : 'N/A'} units.`;
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh]">
        <header className="flex justify-between items-center p-4 border-b">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">
              {productId ? `Product History: ${product ? product.name : 'Loading...'}` : 'All Product History'}
            </h3>
            <p className="text-sm text-gray-500">
              {productId ? 'View history of changes for this product' : 'View history of all product changes'}
            </p>
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
              <div className="text-gray-500">Loading product history...</div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <LuClock className="mx-auto text-5xl text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No History Found</h3>
              <p className="text-gray-500">
                {productId 
                  ? 'No history records found for this product.' 
                  : 'No product history records found.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name (SKU)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Added Qty</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sell Price</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((entry) => {
                    const { date, time } = formatDateTime(entry.timestamp);
                    return (
                      <tr key={entry._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div>
                            <div className="font-medium">{date}</div>
                            <div className="text-xs text-gray-500">{time}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {entry.name} ({entry.sku})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getActionBadge(entry.actionType)}
                          <div className="text-xs text-gray-500 mt-1">
                            {getActionDescription(entry)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                          {entry.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                          {entry.currentStock != null ? entry.currentStock : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                          ₹{entry.netPrice ? entry.netPrice.toFixed(2) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          ₹{entry.sellingPrice ? entry.sellingPrice.toFixed(2) : 'N/A'}
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

export default ProductHistory;