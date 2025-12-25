import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../../../api/axios';
import { generateInvoicePdf } from '../../../utils/generateInvoicePdf';
import CustomModal from '../../CustomModal'; // Added import for CustomModal
import KeyboardShortcutsGuide from './KeyboardShortcutsGuide'; // Import keyboard shortcuts guide

function CreateBill({ baseUrl = '/shop' }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [customerMobileNumber, setCustomerMobileNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [currentItem, setCurrentItem] = useState({
    product: null,
    unit: '',
    quantity: '',
    price: 0,
    productName: '',
    sku: '',
  });

  const [billItems, setBillItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0); // Add subtotal state
  const [discountType, setDiscountType] = useState('none'); // Add discount type state
  const [discountValue, setDiscountValue] = useState(''); // Add discount value state
  const [discountAmount, setDiscountAmount] = useState(0); // Add discount amount state
  const [netAmount, setNetAmount] = useState(0); // Add net amount state
  const [totalAmount, setTotalAmount] = useState(0); // Update total amount calculation
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [autoDownload, setAutoDownload] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  
  // States for out of stock modals
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  const [showConfirmOutOfStockModal, setShowConfirmOutOfStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockQuantity, setStockQuantity] = useState(0);
  const customerMobileRef = useRef(null);
  const customerNameRef = useRef(null);
  const productSearchRef = useRef(null);
  const quantityRef = useRef(null);
  const discountTypeRef = useRef(null);
  const discountValueRef = useRef(null);
  const paymentMethodRef = useRef(null);
  const amountPaidRef = useRef(null);
  const createBillButtonRef = useRef(null);
  
  const PRODUCT_URL = `${baseUrl}/products`;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(PRODUCT_URL, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });
      setProducts(response.data);
    } catch (err) {
      setError('Failed to fetch products.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [PRODUCT_URL]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Calculate amounts when billItems or discount changes
  useEffect(() => {
    const newSubtotal = billItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    setSubtotal(newSubtotal);
    
    // Calculate discount
    let calculatedDiscountAmount = 0;
    if (discountType === 'percentage' && discountValue) {
      const percentage = parseFloat(discountValue);
      if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
        calculatedDiscountAmount = (newSubtotal * percentage) / 100;
      }
    } else if (discountType === 'cash' && discountValue) {
      const cash = parseFloat(discountValue);
      if (!isNaN(cash) && cash >= 0 && cash <= newSubtotal) {
        calculatedDiscountAmount = cash;
      }
    }
    
    setDiscountAmount(calculatedDiscountAmount);
    
    // Calculate net amount and total
    const newNetAmount = newSubtotal - calculatedDiscountAmount;
    setNetAmount(newNetAmount);
    setTotalAmount(newNetAmount);
  }, [billItems, discountType, discountValue]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true); // Show dropdown when typing

    if (value) {
      const filtered = products.filter(
        (product) =>
          (product.name && product.name.toLowerCase().includes(value.toLowerCase())) ||
          (product.sku && product.sku.toLowerCase().includes(value.toLowerCase()))
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
      setShowDropdown(false);
    }
  };

  const handleToggleDropdown = () => {
    setShowProductModal(!showProductModal);
    setShowDropdown(false); // Hide dropdown when opening
    
    // Reset modal search and category when opening
    if (!showProductModal) {
      setModalSearchTerm('');
      setSelectedCategory('All');
    }
  };

  const handleInputFocus = () => {
    // Don't show all products when focusing, only when typing
  };

  // Group products by category
  const groupProductsByCategory = (products) => {
    return products.reduce((groups, product) => {
      const category = product.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(product);
      return groups;
    }, {});
  };

  // Get unique categories from products
  const getUniqueCategories = (products) => {
    const categories = products.map(product => product.category?.name || 'Uncategorized');
    return ['All', ...new Set(categories)];
  };

  // Close dropdowns when pressing Escape key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
        setShowProductModal(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);
  
  // Keyboard navigation for product dropdown
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
  
  useEffect(() => {
    if (showDropdown && filteredProducts.length > 0) {
      setSelectedProductIndex(0);
    } else {
      setSelectedProductIndex(-1);
    }
  }, [showDropdown, filteredProducts]);
  
  const handleProductKeyDown = (event) => {
    if (!showDropdown || filteredProducts.length === 0) return;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedProductIndex(prev => 
          prev < filteredProducts.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedProductIndex(prev => 
          prev > 0 ? prev - 1 : filteredProducts.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedProductIndex >= 0 && filteredProducts[selectedProductIndex]) {
          handleSelectProduct(filteredProducts[selectedProductIndex]);
        }
        break;
      case 'Tab':
        // Allow normal tab behavior
        break;
      default:
        // For other keys, reset to first item if needed
        if (selectedProductIndex === -1 && filteredProducts.length > 0) {
          setSelectedProductIndex(0);
        }
    }
  };

  const handleSelectProduct = (product) => {
    // Check if product is out of stock
    if (product.stockLevel <= 0) {
      // Show out of stock modal
      setSelectedProduct(product);
      setStockQuantity(product.stockLevel);
      setShowProductModal(false); // Close the product selection modal first
      setTimeout(() => {
        setShowOutOfStockModal(true); // Show out of stock modal after a brief delay
      }, 100);
      return;
    }
    
    setSearchTerm(`${product.name} (${product.sku})`);
    setShowProductModal(false);
    setShowDropdown(false); // Hide dropdown when product is selected
    setModalSearchTerm('');
    setSelectedCategory('All');
    
    if (product.prices && product.prices.length > 0) {
      setCurrentItem({
        product,
        unit: product.prices[0].unit,
        quantity: '',
        price: product.prices[0].sellingPrice,
        productName: product.name,
        sku: product.sku,
      });
      setError('');
    } else {
      setError(`Product "${product.name}" has no purchase rates set. Please add them first.`);
      setCurrentItem({ product: null, unit: '', quantity: '', price: 0, productName: '', sku: '' });
    }
  };
  
  // Handle confirming out of stock product selection
  const handleConfirmOutOfStock = () => {
    setShowOutOfStockModal(false);
    setShowConfirmOutOfStockModal(true);
  };
  
  // Handle final confirmation to add out of stock product
  const handleFinalConfirmOutOfStock = () => {
    setShowConfirmOutOfStockModal(false);
    
    if (selectedProduct) {
      setSearchTerm(`${selectedProduct.name} (${selectedProduct.sku})`);
      setShowProductModal(false);
      setShowDropdown(false);
      setModalSearchTerm('');
      setSelectedCategory('All');
      
      if (selectedProduct.prices && selectedProduct.prices.length > 0) {
        setCurrentItem({
          product: selectedProduct,
          unit: selectedProduct.prices[0].unit,
          quantity: '',
          price: selectedProduct.prices[0].sellingPrice,
          productName: selectedProduct.name,
          sku: selectedProduct.sku,
        });
        setError('');
      } else {
        setError(`Product "${selectedProduct.name}" has no purchase rates set. Please add them first.`);
        setCurrentItem({ product: null, unit: '', quantity: '', price: 0, productName: '', sku: '' });
      }
    }
  };

  const handleUnitChange = (e) => {
    const selectedUnit = e.target.value;
    const priceInfo = currentItem.product.prices.find(p => p.unit === selectedUnit);
    if (priceInfo) {
      setCurrentItem(prev => ({ ...prev, unit: priceInfo.unit, price: priceInfo.sellingPrice }));
    }
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    // Allow empty value to enable proper editing
    if (value === '') {
      setCurrentItem(prev => ({ ...prev, quantity: '' }));
    } else {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue > 0) {
        setCurrentItem(prev => ({ ...prev, quantity: numValue }));
      }
    }
  };
  
  const handleAddItem = () => {
    // Handle empty quantity by defaulting to 1
    const quantity = currentItem.quantity === '' ? 1 : currentItem.quantity;
    
    if (!currentItem.product || quantity <= 0) {
      setError('Please select a valid product and quantity.');
      return;
    }
    
    const newItem = {
      product: currentItem.product._id,
      productName: currentItem.productName,
      sku: currentItem.sku,
      unit: currentItem.unit,
      quantity: quantity,
      price: currentItem.price,
    };
    
    const existingItemIndex = billItems.findIndex(item => item.product === newItem.product && item.unit === newItem.unit);

    if (existingItemIndex > -1) {
        const updatedItems = [...billItems];
        updatedItems[existingItemIndex].quantity += newItem.quantity;
        setBillItems(updatedItems);
    } else {
        setBillItems([...billItems, newItem]);
    }

    setSearchTerm('');
    setCurrentItem({ product: null, unit: '', quantity: '', price: 0, productName: '', sku: '' }); 
    setError('');
  };

  const handleRemoveItem = (index) => {
    const newBillItems = billItems.filter((_, i) => i !== index);
    setBillItems(newBillItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!customerMobileNumber || !customerName) {
      setError('Please enter customer details.');
      return;
    }
    if (billItems.length === 0) {
      setError('Please add at least one item to the bill.');
      return;
    }
    
    // Validate discount
    if (discountType !== 'none' && discountValue) {
      const value = parseFloat(discountValue);
      if (isNaN(value)) {
        setError('Please enter a valid discount value.');
        return;
      }
      
      if (discountType === 'percentage' && (value < 0 || value > 100)) {
        setError('Percentage discount must be between 0 and 100.');
        return;
      }
      
      if (discountType === 'cash' && (value < 0 || value > subtotal)) {
        setError('Cash discount cannot be negative or exceed subtotal.');
        return;
      }
    }
    
    const amountPaidNumber = Number(amountPaid);
    if (amountPaidNumber < totalAmount) {
      setError('Amount paid cannot be less than total amount.');
      return;
    }
    
    const BILL_URL = `${baseUrl}/billing`;

    try {
      const payload = {
        customerMobileNumber,
        customerName,
        items: billItems,
        totalAmount,
        paymentMethod,
        amountPaid: amountPaidNumber,
        // Add discount information
        discountType,
        discountValue: discountValue ? parseFloat(discountValue) : 0,
        discountAmount
      };

      const response = await axios.post(
        BILL_URL,
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );

      setMessage('Bill created successfully!');

      if (autoDownload) {
        generateInvoicePdf(response.data);
      }

      setCustomerMobileNumber('');
      setCustomerName('');
      setBillItems([]);
      setSubtotal(0);
      setDiscountType('none');
      setDiscountValue('');
      setDiscountAmount(0);
      setNetAmount(0);
      setTotalAmount(0);
      setAmountPaid('');
      setSearchTerm('');
      setCurrentItem({ product: null, unit: '', quantity: '', price: 0, productName: '', sku: '' });

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create bill. Please try again.');
      console.error(err);
    }
  };
  
  // Keyboard navigation and shortcuts
  // Function to scroll element into view with smooth behavior
  const scrollToElement = (element) => {
    if (element && typeof element.scrollIntoView === 'function') {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest', 
        inline: 'nearest' 
      });
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+N for new bill
      if (event.ctrlKey && event.key === 'n') {
        event.preventDefault();
        setCustomerMobileNumber('');
        setCustomerName('');
        setBillItems([]);
        setSubtotal(0);
        setDiscountType('none');
        setDiscountValue('');
        setDiscountAmount(0);
        setNetAmount(0);
        setTotalAmount(0);
        setAmountPaid('');
        setSearchTerm('');
        setCurrentItem({ product: null, unit: '', quantity: '', price: 0, productName: '', sku: '' });
        setMessage('');
        setError('');
        if (customerMobileRef.current) {
          customerMobileRef.current.focus();
          scrollToElement(customerMobileRef.current);
        }
      }
      
      // Ctrl+F for search products
      if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        if (productSearchRef.current) {
          productSearchRef.current.focus();
          scrollToElement(productSearchRef.current);
        }
      }
      
      // Alt+D for discount
      if (event.altKey && event.key === 'd') {
        event.preventDefault();
        if (discountTypeRef.current) {
          discountTypeRef.current.focus();
          scrollToElement(discountTypeRef.current);
        }
      }
      
      // Ctrl+Enter to submit bill
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        handleSubmit(event);
      }
      
      // F2 to edit quantity when an item is selected
      if (event.key === 'F2' && currentItem.product) {
        event.preventDefault();
        if (quantityRef.current) {
          quantityRef.current.focus();
          quantityRef.current.select();
          scrollToElement(quantityRef.current);
        }
      }
      
      // Ctrl+D to delete last item
      if (event.ctrlKey && event.key === 'd') {
        event.preventDefault();
        if (billItems.length > 0) {
          const lastItemIndex = billItems.length - 1;
          handleRemoveItem(lastItemIndex);
        }
      }
      
      // Ctrl+Alt+F to focus on product search
      if (event.ctrlKey && event.altKey && event.key === 'F') {
        event.preventDefault();
        if (productSearchRef.current) {
          productSearchRef.current.focus();
          productSearchRef.current.select();
          scrollToElement(productSearchRef.current);
        }
      }
      
      // Enter on search field to add item if one is selected
      if (event.key === 'Enter' && searchTerm && filteredProducts.length === 1) {
        event.preventDefault();
        handleSelectProduct(filteredProducts[0]);
        // After adding item, return focus to product search field
        setTimeout(() => {
          if (productSearchRef.current) {
            productSearchRef.current.focus();
            productSearchRef.current.select();
            scrollToElement(productSearchRef.current);
          }
        }, 10);
      }
      
      // Enter on quantity field to add item
      if (event.key === 'Enter' && currentItem.product && currentItem.quantity) {
        event.preventDefault();
        handleAddItem();
        // After adding item, return focus to product search field
        setTimeout(() => {
          if (productSearchRef.current) {
            productSearchRef.current.focus();
            productSearchRef.current.select();
            scrollToElement(productSearchRef.current);
          }
        }, 10);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentItem, searchTerm, filteredProducts, billItems]);
  
  // Add focus event listener to automatically scroll focused elements into view
  useEffect(() => {
    const handleFocus = (event) => {
      if (event.target && event.target.scrollIntoView) {
        // Add a small delay to ensure the element is rendered
        setTimeout(() => {
          event.target.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest', 
            inline: 'nearest' 
          });
        }, 10);
      }
    };
    
    // Add focus event listener to all focusable elements
    document.addEventListener('focusin', handleFocus);
    
    return () => {
      document.removeEventListener('focusin', handleFocus);
    };
  }, []);

  if (loading) {
    return <div className="p-6 text-center">Loading data...</div>;
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
      <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-text-primary">Create Bill</h3>
      <KeyboardShortcutsGuide />
      
      {/* Out of Stock Modal */}
      <CustomModal
        isOpen={showOutOfStockModal}
        onClose={() => setShowOutOfStockModal(false)}
        title="Out of Stock"
      >
        <div className="text-center py-4">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-lg mb-2">Product is out of stock!</p>
          <p className="text-gray-600 mb-4">
            {selectedProduct?.name} (SKU: {selectedProduct?.sku}) is currently out of stock.
            Available quantity: {stockQuantity}
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setShowOutOfStockModal(false)}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmOutOfStock}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Continue Anyway
            </button>
          </div>
        </div>
      </CustomModal>
      
      {/* Confirm Out of Stock Modal */}
      <CustomModal
        isOpen={showConfirmOutOfStockModal}
        onClose={() => setShowConfirmOutOfStockModal(false)}
        title="Confirm Out of Stock Product"
      >
        <div className="text-center py-4">
          <div className="text-orange-500 text-5xl mb-4">⚠️</div>
          <p className="text-lg mb-2">Are you sure?</p>
          <p className="text-gray-600 mb-4">
            You are about to add an out-of-stock product to the bill:
          </p>
          <p className="font-semibold mb-4">
            {selectedProduct?.name} (SKU: {selectedProduct?.sku})
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setShowConfirmOutOfStockModal(false)}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleFinalConfirmOutOfStock}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Confirm & Add
            </button>
          </div>
        </div>
      </CustomModal>
      
      {/* Customer Details */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h4 className="text-lg sm:text-xl font-medium text-gray-700 mb-3">Customer Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-text-secondary text-sm font-medium mb-1" htmlFor="mobileNumber">
              Customer Mobile Number
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-opacity-75"
              id="mobileNumber"
              ref={customerMobileRef}
              value={customerMobileNumber}
              onChange={(e) => setCustomerMobileNumber(e.target.value)}
              required
              onKeyDown={(e) => {
                if (e.key === 'Tab' && !e.shiftKey) {
                  e.preventDefault();
                  if (customerNameRef.current) {
                    customerNameRef.current.focus();
                  }
                }
              }}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="customerName">
              Customer Name
            </label>
            <input
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="customerName"
              ref={customerNameRef}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              onKeyDown={(e) => {
                if (e.key === 'Tab' && !e.shiftKey) {
                  e.preventDefault();
                  if (productSearchRef.current) {
                    productSearchRef.current.focus();
                  }
                } else if (e.key === 'Tab' && e.shiftKey) {
                  e.preventDefault();
                  if (customerMobileRef.current) {
                    customerMobileRef.current.focus();
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Product Search and Selection */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h4 className="text-lg font-medium text-gray-700 mb-3">Add Products</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Product</label>
            <div className="relative">
              <div className="flex">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search by name or SKU..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-opacity-75"
                  ref={productSearchRef}
                  onFocus={handleInputFocus}
                  onKeyDown={(e) => {
                    // Handle dropdown navigation keys
                    if (showDropdown && filteredProducts.length > 0) {
                      switch (e.key) {
                        case 'ArrowDown':
                          e.preventDefault();
                          setSelectedProductIndex(prev => 
                            prev < filteredProducts.length - 1 ? prev + 1 : 0
                          );
                          break;
                        case 'ArrowUp':
                          e.preventDefault();
                          setSelectedProductIndex(prev => 
                            prev > 0 ? prev - 1 : filteredProducts.length - 1
                          );
                          break;
                        case 'Enter':
                          e.preventDefault();
                          if (selectedProductIndex >= 0 && filteredProducts[selectedProductIndex]) {
                            handleSelectProduct(filteredProducts[selectedProductIndex]);
                            // After adding item, return focus to product search field
                            setTimeout(() => {
                              if (productSearchRef.current) {
                                productSearchRef.current.focus();
                                productSearchRef.current.select();
                              }
                            }, 10);
                          }
                          break;
                        case 'Escape':
                          setShowDropdown(false);
                          setSelectedProductIndex(-1);
                          break;
                        default:
                          // For other keys, reset to first item if needed
                          if (selectedProductIndex === -1 && filteredProducts.length > 0) {
                            setSelectedProductIndex(0);
                          }
                      }
                    }
                    
                    // Handle Tab key for navigation
                    if (e.key === 'Tab' && !e.shiftKey) {
                      // If there are already items in the bill AND search term is empty, allow skipping the add item section
                      if (billItems.length > 0 && searchTerm.trim() === '') {
                        e.preventDefault();
                        // Skip to discount type field when Tab is pressed
                        if (discountTypeRef.current) {
                          discountTypeRef.current.focus();
                          scrollToElement(discountTypeRef.current);
                        }
                        return; // Exit early to skip normal tab behavior
                      }
                    }
                  }}
                  tabIndex="0"
                />
                <button
                  type="button"
                  className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200 focus:outline-none"
                  onClick={handleToggleDropdown}
                >
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </button>
              </div>
              
              {/* Dropdown for search suggestions */}
              {showDropdown && filteredProducts.length > 0 && (
                <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {filteredProducts.map((product, index) => (
                    <li
                      key={`${product._id}-${product.sku}`}
                      className={`relative cursor-default select-none py-2 pl-3 pr-9 ${selectedProductIndex === index ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-600 hover:text-white'}`}
                      onClick={() => handleSelectProduct(product)}
                      onMouseEnter={() => setSelectedProductIndex(index)}
                    >
                      <div className="flex justify-between">
                        <span className="font-normal truncate">{product.name}</span>
                        <span className="ml-2 text-gray-500">({product.sku})</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Qty: {product.stockLevel} | Price: ₹{product.prices[0]?.sellingPrice || 0}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              
              {/* Close dropdown when clicking outside */}
              {(showDropdown || showProductModal) && (
                <div 
                  className="fixed inset-0 z-0" 
                  onClick={() => {
                    setShowDropdown(false);
                    setShowProductModal(false);
                  }}
                />
              )}

              {/* Product Selection Modal */}
              {showProductModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                  <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                      <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowProductModal(false)}></div>
                    </div>
                    <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                    <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
                      <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-lg leading-6 font-medium text-gray-900">Select Product</h3>
                              <button
                                type="button"
                                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                onClick={() => setShowProductModal(false)}
                              >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <div className="mt-2 w-full">
                              {/* Search and Filter Controls */}
                              <div className="flex flex-col md:flex-row gap-4 mb-4">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    placeholder="Search products..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-opacity-75"
                                    value={modalSearchTerm}
                                    onChange={(e) => setModalSearchTerm(e.target.value)}
                                  />
                                </div>
                                <div className="flex-1">
                                  <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-opacity-75"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                  >
                                    {getUniqueCategories(products).map(category => (
                                      <option key={category} value={category}>{category}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div className="max-h-96 overflow-y-auto">
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {products
                                        .filter(product => {
                                          // Filter by search term
                                          const matchesSearch = modalSearchTerm === '' || 
                                            (product.name && product.name.toLowerCase().includes(modalSearchTerm.toLowerCase())) ||
                                            (product.sku && product.sku.toLowerCase().includes(modalSearchTerm.toLowerCase()));
                                          
                                          // Filter by category
                                          const productCategory = product.category?.name || 'Uncategorized';
                                          const matchesCategory = selectedCategory === 'All' || productCategory === selectedCategory;
                                          
                                          return matchesSearch && matchesCategory;
                                        })
                                        .map((product) => (
                                          <tr 
                                            key={product._id} 
                                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                                            onClick={() => handleSelectProduct(product)}
                                          >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                                              ₹{product.prices[0]?.sellingPrice || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                              {product.category?.name || 'N/A'}
                                            </td>
                                          </tr>
                                        ))
                                      }
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select
              value={currentItem.unit}
              onChange={handleUnitChange}
              disabled={!currentItem.product}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-opacity-75 disabled:bg-gray-200"
            >
              {currentItem.product?.prices?.map((price) => (
                <option key={price.unit} value={price.unit}>
                  {price.unit}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="text"
              value={currentItem.quantity}
              onChange={handleQuantityChange}
              disabled={!currentItem.product}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-opacity-75 disabled:bg-gray-200"
              min="1"
              ref={quantityRef}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && currentItem.product) {
                  e.preventDefault();
                  handleAddItem();
                } else if (e.key === 'Tab' && !e.shiftKey) {
                  e.preventDefault();
                  const button = document.querySelector('button[type="button"][onClick*="handleAddItem"]');
                  if (button) {
                    button.focus();
                  }
                } else if (e.key === 'Tab' && e.shiftKey) {
                  e.preventDefault();
                  if (productSearchRef.current) {
                    productSearchRef.current.focus();
                  }
                }
              }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input
              type="text"
              value={currentItem.price}
              readOnly
              className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          
          <div className="md:col-span-2 flex items-end">
            <button
              type="button"
              onClick={handleAddItem}
              disabled={!currentItem.product}
              className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-opacity-75 disabled:bg-gray-400"
              onKeyDown={(e) => {
                if (e.key === 'Tab' && !e.shiftKey) {
                  e.preventDefault();
                  if (discountTypeRef.current) {
                    discountTypeRef.current.focus();
                  }
                } else if (e.key === 'Tab' && e.shiftKey) {
                  e.preventDefault();
                  if (quantityRef.current) {
                    quantityRef.current.focus();
                  }
                }
              }}
            >
              Add Item
            </button>
          </div>
        </div>
        
        {error && !error.includes('purchase rates') && (
          <div className="mt-2 text-red-500 text-sm">{error}</div>
        )}
      </div>
      
      {/* Bill Items Table */}
      {billItems.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Product</th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">SKU</th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Unit</th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Quantity</th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Price</th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Total</th>
                <th className="px-2 sm:px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {billItems.map((item, index) => (
                <tr key={index}>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.productName}</td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.sku}</td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.unit}</td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.price.toFixed(2)}</td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{(item.quantity * item.price).toFixed(2)}</td>
                  <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Discount Section */}
      <div className="mt-6 p-4 border rounded-lg bg-gray-50">
        <h4 className="text-lg font-medium text-gray-700 mb-3">Discount</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-opacity-75"
              ref={discountTypeRef}
              onKeyDown={(e) => {
                if (e.key === 'Tab' && !e.shiftKey) {
                  e.preventDefault();
                  if (discountType !== 'none') {
                    if (discountValueRef.current) {
                      discountValueRef.current.focus();
                    }
                  } else {
                    if (paymentMethodRef.current) {
                      paymentMethodRef.current.focus();
                    }
                  }
                } else if (e.key === 'Tab' && e.shiftKey) {
                  e.preventDefault();
                  const button = document.querySelector('button[onClick*="handleAddItem"]');
                  if (button) {
                    button.focus();
                  }
                }
              }}
            >
              <option value="none">No Discount</option>
              <option value="percentage">Percentage (%)</option>
              <option value="cash">Cash (₹)</option>
            </select>
          </div>
          
          {discountType !== 'none' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
              </label>
              <input
                type="text"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-opacity-75"
                min="0"
                step="0.01"
                max={discountType === 'percentage' ? "100" : subtotal}
                ref={discountValueRef}
                onKeyDown={(e) => {
                  if (e.key === 'Tab' && !e.shiftKey) {
                    e.preventDefault();
                    if (paymentMethodRef.current) {
                      paymentMethodRef.current.focus();
                    }
                  } else if (e.key === 'Tab' && e.shiftKey) {
                    e.preventDefault();
                    if (discountTypeRef.current) {
                      discountTypeRef.current.focus();
                    }
                  }
                }}
              />
            </div>
          )}
          
          <div className="flex items-end">
            <div className="text-sm">
              <p className="font-medium">Discount Amount: ₹{discountAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bill Summary */}
      <div className="mt-6 p-4 border rounded-lg bg-gray-50">
        <h4 className="text-lg font-medium text-gray-700 mb-3">Bill Summary</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          
          {discountAmount > 0 && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-₹{discountAmount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span>Net Amount:</span>
            <span>₹{netAmount.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between font-bold">
            <span>Total Amount:</span>
            <span>₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="mt-6 p-4 border rounded-lg bg-gray-50">
        <h4 className="text-lg font-medium text-gray-700 mb-3">Payment Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="paymentMethod">
              Payment Method
            </label>
            <div className="relative">
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline pr-8"
                ref={paymentMethodRef}
                onKeyDown={(e) => {
                  if (e.key === 'Tab' && !e.shiftKey) {
                    e.preventDefault();
                    if (amountPaidRef.current) {
                      amountPaidRef.current.focus();
                    }
                  } else if (e.key === 'Tab' && e.shiftKey) {
                    e.preventDefault();
                    if (discountType !== 'none') {
                      if (discountValueRef.current) {
                        discountValueRef.current.focus();
                      }
                    } else {
                      if (discountTypeRef.current) {
                        discountTypeRef.current.focus();
                      }
                    }
                  }
                }}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amountPaid">
              Amount Paid
            </label>
            <input
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="amountPaid"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              required
              ref={amountPaidRef}
              onKeyDown={(e) => {
                if (e.key === 'Tab' && !e.shiftKey) {
                  e.preventDefault();
                  if (createBillButtonRef.current) {
                    createBillButtonRef.current.focus();
                  }
                } else if (e.key === 'Tab' && e.shiftKey) {
                  e.preventDefault();
                  if (paymentMethodRef.current) {
                    paymentMethodRef.current.focus();
                  }
                }
              }}
            />
          </div>
        </div>
        <div className="flex justify-end items-center mt-4">
          <span className="text-lg font-bold text-gray-800 mr-4">Balance:</span>
          <span className="text-lg font-bold text-red-600">₹{(totalAmount - Number(amountPaid)).toFixed(2)}</span>
        </div>
      </div>

      {/* Bill Options */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <label htmlFor="autoDownload" className="text-gray-700 font-bold">Auto Download Bill after Creation</label>
        <input
          type="checkbox"
          id="autoDownload"
          checked={autoDownload}
          onChange={(e) => setAutoDownload(e.target.checked)}
          className="form-checkbox h-5 w-5 text-primary"
        />
      </div>

      <button
        type="submit"
        onClick={handleSubmit}
        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
        ref={createBillButtonRef}
        onKeyDown={(e) => {
          if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault();
            if (amountPaidRef.current) {
              amountPaidRef.current.focus();
            }
          }
        }}
      >
        Create Bill
      </button>
      {message && <p className="mt-4 text-green-500">{message}</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
}

export default CreateBill;