import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from '../../../api/axios';
import { LuPackage, LuClock, LuCheckCircle, LuPlus, LuCheck, LuX, LuSearch } from 'react-icons/lu';
import { AuthContext } from '../../../context/AuthContext';
import { formatDateWithTime, convertUnit, getBatchId } from '../../../utils/unitConversion';

const AfterPackingAddToStock = () => {
    const { authState } = useContext(AuthContext);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [itemToComplete, setItemToComplete] = useState(null);
    const [completedQty, setCompletedQty] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('');
    const [editedProductName, setEditedProductName] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [usedByDate, setUsedByDate] = useState('');

    // Auxiliary data for the modal
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [sku, setSku] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [netPrice, setNetPrice] = useState('');
    const [sellPrice, setSellPrice] = useState('');

    // Suggestions
    const [recentProductNames, setRecentProductNames] = useState([]);
    const [showProductNameSuggestions, setShowProductNameSuggestions] = useState(false);
    const [recentUnits, setRecentUnits] = useState(['kg', 'gram', 'piece', 'box', 'liter', 'ml']);
    const [showUnitSuggestions, setShowUnitSuggestions] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('recentProductNames');
        if (stored) {
            try { setRecentProductNames(JSON.parse(stored)); } catch (e) { }
        }
        const storedUnits = localStorage.getItem('recentUnits');
        if (storedUnits) {
            try { setRecentUnits(JSON.parse(storedUnits)); } catch (e) { }
        }
    }, []);

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

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all after packing items and filter for pending/partial ones (ready to add to stock)
            const response = await axios.get('/admin/warehouse/after-packing');
            const availableItems = response.data.filter(item =>
                item.status === 'Pending' || item.status === 'Partial'
            );
            setItems(availableItems);
            setError('');
        } catch (err) {
            setError('Failed to fetch After Packing items ready for stock.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
        fetchCategoriesAndProducts();
    }, [fetchItems]);

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

    const filteredItems = items
        .filter(item =>
            (item.productName || item.sweetName || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const confirmComplete = (item) => {
        setItemToComplete(item);
        setCompletedQty(item.quantity);
        setSelectedUnit(item.unit);
        setEditedProductName(item.productName || item.sweetName || '');
        setSku(`PROD-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
        setSelectedCategory('');
        setNetPrice(item.price || '');
        setSellPrice(item.price ? (item.price * 1.2).toFixed(2) : '');
        setShowConfirmation(true);
    };

    const handleConfirmComplete = async () => {
        if (itemToComplete && completedQty && selectedUnit) {
            try {
                const inputQty = Number(completedQty);
                if (inputQty <= 0) {
                    setError('Please enter a valid quantity.');
                    return;
                }

                const convertedQty = convertUnit(inputQty, selectedUnit, itemToComplete.unit);

                if (convertedQty > itemToComplete.quantity + 0.0001) {
                    setError(`Quantity cannot exceed remaining amount (${itemToComplete.quantity} ${itemToComplete.unit}).`);
                    return;
                }

                // update recent lists
                if (editedProductName) {
                    const trimmedName = editedProductName.trim();
                    const newRecent = [trimmedName, ...recentProductNames.filter(n => n !== trimmedName)].slice(0, 10);
                    setRecentProductNames(newRecent);
                    localStorage.setItem('recentProductNames', JSON.stringify(newRecent));
                }
                if (selectedUnit) {
                    const trimmedUnit = selectedUnit.trim();
                    const newUnits = [trimmedUnit, ...recentUnits.filter(u => u !== trimmedUnit)].slice(0, 15);
                    setRecentUnits(newUnits);
                    localStorage.setItem('recentUnits', JSON.stringify(newUnits));
                }

                const response = await axios.put(`/admin/warehouse/after-packing/${itemToComplete._id}/add-to-stock`, {
                    expiryDate,
                    usedByDate,
                    completedQty: inputQty,
                    selectedUnit: selectedUnit,
                    deductionQty: convertedQty,
                    editedProductName: editedProductName,
                    sku: sku,
                    category: selectedCategory,
                    netPrice: netPrice,
                    sellPrice: sellPrice
                });

                setMessage(response.data.message);
                setShowConfirmation(false);
                setItemToComplete(null);
                setExpiryDate('');
                setUsedByDate('');
                fetchItems(); // Refresh the list
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to add item to stock.');
            }
        }
    };

    const handleCancelConfirm = () => {
        setShowConfirmation(false);
        setItemToComplete(null);
        setCompletedQty('');
        setEditedProductName('');
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
                <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <img src="/sweethub-logo.png" className="absolute w-8 h-8" alt="logo" />
            </div>
            <div className="text-blue-600 font-medium">Loading items for stock...</div>
        </div>
    );

    return (
        <div className="bg-gray-50 min-h-screen p-4 md:p-6">
            <div className="max-w-7xl mx-auto bg-white p-6 rounded-2xl shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                            <LuPackage className="text-blue-600" />
                            Add to Stock
                        </h1>
                        <p className="text-gray-500 mt-1">Transform packed items into available inventory.</p>
                    </div>

                    <div className="relative w-full md:w-auto">
                        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-80 shadow-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6 flex items-center gap-3 animate-shake">
                        <LuX className="text-red-500 w-5 h-5 cursor-pointer" onClick={() => setError('')} />
                        <span className="text-red-700 font-medium">{error}</span>
                    </div>
                )}
                {message && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-6 flex items-center gap-3 animate-fadeIn">
                        <LuCheck className="text-green-500 w-5 h-5" />
                        <span className="text-green-700 font-medium">{message}</span>
                    </div>
                )}

                <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                            <tr>
                                <th className="py-4 px-6 text-left">Batch ID</th>
                                <th className="py-4 px-6 text-left">Product</th>
                                <th className="py-4 px-6 text-left">Quantity</th>
                                <th className="py-4 px-6 text-left">Unit</th>
                                <th className="py-4 px-6 text-left">Produced On</th>
                                <th className="py-4 px-6 text-left">Status</th>
                                <th className="py-4 px-6 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredItems.length > 0 ? filteredItems.map((item) => (
                                <tr key={item._id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="py-4 px-6 font-mono text-sm text-gray-600">
                                        {getBatchId(item.scheduleId, item.batchId)}
                                    </td>
                                    <td className="py-4 px-6 font-bold text-gray-900">
                                        {item.productName || item.sweetName}
                                    </td>
                                    <td className="py-4 px-6 text-gray-700 font-medium">
                                        {item.quantity} {item.status === 'Partial' && `(of ${item.totalQuantity || item.quantity})`}
                                    </td>
                                    <td className="py-4 px-6 text-gray-500 uppercase text-xs font-bold">
                                        {item.unit}
                                    </td>
                                    <td className="py-4 px-6 text-gray-500 text-sm">
                                        {formatDateWithTime(item.date)}
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${item.status === 'Pending'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <button
                                            onClick={() => confirmComplete(item)}
                                            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-all font-bold text-xs shadow-sm hover:shadow-md flex items-center gap-2 mx-auto"
                                        >
                                            <LuPlus className="w-3.5 h-3.5" />
                                            Add to Stock
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="text-center py-20">
                                        <LuPackage className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                                        <p className="text-gray-400 font-medium">No items ready for stock addition.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detailed Stock Addition Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[98vh] overflow-y-auto transform transition-all p-8 animate-popup">
                        <div className="flex justify-between items-start mb-6 pb-2 border-b-2 border-blue-50">
                            <div>
                                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Confirm Stock Addition</h3>
                            </div>
                            <button onClick={handleCancelConfirm} className="text-gray-400 hover:text-red-500 transition-colors">
                                <LuX className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Product Name */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Product Name</label>
                                <input
                                    type="text"
                                    className="w-full px-0 py-1 bg-transparent border-none outline-none font-black text-blue-600 text-2xl uppercase focus:ring-0"
                                    value={editedProductName}
                                    onChange={(e) => {
                                        setEditedProductName(e.target.value);
                                        setShowProductNameSuggestions(true);
                                    }}
                                    onFocus={() => setShowProductNameSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowProductNameSuggestions(false), 200)}
                                />
                                <div className="h-0.5 bg-blue-100 w-full mt-1"></div>
                                {showProductNameSuggestions && (
                                    <ul className="absolute z-20 w-full max-w-sm bg-white border border-gray-100 rounded-xl shadow-2xl max-h-48 overflow-auto mt-2 p-1">
                                        {recentProductNames.filter(n => n.toLowerCase().includes(editedProductName.toLowerCase())).map((name, i) => (
                                            <li key={i} onClick={() => setEditedProductName(name)} className="px-4 py-2 hover:bg-blue-50 rounded-lg cursor-pointer font-bold text-gray-700 uppercase text-sm">
                                                {name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Info Block */}
                            <div className="space-y-1 text-sm font-medium">
                                <p className="text-gray-600">Total Original: <span className="text-gray-900">{itemToComplete?.totalQuantity || itemToComplete?.quantity} {itemToComplete?.unit}</span></p>
                                <p className="text-gray-600">Current Remaining: <span className="text-gray-900">{itemToComplete?.quantity} {itemToComplete?.unit}</span></p>
                                <p className="text-gray-600">Unit Price: <span className="text-gray-900 font-bold">₹{itemToComplete?.price} / {itemToComplete?.unit}</span></p>
                            </div>

                            {/* Main Inputs */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-900"
                                        value={completedQty}
                                        onChange={(e) => setCompletedQty(e.target.value)}
                                    />
                                </div>

                                <div className="relative">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Unit</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-900"
                                        value={selectedUnit}
                                        onChange={(e) => {
                                            setSelectedUnit(e.target.value);
                                            setShowUnitSuggestions(true);
                                        }}
                                        onFocus={() => setShowUnitSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowUnitSuggestions(false), 200)}
                                    />
                                    {showUnitSuggestions && (
                                        <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-32 overflow-auto mt-2 p-1">
                                            {recentUnits.filter(u => u.toLowerCase().includes(selectedUnit.toLowerCase())).map((u, i) => (
                                                <li key={i} onClick={() => setSelectedUnit(u)} className="px-4 py-2 hover:bg-blue-50 rounded-lg cursor-pointer font-bold text-gray-700 text-sm uppercase">{u}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">SKU (Optional)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-600"
                                        value={sku}
                                        onChange={(e) => setSku(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Category (Optional)</label>
                                    <select
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-600"
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                    >
                                        <option value="">None</option>
                                        {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Net Price (₹)</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                            value={netPrice}
                                            onChange={(e) => setNetPrice(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Sell Price (₹)</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600"
                                            value={sellPrice}
                                            onChange={(e) => setSellPrice(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Calculations */}
                            <div className="pt-2 border-t border-gray-100">
                                <p className="text-lg font-black text-gray-900">Total Value: ₹{(Number(completedQty || 0) * Number(netPrice || 0)).toFixed(2)}</p>
                                <p className="text-sm text-gray-500 font-medium mt-1">
                                    (Converted Quantity: {completedQty ? convertUnit(Number(completedQty), selectedUnit, itemToComplete?.unit).toFixed(3) : '0.000'} {itemToComplete?.unit})
                                </p>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Expiry Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Used By Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                                        value={usedByDate}
                                        onChange={(e) => setUsedByDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-6 border-t border-gray-100">
                                <button
                                    onClick={handleCancelConfirm}
                                    className="px-8 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmComplete}
                                    className="flex-grow py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-100"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AfterPackingAddToStock;
