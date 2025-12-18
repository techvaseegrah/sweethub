import React, { useState, useEffect, useMemo } from 'react';
import axios from '../../../api/axios';
import { LuX } from 'react-icons/lu';

function CreateInvoice({ closeModal, adminProducts, refreshProducts }) {
  const SHOPS_URL = '/admin/shops';
  const INVOICE_URL = '/admin/invoices';

  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [taxRate, setTaxRate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
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
    // Don't clear message here - let it display for the full 3 seconds
    setError('');
  };
  
  // --- FIX 2: Define the handleItemChange function ---
  const handleItemChange = (productId, unit, field, value) => {
    setInvoiceItems(prevItems =>
      prevItems.map(item => {
        if (item.product._id === productId && item.unit === unit) {
          // Ensure we handle empty string correctly, defaulting to 0 for calculation
          const numericValue = parseInt(value, 10);
          return { ...item, [field]: isNaN(numericValue) ? '' : numericValue };
        }
        return item;
      })
    );
  };
  
  // --- FIX 3: Calculate subtotal, taxAmount, and grandTotal ---
  const { subtotal, taxAmount, grandTotal } = useMemo(() => {
    const sub = invoiceItems.reduce((acc, item) => {
      const quantity = parseInt(item.quantity, 10) || 0;
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
        if (fetchedShops.length > 0) {
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
  }, []);

  const handleProductSelection = (product, price) => {
    const existingItem = invoiceItems.find(item => item.product._id === product._id && item.unitPrice === price.sellingPrice);

    if (existingItem) {
      setInvoiceItems(invoiceItems.filter(item => item !== existingItem));
    } else {
      setInvoiceItems([...invoiceItems, {
        product: product,
        quantity: '', // Set initial quantity to blank
        unitPrice: price.sellingPrice,
        maxQuantity: product.stockLevel,
        unit: price.unit,
      }]);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return adminProducts.filter(p => p.stockLevel > 0);
    return adminProducts.filter(p =>
      p.stockLevel > 0 &&
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, adminProducts]);

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

    const hasInvalidQuantity = invoiceItems.some(item => !item.quantity || parseInt(item.quantity, 10) <= 0);
    if (hasInvalidQuantity) {
        setError('All products in the invoice must have a quantity greater than 0.');
        setIsSubmitting(false); // Stop the submission from proceeding
        return;
    }

    
    setError('');
    setMessage('');

    const payload = {
      shopId: selectedShop,
      items: invoiceItems.map(item => ({
        productId: item.product._id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unit: item.unit, // Include unit information
      })),
      tax: parseFloat(taxRate) || 0,
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
            <div className="mb-4">
                <label className="label-style">Search Products</label>
                <input
                    type="text"
                    placeholder="Search by name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-style mt-1"
                />
            </div>
            <div className="space-y-3">
              {filteredProducts.map(product => (
                <div key={product._id} className="p-3 border rounded-lg bg-gray-50">
                  <p className="font-semibold">{product.name} <span className="text-gray-500 font-normal"> (Stock: {product.stockLevel})</span></p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                    {product.prices.map(price => (
                      <label key={price._id} className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={invoiceItems.some(item => item.product._id === product._id && item.unitPrice === price.sellingPrice)}
                          onChange={() => handleProductSelection(product, price)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{price.unit} - ₹{price.sellingPrice}</span>
                      </label>
                    ))}
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
                    <th className="th-style">Unit</th>
                    <th className="th-style">Qty</th>
                    <th className="th-style">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-10 text-gray-500">Select products from the list.</td></tr>
                  ) : (
                    invoiceItems.map(item => (
                      <tr key={`${item.product._id}-${item.unit}`} className="border-b">
                        <td className="td-style">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-xs text-gray-500">SKU: {item.product.sku}</p>
                        </td>
                        <td className="td-style">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.unit}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">@ ₹{item.unitPrice.toFixed(2)}</p>
                        </td>
                        <td className="td-style">
                          <input 
                            type="text" 
                            value={item.quantity} 
                            placeholder="0"
                            onChange={(e) => handleItemChange(item.product._id, item.unit, 'quantity', e.target.value)} 
                            className="w-20 sm:w-24 input-style no-spinner" 
                          />
                        </td>
                        <td className="td-style font-semibold">₹{(item.unitPrice * (parseInt(item.quantity, 10) || 0)).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-auto pt-6">
                <div className="space-y-2">
                    <div className="flex justify-between items-center"><span className="text-gray-600">Subtotal:</span><span className="font-semibold text-gray-800">₹{subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center gap-4"><label className="text-gray-600">Tax (%):</label>
                        <input 
                            type="text" 
                            value={taxRate}
                            placeholder="0" 
                            onChange={(e) => setTaxRate(e.target.value)} 
                            className="w-24 input-style text-right no-spinner" 
                        />
                    </div>
                    <div className="flex justify-between"><span className="text-gray-600">Tax Amount:</span><span className="font-semibold text-gray-800">₹{taxAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span>Grand Total:</span><span>₹{grandTotal.toFixed(2)}</span></div>
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