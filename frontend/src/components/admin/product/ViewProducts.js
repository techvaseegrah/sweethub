import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import CreateInvoice from './CreateInvoice';
import InvoiceHistory from './InvoiceHistory';
import ProductHistory from './ProductHistory'; // Add this import
import { generateProductReportPdf } from '../../../utils/generateProductReportPdf';
import { LuChevronDown, LuChevronUp, LuInfo, LuPlus, LuTrash2, LuSearch, LuLoaderCircle, LuPencil, LuHistory, LuTrash } from 'react-icons/lu';

function ViewProducts({ baseUrl = '/admin' }) {
  const PRODUCT_URL = `${baseUrl}/products`;
  const CATEGORY_URL = baseUrl === '/shop' ? '/shop/categories' : `${baseUrl}/categories`;

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMixedOnly, setShowMixedOnly] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState({});
  const [mixedSweetDetails, setMixedSweetDetails] = useState({});
  const [editedProduct, setEditedProduct] = useState({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isProductHistoryModalOpen, setIsProductHistoryModalOpen] = useState(false); // Add this state
  const [selectedProductId, setSelectedProductId] = useState(null); // Add this state
  const [isUpdateConfirmationOpen, setIsUpdateConfirmationOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [compSearchTerm, setCompSearchTerm] = useState('');
  const [showCompDropdown, setShowCompDropdown] = useState(false);
  const [canEditProducts, setCanEditProducts] = useState(true); // New state for access control
  const compDropdownRef = React.useRef(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(PRODUCT_URL, { withCredentials: true });
      setProducts(response.data);
      setFilteredProducts(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch products.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // For shop users, get categories used by their products to ensure all used categories appear in dropdown
      if (baseUrl === '/shop') {
        // Use the new endpoint that returns categories used by shop's products
        const response = await axios.get('/shop/categories/shop-used', { withCredentials: true });
        setCategories(Array.isArray(response.data) ? response.data : []);
      } else {
        // For admin, continue with the existing approach
        const response = await axios.get(CATEGORY_URL, { withCredentials: true });
        setCategories(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    // Fetch available products for components if in shop mode
    if (baseUrl === '/shop') {
      const fetchAvailableForMixed = async () => {
        try {
          const res = await axios.get('/shop/products', { withCredentials: true });
          setAvailableProducts(res.data);
        } catch (err) {
          console.error('Failed to fetch available products for mixed sweets:', err);
        }
      };
      fetchAvailableForMixed();
    }

    // Fetch shop details for access control if in shop mode
    if (baseUrl === '/shop') {
      const fetchShopDetails = async () => {
        try {
          const res = await axios.get('/shop/details', { withCredentials: true });
          if (res.data && res.data.canEditProducts !== undefined) {
            setCanEditProducts(res.data.canEditProducts);
          }
        } catch (err) {
          console.error('Failed to fetch shop details for access control:', err);
        }
      };
      fetchShopDetails();
    }

    // Handle clicks outside component dropdown
    const handleClickOutside = (event) => {
      if (compDropdownRef.current && !compDropdownRef.current.contains(event.target)) {
        setShowCompDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [baseUrl]);

  useEffect(() => {
    let tempProducts = products;

    if (selectedCategory !== 'All') {
      tempProducts = tempProducts.filter(
        (product) => {
          // Check if product.category is an object with _id or just an ID string
          const categoryId = (product.category && typeof product.category === 'object') ? product.category._id : product.category;
          return categoryId === selectedCategory;
        }
      );
    }

    if (searchTerm) {
      tempProducts = tempProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateFrom) {
      tempProducts = tempProducts.filter(p => new Date(p.createdAt) >= new Date(dateFrom));
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      tempProducts = tempProducts.filter(p => new Date(p.createdAt) <= toDate);
    }

    if (showMixedOnly) {
      tempProducts = tempProducts.filter(product => product.isMixedSweet);
    }

    setFilteredProducts(tempProducts);
  }, [products, selectedCategory, searchTerm, dateFrom, dateTo, showMixedOnly]);

  const openDeleteConfirmation = (id) => {
    setProductToDelete(id);
    setIsDeleteConfirmationOpen(true);
  };

  const confirmDelete = async () => {
    try {
      let deleteUrl = `${PRODUCT_URL}/${productToDelete}`;
      if (baseUrl === '/shop') {
        deleteUrl = `/shop/products/${productToDelete}`;
      }

      await axios.delete(deleteUrl, {
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
    setError(null);
  };

  const handleInputChange = (e, field) => {
    let value = e.target.value;

    // Handle date fields - convert to Date object if not empty
    if (field === 'expiryDate' || field === 'usedByDate') {
      value = value ? new Date(value) : null;
    }

    setEditedProduct({ ...editedProduct, [field]: value });
  };

  const handlePriceChange = (index, field, value) => {
    const updatedPrices = [...editedProduct.prices];
    updatedPrices[index][field] = value;
    setEditedProduct({ ...editedProduct, prices: updatedPrices });
  };

  const addNewPrice = () => {
    const newPrice = { unit: 'piece', netPrice: '', sellingPrice: '' };
    setEditedProduct({
      ...editedProduct,
      prices: [...editedProduct.prices, newPrice]
    });
  };

  const removePrice = (index) => {
    if (editedProduct.prices.length <= 1) {
      alert('At least one price configuration is required.');
      return;
    }
    const updatedPrices = [...editedProduct.prices];
    updatedPrices.splice(index, 1);
    setEditedProduct({ ...editedProduct, prices: updatedPrices });
  };

  const openEditModal = async (product) => {
    setError(null); // Clear previous errors
    // Ensure prices array exists and has at least one entry
    const productWithPrices = { ...product };
    // Set category ID properly - handle both object and string cases
    if (product.category) {
      productWithPrices.category = typeof product.category === 'object' ? product.category._id : product.category;
    } else {
      productWithPrices.category = '';
    }
    if (!productWithPrices.prices || !Array.isArray(productWithPrices.prices) || productWithPrices.prices.length === 0) {
      productWithPrices.prices = [{ unit: 'piece', netPrice: '', sellingPrice: '' }];
    }

    if (product.isMixedSweet) {
      try {
        const res = await axios.get(`/shop/mixed-sweets/product/${product._id}`);
        productWithPrices.components = res.data.components.map(c => ({
          product: c.product._id || c.product,
          name: c.name,
          quantityUsed: c.quantityUsed,
          unit: c.unit,
          availableStock: 0 // Will be updated if availableProducts is loaded
        }));
      } catch (err) {
        console.error('Failed to fetch mixed sweet components:', err);
        productWithPrices.components = [];
      }
    } else {
      productWithPrices.components = [];
    }

    setEditedProduct(productWithPrices);
    setIsEditModalOpen(true);
  };

  const handleModalUpdate = () => {
    setError(null); // Clear any previous errors
    setIsUpdateConfirmationOpen(true);
  };

  const confirmUpdate = async () => {
    try {
      // Prepare the update payload, ensuring prices are properly formatted as numbers and dates are properly handled
      const updatePayload = {
        ...editedProduct,
        prices: (editedProduct.prices || []).map(price => ({
          unit: price.unit,
          netPrice: parseFloat(price.netPrice) || 0,
          sellingPrice: parseFloat(price.sellingPrice) || 0
        })),
        expiryDate: editedProduct.expiryDate ? new Date(editedProduct.expiryDate).toISOString() : null,
        usedByDate: editedProduct.usedByDate ? new Date(editedProduct.usedByDate).toISOString() : null
      };

      let requestPromise;

      if (editedProduct._id) {
        // Update existing product
        let updateUrl = `${PRODUCT_URL}/${editedProduct._id}`;
        if (baseUrl === '/shop') {
          updateUrl = `/shop/products/${editedProduct._id}`;
        }
        requestPromise = axios.put(updateUrl, updatePayload, {
          withCredentials: true,
        });
      } else {
        // Create new product
        let createUrl = PRODUCT_URL;
        if (baseUrl === '/shop') {
          createUrl = '/shop/products';
        }
        requestPromise = axios.post(createUrl, updatePayload, {
          withCredentials: true,
        });
      }

      await requestPromise;
      fetchProducts();
      handleCancelEdit();
      setIsUpdateConfirmationOpen(false);
    } catch (err) {
      console.error('Final Update Error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'An unexpected error occurred.';
      setError(errorMsg);
    }
  };

  const cancelUpdate = () => {
    setIsUpdateConfirmationOpen(false);
  };

  // Mixed Sweet Editing Helpers
  const addComponent = (product) => {
    if (editedProduct.components.find(c => c.product === product._id)) {
      alert(`${product.name} is already added.`);
      return;
    }

    const defaultUnit = product.prices?.[0]?.unit || 'kg';
    const newComponents = [
      ...editedProduct.components,
      {
        product: product._id,
        name: product.name,
        quantityUsed: '',
        unit: defaultUnit,
        availableStock: product.stockLevel
      }
    ];
    setEditedProduct({ ...editedProduct, components: newComponents });
    setCompSearchTerm('');
    setShowCompDropdown(false);
  };

  const removeComponent = (index) => {
    const newComponents = [...editedProduct.components];
    newComponents.splice(index, 1);
    setEditedProduct({ ...editedProduct, components: newComponents });
  };

  const handleComponentQtyChange = (index, value) => {
    const newComponents = [...editedProduct.components];
    newComponents[index].quantityUsed = value;
    setEditedProduct({ ...editedProduct, components: newComponents });
  };

  const handleComponentUnitChange = (index, value) => {
    const newComponents = [...editedProduct.components];
    newComponents[index].unit = value;
    setEditedProduct({ ...editedProduct, components: newComponents });
  };

  // Add this function to open product history modal
  const openProductHistoryModal = (productId) => {
    setSelectedProductId(productId);
    setIsProductHistoryModalOpen(true);
  };

  const downloadProductReport = () => {
    generateProductReportPdf(filteredProducts, categories, selectedCategory, { dateFrom, dateTo });
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

  {
    error && (
      <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex justify-between items-center rounded shadow-sm">
        <span>{error}</span>
        <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold">×</button>
      </div>
    )
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
        <div className="flex gap-3">
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center gap-2"
          >
            <LuHistory size={18} />
            Invoice History
          </button>

          {baseUrl === '/admin' ? (
            <>
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
            </>
          ) : (
            <button
              onClick={downloadProductReport}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download PDF
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full md:w-auto px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Categories</option>
          {Array.isArray(categories) && categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-sm text-gray-600 font-medium whitespace-nowrap">From:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-sm text-gray-600 font-medium whitespace-nowrap">To:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div
          className="flex items-center gap-3 w-full md:w-auto px-4 py-2 border-2 border-slate-100 rounded-xl hover:border-slate-200 hover:bg-slate-50 transition-all cursor-pointer group"
          onClick={() => setShowMixedOnly(!showMixedOnly)}
        >
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${showMixedOnly ? 'bg-slate-900 border-slate-900 scale-110 shadow-sm' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}>
            {showMixedOnly && (
              <svg className="w-3.5 h-3.5 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            )}
          </div>
          <label className="text-sm font-bold text-slate-700 cursor-pointer select-none">
            Show Mixed Only
          </label>
          <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md transition-all duration-300 ${showMixedOnly ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
            {showMixedOnly ? 'MIXED ONLY' : 'ALL SWEETS'}
          </span>
        </div>
      </div>

      {flattenedProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">📦</div>
          <p className="text-gray-600 font-medium">No products found in your inventory.</p>
          <p className="text-gray-500 text-sm mt-1">
            {baseUrl === '/shop'
              ? 'Start by adding your first product to get started.'
              : 'Start by adding your first product to get started.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Net Price</th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Sell Price</th>
                <th className="hidden lg:table-cell px-3 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Expiry</th>
                <th className="hidden lg:table-cell px-3 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Used By</th>
                <th className="hidden lg:table-cell px-3 py-3 text-left text-sm font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-3 py-3 text-right text-sm font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {flattenedProducts.map((product) => {
                const isExpanded = expandedProducts[product._id];
                const hasMixedDetails = product.isMixedSweet;

                return (
                  <React.Fragment key={`${product._id}-${product.unit}`}>
                    <tr className="hover:bg-gray-50 border-b border-gray-100">
                      <td className="px-3 py-3 text-sm font-medium text-gray-900 max-w-[150px] truncate">
                        <div className="flex items-center gap-2">
                          {hasMixedDetails && (
                            <button
                              onClick={async () => {
                                const newExpanded = { ...expandedProducts };
                                newExpanded[product._id] = !isExpanded;
                                setExpandedProducts(newExpanded);

                                if (!isExpanded && !mixedSweetDetails[product._id]) {
                                  try {
                                    const res = await axios.get(`/shop/mixed-sweets/product/${product._id}`);
                                    setMixedSweetDetails(prev => ({
                                      ...prev,
                                      [product._id]: res.data
                                    }));
                                  } catch (err) {
                                    console.error('Failed to fetch mixed sweet details:', err);
                                  }
                                }
                              }}
                              className="text-slate-400 hover:text-slate-900 transition-colors"
                            >
                              {isExpanded ? <LuChevronUp size={14} /> : <LuChevronDown size={14} />}
                            </button>
                          )}
                          <span className="truncate" title={product.name}>{product.name}</span>
                          {product.isMixedSweet && (
                            <span className="text-[8px] bg-slate-900 text-white px-1.5 py-0.5 rounded-full font-bold">MIX</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        {product.sku}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 uppercase">
                          {product.unit}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${product.stockLevel <= (product.stockAlertThreshold || 0)
                          ? 'bg-red-50 text-red-700'
                          : product.stockLevel <= (product.stockAlertThreshold || 0) * 2
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'bg-green-50 text-green-700'
                          }`}>
                          {product.stockLevel}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm">
                        {Number(product.netPrice) === 0 ? (
                          <span className="text-red-500 font-bold">(0)</span>
                        ) : (
                          <span className="text-gray-500">₹{product.netPrice}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold">
                        {Number(product.sellingPrice) === 0 ? (
                          <span className="text-red-500 font-bold">(0)</span>
                        ) : (
                          <span className="text-green-600">₹{product.sellingPrice}</span>
                        )}
                      </td>
                      <td className="hidden lg:table-cell px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'N/A'}
                      </td>
                      <td className="hidden lg:table-cell px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                        {product.usedByDate ? new Date(product.usedByDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'N/A'}
                      </td>
                      <td className="hidden lg:table-cell px-3 py-3 whitespace-nowrap text-sm text-gray-500 max-w-[100px] truncate">
                        {product.category ? (typeof product.category === 'object' ? product.category.name :
                          categories.find(cat => cat._id === product.category)?.name || 'N/A') : 'N/A'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {(baseUrl === '/admin' || canEditProducts) && (
                            <button
                              onClick={() => openEditModal(product)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Product"
                            >
                              <LuPencil size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => openProductHistoryModal(product._id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="View History"
                          >
                            <LuHistory size={18} />
                          </button>
                          {(baseUrl === '/admin' || canEditProducts) && (
                            <button
                              onClick={() => openDeleteConfirmation(product._id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Product"
                            >
                              <LuTrash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && mixedSweetDetails[product._id] && (
                      <tr className="bg-slate-50/50">
                        <td colSpan="10" className="px-12 py-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider underline">
                              <LuInfo size={14} className="text-slate-400" /> Mixed Sweet Composition
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {mixedSweetDetails[product._id].components.map((comp, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                                  <span className="text-xs font-bold text-slate-600">{comp.name}</span>
                                  <span className="text-[10px] font-heavy bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                                    {comp.quantityUsed} {comp.unit}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Update Confirmation Modal */}
      {isUpdateConfirmationOpen && (
        <div className="fixed inset-0 bg-black/40 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[110] backdrop-blur-[2px]">
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
                    {editedProduct._id ? 'Are you sure you want to update this product? This action cannot be undone.' : 'Are you sure you want to create this product?'}
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
                    {editedProduct._id ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmationOpen && (
        <div className="fixed inset-0 bg-black/40 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[110] backdrop-blur-[2px]">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] overflow-y-auto flex items-start justify-center py-6 sm:py-10 px-4">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Edit Product</h3>
              <button onClick={handleCancelEdit} className="text-slate-400 hover:text-white transition-colors text-2xl font-light">&times;</button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium flex items-center gap-2">
                <LuInfo size={16} /> {error}
              </div>
            )}

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={editedProduct.name}
                    onChange={(e) => handleInputChange(e, 'name')}
                    className={`mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    readOnly={false}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">SKU</label>
                  <input
                    type="text"
                    value={editedProduct.sku}
                    onChange={(e) => handleInputChange(e, 'sku')}
                    className={`mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    readOnly={false}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock</label>
                  <input
                    type="text"
                    step="0.01"
                    value={editedProduct.stockLevel}
                    onChange={(e) => handleInputChange(e, 'stockLevel')}
                    className={`mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    readOnly={false}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stock Alert Threshold</label>
                  <input
                    type="text"
                    step="0.01"
                    value={editedProduct.stockAlertThreshold || ''}
                    onChange={(e) => handleInputChange(e, 'stockAlertThreshold')}
                    className={`mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    readOnly={false}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                  <input
                    type="date"
                    value={editedProduct.expiryDate ? new Date(editedProduct.expiryDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange(e, 'expiryDate')}
                    className={`mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Used By Date</label>
                  <input
                    type="date"
                    value={editedProduct.usedByDate ? new Date(editedProduct.usedByDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange(e, 'usedByDate')}
                    className={`mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={editedProduct.category}
                    onChange={(e) => setEditedProduct({ ...editedProduct, category: e.target.value })}
                    className={`mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    disabled={false}
                  >
                    <option value="">Select Category</option>
                    {Array.isArray(categories) && categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Unit Configuration Section */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-lg font-medium text-gray-800">Unit Configuration</h4>
                  <button
                    type="button"
                    onClick={addNewPrice}
                    className="text-sm bg-green-500 hover:bg-green-700 text-white py-1 px-3 rounded-md"
                  >
                    Add Unit
                  </button>
                </div>

                {editedProduct.prices && editedProduct.prices.map((price, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 p-3 border rounded">
                    <div className="md:col-span-1">
                      <label className="block text-gray-700 text-xs font-bold mb-1">Unit</label>
                      <select
                        value={price.unit}
                        onChange={(e) => handlePriceChange(index, 'unit', e.target.value)}
                        className={`mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                        disabled={false}
                      >
                        <option value="piece">Piece</option>
                        <option value="kg">Kg</option>
                        <option value="g">Gram</option>
                        <option value="l">Liter</option>
                        <option value="ml">Milliliter</option>
                        <option value="dozen">Dozen</option>
                        <option value="pack">Pack</option>
                        <option value="box">Box</option>
                        <option value="bundle">Bundle</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs font-bold mb-1">Net Price</label>
                      <input
                        type="text"
                        step="0.01"
                        value={price.netPrice}
                        onChange={(e) => handlePriceChange(index, 'netPrice', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs font-bold mb-1">Selling Price</label>
                      <input
                        type="text"
                        step="0.01"
                        value={price.sellingPrice}
                        onChange={(e) => handlePriceChange(index, 'sellingPrice', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removePrice(index)}
                        disabled={editedProduct.prices.length <= 1}
                        className={`w-full py-2 px-3 rounded-md text-sm ${editedProduct.prices.length <= 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mixed Sweet Components Section */}
              {editedProduct.isMixedSweet && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <span className="p-1.5 bg-slate-900 text-white rounded-lg"><LuPlus size={14} /></span>
                      Mixed Sweet Composition
                    </h4>
                  </div>

                  <div className="relative mb-4" ref={compDropdownRef}>
                    <div className="relative">
                      <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search ingredients to add..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        value={compSearchTerm}
                        onChange={(e) => {
                          setCompSearchTerm(e.target.value);
                          setShowCompDropdown(true);
                        }}
                        onFocus={() => setShowCompDropdown(true)}
                      />
                    </div>
                    {showCompDropdown && compSearchTerm && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {availableProducts
                          .filter(p => !p.isMixedSweet && (p.name.toLowerCase().includes(compSearchTerm.toLowerCase()) || p.sku.toLowerCase().includes(compSearchTerm.toLowerCase())))
                          .map(p => (
                            <div
                              key={p._id}
                              className="px-4 py-2 hover:bg-indigo-50 cursor-pointer flex justify-between items-center border-b last:border-0"
                              onClick={() => addComponent(p)}
                            >
                              <div>
                                <div className="text-sm font-bold text-gray-800">{p.name}</div>
                                <div className="text-[10px] text-gray-500 uppercase font-medium">SKU: {p.sku} | Stock: {p.stockLevel}</div>
                              </div>
                              <LuPlus size={14} className="text-indigo-400" />
                            </div>
                          ))}
                        {availableProducts.filter(p => !p.isMixedSweet && (p.name.toLowerCase().includes(compSearchTerm.toLowerCase()) || p.sku.toLowerCase().includes(compSearchTerm.toLowerCase()))).length === 0 && (
                          <div className="p-4 text-center text-gray-400 text-xs italic">No matching ingredients found.</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Ingredient</th>
                          <th className="px-4 py-3">Qty</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {editedProduct.components && editedProduct.components.length > 0 ? (
                          editedProduct.components.map((comp, index) => (
                            <tr key={index} className="bg-white">
                              <td className="px-4 py-3">
                                <div className="text-xs font-bold text-slate-800">{comp.name}</div>
                                <div className="text-[10px] text-slate-400">ID: {comp.product.substring(0, 8)}...</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    className="w-16 px-2 py-1 text-xs border border-slate-300 rounded font-bold focus:ring-1 focus:ring-indigo-500"
                                    value={comp.quantityUsed}
                                    onChange={(e) => handleComponentQtyChange(index, e.target.value)}
                                  />
                                  <select
                                    className="text-[10px] font-bold text-slate-500 bg-transparent outline-none uppercase"
                                    value={comp.unit}
                                    onChange={(e) => handleComponentUnitChange(index, e.target.value)}
                                  >
                                    <option value="kg">kg</option>
                                    <option value="gm">gm</option>
                                    <option value="box">box</option>
                                    <option value="pcs">pcs</option>
                                  </select>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeComponent(index)}
                                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                >
                                  <LuTrash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="px-4 py-8 text-center text-slate-400 text-xs italic">No components defined for this mixed sweet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={handleCancelEdit}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-semibold shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleModalUpdate}
                className="px-8 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold shadow-lg shadow-slate-200"
              >
                Update Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product History Modal */}
      {isProductHistoryModalOpen && (
        <ProductHistory
          closeModal={() => setIsProductHistoryModalOpen(false)}
          productId={selectedProductId}
          baseUrl={baseUrl}
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

      {/* Show invoice history modal for both admin and shop */}
      {isHistoryModalOpen && (
        <InvoiceHistory
          closeModal={() => setIsHistoryModalOpen(false)}
          baseUrl={baseUrl}
        />
      )}
    </div>
  );
}

export default ViewProducts;