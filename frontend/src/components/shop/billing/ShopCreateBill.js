import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import { getAvailableUnits, convertUnit, areRelatedUnits, formatDateToDDMMYYYY } from '../../../utils/unitConversion';
import CustomModal from '../../CustomModal';

import { useFullScreenBill } from '../../../context/FullScreenBillContext';
import MessageAlert from '../../MessageAlert';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function CreateBill({ baseUrl = '/shop' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { enterFullScreenBill, exitFullScreenBill } = useFullScreenBill();

  // --- STATE ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalBillId, setOriginalBillId] = useState(null);
  const [billType, setBillType] = useState("ORDINARY");
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [customerMobileNumber, setCustomerMobileNumber] = useState('');
  const [isTaxInvoice, setIsTaxInvoice] = useState(false);
  const [hasTaxInvoiceAccess, setHasTaxInvoiceAccess] = useState(false);

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Customer Suggestions States
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(-1);
  const [activeCustomerField, setActiveCustomerField] = useState(null); // 'mobile', 'name', or 'address'

  // Bill Date State - defaults to current time, but user can change
  // Format for datetime-local input: YYYY-MM-DDTHH:mm
  const [billDate, setBillDate] = useState(() => {
    const now = new Date();
    // Adjust for local timezone offset to show correct local time in input
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - offset)).toISOString().slice(0, 19);
    return localISOTime;
  });
  const [isManualTime, setIsManualTime] = useState(false);

  // To Info

  // To Info
  const [toInfo, setToInfo] = useState({
    name: '',
    address: '',
    gstin: '',
    state: 'Tamil Nadu',
    stateCode: '33',
    phone: '',
    placeOfSupply: '33-Tamil Nadu',
    invoiceNo: ''
  });

  // From Info (Fetched from shop details)
  const [fromInfo, setFromInfo] = useState({
    name: '',
    address: '',
    gstin: '',
    fssaiNumber: '',
    state: 'Tamil Nadu',
    stateCode: '33',
    phone: '',
    email: 'sweetsfactory@gmail.com'
  });

  // Item Entry State
  const [currentItem, setCurrentItem] = useState({
    product: null,
    unit: '',
    quantity: '',
    price: 0,
    productName: '',
    sku: '',
    isDecimalAsGram: false,
    rawInput: '',

    discountPercent: 0,
    discountAmount: 0,
    hsn: ''
  });

  // Helper functions for calculations
  const calculateItemAmount = (quantity, price, discountPercent, discountAmount) => {
    const grossAmount = (parseFloat(quantity) || 0) * price;
    let discount = 0;
    if (discountPercent > 0) {
      discount = (grossAmount * discountPercent) / 100;
    } else if (discountAmount > 0) {
      discount = Math.min(discountAmount, grossAmount);
    }
    return grossAmount - discount;
  };

  const calculateItemTaxAmount = (quantity, price, gstPercentage) => {
    return (parseFloat(quantity) || 0) * price * (gstPercentage / 100);
  };

  // Bill Data States
  const [billItems, setBillItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [netAmount, setNetAmount] = useState(0);
  const [gstPercentage, setGstPercentage] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [baseAmount, setBaseAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [roundOff, setRoundOff] = useState(true);

  // Aux States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoDownload, setAutoDownload] = useState(true);
  const [autoPrint, setAutoPrint] = useState(false);  // Keep for backward compatibility but don't expose UI
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Modal States
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);

  // Worker Selection State
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [workerSearchTerm, setWorkerSearchTerm] = useState('');
  const [showWorkerDropdown, setShowWorkerDropdown] = useState(false);
  const [selectedWorkerIndex, setSelectedWorkerIndex] = useState(-1);

  // Refs
  const customerMobileRef = useRef(null);
  const productSearchRef = useRef(null);
  const quantityRef = useRef(null);
  const amountPaidRef = useRef(null);
  const createBillButtonRef = useRef(null);

  useEffect(() => {
    let timer;
    if (!isManualTime && !isEditMode) {
      timer = setInterval(() => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(now - offset)).toISOString().slice(0, 19);
        setBillDate(localISOTime);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isManualTime, isEditMode]);

  useEffect(() => {
    enterFullScreenBill();
    return () => exitFullScreenBill();
  }, [enterFullScreenBill, exitFullScreenBill]);

  // Auto focus on customer mobile number when component loads or navigates to create bill (not in edit mode)
  useEffect(() => {
    if (!isEditMode) {
      // Wait for the component to fully render and settle, then scroll to top and focus
      setTimeout(() => {
        // FIX: Target the specific scroll container
        const scrollContainer = document.getElementById('shop-bill-container');
        if (scrollContainer) {
          scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Try multiple attempts to ensure focus works
        const attemptFocus = (attempts = 0) => {
          if (customerMobileRef.current && attempts < 5) {
            customerMobileRef.current.focus();
            // Verify the element received focus
            if (document.activeElement !== customerMobileRef.current) {
              setTimeout(() => attemptFocus(attempts + 1), 100);
            }
          } else if (attempts < 5) {
            setTimeout(() => attemptFocus(attempts + 1), 100);
          }
        };

        attemptFocus();
      }, 200);
    }
  }, [isEditMode, location.pathname]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prodRes, gstRes, shopRes, workersRes] = await Promise.all([
          axios.get(`${baseUrl}/products`, { withCredentials: true }),
          axios.get(`${baseUrl}/settings/gst`),
          axios.get(`${baseUrl}/details`, { withCredentials: true }),
          axios.get(`${baseUrl}/workers`, { withCredentials: true })
        ]);
        setProducts(prodRes.data);
        setGstPercentage(gstRes.data.gstPercentage || 0);

        // Set shop details for bill header
        if (shopRes.data) {
          setFromInfo({
            name: shopRes.data.username || shopRes.data.name || 'Shop Name',
            address: shopRes.data.location || shopRes.data.address || '',
            gstin: shopRes.data.gstNumber || '',
            fssaiNumber: shopRes.data.fssaiNumber || '',
            state: 'Tamil Nadu', // You might want to fetch this too if available
            stateCode: '33',
            phone: shopRes.data.shopPhoneNumber || '',
            email: shopRes.data.email || ''
          });
          setHasTaxInvoiceAccess(shopRes.data.hasTaxInvoiceAccess || false);
        }

        // Set workers
        if (workersRes?.data) {
          setWorkers(workersRes.data);
        }
      } catch (e) {
        // Keep default/empty values if fetch fails
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [baseUrl]);

  const fetchCustomerSuggestions = useCallback(async (query, field) => {
    if (!query || query.length < 3) {
      setCustomerSuggestions([]);
      setShowCustomerDropdown(false);
      return;
    }
    try {
      const response = await axios.get(`${baseUrl}/billing/search-customers?query=${query}`);
      setCustomerSuggestions(response.data);
      setShowCustomerDropdown(response.data.length > 0);
      setActiveCustomerField(field);
      setSelectedCustomerIndex(0);
    } catch (err) {
      console.error('Error fetching customer suggestions:', err);
    }
  }, [baseUrl]);

  const handleSelectCustomer = (customer) => {
    setCustomerMobileNumber(customer.mobile);
    setToInfo(prev => ({
      ...prev,
      name: customer.name || prev.name,
      address: customer.address || prev.address
    }));
    setShowCustomerDropdown(false);
  };

  const handleDeleteCustomerSelection = async (e, mobile) => {
    e.stopPropagation(); // Prevent selection
    try {
      await axios.post(`${baseUrl}/billing/hide-customer-suggestions`, { mobile });
      setCustomerSuggestions(prev => prev.filter(c => c.mobile !== mobile));
      if (customerSuggestions.length <= 1) setShowCustomerDropdown(false);
    } catch (err) {
      console.error('Error hiding customer suggestions:', err);
    }
  };

  useEffect(() => {
    if (location.state && location.state.billData && location.state.isEditMode) {
      const bill = location.state.billData;
      setIsEditMode(true);
      setOriginalBillId(bill._id);
      setCustomerMobileNumber(bill.customerMobileNumber || '');
      if (bill.toInfo) setToInfo(bill.toInfo);

      const formattedItems = bill.items.map(item => ({
        product: typeof item.product === 'object' ? item.product : { _id: item.product, name: item.productName, sku: item.sku },
        productName: item.productName,
        sku: item.sku,
        unit: item.unit,
        quantity: item.quantity,
        price: item.price,
        baseUnitPrice: item.price,
        baseUnit: item.unit,

      }));
      setBillItems(formattedItems);
      setDiscountType(bill.discountType || 'none');
      setDiscountValue(bill.discountValue?.toString() || '');
      setPaymentMethod(bill.paymentMethod || 'Cash');
      setAmountPaid(bill.amountPaid?.toString() || '');
      setAmountPaid(bill.amountPaid?.toString() || '');
      setBillType(bill.billType || 'ORDINARY');
      setIsTaxInvoice(bill.isTaxInvoice || false);

      if (bill.billDate || bill.createdAt) {
        const dateToUse = new Date(bill.billDate || bill.createdAt);
        const offset = dateToUse.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(dateToUse - offset)).toISOString().slice(0, 16);
        setBillDate(localISOTime);
      }
    }
  }, [location.state]);

  useEffect(() => {
    const newSubtotal = billItems.reduce((acc, item) => {
      const itemTotal = item.quantity * item.price;
      let itemDiscount = 0;
      if (item.discountPercent > 0) itemDiscount = (itemTotal * item.discountPercent) / 100;
      else if (item.discountAmount > 0) itemDiscount = Math.min(item.discountAmount, itemTotal);
      return acc + (itemTotal - itemDiscount);
    }, 0);

    setSubtotal(newSubtotal);

    let calculatedDiscountAmount = 0;
    if (discountType === 'percentage' && discountValue) {
      calculatedDiscountAmount = (newSubtotal * parseFloat(discountValue || 0)) / 100;
    } else if (discountType === 'cash' && discountValue) {
      calculatedDiscountAmount = parseFloat(discountValue || 0);
    }

    setDiscountAmount(calculatedDiscountAmount);
    const newNetAmount = newSubtotal - calculatedDiscountAmount;
    setNetAmount(newNetAmount);

    if (gstPercentage > 0) {
      const base = newNetAmount / (1 + gstPercentage / 100);
      const tax = newNetAmount - base;
      setBaseAmount(base);
      setGstAmount(tax);
      setTotalAmount(roundOff ? Math.round(newNetAmount) : newNetAmount);
    } else {
      setBaseAmount(newNetAmount);
      setGstAmount(0);
      setTotalAmount(roundOff ? Math.round(newNetAmount) : newNetAmount);
    }
  }, [billItems, discountType, discountValue, gstPercentage, roundOff]);

  // --- PDF GENERATION LOGIC ---
  const handlePrintBill = (billData = null, forcePrint = false) => {
    // Import the standard bill PDF generator
    import('../../../utils/generateBillPdf').then(({ printBill, generateBillPdf, generateTaxInvoicePdf }) => {
      const dataToPrint = billData || {
        invoiceNo: isEditMode ? "UPDATED" : (Math.floor(Math.random() * 90000) + 10000),
        date: formatDateToDDMMYYYY(billDate),
        time: new Date(billDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        items: billItems,
        subtotal,
        discountAmount,
        gstAmount,
        totalAmount,
        amountPaid: parseFloat(amountPaid) || 0
      };

      // Convert data to the format expected by the standard generator
      const billDataFormatted = {
        ...dataToPrint,
        billId: billData?.billId || billData?._id || dataToPrint.invoiceNo, // Use the actual billId from the saved response if available
        billDate: dataToPrint.date,
        customerMobileNumber: customerMobileNumber,
        customerName: toInfo.name || 'Walk-in Customer',
        totalAmount: dataToPrint.totalAmount,
        amountPaid: dataToPrint.amountPaid,
        gstPercentage: gstPercentage,
        gstAmount: gstAmount,
        baseAmount: subtotal - discountAmount,
        discountType: discountType,
        discountValue: discountValue,
        discountAmount: discountAmount,
        fromInfo: fromInfo,
        toInfo: toInfo,
      };

      const shopData = {
        name: fromInfo.name,
        address: fromInfo.address,
        phone: fromInfo.phone,
        gstNumber: fromInfo.gstin,
        fssaiNumber: fromInfo.fssaiNumber,
      };

      if (isTaxInvoice) {
        if (forcePrint) {
          generateTaxInvoicePdf(billDataFormatted, shopData, true);
          if (autoDownload) {
            generateTaxInvoicePdf(billDataFormatted, shopData, false);
          }
        } else if (autoDownload) {
          generateTaxInvoicePdf(billDataFormatted, shopData, false);
        } else {
          generateTaxInvoicePdf(billDataFormatted, shopData, true);
        }
      } else {
        if (forcePrint) {
          printBill(billDataFormatted, shopData);
          if (autoDownload) {
            generateBillPdf(billDataFormatted, shopData);
          }
        } else if (autoDownload) {
          generateBillPdf(billDataFormatted, shopData);
        } else {
          printBill(billDataFormatted, shopData);
        }
      }
    }).catch(error => {
      console.error('Error importing generateBillPdf:', error);
    });
  };

  // --- HANDLERS ---
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);
    if (value) {
      const filtered = products.filter(p =>
        (p.name && p.name.toLowerCase().includes(value.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(value.toLowerCase()))
      );
      setFilteredProducts(filtered);
      setSelectedProductIndex(0);
    } else {
      setFilteredProducts([]);
      setShowDropdown(false);
    }
  };

  const handleSelectProduct = (product) => {
    if (product.stockLevel <= 0) {
      setSelectedProduct(product);
      setStockQuantity(product.stockLevel);
      setShowProductModal(false);
      setTimeout(() => setShowOutOfStockModal(true), 100);
      return;
    }
    setupProductSelection(product);
  };

  const setupProductSelection = (product) => {
    setSearchTerm(`${product.name}`);
    setShowProductModal(false);
    setShowDropdown(false);
    setModalSearchTerm('');
    setSelectedCategory('All');

    if (product.prices && product.prices.length > 0) {
      const availableUnits = getAvailableUnits(product.prices);
      setCurrentItem({
        ...currentItem,
        product,
        unit: availableUnits[0],
        quantity: '',
        price: product.prices.find(p => p.unit === availableUnits[0])?.sellingPrice || product.prices[0].sellingPrice,
        productName: product.name,
        sku: product.sku,


      });
      setError('');
      setTimeout(() => quantityRef.current?.focus(), 50);
    } else {
      setError(`Product "${product.name}" has no purchase rates.`);
    }
  };

  const handleConfirmOutOfStock = () => {
    setShowOutOfStockModal(false);
  };

  const handleUnitChange = (e) => {
    const selectedUnit = e.target.value;
    const priceInfo = currentItem.product.prices.find(p => p.unit === selectedUnit);
    if (priceInfo) {
      setCurrentItem(prev => ({ ...prev, unit: priceInfo.unit, price: priceInfo.sellingPrice }));
    } else {
      const baseUnitInfo = currentItem.product.prices[0];
      setCurrentItem(prev => ({ ...prev, unit: selectedUnit, price: baseUnitInfo.sellingPrice }));
    }
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    const numValue = parseFloat(value);

    if (value === "" || value === "0." || value === "." || (!isNaN(numValue) && numValue >= 0)) {
      if (value === "0." || value === ".") {
        setCurrentItem(prev => ({ ...prev, quantity: '', rawInput: value, isDecimalAsGram: false }));
      } else if (value === "") {
        setCurrentItem(prev => ({ ...prev, quantity: '', rawInput: '', isDecimalAsGram: false }));
      } else if (!isNaN(numValue) && numValue >= 0) {
        // Check if this would be a decimal-as-gram scenario (kg product with gram price)
        // but DON'T convert yet — just flag it. Conversion happens in handleAddItem.
        const wouldBeDecimalAsGram =
          currentItem.product?.prices?.[0]?.unit === 'kg' &&
          numValue < 1 &&
          value.includes('.') &&
          numValue > 0 &&
          currentItem.product?.prices?.some(p => p.unit === 'gram');

        setCurrentItem(prev => ({
          ...prev,
          quantity: numValue,
          rawInput: value,
          isDecimalAsGram: wouldBeDecimalAsGram
        }));
      }
    }
  };

  const handleAddItem = () => {
    let finalQuantity;
    let finalUnit = currentItem.unit;
    let finalPrice = currentItem.price;
    let isValid = false;

    const rawNum = parseFloat(currentItem.rawInput);
    const hasRaw = currentItem.rawInput !== '' && !isNaN(rawNum) && isFinite(rawNum);

    if (hasRaw && rawNum > 0) {
      finalQuantity = rawNum;
      isValid = true;
    } else if (currentItem.quantity !== '') {
      const parsedQuantity = parseFloat(currentItem.quantity);
      if (!isNaN(parsedQuantity) && isFinite(parsedQuantity) && parsedQuantity > 0) {
        finalQuantity = parsedQuantity;
        isValid = true;
      }
    }

    if (!isValid || !currentItem.product || finalQuantity <= 0) {
      setError('Invalid product or quantity.');
      return;
    }

    // If decimal-as-gram: convert kg decimal → gram quantity, switch unit & price
    if (currentItem.isDecimalAsGram) {
      const gramPriceInfo = currentItem.product.prices.find(p => p.unit === 'gram');
      finalQuantity = finalQuantity * 1000; // e.g. 0.25 → 250 grams
      finalUnit = 'gram';
      finalPrice = gramPriceInfo ? gramPriceInfo.sellingPrice : currentItem.price;
    } else {
      // Price conversion logic for other unit relationships
      if (currentItem.product.prices?.length > 0) {
        const baseUnit = currentItem.product.prices[0].unit;
        if (finalUnit !== baseUnit && areRelatedUnits(finalUnit, baseUnit)) {
          const conversionFactor = convertUnit(1, finalUnit, baseUnit);
          finalPrice = currentItem.price * conversionFactor;
        }
      }
    }

    const newItem = {
      product: currentItem.product._id,
      productName: currentItem.productName,
      sku: currentItem.sku,
      unit: finalUnit,
      quantity: finalQuantity,
      price: finalPrice,
      baseUnitPrice: currentItem.price,
      baseUnit: currentItem.product.prices[0].unit,
      discountPercent: currentItem.discountPercent || 0,
      discountAmount: currentItem.discountAmount || 0,
      hsn: currentItem.hsn || '',
    };

    const existingIndex = billItems.findIndex(i => i.product === newItem.product && i.unit === newItem.unit);
    if (existingIndex > -1) {
      const updated = [...billItems];
      updated[existingIndex].quantity += newItem.quantity;
      setBillItems(updated);
    } else {
      setBillItems([...billItems, newItem]);
    }

    setSearchTerm('');
    setCurrentItem({ ...currentItem, product: null, unit: '', quantity: '', price: 0, productName: '', sku: '', isDecimalAsGram: false, rawInput: '', discountPercent: 0, discountAmount: 0, hsn: '' });
    setError('');
    setTimeout(() => productSearchRef.current?.focus(), 50);
  };

  const handleRemoveItem = (index) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const updateBillItem = (index, field, value) => {
    const updatedItems = [...billItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setBillItems(updatedItems);
  };

  // Removed unused editing state variables

  // Modified: Accepts forcePrint parameter to handle "Print" button click
  // Modified: Accepts forcePrint parameter to handle "Print" button click
  // Modified: Accepts forcePrint parameter to handle "Print" button click
  const handleSubmit = async (e, forcePrint = false) => {
    if (e) e.preventDefault();

    // FIX: Add timeouts so errors clear automatically
    if (!customerMobileNumber) {
      setError('Enter Mobile Number');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (billItems.length === 0) {
      setError('Add items first');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const payload = {
        customerMobileNumber: customerMobileNumber.replace(/\D/g, '').length === 10 ? `+91${customerMobileNumber.replace(/\D/g, '')}` : customerMobileNumber,
        customerName: toInfo.name || '',
        items: billItems,
        baseAmount,
        gstPercentage,
        gstAmount,
        totalAmount,
        paymentMethod,
        billDate: new Date(billDate), // Add billDate to payload
        amountPaid: Number(amountPaid),
        discountType,
        discountValue: discountValue ? parseFloat(discountValue) : 0,
        discountAmount,
        billType,
        isTaxInvoice,
        toInfo: toInfo.name ? toInfo : undefined,
        ...(selectedWorker && { worker: selectedWorker }),
      };

      const url = isEditMode ? `${baseUrl}/billing/${originalBillId}` : `${baseUrl}/billing`;
      const method = isEditMode ? 'put' : 'post';

      const response = await axios[method](url, payload, { withCredentials: true });

      setNotificationMessage(isEditMode ? 'Bill Updated!' : 'Bill Created!');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);

      // Print Logic
      if (autoDownload || forcePrint) {  // Removed autoPrint condition
        handlePrintBill({
          ...response.data,
          invoiceNo: response.data.invoiceNo || "NEW",
          items: billItems,
          subtotal, discountAmount, gstAmount, totalAmount
        }, forcePrint);
      }

      if (!isEditMode) {
        // FIX: Manually reset state instead of reloading page (navigate(0))
        // This prevents the print/download window from being closed/cancelled
        setCustomerMobileNumber('');
        setBillItems([]);
        setAmountPaid('');
        setDiscountValue('');
        setDiscountType('none');
        setSearchTerm('');
        setIsTaxInvoice(false);
        // Reset customer info as well
        setIsManualTime(false); // Reset manual time after saving
        setToInfo({
          name: '',
          address: '',
          gstin: '',
          state: 'Tamil Nadu',
          stateCode: '33',
          phone: '',
          placeOfSupply: '33-Tamil Nadu',
          invoiceNo: ''
        });

        // FIX: Scroll the specific container to top
        setTimeout(() => {
          const scrollContainer = document.getElementById('shop-bill-container');
          if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });

          setTimeout(() => {
            customerMobileRef.current?.focus();
          }, 100);
        }, 100);
      } else {
        navigate('/shop/billing/view');
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Error creating bill');
    }
  };

  // --- SHORTCUTS ---
  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.key === 'Enter') handleSubmit(e);
      if (e.ctrlKey && e.shiftKey && e.key === 'Enter') handleSubmit(e, true); // Ctrl+Shift+Enter for Print
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault(); // Prevent default print dialog
        handleSubmit(e, true); // Trigger print functionality
      }
      if (e.key === 'F2') {
        e.preventDefault();
        // Open a new tab/window for creating a new bill
        const newWindow = window.open(`${window.location.origin}${baseUrl}/billing/create`, '_blank');
        // Focus the new window to ensure it opens properly on all platforms (including Mac)
        if (newWindow) newWindow.focus();
      }
      if (showDropdown) {
        if (e.key === 'ArrowDown') setSelectedProductIndex(p => p < filteredProducts.length - 1 ? p + 1 : 0);
        if (e.key === 'ArrowUp') setSelectedProductIndex(p => p > 0 ? p - 1 : filteredProducts.length - 1);
        if (e.key === 'Enter' && selectedProductIndex >= 0) {
          e.preventDefault();
          handleSelectProduct(filteredProducts[selectedProductIndex]);
        }
        if (e.key === 'Escape') setShowDropdown(false);
      } else if (showWorkerDropdown) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const filteredWorkers = workers.filter(worker =>
            worker.name.toLowerCase().includes(workerSearchTerm.toLowerCase())
          );
          setSelectedWorkerIndex(prev => prev < filteredWorkers.length - 1 ? prev + 1 : 0);
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          const filteredWorkers = workers.filter(worker =>
            worker.name.toLowerCase().includes(workerSearchTerm.toLowerCase())
          );
          setSelectedWorkerIndex(prev => prev > 0 ? prev - 1 : filteredWorkers.length - 1);
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          const filteredWorkers = workers.filter(worker =>
            worker.name.toLowerCase().includes(workerSearchTerm.toLowerCase())
          );
          if (filteredWorkers.length > 0 && selectedWorkerIndex >= 0 && selectedWorkerIndex < filteredWorkers.length) {
            setSelectedWorker(filteredWorkers[selectedWorkerIndex]._id);
            setWorkerSearchTerm('');
            setShowWorkerDropdown(false);
            setSelectedWorkerIndex(-1);
          } else if (filteredWorkers.length > 0) {
            // Fallback to first worker if no index selected
            setSelectedWorker(filteredWorkers[0]._id);
            setWorkerSearchTerm('');
            setShowWorkerDropdown(false);
          }
        }
        if (e.key === 'Escape') {
          setShowWorkerDropdown(false);
          setSelectedWorkerIndex(-1);
        }
      } else if (showCustomerDropdown) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedCustomerIndex(prev => prev < customerSuggestions.length - 1 ? prev + 1 : 0);
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedCustomerIndex(prev => prev > 0 ? prev - 1 : customerSuggestions.length - 1);
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          if (customerSuggestions[selectedCustomerIndex]) {
            handleSelectCustomer(customerSuggestions[selectedCustomerIndex]);
          }
        }
        if (e.key === 'Escape') {
          setShowCustomerDropdown(false);
        }
      } else if (e.key === 'Enter' && currentItem.product && document.activeElement === quantityRef.current) {
        handleAddItem();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showDropdown, filteredProducts, selectedProductIndex, currentItem, baseUrl, showWorkerDropdown, workers, workerSearchTerm, handleSubmit, showCustomerDropdown, customerSuggestions, selectedCustomerIndex, handleSelectCustomer]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    // FIX: Added ID "shop-bill-container" and replaced "overflow-hidden" with "overflow-y-auto overflow-x-hidden"
    // This ensures the main scrollbar is on this container, allowing full page scrolling even inside a fixed layout.
    <div id="shop-bill-container" className="bg-gray-100 h-screen flex flex-col font-sans overflow-y-auto overflow-x-hidden">
      <style>{`
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

      {showNotification && <div className="fixed top-5 right-5 z-50"><MessageAlert type="success" message={notificationMessage} /></div>}
      {/* FIX: Display Error Alert so you know why it failed (e.g., "Enter Mobile Number") */}
      {error && <div className="fixed top-5 left-5 z-50"><MessageAlert type="error" message={error} /></div>}

      <CustomModal isOpen={showOutOfStockModal} onClose={() => setShowOutOfStockModal(false)} title="Out of Stock" customZIndex="z-[100]">
        <div className="p-4 text-center">
          <p className="text-red-500 text-xl font-bold mb-2">Item Out of Stock</p>
          <p>Qty Available: {stockQuantity}</p>
          <div className="mt-4 flex justify-center gap-2">
            <button onClick={() => setShowOutOfStockModal(false)} className="px-6 py-2 bg-blue-500 text-white rounded font-bold">OK</button>
          </div>
        </div>
      </CustomModal>

      {/* --- HEADER --- */}
      <div className="bg-white p-3 border-b shadow-sm z-20 shrink-0">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800">New Bill / Invoice (Shop)</h1>

            {/* Bill Type Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Bill Type:</span>
              <div className="relative inline-flex items-center bg-gray-200 border-2 border-gray-300 rounded-full w-12 h-6 cursor-pointer transition-colors duration-300"
                onClick={() => setBillType(prev => prev === "ORDINARY" ? "REFERENCE" : "ORDINARY")}
                title="Toggle between Ordinary and Reference bill">
                <input type="checkbox" className="sr-only" checked={billType === "ORDINARY"} readOnly />
                <div className={`absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-all duration-300 ${billType === "ORDINARY" ? "transform translate-x-0" : "transform translate-x-6"}`}></div>
              </div>
              <span className="text-sm font-medium ml-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${billType === "ORDINARY" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                  {billType === "ORDINARY" ? "ORDINARY" : "REFERENCE"}
                </span>
              </span>
            </div>

            {/* Tax Invoice Checkbox */}
            {hasTaxInvoiceAccess && (
              <div className="flex items-center gap-2 ml-4">
                <input
                  type="checkbox"
                  id="taxInvoiceCheckbox"
                  checked={isTaxInvoice}
                  onChange={(e) => setIsTaxInvoice(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="taxInvoiceCheckbox" className="text-sm font-medium text-gray-700 cursor-pointer">Tax Invoice</label>
              </div>
            )}
          </div>
          <button onClick={() => navigate(baseUrl + '/billing/view')} className="text-gray-500 hover:text-red-500">✕</button>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Left Side: Customer */}
          <div className="col-span-8 flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="w-1/3">
                <div className="relative">
                  <input
                    ref={customerMobileRef}
                    type="text"
                    placeholder="Mobile Number"
                    className="w-full p-2 border rounded text-sm focus:ring-1 focus:ring-blue-500"
                    value={customerMobileNumber}
                    onChange={(e) => {
                      setCustomerMobileNumber(e.target.value);
                      fetchCustomerSuggestions(e.target.value, 'mobile');
                    }}
                    onFocus={() => {
                      if (customerMobileNumber.length >= 3) fetchCustomerSuggestions(customerMobileNumber, 'mobile');
                    }}
                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                  />
                  {showCustomerDropdown && activeCustomerField === 'mobile' && (
                    <ul className="absolute left-0 top-full mt-1 w-full bg-white border shadow-lg max-h-60 overflow-y-auto z-50 rounded">
                      {customerSuggestions.map((c, i) => (
                        <li
                          key={i}
                          className={`p-2 cursor-pointer border-b flex justify-between items-center ${i === selectedCustomerIndex ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                          onClick={() => handleSelectCustomer(c)}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold">{c.mobile}</span>
                            <span className="text-xs text-gray-500">{c.name} - {c.address}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomerSelection(e, c.mobile)}
                            className="text-red-400 hover:text-red-600 p-1"
                            title="Delete this suggestion"
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="w-1/3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Customer Name (Optional)"
                    className="w-full p-2 border rounded text-sm"
                    value={toInfo.name}
                    onChange={(e) => {
                      setToInfo({ ...toInfo, name: e.target.value });
                      fetchCustomerSuggestions(e.target.value, 'name');
                    }}
                    onFocus={() => {
                      if (toInfo.name.length >= 3) fetchCustomerSuggestions(toInfo.name, 'name');
                    }}
                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                  />
                  {showCustomerDropdown && activeCustomerField === 'name' && (
                    <ul className="absolute left-0 top-full mt-1 w-full bg-white border shadow-lg max-h-60 overflow-y-auto z-50 rounded">
                      {customerSuggestions.map((c, i) => (
                        <li
                          key={i}
                          className={`p-2 cursor-pointer border-b flex justify-between items-center ${i === selectedCustomerIndex ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                          onClick={() => handleSelectCustomer(c)}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold">{c.name}</span>
                            <span className="text-xs text-gray-500">{c.mobile} - {c.address}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomerSelection(e, c.mobile)}
                            className="text-red-400 hover:text-red-600 p-1"
                            title="Delete this suggestion"
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="w-1/3">
                <input type="text" placeholder="PO No." className="w-full p-2 border rounded text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-2/3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Billing Address"
                    className="w-full p-2 border rounded text-sm"
                    value={toInfo.address}
                    onChange={(e) => {
                      setToInfo({ ...toInfo, address: e.target.value });
                      fetchCustomerSuggestions(e.target.value, 'address');
                    }}
                    onFocus={() => {
                      if (toInfo.address.length >= 3) fetchCustomerSuggestions(toInfo.address, 'address');
                    }}
                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                  />
                  {showCustomerDropdown && activeCustomerField === 'address' && (
                    <ul className="absolute left-0 top-full mt-1 w-full bg-white border shadow-lg max-h-60 overflow-y-auto z-50 rounded">
                      {customerSuggestions.map((c, i) => (
                        <li
                          key={i}
                          className={`p-2 cursor-pointer border-b flex justify-between items-center ${i === selectedCustomerIndex ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                          onClick={() => handleSelectCustomer(c)}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold">{c.address}</span>
                            <span className="text-xs text-gray-500">{c.name} - {c.mobile}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomerSelection(e, c.mobile)}
                            className="text-red-400 hover:text-red-600 p-1"
                            title="Delete this suggestion"
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="w-1/3">
                <input type="text" placeholder="PO Date" className="w-full p-2 border rounded text-sm" />
              </div>
              <div className="w-1/3 relative">
                <input
                  type="text"
                  placeholder="Select Worker (Optional)"
                  className="w-full p-2 border rounded text-sm"
                  value={workers.find(w => w._id === selectedWorker)?.name || workerSearchTerm}
                  onChange={(e) => {
                    setWorkerSearchTerm(e.target.value);
                    setShowWorkerDropdown(true);
                    if (e.target.value === '') {
                      setSelectedWorker('');
                    }
                  }}
                  onFocus={() => {
                    setWorkerSearchTerm('');
                    setShowWorkerDropdown(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setShowWorkerDropdown(false);
                    }, 200);
                  }}
                />
                {showWorkerDropdown && (
                  <ul className="absolute left-0 top-full mt-1 w-full bg-white border shadow-lg max-h-60 overflow-y-auto z-50 rounded">
                    {workers
                      .filter(worker =>
                        worker.name.toLowerCase().includes(workerSearchTerm.toLowerCase())
                      )
                      .map((worker, index) => (
                        <li
                          key={worker._id}
                          className={`p-2 cursor-pointer border-b ${index === selectedWorkerIndex ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                          onClick={() => {
                            setSelectedWorker(worker._id);
                            setWorkerSearchTerm('');
                            setShowWorkerDropdown(false);
                            setSelectedWorkerIndex(-1);
                          }}
                        >
                          {worker.name}
                        </li>
                      ))
                    }
                  </ul>
                )}
              </div>
            </div>
            {isTaxInvoice && (
              <div className="flex gap-2">
                <div className="w-1/2 group">
                  <label className="text-[10px] text-gray-500 font-bold ml-1 uppercase">GST Number</label>
                  <input
                    type="text"
                    placeholder="Enter Customer GST No"
                    className="w-full p-2 border-2 border-blue-100 rounded text-sm focus:border-blue-400 outline-none font-bold"
                    value={toInfo.gstin}
                    onChange={(e) => setToInfo({ ...toInfo, gstin: e.target.value })}
                  />
                </div>
                <div className="w-1/2 group">
                  <label className="text-[10px] text-gray-500 font-bold ml-1 uppercase">Place of Supply</label>
                  <input
                    type="text"
                    placeholder="Enter Place of Supply"
                    className="w-full p-2 border-2 border-blue-100 rounded text-sm focus:border-blue-400 outline-none font-bold"
                    value={toInfo.placeOfSupply}
                    onChange={(e) => setToInfo({ ...toInfo, placeOfSupply: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Invoice Meta */}
          <div className="col-span-4 flex flex-col gap-2 items-end text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Invoice No:</span>
              {isTaxInvoice ? (
                <input
                  type="text"
                  placeholder="Manual Inv No."
                  className="border rounded p-1 text-sm font-bold w-32 text-right"
                  value={toInfo.invoiceNo}
                  onChange={(e) => setToInfo({ ...toInfo, invoiceNo: e.target.value })}
                />
              ) : (
                <span className="font-bold">Auto-Gen</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Date:</span>
              <input
                type="date"
                value={billDate.split('T')[0]}
                onChange={(e) => {
                  const newDate = e.target.value;
                  const currentTime = billDate.split('T')[1];
                  setBillDate(`${newDate}T${currentTime}`);
                  setIsManualTime(true);
                }}
                className="font-bold border rounded p-1 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Time:</span>
              <input
                type="time"
                step="1"
                value={billDate.split('T')[1]}
                onChange={(e) => {
                  const newTime = e.target.value;
                  const currentDate = billDate.split('T')[0];
                  setBillDate(`${currentDate}T${newTime}`);
                  setIsManualTime(true);
                }}
                className="font-bold border rounded p-1 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 w-full justify-end">
              <span className="text-gray-500">State:</span>
              <select
                value={toInfo.state || 'Tamil Nadu'}
                onChange={(e) => setToInfo({ ...toInfo, state: e.target.value })}
                className="border rounded p-1 text-sm text-right font-bold"
              >
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Kerala">Kerala</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Karnataka">Karnataka</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN TABLE AREA --- */}
      {/* FIX: Removed "overflow-y-auto" and "hide-scrollbar" here to prevent nested scrolling */}
      <div className="flex-1 bg-white p-2">
        <table className="w-full border-collapse border border-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm text-xs uppercase text-gray-600 font-bold">
            <tr>
              <th className="p-2 border border-gray-200 w-8">#</th>
              <th className="p-2 border border-gray-200 text-left min-w-[200px]">ITEM</th>

              <th className="p-2 border border-gray-200 w-16">QTY</th>
              <th className="p-2 border border-gray-200 w-20">UNIT</th>
              {isTaxInvoice && <th className="p-2 border border-gray-200 w-24">HSN/SKU</th>}
              <th className="p-2 border border-gray-200 w-28 text-right">
                PRICE/UNIT <br /><span className="text-[10px] lowercase font-normal">({isTaxInvoice ? 'Before Tax' : 'Without Tax'})</span>
              </th>
              {isTaxInvoice && <th className="p-2 border border-gray-200 w-24 text-right">GST</th>}
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
                  ref={quantityRef}
                  type="text"
                  className="w-full bg-transparent outline-none text-center font-bold"
                  placeholder="0"
                  value={currentItem.rawInput || currentItem.quantity}
                  onChange={handleQuantityChange}
                />
              </td>
              <td className="p-1 border border-blue-200">
                <select className="w-full bg-transparent outline-none text-xs" value={currentItem.unit} onChange={handleUnitChange}>
                  {currentItem.product ? getAvailableUnits(currentItem.product.prices).map(u => <option key={u} value={u}>{u}</option>) : <option>NONE</option>}
                </select>
              </td>
              {isTaxInvoice && (
                <td className="p-1 border border-blue-200">
                  <input
                    type="text"
                    className="w-full bg-white border border-blue-200 rounded p-1 text-xs text-center"
                    placeholder="HSN/SAC"
                    value={currentItem.hsn}
                    onChange={(e) => setCurrentItem({ ...currentItem, hsn: e.target.value })}
                  />
                </td>
              )}
              <td className="p-2 border border-blue-200 text-right">
                {currentItem.price ? (isTaxInvoice ? (currentItem.price / (1 + gstPercentage / 100)).toFixed(2) : currentItem.price) : 0}
              </td>
              {isTaxInvoice && <td className="p-2 border border-blue-200 text-right">{(calculateItemTaxAmount(currentItem.quantity, currentItem.price / (1 + gstPercentage / 100), gstPercentage)).toFixed(2)}</td>}

              <td className="p-2 border border-blue-200 text-right font-bold">
                {calculateItemAmount(currentItem.rawInput || currentItem.quantity, currentItem.price, currentItem.discountPercent, currentItem.discountAmount).toFixed(2)}
              </td>
              <td className="p-1 border border-blue-200 text-center">
                <button onClick={handleAddItem} className="text-blue-600 font-bold text-xl hover:scale-110 transition-transform" disabled={!currentItem.product}>+</button>
              </td>
            </tr>

            {/* Data Rows */}
            {billItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="p-2 border border-gray-200 text-center text-gray-500">{idx + 1}</td>
                <td className="p-2 border border-gray-200 font-medium">{item.productName}</td>
                <td className="p-2 border border-gray-200 text-center">
                  <input
                    type="text"
                    className="w-full text-center p-1 border rounded bg-transparent hover:bg-white"
                    value={item.quantity}
                    onChange={e => updateBillItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    min="0"
                  />
                </td>
                <td className="p-2 border border-gray-200 text-center">
                  <select
                    className="w-full text-center p-1 border rounded bg-transparent hover:bg-white"
                    value={item.unit}
                    onChange={e => updateBillItem(idx, 'unit', e.target.value)}
                  >
                    {item.product && typeof item.product === 'object' && item.product.prices && item.product.prices.length > 0 ?
                      getAvailableUnits(item.product.prices).map(u => <option key={u} value={u}>{u}</option>)
                      : <option value={item.unit}>{item.unit}</option>}
                  </select>
                </td>
                {isTaxInvoice && (
                  <td className="p-1 border border-gray-200">
                    <input
                      type="text"
                      className="w-full text-center p-1 border rounded bg-transparent hover:bg-white text-xs"
                      value={item.hsn || ''}
                      onChange={e => updateBillItem(idx, 'hsn', e.target.value)}
                      placeholder="Enter HSN"
                    />
                  </td>
                )}
                <td className="p-2 border border-gray-200 text-right">
                  <input
                    type="text"
                    className="w-full text-right p-1 border rounded bg-transparent hover:bg-white"
                    value={isTaxInvoice ? (item.price / (1 + gstPercentage / 100)).toFixed(2) : item.price}
                    onChange={e => updateBillItem(idx, 'price', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                  />
                </td>
                {isTaxInvoice && <td className="p-2 border border-gray-200 text-right">{(calculateItemTaxAmount(item.quantity, item.price / (1 + gstPercentage / 100), gstPercentage)).toFixed(2)}</td>}
                <td className="p-2 border border-gray-200 text-right font-bold">
                  {calculateItemAmount(item.quantity, item.price, item.discountPercent, item.discountAmount).toFixed(2)}
                </td>
                <td className="p-2 border border-gray-200 text-center">
                  <button
                    onClick={() => handleRemoveItem(idx)}
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
              <td className="border border-gray-200 p-2 text-center">{billItems.reduce((acc, i) => acc + parseFloat(i.quantity), 0)}</td>
              <td colSpan="1" className="border border-gray-200"></td>
              <td className="border border-gray-200 p-2 text-right">{subtotal.toFixed(2)}</td>
              <td className="border border-gray-200"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* --- FOOTER --- */}
      <div className="bg-white border-t p-4 shrink-0 z-30 shadow-[0_-4px_8px_rgba(0,0,0,0.05)] text-sm">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Left Column */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-gray-500 text-xs font-bold mb-1">Payment Type</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-48 border border-gray-300 rounded p-2 text-sm bg-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </select>
              <div className="text-blue-500 text-xs mt-1 cursor-pointer hover:underline">+ Add Payment type</div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={autoDownload} onChange={e => setAutoDownload(e.target.checked)} /> Auto Download
            </div>
          </div>

          {/* Right Column: Calculations */}
          <div className="flex-1 max-w-2xl">
            <div className="grid grid-cols-[1fr_auto] gap-y-2 items-center">

              {/* Row 1: Discount */}
              <div className="flex justify-end items-center gap-2">
                <span className="text-gray-600 font-medium">Discount</span>
                <div className="flex">
                  <input className="w-16 border rounded-l p-1 text-right pr-6" placeholder="" value={discountType === 'percentage' ? discountValue : ''} onChange={e => { setDiscountType('percentage'); setDiscountValue(e.target.value) }} /><span className="relative right-4 top-1 text-gray-400">%</span>
                  <input className="w-20 border rounded-r p-1 text-right pr-6" placeholder="" value={discountType === 'cash' ? discountValue : ''} onChange={e => { setDiscountType('cash'); setDiscountValue(e.target.value) }} /><span className="relative right-4 top-1 text-gray-400">₹</span>
                </div>
              </div>
              <div className="text-right font-medium w-32">{discountAmount > 0 && <span className="text-red-500">-{discountAmount.toFixed(2)}</span>}</div>

              {/* Row 2: Round Off & Total */}
              <div className="flex justify-end items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={roundOff} onChange={e => setRoundOff(e.target.checked)} />
                  <span className="text-gray-600">Round Off</span>
                  <span className="text-gray-400 text-xs w-8 text-right">{roundOff ? (totalAmount - netAmount).toFixed(2) : '0.00'}</span>
                </label>
                <span className="font-bold text-gray-700">Total</span>
              </div>
              <div className="text-right w-32">
                <div className="bg-gray-100 border rounded px-2 py-1 font-bold text-gray-800 text-right">{totalAmount.toFixed(2)}</div>
              </div>

              {/* Row 3: Received */}
              <div className="flex justify-end items-center"><span className="font-bold text-gray-700">Received</span></div>
              <div className="text-right w-32">
                <input ref={amountPaidRef} type="text" className="w-full border-2 border-blue-400 rounded px-2 py-1 font-bold text-right" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
              </div>

              {/* Row 4: Balance */}
              <div className="flex justify-end items-center"><span className="font-bold text-gray-700">Balance</span></div>
              <div className="text-right w-32 font-bold text-gray-800">{(totalAmount - (parseFloat(amountPaid) || 0)).toFixed(2)}</div>

              {/* Row 5: Buttons */}
              <div className="col-span-2 flex justify-end gap-2 mt-2">
                {/* Modified: Print button now triggers Save & Print by passing true */}
                <button onClick={(e) => handleSubmit(e, true)} className="px-4 py-2 border border-blue-500 text-blue-500 rounded font-bold hover:bg-blue-50 flex items-center gap-2">
                  Print <span className="text-xs">▼</span>
                </button>
                <button ref={createBillButtonRef} onClick={(e) => handleSubmit(e, false)} className="px-8 py-2 bg-blue-500 text-white rounded font-bold hover:bg-blue-600 shadow-sm">Save</button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateBill;
