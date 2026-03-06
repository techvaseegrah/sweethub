import React, { useState, useEffect, useMemo } from 'react';
import axios from '../../../api/axios';
import { LuX, LuPackage } from 'react-icons/lu';
// Re-save to trigger compilation fix

function CreateInvoice({ closeModal, adminProducts, refreshProducts, shopId: propShopId, orderItems: propOrderItems, selectedOrder }) {
  const SHOPS_URL = '/admin/shops';
  const INVOICE_URL = '/admin/invoices';

  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [taxRate, setTaxRate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- FIX 1: Define the resetForm function ---
  const resetForm = () => {
    setSelectedShop(shops.length > 0 ? shops[0]._id : '');
    setInvoiceItems([]);
    setTaxRate('');
    setSearchTerm('');
    setSelectedCategory('');
    // Don't clear message here - let it display for the full 3 seconds
    setError('');
  };

  // --- FIX 2: Define the handleItemChange function ---
  const handleItemChange = (index, field, value) => {
    setInvoiceItems(prevItems =>
      prevItems.map((item, idx) => {
        if (idx === index) {
          // Handle partial decimal inputs - if the value ends with a dot but is not just a dot
          if (value.endsWith('.') && value !== '.') {
            // Store the partial input as a string to allow continued typing
            return { ...item, [field]: value };
          } else if (value === ".") {
            // Handle just a dot by itself
            return { ...item, [field]: value };
          } else {
            // For complete numbers, parse as float
            const numericValue = parseFloat(value);
            return { ...item, [field]: isNaN(numericValue) || numericValue < 0 ? '' : numericValue };
          }
        }
        return item;
      })
    );
  };

  const handleUnitChange = (index, newUnit) => {
    setInvoiceItems(prevItems =>
      prevItems.map((item, idx) => {
        if (idx === index) {
          // Find the price info for the new unit from the product's prices array
          const priceInfo = item.product.prices.find(p => p.unit === newUnit);
          if (priceInfo) {
            return {
              ...item,
              unit: newUnit,
              unitPrice: priceInfo.sellingPrice
            };
          }
        }
        return item;
      })
    );
  };

  // --- FIX 3: Calculate subtotal, taxAmount, and grandTotal ---
  const { subtotal, taxAmount, grandTotal } = useMemo(() => {
    const sub = invoiceItems.reduce((acc, item) => {
      // Handle partial decimal inputs
      if (typeof item.quantity === 'string' && (item.quantity === '0.' || item.quantity === '.')) {
        return acc + item.unitPrice * 0; // Treat partial inputs as 0 for calculation
      }
      const quantity = parseFloat(item.quantity) || 0;
      return acc + item.unitPrice * quantity;
    }, 0);
    const tax = sub * ((parseFloat(taxRate) || 0) / 100);
    const grand = sub + tax;
    return { subtotal: sub, taxAmount: tax, grandTotal: grand };
  }, [invoiceItems, taxRate]);


  useEffect(() => {
    const fetchShops = async () => {
      try {
        console.log('Fetching shops from:', SHOPS_URL);
        const response = await axios.get(SHOPS_URL, { withCredentials: true });
        console.log('Shops response:', response.data);
        const fetchedShops = response.data;
        setShops(fetchedShops);

        // Select shop from props if provided, otherwise select first shop
        if (propShopId) {
          setSelectedShop(propShopId);
        } else if (fetchedShops.length > 0) {
          setSelectedShop(fetchedShops[0]._id);
        } else {
          console.log('No shops found!');
          setError('No shops available. Please create a shop first.');
        }
      } catch (err) {
        console.log('Error fetching shops:', err);
        setError('Failed to fetch shops.');
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, [propShopId]);

  // Pre-populate invoice items from order items if provided
  useEffect(() => {
    console.log('[CreateInvoice] Pre-population useEffect triggered');
    console.log('[CreateInvoice] propOrderItems:', propOrderItems);
    console.log('[CreateInvoice] adminProducts count:', adminProducts?.length);

    if (propOrderItems && propOrderItems.length > 0 && adminProducts.length > 0) {
      console.log('[CreateInvoice] Starting pre-population of', propOrderItems.length, 'order items');

      const populatedItems = propOrderItems.map(orderItem => {
        console.log('[CreateInvoice] Processing orderItem:', orderItem);

        // Handle both populated and unpopulated product references
        const orderProductId = orderItem.product?._id || orderItem.product;
        console.log('[CreateInvoice] Looking for admin product match for ID:', orderProductId);

        // Find the corresponding admin product
        const adminProduct = adminProducts.find(p => String(p._id) === String(orderProductId));

        if (!adminProduct) {
          console.warn('[CreateInvoice] Admin product NOT found for product ID:', orderProductId);
          console.log('[CreateInvoice] Available admin product IDs:', adminProducts.map(p => p._id));
          return null;
        }
        console.log('[CreateInvoice] Found admin product match:', adminProduct.name);

        // Find the price for this unit
        const price = adminProduct.prices.find(p => p.unit === orderItem.unit);
        if (!price) {
          console.warn('[CreateInvoice] Price not found for unit:', orderItem.unit, 'in product:', adminProduct.name);
          console.log('[CreateInvoice] Available units for product:', adminProduct.prices.map(p => p.unit));
          return null;
        }
        console.log('[CreateInvoice] Found price for unit', orderItem.unit, ':', price.sellingPrice);

        const invoiceItem = {
          product: adminProduct,
          quantity: orderItem.quantity, // Use the quantity from the order
          unitPrice: price.sellingPrice,
          maxQuantity: adminProduct.stockLevel,
          unit: orderItem.unit,
          productName: orderItem.productName || adminProduct.name,
          isFromOrder: true // Mark as shop order product
        };

        console.log('[CreateInvoice] Created invoice item successfully:', {
          productName: invoiceItem.productName,
          quantity: invoiceItem.quantity,
          unit: invoiceItem.unit
        });

        return invoiceItem;
      }).filter(Boolean); // Remove any null items

      console.log('[CreateInvoice] Final populated items count:', populatedItems.length);
      console.log('[CreateInvoice] Setting', populatedItems.length, 'items to state');
      setInvoiceItems(populatedItems);
    } else {
      console.log('[CreateInvoice] Pre-population conditions not met:', {
        hasOrderItems: !!(propOrderItems && propOrderItems.length > 0),
        hasAdminProducts: !!(adminProducts && adminProducts.length > 0)
      });
    }
  }, [propOrderItems, adminProducts]);

  const [availabilityMap, setAvailabilityMap] = useState({});

  // Fetch availability for all current invoice items
  useEffect(() => {
    const fetchAvailability = async () => {
      if (invoiceItems.length === 0) {
        setAvailabilityMap({});
        return;
      }

      try {
        const itemsToCheck = invoiceItems.map(item => ({
          productId: item.product._id,
          productName: item.productName || item.product.name,
          quantity: parseFloat(item.quantity) || 0,
          unit: item.unit
        }));

        const response = await axios.post('/admin/orders/check-availability', { items: itemsToCheck });

        if (response.data && response.data.items) {
          const newMap = {};
          response.data.items.forEach(info => {
            const key = `${info.productId}-${info.unit}`;
            newMap[key] = info;
          });
          setAvailabilityMap(newMap);
        }
      } catch (err) {
        console.error('Error fetching availability:', err);
      }
    };

    // Debounce availability check to avoid too many requests
    const timeoutId = setTimeout(() => {
      fetchAvailability();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [invoiceItems]);

  const handleProductSelection = (product, price) => {
    const existingItem = invoiceItems.find(item => item.product._id === product._id && item.unit === price.unit);

    if (existingItem) {
      // Prevent removing shop order products
      if (existingItem.isFromOrder) {
        console.log('[CreateInvoice] Preventing removal of shop order product:', existingItem.productName);
        return; // Don't allow removal of shop order products
      }
      setInvoiceItems(invoiceItems.filter(item => item !== existingItem));
    } else {
      setInvoiceItems([...invoiceItems, {
        product: product,
        quantity: '', // Set initial quantity to blank
        unitPrice: price.sellingPrice,
        maxQuantity: product.stockLevel,
        unit: price.unit,
        productName: product.name, // Include product name for availability checking
        isFromOrder: false // External product
      }]);
    }
  };

  const categories = useMemo(() => {
    if (!adminProducts) return [];
    const allCategories = adminProducts
      .map(p => p.category?.name || (typeof p.category === 'string' ? p.category : ''))
      .filter(Boolean);
    return [...new Set(allCategories)].sort();
  }, [adminProducts]);

  const filteredProducts = useMemo(() => {
    return adminProducts.filter(p => {
      if (p.stockLevel <= 0) return false;

      const searchMatch = !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());

      const catName = p.category?.name || (typeof p.category === 'string' ? p.category : '');
      const categoryMatch = !selectedCategory || catName === selectedCategory;

      return searchMatch && categoryMatch;
    });
  }, [searchTerm, selectedCategory, adminProducts]);

  const handleSubmitInvoice = async () => {
    if (!selectedShop) {
      setError('Please select a shop.');
      return;
    }
    if (invoiceItems.length === 0) {
      setError('Please add at least one product to the invoice.');
      return;
    }

    setIsSubmitting(true);

    // Check for partial decimal inputs
    const hasPartialInputs = invoiceItems.some(item =>
      typeof item.quantity === 'string' && (item.quantity === '0.' || item.quantity === '.')
    );

    if (hasPartialInputs) {
      setError('Please complete all quantity fields. Partial decimal entries (like "0." or ".") are not allowed.');
      setIsSubmitting(false);
      return;
    }

    const hasInvalidQuantity = invoiceItems.some(item => {
      // For numeric values, check if they're valid (greater than 0)
      const quantityValue = parseFloat(item.quantity);
      return !item.quantity || isNaN(quantityValue) || quantityValue <= 0;
    });
    if (hasInvalidQuantity) {
      setError('All products in the invoice must have a quantity greater than 0.');
      setIsSubmitting(false); // Stop the submission from proceeding
      return;
    }

    // Check if requested quantities exceed available stock
    const stockExceededErrors = [];
    invoiceItems.forEach(item => {
      if (item.maxQuantity !== undefined && parseFloat(item.quantity) > item.maxQuantity) {
        stockExceededErrors.push(`${item.product.name}: Requested ${item.quantity}, Available ${item.maxQuantity}`);
      }
    });

    if (stockExceededErrors.length > 0) {
      setError(`Insufficient stock for: ${stockExceededErrors.join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    setError('');
    setMessage('');

    const payload = {
      shopId: selectedShop,
      items: invoiceItems.map(item => ({
        product: item.product._id, // Changed from productId to product to match backend expectation
        productName: item.productName || item.product.name, // Include product name for availability checking (using either from order or from product)
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unit: item.unit, // Include unit information
      })),
      tax: parseFloat(taxRate) || 0,
      ...(propOrderItems && propOrderItems.length > 0 && selectedOrder && selectedOrder._id ? { orderId: selectedOrder._id } : {}), // Include orderId if creating invoice from order
    };

    try {
      await axios.post(INVOICE_URL, payload, { withCredentials: true });

      // Find the selected shop name to show in success message
      const selectedShopData = shops.find(shop => shop._id === selectedShop);
      const shopName = selectedShopData ? selectedShopData.name : 'the selected shop';

      setMessage(`Invoice created and sent successfully to ${shopName}!`);
      if (refreshProducts) {
        refreshProducts();
      }

      // Clear form after setting success message
      setTimeout(() => {
        resetForm();
      }, 500);

      // Close modal after 3 seconds
      setTimeout(() => {
        closeModal();
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="p-6 text-center flex flex-col items-center justify-center">
      <div className="relative flex justify-center items-center mb-4">
        <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
        <img
          src="/sweethub-logo.png"
          alt="Sweet Hub Logo"
          className="absolute w-8 h-8"
        />
      </div>
      <div className="text-red-500 font-medium">Loading...</div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh]">
        <header className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800">Create New Invoice</h3>
          <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-200"><LuX size={20} /></button>
        </header>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-1/2 p-4 border-r overflow-y-auto">
            {/* Shop Order Requirements Section */}
            {propOrderItems && propOrderItems.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-md font-bold mb-3 flex items-center text-blue-800">
                  <LuPackage className="mr-2" /> Shop Order Requirements
                </h4>
                <div className="overflow-x-auto rounded-lg border border-blue-100 bg-white">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-blue-700">Product</th>
                        <th className="px-3 py-2 text-center font-semibold text-blue-700">Ordered Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {propOrderItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-medium text-gray-800">{item.productName}</td>
                          <td className="px-3 py-2 text-center font-bold text-blue-600">{item.quantity} {item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="label-style">Search Products</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  placeholder="Search by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-style flex-1"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input-style flex-1"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-3">
              {filteredProducts.map(product => (
                <div key={product._id} className="p-3 border rounded-lg bg-gray-50">
                  <p className="font-semibold">{product.name} <span className="text-gray-500 font-normal"> (Stock: {product.stockLevel})</span></p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                    {product.prices.map(price => {
                      const isOrderProduct = invoiceItems.some(
                        item => item.product._id === product._id &&
                          item.unitPrice === price.sellingPrice &&
                          item.isFromOrder
                      );
                      return (
                        <label key={price._id} className={`flex items-center space-x-2 text-sm ${isOrderProduct ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            checked={invoiceItems.some(item => item.product._id === product._id && item.unitPrice === price.sellingPrice)}
                            onChange={() => handleProductSelection(product, price)}
                            disabled={isOrderProduct}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <span>{price.unit} - ₹{price.sellingPrice}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <main className="w-full md:w-1/2 p-4 sm:p-6 flex flex-col overflow-y-auto">
            <div className="mb-6">
              <label className="label-style">Deliver To Shop</label>
              <select value={selectedShop} onChange={(e) => setSelectedShop(e.target.value)} className="input-style mt-1">
                {shops.map(shop => <option key={shop._id} value={shop._id}>{shop.name}</option>)}
              </select>
            </div>

            <h4 className="font-semibold mb-2">Products Added to Invoice</h4>
            <div className="flex-1 overflow-x-auto rounded-lg border">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="th-style">Product</th>
                    <th className="th-style text-center">Price</th>
                    <th className="th-style text-center">Ordered</th>
                    <th className="th-style text-center text-blue-700">Qty to Send</th>
                    <th className="th-style text-center">Stock Status</th>
                    <th className="th-style text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-10 text-gray-500">Select products from the list.</td></tr>
                  ) : (
                    invoiceItems.map((item, index) => {
                      // Find the ordered quantity if this item came from the order
                      const orderedItem = propOrderItems?.find(oi =>
                        String(oi.product?._id || oi.product) === String(item.product._id) && oi.unit === item.unit
                      );

                      // Get availability info
                      const availability = availabilityMap[`${item.product._id}-${item.unit}`];

                      const getBadgeColor = (status) => {
                        switch (status) {
                          case 'View Products': return 'bg-green-100 text-green-800';
                          case 'After Packing': return 'bg-blue-100 text-blue-800';
                          case 'Before Packing': return 'bg-yellow-100 text-yellow-800';
                          case 'Production Schedules': return 'bg-purple-100 text-purple-800';
                          default: return 'bg-red-100 text-red-800';
                        }
                      };

                      return (
                        <tr key={`${item.product._id}-${item.unit}`} className={`border-b ${item.isFromOrder ? 'bg-blue-50' : ''}`}>
                          <td className="td-style">
                            <div className="flex flex-col">
                              <p className="font-medium">{item.product.name}</p>
                              <p className="text-[10px] text-gray-400">SKU: {item.product.sku}</p>
                              {item.isFromOrder && (
                                <span className="mt-1 w-fit px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded-full uppercase font-bold">
                                  Order Item
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="td-style text-center">
                            <p className="font-bold text-gray-800 text-xs">₹{item.unitPrice.toFixed(2)}</p>
                            <span className="text-[10px] text-gray-400 uppercase">{item.unit}</span>
                          </td>
                          <td className="td-style text-center">
                            {orderedItem ? (
                              <span className="font-bold text-blue-600">{orderedItem.quantity}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="td-style text-center min-w-[140px]">
                            <div className="flex items-center justify-center gap-1.5 p-1">
                              <input
                                type="text"
                                value={item.quantity}
                                placeholder="0"
                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                className="w-16 px-2 py-1.5 border-2 border-blue-400 rounded-md text-center font-bold text-blue-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-blue-50/30"
                              />
                              <select
                                value={item.unit}
                                onChange={(e) => handleUnitChange(index, e.target.value)}
                                disabled={item.isFromOrder}
                                className={`text-[10px] font-bold border rounded px-1 py-1.5 ${item.isFromOrder ? 'bg-gray-100 cursor-not-allowed text-gray-500 border-gray-200' : 'bg-white border-blue-300 text-blue-800 cursor-pointer shadow-sm hover:border-blue-500'}`}
                              >
                                {item.product.prices.map(price => (
                                  <option key={price.unit} value={price.unit}>{price.unit}</option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="td-style text-center">
                            <div className="flex flex-col items-center gap-1">
                              {availability ? (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${getBadgeColor(availability.availableIn)} uppercase whitespace-nowrap`}>
                                  {availability.availableIn === 'Not Available' ? 'Out of Stock' : availability.availableIn}
                                </span>
                              ) : (
                                <span className="text-[9px] text-gray-400 italic">Checking...</span>
                              )}
                              <div className="flex items-center gap-1">
                                <span className={`text-xs font-bold ${(item.maxQuantity || 0) < (parseFloat(item.quantity) || 0) ? 'text-red-600' : 'text-gray-700'}`}>
                                  {item.maxQuantity !== undefined ? item.maxQuantity : 'N/A'}
                                </span>
                                <span className="text-[9px] text-gray-400 uppercase font-medium">{item.unit}</span>
                              </div>
                              {availability && availability.availableIn !== 'View Products' && (
                                <p className="text-[8px] text-blue-600 font-medium italic">({availability.availableQuantity} in {availability.availableIn})</p>
                              )}
                            </div>
                          </td>
                          <td className="td-style text-right font-bold text-gray-800">
                            ₹{(item.unitPrice * (typeof item.quantity === 'string' && (item.quantity === '0.' || item.quantity === '.') ? 0 : parseFloat(item.quantity) || 0)).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-auto pt-6 border-t mt-6">
              <div className="flex justify-between items-center font-bold text-xl text-gray-900 px-2">
                <span>Grand Total:</span>
                <span className="text-blue-700">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </main>
        </div>

        <footer className="p-4 bg-gray-50 border-t flex justify-end items-center gap-3">
          {message && (
            <div className="fixed top-4 right-4 z-[9999] bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
              <p className="font-semibold">{message}</p>
            </div>
          )}
          {error && <p className="text-red-600 font-semibold">{error}</p>}
          <button onClick={closeModal} className="btn-secondary">Cancel</button>
          <button
            onClick={handleSubmitInvoice}
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Create & Send Invoice'}
          </button>
        </footer>
      </div>
    </div>
  );
}

const style = document.createElement('style');
style.innerHTML = `
  .input-style { display: block; width: 100%; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: #1f2937; background-color: #fff; border: 1px solid #d1d5db; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
  .label-style { font-size: 0.875rem; font-weight: 500; color: #374151; }
  .th-style { padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #4b5563; text-transform: uppercase; }
  .td-style { padding: 0.75rem 1rem; font-size: 0.875rem; color: #111827; vertical-align: middle; }
  .btn-primary { padding: 0.6rem 1.2rem; background-color: #4f46e5; color: white; border-radius: 0.375rem; font-weight: 600; border: none; cursor: pointer; }
  .btn-secondary { padding: 0.6rem 1.2rem; background-color: #e5e7eb; color: #1f2937; border-radius: 0.375rem; font-weight: 600; border: none; cursor: pointer; }
  /* CSS to hide number input spinners */
  .no-spinner::-webkit-outer-spin-button,
  .no-spinner::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .no-spinner {
    -moz-appearance: textfield;
  }
`;
document.head.appendChild(style);

export default CreateInvoice;