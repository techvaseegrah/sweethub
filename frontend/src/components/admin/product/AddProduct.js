import React, { useState, useEffect, useRef } from 'react';
import axios from '../../../api/axios';
import UnitSelector from '../../../components/common/UnitSelector';

function AddProduct({ baseUrl = '/admin' }) {
  const PRODUCT_URL = `${baseUrl}/products`;
  const CATEGORY_URL = `${baseUrl}/categories`;

  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');
  const [stockLevel, setStockLevel] = useState('');
  const [stockAlertThreshold, setStockAlertThreshold] = useState('');
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  
  // States for searchable dropdown
  const [allProducts, setAllProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const dropdownRef = useRef(null);

  // Unit management states
  const [productUnits, setProductUnits] = useState([
    { unit: 'piece', netPrice: '', sellingPrice: '' }
  ]);

  // Fetch categories and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, productsResponse] = await Promise.all([
          axios.get(CATEGORY_URL, { withCredentials: true }),
          axios.get(PRODUCT_URL, { withCredentials: true })
        ]);
        
        setCategories(categoriesResponse.data);
        setAllProducts(productsResponse.data);
        setFilteredProducts(productsResponse.data);
        
        // Set a default category if available
        if (categoriesResponse.data.length > 0) {
          setCategory(categoriesResponse.data[0]._id);
        }
      } catch (err) {
        setError('Failed to load data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [CATEGORY_URL, PRODUCT_URL]);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter products based on input
  useEffect(() => {
    if (productName) {
      const filtered = allProducts.filter(product => 
        product.name.toLowerCase().includes(productName.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(allProducts);
    }
  }, [productName, allProducts]);

  // Handle product name input change
  const handleProductNameChange = (e) => {
    const value = e.target.value;
    setProductName(value);
    setShowDropdown(true);
  };

  // Select a product from dropdown
  const selectProduct = (productName) => {
    setProductName(productName);
    setShowDropdown(false);
  };

  // Add a new product to the list
  const handleAddNewProduct = async (newProductName) => {
    // Just add to local state for now, actual saving happens on form submit
    setProductName(newProductName);
    setShowDropdown(false);
  };

  const handleUnitChange = (index, field, value) => {
    const newProductUnits = [...productUnits];
    newProductUnits[index][field] = value;
    setProductUnits(newProductUnits);
  };

  // --- MODIFIED: Simplified the form submission logic ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Validate form
    if (!productName || !category || !sku) {
      setError('Please fill in all required fields.');
      return;
    }

    // Validate unit prices
    for (let i = 0; i < productUnits.length; i++) {
      const unit = productUnits[i];
      if (!unit.unit || !unit.netPrice || !unit.sellingPrice) {
        setError(`Please fill in all fields for unit ${i + 1}.`);
        return;
      }
      if (isNaN(unit.netPrice) || isNaN(unit.sellingPrice)) {
        setError(`Net Price and Selling Price must be valid numbers for unit ${i + 1}.`);
        return;
      }
    }

    try {
      // The payload includes the 'prices' array
      const payload = {
        name: productName,
        category,
        sku,
        stockLevel: parseInt(stockLevel) || 0,
        stockAlertThreshold: parseInt(stockAlertThreshold) || 0,
        prices: productUnits.map(unit => ({
          unit: unit.unit,
          netPrice: parseFloat(unit.netPrice),
          sellingPrice: parseFloat(unit.sellingPrice)
        }))
      };

      await axios.post(
        PRODUCT_URL,
        JSON.stringify(payload),
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );
      setMessage(`Product "${productName}" created successfully!`);
      // Reset form fields
      setProductName('');
      setSku('');
      setStockLevel('');
      setStockAlertThreshold('');
      setProductUnits([{ unit: 'piece', netPrice: '', sellingPrice: '' }]);
      
      // Refresh product list
      try {
        const productsResponse = await axios.get(PRODUCT_URL, { withCredentials: true });
        setAllProducts(productsResponse.data);
        setFilteredProducts(productsResponse.data);
      } catch (err) {
        console.error('Failed to refresh products:', err);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product.');
      console.error(err);
    }
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
        <div className="text-red-500 font-medium">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
      <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800">Add New Product</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* --- REMOVED: The entire 'Shop (Optional)' dropdown is gone --- */}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative" ref={dropdownRef}>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="productName">
                Product Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="productName"
                  value={productName}
                  onChange={handleProductNameChange}
                  onFocus={() => setShowDropdown(true)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </button>
              </div>
              
              {/* Dropdown list */}
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <div
                      key={product._id}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => selectProduct(product.name)}
                    >
                      <span>{product.name}</span>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && productName && (
                    <div className="px-4 py-2">
                      <button
                        type="button"
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => handleAddNewProduct(productName)}
                      >
                        Add "{productName}" as a new product
                      </button>
                    </div>
                  )}
                  {filteredProducts.length > 0 && (
                    <div className="border-t border-gray-200">
                      <div className="px-4 py-2 text-gray-500 text-sm">
                        Showing {filteredProducts.length} of {allProducts.length} products
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>
          <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No categories found. Please add a category first.</option>
                )}
              </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sku">
                SKU
              </label>
              <input
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
              />
          </div>
          <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="stockLevel">
                  Stock Level
              </label>
              <input
                  type="text"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="stockLevel"
                  value={stockLevel}
                  onChange={(e) => setStockLevel(e.target.value)}
              />
          </div>
        </div>
        <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="stockAlertThreshold">
                Stock Alert Threshold
            </label>
            <input
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="stockAlertThreshold"
                value={stockAlertThreshold}
                onChange={(e) => setStockAlertThreshold(e.target.value)}
            />
        </div>
        
        {/* Unit Configuration Section */}
        <div className="rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-medium text-gray-800">Unit Configuration</h4>
          </div>
          
          {productUnits.map((unit, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 p-3 border rounded">
              <div className="md:col-span-1">
                <label className="block text-gray-700 text-xs font-bold mb-1">Unit</label>
                <UnitSelector
                  value={unit.unit}
                  onChange={(selectedUnit) => handleUnitChange(index, 'unit', selectedUnit)}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-xs font-bold mb-1">Net Price</label>
                <input
                  type="text"
                  step="0.01"
                  value={unit.netPrice}
                  onChange={(e) => handleUnitChange(index, 'netPrice', e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-xs font-bold mb-1">Selling Price</label>
                <input
                  type="text"
                  step="0.01"
                  value={unit.sellingPrice}
                  onChange={(e) => handleUnitChange(index, 'sellingPrice', e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                  required
                />
              </div>
              <div className="flex items-end">
              </div>
            </div>
          ))}
        </div>

        <button
            type="submit"
            className="w-full sm:w-auto bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
            Add Product
        </button>
      </form>
      {message && <p className="mt-4 text-green-500">{message}</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
}

export default AddProduct;