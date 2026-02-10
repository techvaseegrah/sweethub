import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from '../../api/axios'; // Corrected import path - from shop folder to api folder
import { LuX, LuPlus, LuTrash2, LuShoppingCart, LuPackage, LuCalendar, LuDollarSign, LuLoader } from 'react-icons/lu';
import { formatDateToDDMMYYYY } from '../../utils/unitConversion';
import KeyboardShortcutsGuide from './billing/KeyboardShortcutsGuide'; // Import the keyboard shortcuts guide

function ShopOrderManagement() {
  const [products, setProducts] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UI States
  const [showDropdown, setShowDropdown] = useState(false);
  const [showStockAlertDropdown, setShowStockAlertDropdown] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);

  // NEW: Stock alert state
  const [stockAlertProducts, setStockAlertProducts] = useState([]);

  // Current item state
  const [currentItem, setCurrentItem] = useState({
    product: null,
    unit: '',
    quantity: '',
    price: 0,
    productName: '',
    sku: '',
    rawInput: '',
  });

  // Refs
  const productSearchRef = useRef(null);
  const stockAlertDropdownRef = useRef(null);

  // NEW: Fetch stock alert products
  useEffect(() => {
    const fetchStockAlertProducts = async () => {
      try {
        const response = await axios.get('/shop/products/low-stock'); // Assuming this endpoint exists
        setStockAlertProducts(response.data);
      } catch (err) {
        // If the endpoint doesn't exist, fetch all products and filter for low stock
        try {
          const response = await axios.get('/shop/products');
          const lowStockProducts = response.data.filter(product => product.stockLevel < 10); // Assuming < 10 is low stock
          setStockAlertProducts(lowStockProducts);
        } catch (err2) {
          console.error('Failed to load stock alert products:', err2);
          setStockAlertProducts([]); // Set to empty array if both attempts fail
        }
      }
    };

    if (products.length > 0) {
      fetchStockAlertProducts();
    }
  }, [products]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/shop/products');
        setProducts(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load products');
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // NEW: Handle selecting a stock alert product
  const handleSelectStockAlertProduct = (product) => {
    const priceInfo = product.prices && product.prices.length > 0 ? product.prices[0] : { unit: 'N/A', sellingPrice: 0 };

    setCurrentItem({
      product: product,
      unit: priceInfo.unit,
      quantity: '',
      price: priceInfo.sellingPrice,
      productName: product.name,
      sku: product.sku,
      rawInput: '',
    });
    setSearchTerm('');
    setShowDropdown(false);
    setShowStockAlertDropdown(false); // Close the dropdown after selection
    productSearchRef.current?.focus();
  };

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, products]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  // Handle product selection
  const handleSelectProduct = (product) => {
    const priceInfo = product.prices && product.prices.length > 0 ? product.prices[0] : { unit: 'N/A', sellingPrice: 0 };

    setCurrentItem({
      product: product,
      unit: priceInfo.unit,
      quantity: '',
      price: priceInfo.sellingPrice,
      productName: product.name,
      sku: product.sku,
      rawInput: '',
    });
    setSearchTerm('');
    setShowDropdown(false);
    productSearchRef.current?.focus();
  };

  // Handle quantity change
  const handleQuantityChange = (e) => {
    const value = e.target.value;
    setCurrentItem({
      ...currentItem,
      rawInput: value,
      quantity: value,
    });
  };

  // Handle adding item to order
  const handleAddItem = () => {
    if (!currentItem.product || !currentItem.unit || !currentItem.quantity) {
      setError('Please select a product, unit, and enter quantity');
      return;
    }

    const quantity = parseFloat(currentItem.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    const newItem = {
      product: currentItem.product._id,
      productName: currentItem.productName,
      sku: currentItem.sku,
      unit: currentItem.unit,
      quantity: quantity,
      price: currentItem.price,
      amount: quantity * currentItem.price,
    };

    setOrderItems([...orderItems, newItem]);

    // Reset current item
    setCurrentItem({
      product: null,
      unit: '',
      quantity: '',
      price: 0,
      productName: '',
      sku: '',
      rawInput: '',
    });

    setError('');
  };

  // Handle removing item from order
  const handleRemoveItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Calculate subtotal
  const subtotal = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + item.amount, 0);
  }, [orderItems]);

  // Handle submitting order
  const handleSubmitOrder = async () => {
    if (orderItems.length === 0) {
      setError('Please add at least one item to the order');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      const orderData = {
        items: orderItems.map(item => ({
          productId: item.product,
          quantity: parseFloat(item.quantity),
          unit: item.unit,
        })),
      };

      await axios.post('/shop/orders', orderData);

      setMessage('✅ Order submitted successfully to Admin!');
      setOrderItems([]);

      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to submit order. Please try again.';
      setError(`❌ Order submission failed: ${errorMessage}`);
      console.error('Error submitting order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="p-10 text-center">Loading...</div>
  );

  return (
    // Main container with similar structure to ShopCreateBill
    <div className="bg-gray-100 h-screen flex flex-col font-sans overflow-y-auto overflow-x-hidden">
      <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Display Success Message */}
      {message && <div className="fixed top-5 right-5 z-50"><div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">{message}</div></div>}

      {/* Display Error Alert */}
      {error && <div className="fixed top-5 left-5 z-50"><div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">{error}</div></div>}

      {/* Header */}
      <div className="bg-white p-3 border-b shadow-sm z-20 shrink-0">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800">New Order (Shop)</h1>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Left Side: PO Info */}
          <div className="col-span-8 flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="w-1/3">
                <input type="text" placeholder="PO No." className="w-full p-2 border rounded text-sm" />
              </div>
              <div className="w-1/3">
                <input type="text" placeholder="PO Date" className="w-full p-2 border rounded text-sm" />
              </div>
              <div className="w-1/3">
                {/* Empty div to maintain layout */}
              </div>
            </div>
          </div>

          {/* Right Side: Invoice Meta */}
          <div className="col-span-4 flex flex-col gap-2 items-end text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Order No:</span>
              <span className="font-bold">Auto-Gen</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Date:</span>
              <span className="font-bold">{formatDateToDDMMYYYY(new Date())}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Time:</span>
              <span className="font-bold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 bg-white p-2">
        <table className="w-full border-collapse border border-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm text-xs uppercase text-gray-600 font-bold">
            <tr>
              <th className="p-2 border border-gray-200 w-8">#</th>
              <th className="p-2 border border-gray-200 text-left min-w-[200px]">ITEM</th>
              <th className="p-2 border border-gray-200 w-16">QTY</th>
              <th className="p-2 border border-gray-200 w-20">UNIT</th>
              <th className="p-2 border border-gray-200 w-28 text-right">
                PRICE/UNIT <br /><span className="text-[10px] lowercase font-normal">(Without Tax)</span>
              </th>
              <th className="p-2 border border-gray-200 w-24 text-right">AMOUNT</th>
              <th className="p-2 border border-gray-200 w-8"></th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {/* Input Row (Blue) */}
            <tr className="bg-blue-50">
              <td className="p-2 border border-blue-200 text-center text-blue-500 font-bold">⚡</td>
              <td className="p-2 border border-blue-200 relative">
                <div className="flex gap-2">
                  <input
                    ref={productSearchRef}
                    type="text"
                    className="flex-1 bg-transparent outline-none placeholder-blue-400 font-medium"
                    placeholder="Scan/Search Item..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => searchTerm && setShowDropdown(true)}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                  <button
                    type="button"
                    className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded border border-yellow-300 hover:bg-yellow-200 text-sm font-medium"
                    onClick={() => {
                      setShowStockAlertDropdown(!showStockAlertDropdown);
                      setShowDropdown(false);
                    }}
                  >
                    Stock Alerts
                  </button>
                </div>
                {showDropdown && (
                  <ul className="absolute left-0 top-full mt-1 w-full bg-white border shadow-lg max-h-60 overflow-y-auto z-50 rounded"
                    onMouseDown={(e) => e.stopPropagation()}>
                    {filteredProducts.map((p, i) => (
                      <li
                        key={p._id}
                        className={`p-2 cursor-pointer border-b flex justify-between ${i === selectedProductIndex ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectProduct(p);
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <span>{p.name} <small className="text-gray-400">({p.sku})</small></span>
                        <span className="font-bold text-green-600">₹{p.prices[0]?.sellingPrice}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div ref={stockAlertDropdownRef}>
                  {showStockAlertDropdown && (
                    <ul className="absolute left-0 top-full mt-1 w-full bg-white border shadow-lg max-h-60 overflow-y-auto z-50 rounded"
                      onMouseDown={(e) => e.stopPropagation()}>
                      {stockAlertProducts.length > 0 ? (
                        stockAlertProducts.map((p, i) => (
                          <li
                            key={p._id}
                            className={`p-2 cursor-pointer border-b flex justify-between hover:bg-gray-50`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectStockAlertProduct(p);
                            }}
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            <span>{p.name} <small className="text-gray-400">({p.sku})</small></span>
                            <span className="font-bold text-red-600">⚠️ Low: {p.stockLevel}</span>
                          </li>
                        ))
                      ) : (
                        <li className="p-2 text-gray-500 text-center">No stock alerts</li>
                      )}
                    </ul>
                  )}
                </div>
              </td>
              <td className="p-1 border border-blue-200">
                <input
                  type="text"
                  className="w-full bg-transparent outline-none text-center font-bold"
                  placeholder="0"
                  value={currentItem.rawInput || currentItem.quantity}
                  onChange={handleQuantityChange}
                />
              </td>
              <td className="p-1 border border-blue-200">
                <select
                  className="w-full bg-transparent outline-none text-xs"
                  value={currentItem.unit}
                  onChange={(e) => setCurrentItem({ ...currentItem, unit: e.target.value })}
                >
                  {currentItem.product && currentItem.product.prices ?
                    currentItem.product.prices.map(u => <option key={u.unit} value={u.unit}>{u.unit}</option>) :
                    <option>NONE</option>
                  }
                </select>
              </td>
              <td className="p-2 border border-blue-200 text-right">
                {currentItem.price || 0}
              </td>
              <td className="p-2 border border-blue-200 text-right font-bold">
                {((parseFloat(currentItem.rawInput || currentItem.quantity) || 0) * (currentItem.price || 0)).toFixed(2)}
              </td>
              <td className="p-1 border border-blue-200 text-center">
                <button
                  type="button"
                  className="p-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  onClick={handleAddItem}
                  disabled={!currentItem.product || !currentItem.unit || !currentItem.quantity}
                >
                  <LuPlus size={16} />
                </button>
              </td>
            </tr>

            {/* Order Items */}
            {orderItems.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="p-2 border border-gray-200 text-center">{index + 1}</td>
                <td className="p-2 border border-gray-200">
                  <div>
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-xs text-gray-500">{item.sku}</div>
                  </div>
                </td>
                <td className="p-2 border border-gray-200 text-center">{item.quantity}</td>
                <td className="p-2 border border-gray-200 text-center">{item.unit}</td>
                <td className="p-2 border border-gray-200 text-right">₹{item.price.toFixed(2)}</td>
                <td className="p-2 border border-gray-200 text-right font-bold">₹{item.amount.toFixed(2)}</td>
                <td className="p-1 border border-gray-200 text-center">
                  <button
                    type="button"
                    className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                    onClick={() => handleRemoveItem(index)}
                  >
                    <LuTrash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}

            {/* Empty State */}
            {orderItems.length === 0 && (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-500">
                  <LuShoppingCart className="mx-auto mb-2" size={24} />
                  <div>No items added yet</div>
                  <div className="text-sm">Add products using the search above</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with Totals and Actions */}
      <div className="bg-gray-50 p-3 border-t shrink-0">
        <div className="flex justify-end">
          <div className="flex-1 max-w-2xl">
            <div className="grid grid-cols-[1fr_auto] gap-y-2 items-center">

              {/* Row 1: Total */}
              <div className="flex justify-end items-center gap-4">
                <span className="font-bold text-gray-700">Total</span>
              </div>
              <div className="text-right w-32">
                <div className="bg-gray-100 border rounded px-2 py-1 font-bold text-gray-800 text-right">{subtotal.toFixed(2)}</div>
              </div>

              {/* Row 2: Buttons */}
              <div className="col-span-2 flex justify-end gap-2 mt-2">
                <button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || orderItems.length === 0}
                  className={`px-8 py-2 rounded font-bold ${isSubmitting || orderItems.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                >
                  {isSubmitting ? (
                    <>
                      <LuLoader className="animate-spin mr-2" /> Sending Order...
                    </>
                  ) : (
                    'Send Order to Admin'
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShopOrderManagement;