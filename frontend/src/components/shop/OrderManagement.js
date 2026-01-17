import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from '../../api/axios'; // Corrected import path - from shop folder to api folder
import { LuX, LuPlus, LuTrash2, LuShoppingCart, LuPackage, LuCalendar, LuDollarSign, LuLoader } from 'react-icons/lu';
import { formatDateToDDMMYYYY } from '../../utils/unitConversion';

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
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
  
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

  // Load products for the shop
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/shop/products');
        setProducts(response.data);
      } catch (err) {
        if (err.response?.status === 403) {
          setError('Access denied. Please log in again.');
        } else {
          setError(err.response?.data?.message || 'Failed to load products');
        }
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, products]);

  const handleSelectProduct = (product) => {
    setSearchTerm(`${product.name}`);
    setShowDropdown(false);
    
    if (product.prices && product.prices.length > 0) {
      setCurrentItem({
        product,
        unit: product.prices[0].unit,
        quantity: '',
        price: product.prices[0].sellingPrice,
        productName: product.name,
        sku: product.sku,
        rawInput: ''
      });
      setError('');
    } else {
      setError(`Product "${product.name}" has no purchase rates.`);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);
    if (value) {
      setSelectedProductIndex(0);
    } else {
      setShowDropdown(false);
    }
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    const numValue = parseFloat(value);
    
    if (value === "" || value === "0." || value === "." || (!isNaN(numValue) && numValue >= 0)) {
      setCurrentItem(prev => ({ ...prev, rawInput: value, quantity: value }));
    }
  };

  const handleAddItem = () => {
    let finalQuantity;
    let isValid = false;
    
    if (currentItem.rawInput) {
      const parsedRaw = parseFloat(currentItem.rawInput);
      if (!isNaN(parsedRaw) && isFinite(parsedRaw) && parsedRaw >= 0) {
        finalQuantity = parsedRaw;
        isValid = true;
      }
    } else if (currentItem.quantity !== '') {
      const parsedQuantity = parseFloat(currentItem.quantity);
      if (!isNaN(parsedQuantity) && isFinite(parsedQuantity) && parsedQuantity >= 0) {
        finalQuantity = parsedQuantity;
        isValid = true;
      }
    }
    
    if (!isValid || !currentItem.product || finalQuantity <= 0) {
      setError('Invalid product or quantity.');
      return;
    }
    
    const newItem = {
      product: currentItem.product._id,
      productName: currentItem.productName,
      sku: currentItem.sku,
      unit: currentItem.unit,
      quantity: finalQuantity,
      price: currentItem.price,
    };
    
    const existingIndex = orderItems.findIndex(i => i.product === newItem.product && i.unit === newItem.unit);
    if (existingIndex > -1) {
      const updated = [...orderItems];
      updated[existingIndex].quantity += newItem.quantity;
      setOrderItems(updated);
    } else {
      setOrderItems([...orderItems, newItem]);
    }

    setSearchTerm('');
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
    setTimeout(() => productSearchRef.current?.focus(), 50);
  };

  const removeItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index, field, value) => {
    const updatedItems = [...orderItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setOrderItems(updatedItems);
  };

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.price) || 0;
      return sum + (quantity * price);
    }, 0);

    return { subtotal };
  };

  const { subtotal } = calculateTotals();

  const handleSubmitOrder = async () => {
    if (orderItems.length === 0) {
      setError('Please add at least one product to the order.');
      return;
    }

    // Validate all items have valid quantities
    for (const item of orderItems) {
      const quantity = parseFloat(item.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        setError(`Please enter a valid quantity for ${item.productName}.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        items: orderItems.map(item => ({
          productId: item.product,
          quantity: parseFloat(item.quantity),
          unit: item.unit,
        })),
      };

      await axios.post('/shop/orders', orderData);
      
      setMessage('Order submitted successfully!');
      setOrderItems([]);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit order. Please try again.');
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
                PRICE/UNIT <br/><span className="text-[10px] lowercase font-normal">(Without Tax)</span>
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
                <input 
                  ref={productSearchRef}
                  type="text" 
                  className="w-full bg-transparent outline-none placeholder-blue-400 font-medium"
                  placeholder="Scan/Search Item..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => searchTerm && setShowDropdown(true)}
                />
                {showDropdown && (
                  <ul className="absolute left-0 top-full mt-1 w-full bg-white border shadow-lg max-h-60 overflow-y-auto z-50 rounded">
                    {filteredProducts.map((p, i) => (
                      <li 
                        key={p._id} 
                        className={`p-2 cursor-pointer border-b flex justify-between ${i === selectedProductIndex ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                        onClick={() => handleSelectProduct(p)}
                      >
                        <span>{p.name} <small className="text-gray-400">({p.sku})</small></span>
                        <span className="font-bold text-green-600">₹{p.prices[0]?.sellingPrice}</span>
                      </li>
                    ))}
                  </ul>
                )}
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
                  onChange={(e) => setCurrentItem({...currentItem, unit: e.target.value})}
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
                {((parseFloat(currentItem.quantity) || 0) * (currentItem.price || 0)).toFixed(2)}
              </td>
              <td className="p-1 border border-blue-200 text-center">
                <button 
                  onClick={handleAddItem} 
                  className="text-blue-600 font-bold text-xl hover:scale-110 transition-transform" 
                  disabled={!currentItem.product}
                >
                  +
                </button>
              </td>
            </tr>

            {/* Data Rows */}
            {orderItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="p-2 border border-gray-200 text-center text-gray-500">{idx + 1}</td>
                <td className="p-2 border border-gray-200 font-medium">{item.productName}</td>
                <td className="p-2 border border-gray-200 text-center">
                  <input 
                    type="text" 
                    className="w-full text-center p-1 border rounded bg-transparent hover:bg-white" 
                    value={item.quantity} 
                    onChange={e => updateOrderItem(idx, 'quantity', parseFloat(e.target.value) || 0)} 
                    min="0"
                  />
                </td>
                <td className="p-2 border border-gray-200 text-center">
                  <select 
                    className="w-full text-center p-1 border rounded bg-transparent hover:bg-white" 
                    value={item.unit} 
                    onChange={e => updateOrderItem(idx, 'unit', e.target.value)}
                  >
                    <option value={item.unit}>{item.unit}</option>
                  </select>
                </td>
                <td className="p-2 border border-gray-200 text-right">
                  <input 
                    type="text" 
                    className="w-full text-right p-1 border rounded bg-transparent hover:bg-white" 
                    value={item.price} 
                    onChange={e => updateOrderItem(idx, 'price', parseFloat(e.target.value) || 0)} 
                    min="0"
                    step="0.01"
                  />
                </td>
                <td className="p-2 border border-gray-200 text-right font-bold">
                  {(item.quantity * item.price).toFixed(2)}
                </td>
                <td className="p-2 border border-gray-200 text-center">
                  <button 
                    onClick={() => removeItem(idx)} 
                    className="text-red-400 hover:text-red-600 font-bold"
                    title="Remove"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
            
            {/* Add Row Button Row */}
            <tr>
              <td colSpan="7" className="p-2 border border-gray-200">
                <button 
                  onClick={() => productSearchRef.current?.focus()}
                  className="bg-white border border-blue-300 text-blue-500 px-4 py-1 rounded text-sm font-bold hover:bg-blue-50 uppercase"
                >
                  + Add Row
                </button>
              </td>
            </tr>
            
            {/* Total Row */}
            <tr className="bg-gray-50 font-bold">
              <td colSpan="4" className="border border-gray-200 p-2 text-right">TOTAL</td>
              <td className="border border-gray-200 p-2 text-center">{orderItems.reduce((acc, i) => acc + parseFloat(i.quantity), 0)}</td>
              <td className="border border-gray-200 p-2 text-right">{subtotal.toFixed(2)}</td>
              <td className="border border-gray-200"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-white border-t p-4 shrink-0 z-30 shadow-[0_-4px_8px_rgba(0,0,0,0.05)] text-sm">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Left Column - Empty to maintain layout */}
          <div className="flex-1 space-y-4">
            {/* Empty to maintain layout */}
          </div>

          {/* Right Column: Calculations */}
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
                  className={`px-8 py-2 rounded font-bold ${
                    isSubmitting || orderItems.length === 0
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