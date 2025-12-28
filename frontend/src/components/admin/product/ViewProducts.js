import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import CreateInvoice from './CreateInvoice';
import InvoiceHistory from './InvoiceHistory'; 
import ProductHistory from './ProductHistory'; // Add this import
import { generateProductReportPdf } from '../../../utils/generateProductReportPdf';

function ViewProducts({ baseUrl = '/admin' }) {
  const PRODUCT_URL = `${baseUrl}/products`;
  const CATEGORY_URL = `${baseUrl}/categories`;
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editedProduct, setEditedProduct] = useState({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isProductHistoryModalOpen, setIsProductHistoryModalOpen] = useState(false); // Add this state
  const [selectedProductId, setSelectedProductId] = useState(null); // Add this state
  const [isUpdateConfirmationOpen, setIsUpdateConfirmationOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(PRODUCT_URL, { withCredentials: true });
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (err) {
      setError('Failed to fetch products.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(CATEGORY_URL, { withCredentials: true });
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };
  
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [baseUrl]);

  useEffect(() => {
    let tempProducts = products;

    if (selectedCategory !== 'All') {
      tempProducts = tempProducts.filter(
        (product) => product.category?._id === selectedCategory
      );
    }

    if (searchTerm) {
      tempProducts = tempProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(tempProducts);
  }, [products, selectedCategory, searchTerm]);

  const openDeleteConfirmation = (id) => {
    setProductToDelete(id);
    setIsDeleteConfirmationOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${PRODUCT_URL}/${productToDelete}`, {
        withCredentials: true,
      });
      // Refresh products after deletion
      fetchProducts();
      setIsDeleteConfirmationOpen(false);
      setProductToDelete(null);
    } catch (err) {
      setError('Failed to delete product.');
      console.error(err);
    }
  };

  const cancelDelete = () => {
    setIsDeleteConfirmationOpen(false);
    setProductToDelete(null);
  };

  const handleCancelEdit = () => {
    setEditedProduct({});
    setIsEditModalOpen(false);
  };

  const handleInputChange = (e, field) => {
    setEditedProduct({ ...editedProduct, [field]: e.target.value });
  };

  const openEditModal = (product) => {
    setEditedProduct({ ...product, category: product.category?._id || '' });
    setIsEditModalOpen(true);
  };

  const handleModalUpdate = () => {
    setIsUpdateConfirmationOpen(true);
  };

  const confirmUpdate = async () => {
    try {
      const { ...updatePayload } = editedProduct;
      await axios.put(`${PRODUCT_URL}/${editedProduct._id}`, updatePayload, {
        withCredentials: true,
      });
      fetchProducts();
      handleCancelEdit();
      setIsUpdateConfirmationOpen(false);
    } catch (err) {
      setError('Failed to update product.');
      console.error(err);
    }
  };

  const cancelUpdate = () => {
    setIsUpdateConfirmationOpen(false);
  };

  // Add this function to open product history modal
  const openProductHistoryModal = (productId) => {
    setSelectedProductId(productId);
    setIsProductHistoryModalOpen(true);
  };

  const downloadProductReport = () => {
    generateProductReportPdf(filteredProducts, categories, selectedCategory);
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
        <div className="text-red-500 font-medium">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  // Flatten products with their units to create one row per unit
  const flattenedProducts = [];
  filteredProducts.forEach(product => {
    if (product.prices && product.prices.length > 0) {
      product.prices.forEach(price => {
        flattenedProducts.push({
          ...product,
          unit: price.unit,
          netPrice: price.netPrice,
          sellingPrice: price.sellingPrice,
          stockLevel: product.stockLevel // Each unit row shows the same stock level
        });
      });
    } else {
      // For products without prices, still show them in the table
      flattenedProducts.push({
        ...product,
        unit: 'N/A',
        netPrice: 'N/A',
        sellingPrice: 'N/A',
        stockLevel: product.stockLevel
      });
    }
  });

    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-800">View Products</h3>
          {/* Only show Create Invoice button for admin, not for shop */}
          {baseUrl === '/admin' && (
            <div className="flex gap-3">
              <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                  Invoice History
              </button>
              <button
                  onClick={() => setIsInvoiceModalOpen(true)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                  Create Invoice
              </button>
              <button
                  onClick={downloadProductReport}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download PDF
              </button>
            </div>
          )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full md:w-auto px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
        </div>
        
        {flattenedProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">📦</div>
            <p className="text-gray-600 font-medium">No products found in your inventory.</p>
            <p className="text-gray-500 text-sm mt-1">
              {baseUrl === '/shop' 
                ? 'Products will appear here when admin sends invoices and you confirm them.' 
                : 'Start by adding your first product to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Price</th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sell Price</th>
                <th className="hidden lg:table-cell px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-2 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {flattenedProducts.map((product) => (
                <tr key={`${product._id}-${product.unit}`} className="hover:bg-gray-50">
                  <td className="px-2 sm:px-6 py-4 text-sm font-semibold text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.sku}
                  </td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 uppercase">
                      {product.unit}
                    </span>
                  </td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.stockLevel <= (product.stockAlertThreshold || 0) 
                        ? 'bg-red-100 text-red-800' 
                        : product.stockLevel <= (product.stockAlertThreshold || 0) * 2 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {product.stockLevel}
                    </span>
                  </td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{product.netPrice}
                  </td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                    ₹{product.sellingPrice}
                  </td>
                  <td className="hidden lg:table-cell px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category ? product.category.name : 'N/A'}
                  </td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(product)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    {baseUrl === '/admin' && (
                      <button
                        onClick={() => openProductHistoryModal(product._id)}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        History
                      </button>
                    )}
                    <button
                      onClick={() => openDeleteConfirmation(product._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}

        {/* Update Confirmation Modal */}
        {isUpdateConfirmationOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative m-4 p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="text-center py-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
                  <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900">Are you sure?</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to update this product? This action cannot be undone.
                    </p>
                  </div>
                  <div className="mt-6 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={cancelUpdate}
                      className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmUpdate}
                      className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete Confirmation Modal */}
        {isDeleteConfirmationOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative m-4 p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="text-center py-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900">Are you sure?</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this product? This action cannot be undone.
                    </p>
                  </div>
                  <div className="mt-6 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={cancelDelete}
                      className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmDelete}
                      className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative m-4 p-4 sm:p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Edit Product</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" value={editedProduct.name} onChange={(e) => handleInputChange(e, 'name')} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">SKU</label>
                <input type="text" value={editedProduct.sku} onChange={(e) => handleInputChange(e, 'sku')} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Stock</label>
                <input type="number" value={editedProduct.stockLevel} onChange={(e) => handleInputChange(e, 'stockLevel')} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Stock Alert Threshold</label>
                <input
                  type="number"
                  value={editedProduct.stockAlertThreshold || ''}
                  onChange={(e) => handleInputChange(e, 'stockAlertThreshold')}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select value={editedProduct.category} onChange={(e) => setEditedProduct({...editedProduct, category: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                  {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={handleCancelEdit} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
              <button onClick={handleModalUpdate} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Update</button>
            </div>
            </div>
          </div>
        )}
        
        {/* Product History Modal */}
        {isProductHistoryModalOpen && baseUrl === '/admin' && (
          <ProductHistory
            closeModal={() => setIsProductHistoryModalOpen(false)}
            productId={selectedProductId}
          />
        )}
      
        {/* Only show invoice modal for admin, not for shop */}
        {isInvoiceModalOpen && baseUrl === '/admin' && (
          <CreateInvoice
           closeModal={() => setIsInvoiceModalOpen(false)}
           adminProducts={products}
           refreshProducts={fetchProducts}
          />
        )}
        
        {/* Only show invoice history modal for admin, not for shop */}
        {isHistoryModalOpen && baseUrl === '/admin' && (
          <InvoiceHistory
           closeModal={() => setIsHistoryModalOpen(false)}
          />
        )}
      </div>
    );
  }
  
  export default ViewProducts;