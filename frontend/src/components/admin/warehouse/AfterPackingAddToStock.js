import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from '../../../api/axios';
import { LuPackage, LuX } from 'react-icons/lu';
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
    const [weightPerPacket, setWeightPerPacket] = useState('');
    const [numberOfPackets, setNumberOfPackets] = useState('');
    const [packetWeightUnit, setPacketWeightUnit] = useState('gram');
    const [editedProductName, setEditedProductName] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [usedByDate, setUsedByDate] = useState('');
    const [viewMode, setViewMode] = useState('OWN'); // 'OWN' or 'FINISHED'

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
    const [recentUnits, setRecentUnits] = useState(['kg', 'gram', 'piece', 'packet', 'box', 'liter', 'ml']);
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
        .filter(item => {
            const matchesSearch = (item.productName || item.sweetName || '').toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            const itemSource = item.source || 'OWN';
            if (viewMode === 'OWN' && itemSource !== 'OWN') return false;
            if (viewMode === 'FINISHED' && itemSource !== 'FINISHED PRODUCT') return false;

            return true;
        })
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
        
        setWeightPerPacket('');
        setNumberOfPackets('');
        setPacketWeightUnit('gram');

        setShowConfirmation(true);
    };

    const handleConfirmComplete = async () => {
        if (itemToComplete && completedQty && selectedUnit) {
            try {
                let inputQty = Number(completedQty);
                if (inputQty <= 0 && !(selectedUnit.toLowerCase().includes('packet') && Number(numberOfPackets) > 0)) {
                    setError('Please enter a valid quantity.');
                    return;
                }

                let convertedQty;
                const isPacket = selectedUnit.toLowerCase().includes('packet') || selectedUnit === '1';
                
                if (isPacket && weightPerPacket && numberOfPackets) {
                    const weightFactor = packetWeightUnit === 'gram' ? 0.001 : 1;
                    const totalWeightInKg = Number(weightPerPacket) * Number(numberOfPackets) * weightFactor;
                    convertedQty = convertUnit(totalWeightInKg, 'kg', itemToComplete.unit);
                    inputQty = Number(numberOfPackets);
                } else {
                    convertedQty = convertUnit(inputQty, selectedUnit, itemToComplete.unit);
                }

                if (convertedQty > itemToComplete.quantity + 0.0001) {
                    setError(`Insufficient bulk stock to fulfill this amount. You need ${convertedQty.toFixed(3)} ${itemToComplete.unit}, but only ${itemToComplete.quantity} ${itemToComplete.unit} is available.`);
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
                <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
                <img
                    src="/sweethub-logo.png"
                    alt="Sweet Hub Logo"
                    className="absolute w-8 h-8"
                />
            </div>
            <div className="text-red-500 font-medium">Loading items for stock...</div>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Add to Stock</h1>
            </div>

            <div className="flex justify-between flex-wrap gap-4 mb-6">
                <p className="text-gray-600">Transform packed items into available inventory.</p>
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('OWN')}
                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${viewMode === 'OWN' ? 'bg-white text-green-600 shadow' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        OWN Products
                    </button>
                    <button
                        onClick={() => setViewMode('FINISHED')}
                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${viewMode === 'FINISHED' ? 'bg-white text-green-600 shadow' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        Finished Products
                    </button>
                </div>
            </div>

            {error && <div className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</div>}
            {message && <div className="text-green-700 bg-green-100 p-3 rounded mb-4">{message}</div>}

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search products..."
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
                            <th className="py-2 px-4 text-left">Product</th>
                            <th className="py-2 px-4 text-left">Quantity</th>
                            <th className="py-2 px-4 text-left">Unit</th>
                            <th className="py-2 px-4 text-left">Produced On</th>
                            <th className="py-2 px-4 text-left">Status</th>
                            <th className="py-2 px-4 text-left">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.length > 0 ? filteredItems.map((item) => (
                            <tr key={item._id} className="border-b hover:bg-gray-50">
                                <td className="border px-4 py-2 font-medium">{getBatchId(item.scheduleId, item.batchId)}</td>
                                <td className="border px-4 py-2 font-medium">{item.productName || item.sweetName}</td>
                                <td className="border px-4 py-2">
                                    {item.quantity} {item.status === 'Partial' && `(of ${item.totalQuantity || item.quantity})`}
                                </td>
                                <td className="border px-4 py-2">{item.unit}</td>
                                <td className="border px-4 py-2">
                                    {formatDateWithTime(item.date)}
                                </td>
                                <td className="border px-4 py-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'Pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-orange-100 text-orange-800'
                                        }`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="border px-4 py-2">
                                    <button
                                        onClick={() => confirmComplete(item)}
                                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm flex items-center gap-1"
                                    >
                                        <LuPackage className="w-4 h-4" />
                                        Add to Stock
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" className="text-center py-4">No items ready for stock addition.</td>
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
                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-md mb-2 border border-gray-100">
                                <div>
                                    <p className="text-xs uppercase text-gray-500 font-semibold">Total Original</p>
                                    <p className="text-sm font-bold text-gray-800">{itemToComplete?.totalQuantity || itemToComplete?.quantity} {itemToComplete?.unit}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs uppercase text-gray-500 font-semibold">Available Bulk Stock</p>
                                    <p className="text-sm font-bold text-green-600">Available: {itemToComplete?.quantity} {itemToComplete?.unit}</p>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 pl-1">
                                Unit Price: ₹{itemToComplete?.price} / {itemToComplete?.unit}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {(selectedUnit.toLowerCase().includes('packet') || selectedUnit === '1') ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Weight per Packet
                                        </label>
                                        <div className="flex gap-1">
                                            <input
                                                type="number"
                                                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                value={weightPerPacket}
                                                onChange={(e) => setWeightPerPacket(e.target.value)}
                                                placeholder="e.g. 250"
                                                min="0"
                                            />
                                            <select
                                                className="px-2 py-1 border rounded-md bg-gray-50 text-xs outline-none"
                                                value={packetWeightUnit}
                                                onChange={(e) => setPacketWeightUnit(e.target.value)}
                                            >
                                                <option value="gram">g</option>
                                                <option value="kg">kg</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Number of Packets
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            value={numberOfPackets}
                                            onChange={(e) => {
                                                setNumberOfPackets(e.target.value);
                                                setCompletedQty(e.target.value);
                                            }}
                                            placeholder="e.g. 10"
                                            min="0"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Stock to Add
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
                            )}
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
                        </div>

                        {completedQty && selectedUnit && itemToComplete && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 shadow-sm">
                                {(selectedUnit.toLowerCase().includes('packet') || selectedUnit === '1') && weightPerPacket && numberOfPackets ? (
                                    <>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-semibold text-blue-700">Stock Update:</span>
                                            <span className="text-xs font-bold text-blue-800">+{numberOfPackets} {selectedUnit === '1' ? 'Units' : 'Packets'} to inventory</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-semibold text-orange-700">Total weight used:</span>
                                            <span className="text-xs font-bold text-orange-800">
                                                {(Number(weightPerPacket) * Number(numberOfPackets) * (packetWeightUnit === 'gram' ? 0.001 : 1)).toFixed(3)} kg
                                            </span>
                                        </div>
                                        {(() => {
                                            const weightFactor = packetWeightUnit === 'gram' ? 0.001 : 1;
                                            const totalWeightInKg = Number(weightPerPacket) * Number(numberOfPackets) * weightFactor;
                                            const deductionInItemUnit = convertUnit(totalWeightInKg, 'kg', itemToComplete.unit);
                                            const isOverBulk = deductionInItemUnit > itemToComplete.quantity + 0.0001;
                                            return (
                                                <>
                                                    <div className="flex justify-between items-center mt-1 pt-1 border-t border-blue-100">
                                                        <span className="text-xs font-semibold text-gray-600">Bulk Deduction:</span>
                                                        <span className={`text-xs font-bold ${isOverBulk ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
                                                            -{deductionInItemUnit.toFixed(3)} {itemToComplete.unit}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <span className="text-xs font-semibold text-gray-600">Remaining Bulk:</span>
                                                        <span className={`text-xs font-bold ${(itemToComplete.quantity - deductionInItemUnit) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                            {(itemToComplete.quantity - deductionInItemUnit).toFixed(3)} {itemToComplete.unit}
                                                        </span>
                                                    </div>
                                                    {isOverBulk && (
                                                        <p className="text-[10px] text-red-600 font-bold mt-2 bg-red-50 p-1 rounded border border-red-100">
                                                            ⚠️ Warning: Total weight exceeds available bulk stock!
                                                        </p>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-semibold text-blue-700">Stock Update:</span>
                                            <span className="text-xs font-bold text-blue-800">+{completedQty} {selectedUnit} to inventory</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-semibold text-orange-700">Bulk Deduction:</span>
                                            <span className="text-xs font-bold text-orange-800">-{convertUnit(Number(completedQty), selectedUnit, itemToComplete.unit).toFixed(3)} {itemToComplete.unit} from bulk</span>
                                        </div>
                                    </>
                                )}
                                <p className="text-[10px] text-gray-500 mt-2 italic border-t border-blue-100 pt-1">
                                    The system will increment the product's stock count and deduct the corresponding weight from available bulk.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Net Price (₹)
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    value={netPrice}
                                    onChange={(e) => setNetPrice(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Selling Price (₹)
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    value={sellPrice}
                                    onChange={(e) => setSellPrice(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

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
                                disabled={(() => {
                                    if (!selectedUnit) return true;
                                    const isPacket = selectedUnit.toLowerCase().includes('packet') || selectedUnit === '1';
                                    if (isPacket) {
                                        if (!weightPerPacket || !numberOfPackets) return true;
                                        const weightFactor = packetWeightUnit === 'gram' ? 0.001 : 1;
                                        const totalWeightInKg = Number(weightPerPacket) * Number(numberOfPackets) * weightFactor;
                                        const deduction = convertUnit(totalWeightInKg, 'kg', itemToComplete.unit);
                                        if (deduction > itemToComplete.quantity + 0.0001) return true;
                                    } else {
                                        if (!completedQty) return true;
                                        const deduction = convertUnit(Number(completedQty), selectedUnit, itemToComplete.unit);
                                        if (deduction > itemToComplete.quantity + 0.0001) return true;
                                    }
                                    return false;
                                })()}
                                className={`px-4 py-2 rounded-md transition-colors font-semibold ${((() => {
                                    const isPacket = selectedUnit.toLowerCase().includes('packet') || selectedUnit === '1';
                                    let deduction;
                                    if (isPacket && weightPerPacket && numberOfPackets) {
                                        const weightFactor = packetWeightUnit === 'gram' ? 0.001 : 1;
                                        deduction = convertUnit(Number(weightPerPacket) * Number(numberOfPackets) * weightFactor, 'kg', itemToComplete.unit);
                                    } else if (!isPacket && completedQty) {
                                        deduction = convertUnit(Number(completedQty), selectedUnit, itemToComplete.unit);
                                    } else {
                                        return false;
                                    }
                                    return deduction > itemToComplete.quantity + 0.0001;
                                })()) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AfterPackingAddToStock;
