import React, { useState, useEffect, useRef } from 'react';
import axios from '../../../api/axios';
import { LuPlus, LuTrash2, LuHistory, LuPackagePlus, LuSearch, LuLoaderCircle, LuChevronDown, LuChevronUp, LuBoxes } from 'react-icons/lu';

const MixedSweets = () => {
    const [activeTab, setActiveTab] = useState('manufacture');
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [productions, setProductions] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        quantityProduced: '',
        unit: 'kg',
        expiryDate: '',
        usedByDate: '',
        category: '',
        components: [] // { product: id, name, quantityUsed, unit }
    });

    // Delete Confirmation State
    const [deleteModal, setDeleteModal] = useState({
        show: false,
        id: null
    });

    // Re-add Confirmation State
    const [reAddModal, setReAddModal] = useState({
        show: false,
        record: null
    });

    // Component Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchInitialData();

        // Handle clicks outside dropdown
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProductDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [catRes, prodRes, historyRes] = await Promise.all([
                axios.get('/shop/categories/shop-used'),
                axios.get('/shop/products'),
                axios.get('/shop/mixed-sweets')
            ]);
            setCategories(Array.isArray(catRes.data) ? catRes.data : []);
            setAvailableProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
            setProductions(Array.isArray(historyRes.data) ? historyRes.data : []);
        } catch (err) {
            console.error('Failed to fetch initial data:', err);
            setError('Failed to load required data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await axios.get('/shop/mixed-sweets');
            setProductions(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to fetch history:', err);
        }
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const addComponent = (product) => {
        // Prevent duplicate components
        if (formData.components.find(c => c.product === product._id)) {
            setError(`${product.name} is already added to components.`);
            setTimeout(() => setError(''), 3000);
            return;
        }

        // Use the first available unit as default
        const defaultUnit = product.prices?.[0]?.unit || 'kg';

        setFormData({
            ...formData,
            components: [
                ...formData.components,
                {
                    product: product._id,
                    name: product.name,
                    quantityUsed: '',
                    unit: defaultUnit,
                    availableStock: product.stockLevel,
                    stockUnit: defaultUnit
                }
            ]
        });
        setSearchTerm('');
        setShowProductDropdown(false);
    };

    const removeComponent = (index) => {
        const newComponents = [...formData.components];
        newComponents.splice(index, 1);
        setFormData({ ...formData, components: newComponents });
    };

    const handleComponentQtyChange = (index, value) => {
        const newComponents = [...formData.components];
        newComponents[index].quantityUsed = value;
        setFormData({ ...formData, components: newComponents });
    };

    const handleComponentUnitChange = (index, value) => {
        const newComponents = [...formData.components];
        newComponents[index].unit = value;
        setFormData({ ...formData, components: newComponents });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setMessage('');
        setError('');

        if (formData.components.length === 0) {
            setError('Please add at least one sweet component.');
            setActionLoading(false);
            return;
        }

        if (!formData.quantityProduced || parseFloat(formData.quantityProduced) <= 0) {
            setError('Please enter a valid quantity produced.');
            setActionLoading(false);
            return;
        }

        // Simple validation for qty used
        for (const comp of formData.components) {
            if (!comp.quantityUsed || parseFloat(comp.quantityUsed) <= 0) {
                setError(`Please enter a valid quantity for ${comp.name}`);
                setActionLoading(false);
                return;
            }
            if (parseFloat(comp.quantityUsed) > comp.availableStock) {
                setError(`Insufficient stock for ${comp.name}. Available: ${comp.availableStock}`);
                setActionLoading(false);
                return;
            }
        }

        try {
            const response = await axios.post('/shop/mixed-sweets', formData);
            setMessage('Mixed Sweet Box manufactured successfully!');
            setFormData({
                name: '',
                sku: '',
                quantityProduced: '',
                unit: 'kg',
                expiryDate: '',
                usedByDate: '',
                category: '',
                components: []
            });
            fetchHistory();
            // Also refresh available products stock in the list
            const prodRes = await axios.get('/shop/products');
            setAvailableProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Manufacturing failed.');
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteProduction = async (id) => {
        setDeleteModal({ show: true, id });
    };

    const confirmDelete = async () => {
        const id = deleteModal.id;
        setActionLoading(true);
        try {
            await axios.delete(`/shop/mixed-sweets/${id}`);
            setMessage('Production record deleted successfully.');
            fetchHistory();
        } catch (err) {
            setError('Failed to delete record.');
        } finally {
            setActionLoading(false);
            setDeleteModal({ show: false, id: null });
        }
    };

    const handleReAddProduction = (record) => {
        // Find current stock for each component to show in modal
        const componentsWithStock = record.components.map(comp => {
            const productId = comp.product?._id || comp.product;
            const currentItem = availableProducts.find(p => p._id === productId);
            return {
                ...comp,
                product: productId, // Ensure it's the ID
                availableStock: currentItem ? currentItem.stockLevel : 0,
                stockUnit: currentItem?.prices?.[0]?.unit || comp.unit
            };
        });

        setReAddModal({
            show: true,
            record: {
                ...record,
                components: componentsWithStock
            }
        });
    };

    const handleReAddQtyChange = (value) => {
        setReAddModal(prev => ({
            ...prev,
            record: { ...prev.record, quantityProduced: value }
        }));
    };

    const handleReAddComponentQtyChange = (index, value) => {
        const newComponents = [...reAddModal.record.components];
        newComponents[index].quantityUsed = value;
        setReAddModal(prev => ({
            ...prev,
            record: { ...prev.record, components: newComponents }
        }));
    };

    const confirmReAdd = async () => {
        const record = reAddModal.record;
        setActionLoading(true);
        setMessage('');
        setError('');

        try {
            // Prepare data from record - ensure components use product ID
            const reAddData = {
                name: record.name,
                sku: record.sku,
                quantityProduced: record.quantityProduced,
                unit: record.unit,
                expiryDate: record.expiryDate,
                usedByDate: record.usedByDate,
                category: record.category?._id || record.category,
                components: record.components.map(comp => ({
                    product: comp.product,
                    name: comp.name,
                    quantityUsed: comp.quantityUsed,
                    unit: comp.unit
                }))
            };

            await axios.post('/shop/mixed-sweets', reAddData);
            setMessage(`${record.name} added again successfully!`);
            fetchHistory();
            // Refresh available products stock
            const prodRes = await axios.get('/shop/products');
            setAvailableProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Failed to re-add production.');
            console.error(err);
        } finally {
            setActionLoading(false);
            setReAddModal({ show: false, record: null });
        }
    };

    const filteredProducts = availableProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-80 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <div className="relative">
                    <LuLoaderCircle className="w-12 h-12 animate-spin text-slate-400" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-slate-200 rounded-full animate-pulse"></div>
                    </div>
                </div>
                <p className="text-slate-500 font-medium tracking-wide mt-4">Preparing Manufacturing Module...</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen p-4 md:p-8 animate-fadeIn">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header & Navigation */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-900 rounded-xl text-white shadow-lg">
                            <LuPackagePlus size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Manufacturing Hub</h2>
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-0.5">Custom Mixed Collections</p>
                        </div>
                    </div>

                    <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200">
                        <button
                            onClick={() => setActiveTab('manufacture')}
                            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${activeTab === 'manufacture' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Production
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            History
                        </button>
                    </div>
                </div>

                {message && (
                    <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-lg flex items-center shadow-sm animate-slideDown">
                        <div className="bg-emerald-500 p-1 rounded-full mr-3">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <span className="font-semibold text-sm">{message}</span>
                    </div>
                )}
                {error && (
                    <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-800 rounded-lg flex items-center shadow-sm animate-shake">
                        <div className="bg-rose-500 p-1 rounded-full mr-3">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <span className="font-semibold text-sm">{error}</span>
                    </div>
                )}

                {activeTab === 'manufacture' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Primary Form */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center">
                                        <LuBoxes className="mr-2 text-slate-400" /> Mixed Box configuration
                                    </h3>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-heavy text-slate-500 uppercase ml-1">Product Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="e.g. Signature Mix 1kg"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-medium"
                                            value={formData.name}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-heavy text-slate-500 uppercase ml-1">SKU / Code</label>
                                        <input
                                            type="text"
                                            name="sku"
                                            placeholder="UNIQUE-CODE-01"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-mono font-bold uppercase"
                                            value={formData.sku}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-heavy text-slate-500 uppercase ml-1">Quantity / Stock</label>
                                        <input
                                            type="text"
                                            name="quantityProduced"
                                            placeholder="0"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-bold"
                                            value={formData.quantityProduced}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-heavy text-slate-500 uppercase ml-1">Unit</label>
                                        <select
                                            name="unit"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-medium"
                                            value={formData.unit}
                                            onChange={handleFormChange}
                                        >
                                            <option value="kg">kg</option>
                                            <option value="box">box</option>
                                            <option value="pcs">pcs</option>
                                            <option value="gm">gm</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-heavy text-slate-500 uppercase ml-1">Expiry Date</label>
                                        <input
                                            type="date"
                                            name="expiryDate"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-medium"
                                            value={formData.expiryDate}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-heavy text-slate-500 uppercase ml-1">Used By Date</label>
                                        <input
                                            type="date"
                                            name="usedByDate"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-medium"
                                            value={formData.usedByDate}
                                            onChange={handleFormChange}
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-xs font-heavy text-slate-500 uppercase ml-1">Category</label>
                                        <select
                                            name="category"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all font-medium"
                                            value={formData.category}
                                            onChange={handleFormChange}
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map((cat) => (
                                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Components List */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center">
                                        <LuHistory className="mr-2 text-slate-400" /> Ingredient Breakdown
                                    </h3>
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-600 rounded uppercase tracking-tighter">
                                        {formData.components.length} Items Selected
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50/30 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-3 text-left">Sweet Component</th>
                                                <th className="px-6 py-3 text-left">Qty per box</th>
                                                <th className="px-6 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {formData.components.length === 0 ? (
                                                <tr>
                                                    <td colSpan="3" className="px-6 py-12 text-center text-slate-300 italic text-sm">
                                                        No components added to this batch yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                formData.components.map((comp, index) => (
                                                    <tr key={comp.product} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-slate-800 uppercase text-xs">{comp.name}</div>
                                                            <div className="text-[10px] text-slate-400 font-medium">Stock: {comp.availableStock} {comp.stockUnit || comp.unit}</div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    step="0.01"
                                                                    className={`w-20 px-2 py-1 bg-white border rounded focus:ring-2 focus:ring-slate-900/5 outline-none font-bold text-xs ${parseFloat(comp.quantityUsed) > comp.availableStock ? 'border-rose-400 text-rose-600' : 'border-slate-200'}`}
                                                                    value={comp.quantityUsed}
                                                                    onChange={(e) => handleComponentQtyChange(index, e.target.value)}
                                                                />
                                                                <select
                                                                    className="bg-transparent border-none text-[10px] font-heavy text-slate-500 uppercase outline-none cursor-pointer hover:text-slate-900 transition-colors"
                                                                    value={comp.unit}
                                                                    onChange={(e) => handleComponentUnitChange(index, e.target.value)}
                                                                >
                                                                    <option value={comp.stockUnit}>{comp.stockUnit}</option>
                                                                    {['kg', 'gm', 'box', 'pcs']
                                                                        .filter(u => u !== comp.stockUnit)
                                                                        .map(u => (
                                                                            <option key={u} value={u}>{u}</option>
                                                                        ))
                                                                    }
                                                                </select>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeComponent(index)}
                                                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                            >
                                                                <LuTrash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Search & Submit */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                                <h3 className="text-xs font-heavy text-slate-400 uppercase tracking-widest">Add Ingredients</h3>
                                <div className="relative" ref={dropdownRef}>
                                    <div className="relative">
                                        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                        <input
                                            type="text"
                                            placeholder="Search products..."
                                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 outline-none transition-all text-sm font-medium"
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setShowProductDropdown(true);
                                            }}
                                            onFocus={() => setShowProductDropdown(true)}
                                        />
                                    </div>
                                    {showProductDropdown && searchTerm && (
                                        <div className="absolute z-30 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-1 overflow-hidden">
                                            {filteredProducts.length > 0 ? (
                                                filteredProducts.map(p => (
                                                    <div
                                                        key={p._id}
                                                        className="px-4 py-3 hover:bg-slate-50 cursor-pointer rounded-xl flex justify-between items-center transition-all group"
                                                        onClick={() => addComponent(p)}
                                                    >
                                                        <div>
                                                            <div className="font-bold text-slate-800 text-xs uppercase group-hover:text-slate-900">{p.name}</div>
                                                            <div className="text-[10px] text-slate-400 font-medium">Stock: {p.stockLevel} {p.prices?.[0]?.unit || 'kg'}</div>
                                                        </div>
                                                        <LuPlus size={14} className="text-slate-300 group-hover:text-slate-600" />
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-slate-400 text-xs font-semibold">No results found</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="pt-2">
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic border-l-2 border-slate-100 pl-3">
                                        Select ingredients to include in this mixed sweet box. Ingredients stock will be deducted immediately upon manufacture.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={actionLoading}
                                className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold shadow-lg hover:shadow-slate-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
                            >
                                {actionLoading ? (
                                    <LuLoaderCircle className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <span>Confirm Manufacture</span>
                                        <LuPackagePlus size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-slideUp">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center">
                                <LuHistory className="mr-2 text-slate-400" /> Production Log
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50/30 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Mixed box</th>
                                        <th className="px-6 py-4 text-left">Output</th>
                                        <th className="px-6 py-4 text-left">Validity</th>
                                        <th className="px-6 py-4 text-left">Recipe</th>
                                        <th className="px-6 py-4 text-left">Date</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {productions.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center opacity-30">
                                                    <LuHistory size={48} className="mb-4 text-slate-400" />
                                                    <p className="text-slate-800 font-bold uppercase tracking-widest text-sm">No History Recorded</p>
                                                    <p className="text-slate-400 text-xs mt-1">Items will appear here after production.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        productions.map((record) => (
                                            <tr key={record._id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="font-bold text-slate-800 uppercase text-sm tracking-tight">{record.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-heavy">SKU: {record.sku}</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-xs font-heavy px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200">
                                                        {record.quantityProduced} {record.unit || 'UNIT(S)'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="text-[10px] text-slate-500 font-bold uppercase truncate max-w-[120px]">
                                                        EXP: {record.expiryDate || 'N/A'}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-medium uppercase truncate max-w-[120px] mt-1">
                                                        USE BY: {record.usedByDate || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                                                        {record.components.map((c, i) => (
                                                            <div key={i} className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold uppercase text-slate-500">
                                                                {c.name} <span className="text-slate-400 ml-1">({c.quantityUsed}{c.unit})</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="text-xs font-bold text-slate-600">
                                                        {new Date(record.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-medium">
                                                        {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleReAddProduction(record)}
                                                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all group/btn"
                                                            title="Add Again"
                                                        >
                                                            <LuPackagePlus size={18} className="group-hover/btn:scale-110 transition-transform" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteProduction(record._id)}
                                                            className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all group/btn"
                                                            title="Delete Record"
                                                        >
                                                            <LuTrash2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteModal.show && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-zoomIn">
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-500">
                                    <LuTrash2 size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Production Record?</h3>
                                <p className="text-slate-500 text-sm leading-relaxed mb-8">
                                    Are you sure you want to delete this production record? This action <span className="text-rose-600 font-bold uppercase">cannot be undone</span> and will <span className="font-bold underline">not</span> revert the stock levels.
                                </p>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setDeleteModal({ show: false, id: null })}
                                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-all active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        disabled={actionLoading}
                                        className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
                                    >
                                        {actionLoading ? (
                                            <LuLoaderCircle className="animate-spin" size={18} />
                                        ) : (
                                            "Confirm Delete"
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2">
                                <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse"></div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Permanent Action</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Re-add Confirmation Modal */}
                {reAddModal.show && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-zoomIn">
                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-100 shadow-sm shrink-0">
                                        <LuPackagePlus size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 leading-tight">Confirm Production</h3>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">Repeat Mixed Collection</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-heavy text-slate-400 uppercase tracking-wider">Product Name</span>
                                            <span className="text-[10px] font-heavy bg-slate-200 text-slate-600 px-2 py-0.5 rounded uppercase">{reAddModal.record?.sku}</span>
                                        </div>
                                        <div className="text-lg font-bold text-slate-800 uppercase mb-3">{reAddModal.record?.name}</div>

                                        <div className="pt-3 border-t border-slate-200/50">
                                            <label className="text-[10px] font-heavy text-slate-400 uppercase tracking-wider block mb-1.5">Output Quantity</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-900"
                                                    value={reAddModal.record.quantityProduced}
                                                    onChange={(e) => handleReAddQtyChange(e.target.value)}
                                                />
                                                <span className="text-xs font-bold text-slate-500 uppercase px-3 py-2 bg-slate-100 rounded-xl border border-slate-200">{reAddModal.record.unit}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-1">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ingredient Breakdown</span>
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-300 uppercase">Availability</span>
                                        </div>
                                        <div className="space-y-3 max-h-60 overflow-y-auto px-1 custom-scrollbar">
                                            {reAddModal.record?.components.map((c, i) => (
                                                <div key={i} className="flex flex-col p-3 bg-slate-50/50 rounded-xl border border-slate-100 group/item hover:border-emerald-200 transition-colors">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs font-bold text-slate-600 uppercase flex items-center">
                                                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mr-2"></span>
                                                            {c.name}
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.availableStock < parseFloat(c.quantityUsed) ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                                            {c.availableStock} {c.stockUnit || c.unit}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative flex-1">
                                                            <input
                                                                type="text"
                                                                className={`w-full pl-3 pr-8 py-1.5 bg-white border rounded-lg focus:ring-1 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-xs font-bold ${c.availableStock < parseFloat(c.quantityUsed) ? 'border-rose-300' : 'border-slate-200'}`}
                                                                value={c.quantityUsed}
                                                                onChange={(e) => handleReAddComponentQtyChange(i, e.target.value)}
                                                            />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 uppercase">{c.unit}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setReAddModal({ show: false, record: null })}
                                        className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold text-sm transition-all active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmReAdd}
                                        disabled={actionLoading || reAddModal.record.components.some(c => c.availableStock < parseFloat(c.quantityUsed))}
                                        className="px-6 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
                                    >
                                        {actionLoading ? (
                                            <LuLoaderCircle className="animate-spin" size={20} />
                                        ) : (
                                            <>
                                                <span>Confirm & Add</span>
                                                <LuPackagePlus size={18} className="transition-transform group-hover:translate-x-0.5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="px-8 py-3 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Inventory will be updated</span>
                                </div>
                                <span className="text-[10px] font-heavy text-emerald-400/80 uppercase tracking-tighter italic">Manual Edit Enabled</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MixedSweets;
