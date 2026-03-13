import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from '../../../api/axios';
import { LuCheck, LuPackage, LuX, LuDownload } from 'react-icons/lu';
import CreateAfterPackingAccountModal from './CreateAfterPackingAccountModal';
import CustomModal from '../../CustomModal';
import { AuthContext } from '../../../context/AuthContext';
import { formatDateWithTime, convertUnit, getBatchId } from '../../../utils/unitConversion';
import * as XLSX from 'xlsx';

const AfterPacking = () => {
    const { authState } = useContext(AuthContext);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [timeFilter, setTimeFilter] = useState('all');
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [itemToComplete, setItemToComplete] = useState(null);
    const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [showManageMode, setShowManageMode] = useState(false);
    const [expiryDate, setExpiryDate] = useState('');
    const [usedByDate, setUsedByDate] = useState('');
    const [completedQty, setCompletedQty] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('');
    const [editedProductName, setEditedProductName] = useState('');
    const [recentProductNames, setRecentProductNames] = useState([]);
    const [showProductNameSuggestions, setShowProductNameSuggestions] = useState(false);

    // Unit autosuggest state
    const [recentUnits, setRecentUnits] = useState(['kg', 'gram', 'piece', 'box', 'liter', 'ml']);
    const [showUnitSuggestions, setShowUnitSuggestions] = useState(false);

    // New Auxiliary States
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [sku, setSku] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [netPrice, setNetPrice] = useState('');
    const [sellPrice, setSellPrice] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('recentProductNames');
        if (stored) {
            try {
                setRecentProductNames(JSON.parse(stored));
            } catch (e) { }
        }

        const storedUnits = localStorage.getItem('recentUnits');
        if (storedUnits) {
            try {
                setRecentUnits(JSON.parse(storedUnits));
            } catch (e) { }
        }
    }, []);

    useEffect(() => {
        const fetchCategoriesAndProducts = async () => {
            try {
                const [catRes, prodRes] = await Promise.all([
                    axios.get('/admin/categories'),
                    axios.get('/admin/products')
                ]);
                setCategories(catRes.data);
                setProducts(prodRes.data);
            } catch (error) {
                console.error("Failed to fetch auxiliary data", error);
            }
        };
        fetchCategoriesAndProducts();
    }, []);

    useEffect(() => {
        if (!showConfirmation || !editedProductName) return;
        const matchingProduct = products.find(p => p.name.toLowerCase() === editedProductName.toLowerCase());
        if (matchingProduct) {
            setSku(matchingProduct.sku || '');
            setSelectedCategory(matchingProduct.category?._id || matchingProduct.category || '');
            const priceObj = matchingProduct.prices?.find(p => p.unit === selectedUnit) || matchingProduct.prices?.[0];
            if (priceObj) {
                setNetPrice(priceObj.netPrice || '');
                setSellPrice(priceObj.sellingPrice || '');
            }
        }
    }, [editedProductName, selectedUnit, showConfirmation, products]);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/admin/warehouse/after-packing');
            setItems(response.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch After Packing items.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const filteredItems = items
        .filter(item => {
            const matchesSearch = (item.productName || item.sweetName || '').toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            if (timeFilter === 'all') return true;

            const itemDate = new Date(item.date);
            const now = new Date();

            if (timeFilter === 'hour') {
                return (now - itemDate) <= 60 * 60 * 1000;
            }
            if (timeFilter === 'today') {
                return itemDate.toDateString() === now.toDateString();
            }
            if (timeFilter === 'yesterday') {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                return itemDate.toDateString() === yesterday.toDateString();
            }
            if (timeFilter === 'week') {
                return (now - itemDate) <= 7 * 24 * 60 * 60 * 1000;
            }
            if (timeFilter === 'month') {
                return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
            }
            return true;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const handleDownloadExcel = () => {
        const dataToExport = filteredItems.map(item => ({
            'Batch ID': getBatchId(item.scheduleId, item.batchId),
            'Product Name': item.productName || item.sweetName,
            'Quantity': item.quantity,
            'Total Quantity': item.totalQuantity || item.quantity,
            'Unit': item.unit,
            'Date': formatDateWithTime(item.date),
            'Status': item.status
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'After Packing');
        XLSX.writeFile(wb, `After_Packing_Report_${timeFilter}.xlsx`);
    };

    /* UNUSED: handleStatusChange */

    const handleAddToStock = async (itemId, inputQty, userSelectedUnit, convertedQtyToDeduct, newProductName, customSku, customCategory, customNetPrice, customSellPrice) => {
        try {
            const response = await axios.put(`/admin/warehouse/after-packing/${itemId}/add-to-stock`, {
                expiryDate,
                usedByDate,
                completedQty: inputQty,
                selectedUnit: userSelectedUnit,
                deductionQty: convertedQtyToDeduct,
                editedProductName: newProductName,
                sku: customSku,
                category: customCategory,
                netPrice: customNetPrice,
                sellPrice: customSellPrice
            });
            setMessage(response.data.message);
            setExpiryDate('');
            setUsedByDate('');
            fetchItems(); // Refresh the list
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add item to stock.');
        }
    };

    const confirmComplete = (item) => {
        setItemToComplete(item);
        setCompletedQty(item.quantity);
        setSelectedUnit(item.unit);
        setEditedProductName(item.productName || item.sweetName || '');

        setSku(`PROD-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
        setSelectedCategory('');
        setNetPrice(item.price || '');
        // Default sell price logic: 20% markup
        setSellPrice(item.price ? (item.price * 1.2).toFixed(2) : '');

        setShowConfirmation(true);
    };

    const handleConfirmComplete = () => {
        if (itemToComplete && completedQty && selectedUnit) {
            try {
                const inputQty = Number(completedQty);
                if (inputQty <= 0) {
                    setError('Please enter a valid quantity.');
                    return;
                }

                // Convert input quantity to the original unit for comparison and processing
                const convertedQty = convertUnit(inputQty, selectedUnit, itemToComplete.unit);

                // Use a small epsilon for floating point comparison to prevent error when floating math deviates slightly
                if (convertedQty > itemToComplete.quantity + 0.0001) {
                    setError(`Quantity cannot exceed remaining amount (${itemToComplete.quantity} ${itemToComplete.unit}).`);
                    return;
                }

                // update recent product names
                if (editedProductName && editedProductName.trim() !== '') {
                    const trimmedName = editedProductName.trim();
                    const newRecent = [trimmedName, ...recentProductNames.filter(n => n !== trimmedName)].slice(0, 10);
                    setRecentProductNames(newRecent);
                    localStorage.setItem('recentProductNames', JSON.stringify(newRecent));
                }

                // update recent units
                if (selectedUnit && selectedUnit.trim() !== '') {
                    const trimmedUnit = selectedUnit.trim();
                    const newUnits = [trimmedUnit, ...recentUnits.filter(u => u !== trimmedUnit)].slice(0, 15);
                    setRecentUnits(newUnits);
                    localStorage.setItem('recentUnits', JSON.stringify(newUnits));
                }

                handleAddToStock(itemToComplete._id, inputQty, selectedUnit, convertedQty, editedProductName, sku, selectedCategory, netPrice, sellPrice);
                setShowConfirmation(false);
                setItemToComplete(null);
                setCompletedQty('');
                setSelectedUnit('');
                setEditedProductName('');
                setShowProductNameSuggestions(false);
                setShowUnitSuggestions(false);
                setSku('');
                setSelectedCategory('');
                setNetPrice('');
                setSellPrice('');
            } catch (err) {
                setError('Unit conversion error: ' + err.message);
            }
        }
    };

    const handleCancelConfirm = () => {
        setShowConfirmation(false);
        setItemToComplete(null);
        setCompletedQty('');
        setEditedProductName('');
        setShowProductNameSuggestions(false);
        setExpiryDate('');
        setUsedByDate('');
        setSku('');
        setSelectedCategory('');
        setNetPrice('');
        setSellPrice('');
    };

    if (loading) return (
        <div className="p-4 flex flex-col items-center justify-center">
            <div className="relative flex justify-center items-center mb-4">
                <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
                <img
                    src="/sweethub-logo.png"
                    alt="Sweet Hub Logo"
                    className="absolute w-8 h-8"
                />
            </div>
            <div className="text-red-500 font-medium">Loading After Packing items...</div>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">After Packing</h1>
                <div className="flex items-center gap-4">
                    <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-green-500 font-medium text-gray-700"
                    >
                        <option value="all">All Records</option>
                        <option value="hour">Per Hour</option>
                        <option value="today">Today</option>
                        <option value="yesterday">Yesterday</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                    </select>
                    <button
                        onClick={handleDownloadExcel}
                        className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                        title="Download Excel"
                    >
                        <LuDownload className="w-4 h-4" />
                        Download
                    </button>
                    {/* Show Create Account button only for admin users (not for after-packing-only users) */}
                    {authState?.isAuthenticated && authState?.role === 'admin' && (
                        <button
                            onClick={() => {
                                setEditingAccount(null);  // Ensure we're in create mode
                                setShowManageMode(false);  // Set to open modal in create mode
                                setShowCreateAccountModal(true);
                            }}
                            className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                            </svg>
                            Create Account
                        </button>
                    )}
                </div>
            </div>
            <p className="text-gray-600 mb-6">Manage products ready for final packaging and stock addition.</p>

            {error && <div className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</div>}
            {message && <div className="text-green-700 bg-green-100 p-3 rounded mb-4">{message}</div>}

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search items..."
                    className="w-full md:w-1/3 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-light-gray">
                        <tr>
                            <th className="py-2 px-4 text-left">Batch ID</th>
                            <th className="py-2 px-4 text-left">Product Name</th>
                            <th className="py-2 px-4 text-left">Quantity / Total</th>
                            <th className="py-2 px-4 text-left">Unit</th>
                            <th className="py-2 px-4 text-left">Date</th>
                            <th className="py-2 px-4 text-left">Status</th>
                            <th className="py-2 px-4 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.length > 0 ? filteredItems.map((item) => (
                            <tr key={item._id} className="border-b hover:bg-gray-50">
                                <td className="border px-4 py-2 font-medium">{getBatchId(item.scheduleId, item.batchId)}</td>
                                <td className="border px-4 py-2 font-medium">{item.productName || item.sweetName}</td>
                                <td className="border px-4 py-2">
                                    {item.quantity} / {item.totalQuantity || item.quantity}
                                </td>
                                <td className="border px-4 py-2">{item.unit}</td>
                                <td className="border px-4 py-2">
                                    {formatDateWithTime(item.date)}
                                </td>
                                <td className="border px-4 py-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'Pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : item.status === 'Partial'
                                            ? 'bg-orange-100 text-orange-800'
                                            : 'bg-green-100 text-green-800'
                                        }`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="border px-4 py-2">
                                    {item.status !== 'Completed' ? (
                                        <button
                                            onClick={() => confirmComplete(item)}
                                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm flex items-center gap-1"
                                        >
                                            <LuPackage className="w-4 h-4" />
                                            Add to Stock
                                        </button>
                                    ) : (
                                        <span className="text-gray-500 text-sm flex items-center gap-1">
                                            <LuCheck className="w-4 h-4" />
                                            Added to Stock
                                        </span>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" className="text-center py-4">No items found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4">Confirm Stock Addition</h3>
                        <div className="mb-4 text-sm text-gray-600">
                            <div className="mb-4 relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Product Name
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 font-semibold"
                                    value={editedProductName}
                                    onChange={(e) => {
                                        setEditedProductName(e.target.value);
                                        setShowProductNameSuggestions(true);
                                    }}
                                    onFocus={() => setShowProductNameSuggestions(true)}
                                    // Delay hide to allow clicks on suggestions
                                    onBlur={() => setTimeout(() => setShowProductNameSuggestions(false), 200)}
                                />
                                {showProductNameSuggestions && (
                                    (() => {
                                        const matchingRecent = recentProductNames.filter(name => name.toLowerCase().includes(editedProductName.toLowerCase()));
                                        const matchingProducts = [...new Set(products.map(p => p?.name).filter(Boolean))]
                                            .filter(name => name.toLowerCase().includes(editedProductName.toLowerCase()) && !recentProductNames.includes(name));

                                        if (matchingRecent.length === 0 && matchingProducts.length === 0) return null;

                                        return (
                                            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto mt-1">
                                                {matchingRecent.map((name, index) => (
                                                    <li key={`recent-${index}`} className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center group">
                                                        <span
                                                            className="flex-grow font-medium text-gray-800"
                                                            onClick={() => {
                                                                setEditedProductName(name);
                                                                setShowProductNameSuggestions(false);
                                                            }}
                                                        >
                                                            {name}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Remove from history"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newRecent = recentProductNames.filter(n => n !== name);
                                                                setRecentProductNames(newRecent);
                                                                localStorage.setItem('recentProductNames', JSON.stringify(newRecent));
                                                            }}
                                                        >
                                                            <LuX className="w-4 h-4" />
                                                        </button>
                                                    </li>
                                                ))}

                                                {matchingRecent.length > 0 && matchingProducts.length > 0 && (
                                                    <li className="border-t border-gray-200 my-1"></li>
                                                )}

                                                {matchingProducts.map((name, index) => (
                                                    <li key={`product-${index}`} className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center group">
                                                        <span
                                                            className="flex-grow text-gray-600 font-medium"
                                                            onClick={() => {
                                                                setEditedProductName(name);
                                                                setShowProductNameSuggestions(false);
                                                            }}
                                                        >
                                                            {name}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        );
                                    })()
                                )}
                            </div>
                            <p>Total Original: {itemToComplete?.totalQuantity || itemToComplete?.quantity} {itemToComplete?.unit}</p>
                            <p>Current Remaining: {itemToComplete?.quantity} {itemToComplete?.unit}</p>
                            <p>Unit Price: ₹{itemToComplete?.price} / {itemToComplete?.unit}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Quantity
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    value={completedQty}
                                    onChange={(e) => setCompletedQty(e.target.value)}
                                    min="0"
                                    step="any"
                                />
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Unit
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    value={selectedUnit}
                                    onChange={(e) => {
                                        setSelectedUnit(e.target.value);
                                        setShowUnitSuggestions(true);
                                    }}
                                    onFocus={() => setShowUnitSuggestions(true)}
                                    // Delay hide to allow clicks on suggestions
                                    onBlur={() => setTimeout(() => setShowUnitSuggestions(false), 200)}
                                />
                                {showUnitSuggestions && recentUnits.length > 0 && (
                                    <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-auto mt-1">
                                        {recentUnits
                                            .filter(u => u.toLowerCase().includes(selectedUnit.toLowerCase()))
                                            .map((u, index) => (
                                                <li key={index} className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center group">
                                                    <span
                                                        className="flex-grow"
                                                        onClick={() => {
                                                            setSelectedUnit(u);
                                                            setShowUnitSuggestions(false);
                                                        }}
                                                    >
                                                        {u}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Remove unit"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const newRecent = recentUnits.filter(nu => nu !== u);
                                                            setRecentUnits(newRecent);
                                                            localStorage.setItem('recentUnits', JSON.stringify(newRecent));
                                                        }}
                                                    >
                                                        <LuX className="w-4 h-4" />
                                                    </button>
                                                </li>
                                            ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    SKU (Optional)
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    value={sku}
                                    onChange={(e) => setSku(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category (Optional)
                                </label>
                                <select
                                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Net Price (₹)
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    value={netPrice}
                                    onChange={(e) => setNetPrice(e.target.value)}
                                    step="any"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sell Price (₹)
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    value={sellPrice}
                                    onChange={(e) => setSellPrice(e.target.value)}
                                    step="any"
                                    min="0"
                                />
                            </div>
                        </div>

                        {completedQty && selectedUnit && itemToComplete && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-sm font-semibold text-blue-800">
                                    Total Value: ₹
                                    {(convertUnit(Number(completedQty), selectedUnit, itemToComplete.unit) * itemToComplete.price).toFixed(2)}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    (Converted Quantity: {convertUnit(Number(completedQty), selectedUnit, itemToComplete.unit).toFixed(3)} {itemToComplete.unit})
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Expiry Date
                                </label>
                                <input
                                    type="date"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Used By Date
                                </label>
                                <input
                                    type="date"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={usedByDate}
                                    onChange={(e) => setUsedByDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleCancelConfirm}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmComplete}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Account Modal */}
            {showCreateAccountModal && (
                <CustomModal
                    isOpen={showCreateAccountModal}
                    onClose={() => {
                        setShowCreateAccountModal(false);
                        setEditingAccount(null);  // Reset editing state when modal is closed
                    }}
                    title={editingAccount ? "Edit After Packing Account" : "Create After Packing Account"}
                >
                    <CreateAfterPackingAccountModal
                        onClose={() => {
                            setShowCreateAccountModal(false);
                            setEditingAccount(null);  // Reset editing state when modal is closed
                            setShowManageMode(false);  // Reset manage mode
                        }}
                        onAccountCreated={() => {
                            setShowCreateAccountModal(false);
                            setEditingAccount(null);  // Reset editing state when account is created
                            setShowManageMode(false);  // Reset manage mode
                            // Optionally refresh data or show success message
                        }}
                        editingAccount={editingAccount}
                        showManageAccountsInitial={showManageMode}
                    />
                </CustomModal>
            )}
        </div>
    );
};

export default AfterPacking;