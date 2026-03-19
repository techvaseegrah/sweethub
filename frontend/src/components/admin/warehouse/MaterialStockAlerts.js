import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../../../api/axios';
import { LuPackageX, LuPlus, LuDownload, LuFileText, LuSearch, LuX } from 'react-icons/lu';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';

const MaterialStockAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [materialFilter, setMaterialFilter] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [predefinedFilter, setPredefinedFilter] = useState('all');
    const [materialSearchInput, setMaterialSearchInput] = useState('');
    const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
    const materialDropdownRef = useRef(null);

    // State for the "Add Stock" modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [addQuantity, setAddQuantity] = useState('');
    const [updating, setUpdating] = useState(false);

    const fetchAlerts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/admin/warehouse/material-stock-alerts');
            setAlerts(response.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch material stock alerts.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    // Handle click outside for material dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (materialDropdownRef.current && !materialDropdownRef.current.contains(event.target)) {
                setShowMaterialDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const openAddStockModal = (item) => {
        setCurrentItem(item);
        setIsModalOpen(true);
        setAddQuantity(''); // Reset quantity input
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentItem(null);
    };

    const handleAddStock = async (e) => {
        e.preventDefault();
        if (!currentItem || !addQuantity || Number(addQuantity) <= 0) {
            toast.error('Please enter a valid quantity.');
            return;
        }

        setUpdating(true);
        try {
            // We use the 'raw-materials' endpoint as it's designed to add quantity to existing items
            await axios.post('/admin/warehouse/raw-materials', {
                name: currentItem.name,
                quantity: addQuantity,
            });
            toast.success(`Stock for "${currentItem.name}" updated successfully.`);
            closeModal();
            fetchAlerts(); // Refresh the alerts list
        } catch (err) {
            toast.error('Failed to update stock.');
            console.error(err);
        } finally {
            setUpdating(false);
        }
    };

    const handlePredefinedFilter = (filter) => {
        setPredefinedFilter(filter);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (filter === 'today') {
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            setDateRange({
                start: today.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0]
            });
        } else if (filter === 'week') {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            setDateRange({
                start: startOfWeek.toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0]
            });
        } else if (filter === 'month') {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            setDateRange({
                start: startOfMonth.toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0]
            });
        } else {
            setDateRange({ start: '', end: '' });
        }
    };

    const filteredAlerts = alerts.filter(alert => {
        const matchesSearch = alert.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMaterial = materialFilter === 'all' || alert.name === materialFilter;

        // Use updatedAt or updatedAt as fallback for date filtering
        const alertDate = new Date(alert.updatedAt || alert.createdAt);
        let matchesDate = true;

        if (dateRange.start) {
            const start = new Date(dateRange.start);
            start.setHours(0, 0, 0, 0);
            matchesDate = matchesDate && alertDate >= start;
        }
        if (dateRange.end) {
            const end = new Date(dateRange.end);
            end.setHours(23, 59, 59, 999);
            matchesDate = matchesDate && alertDate <= end;
        }

        return matchesSearch && matchesMaterial && matchesDate;
    });

    const uniqueMaterials = [...new Set(alerts.map(a => a.name))].sort();

    const downloadExcel = () => {
        const data = filteredAlerts.map(alert => ({
            'Material Name': alert.name,
            'Current Stock': alert.quantity,
            'Threshold': alert.stockAlertThreshold,
            'Unit': alert.unit,
            'Vendor': alert.vendor || 'N/A',
            'Last Updated': new Date(alert.updatedAt).toLocaleString()
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Stock Alerts');
        XLSX.writeFile(wb, `Material_Stock_Alerts_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.text('Material Stock Alerts Report', 14, 15);

        const tableColumn = ["Material Name", "Stock", "Threshold", "Unit", "Vendor", "Last Updated"];
        const tableRows = filteredAlerts.map(alert => [
            alert.name,
            alert.quantity,
            alert.stockAlertThreshold,
            alert.unit,
            alert.vendor || 'N/A',
            new Date(alert.updatedAt).toLocaleString()
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });
        doc.save(`Material_Stock_Alerts_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (loading) return (
        <div className="p-4 flex flex-col items-center justify-center min-h-[400px]">
            <div className="relative flex justify-center items-center mb-4">
                <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
                <img
                    src="/sweethub-logo.png"
                    alt="Sweet Hub Logo"
                    className="absolute w-8 h-8"
                />
            </div>
            <div className="text-red-500 font-medium">Loading Alerts...</div>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Material Stock Alerts</h1>
                    <p className="text-gray-500">Showing materials that are currently below their threshold levels.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={downloadExcel}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        <LuDownload size={18} />
                        Download Excel
                    </button>
                    <button
                        onClick={downloadPDF}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        <LuFileText size={18} />
                        Download PDF
                    </button>
                </div>
            </div>

            {/* Filters Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Range</label>
                    <div className="flex gap-2">
                        {['all', 'today', 'week', 'month'].map((f) => (
                            <button
                                key={f}
                                onClick={() => handlePredefinedFilter(f)}
                                className={`px-3 py-1.5 text-xs rounded-full border transition-all ${predefinedFilter === f ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-gray-600 border-gray-300 hover:border-primary'}`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative" ref={materialDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material Name Filter</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search material..."
                            value={materialSearchInput}
                            onChange={(e) => {
                                setMaterialSearchInput(e.target.value);
                                setShowMaterialDropdown(true);
                            }}
                            onFocus={() => setShowMaterialDropdown(true)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white pr-8"
                        />
                        {materialSearchInput && (
                            <button
                                onClick={() => { setMaterialSearchInput(''); setMaterialFilter('all'); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <LuX size={14} />
                            </button>
                        )}
                    </div>
                    {showMaterialDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-fade-in">
                            <div
                                className={`px-4 py-2 cursor-pointer transition-colors text-sm font-medium ${materialFilter === 'all' ? 'bg-primary text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                                onClick={() => {
                                    setMaterialFilter('all');
                                    setMaterialSearchInput('');
                                    setShowMaterialDropdown(false);
                                }}
                            >
                                All Materials
                            </div>
                            {uniqueMaterials
                                .filter(name => name.toLowerCase().includes(materialSearchInput.toLowerCase()))
                                .map(name => (
                                    <div
                                        key={name}
                                        className={`px-4 py-2 cursor-pointer transition-colors text-sm ${materialFilter === name ? 'bg-primary text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                                        onClick={() => {
                                            setMaterialFilter(name);
                                            setMaterialSearchInput(name);
                                            setShowMaterialDropdown(false);
                                        }}
                                    >
                                        {name}
                                    </div>
                                ))
                            }
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => {
                            setDateRange({ ...dateRange, start: e.target.value });
                            setPredefinedFilter('custom');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => {
                            setDateRange({ ...dateRange, end: e.target.value });
                            setPredefinedFilter('custom');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                    <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Live search by material name..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl border border-red-100 font-semibold shadow-sm">
                    {filteredAlerts.length} Alerts
                </div>
            </div>

            {error && <div className="text-red-500 bg-red-100 p-3 rounded-lg mb-4 border border-red-200 flex items-center gap-2">
                <LuPackageX /> {error}
            </div>}

            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                <table className="min-w-full bg-white divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Material Name</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Current Stock</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Threshold</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Unit</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Vendor</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Alert Date</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredAlerts.length > 0 ? filteredAlerts.map((alert) => (
                            <tr key={alert._id} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{alert.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold">
                                    <span className="flex items-center gap-1">
                                        {alert.quantity}
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{alert.stockAlertThreshold}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{alert.unit}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{alert.vendor || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(alert.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <button
                                        onClick={() => openAddStockModal(alert)}
                                        className="bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 mx-auto transition-all transform active:scale-95 shadow-sm"
                                    >
                                        <LuPlus size={14} />
                                        Add Stock
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" className="text-center py-20">
                                    <LuPackageX className="mx-auto text-6xl text-gray-200 mb-4" />
                                    <h2 className="text-xl font-semibold text-gray-400">No stock alerts found</h2>
                                    <p className="text-gray-400 text-sm">Either everything is in stock or your filters are too strict.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && currentItem && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
                        <div className="bg-primary p-4 flex justify-between items-center text-white">
                            <h2 className="text-lg font-bold">Add Stock: {currentItem.name}</h2>
                            <button onClick={closeModal} className="hover:bg-white/20 p-1 rounded-full"><LuX /></button>
                        </div>
                        <div className="p-6">
                            <div className="flex gap-4 mb-6 bg-red-50 p-4 rounded-xl border border-red-100">
                                <div>
                                    <p className="text-xs text-red-500 font-bold uppercase tracking-wider">Current Stock</p>
                                    <p className="text-2xl font-black text-red-600">{currentItem.quantity} {currentItem.unit}</p>
                                </div>
                                <div className="w-px bg-red-200"></div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Threshold</p>
                                    <p className="text-2xl font-black text-gray-400">{currentItem.stockAlertThreshold} {currentItem.unit}</p>
                                </div>
                            </div>

                            <form onSubmit={handleAddStock}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Quantity to Add</label>
                                        <input
                                            type="number"
                                            value={addQuantity}
                                            onChange={(e) => setAddQuantity(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary text-lg font-bold"
                                            placeholder={`e.g., 50`}
                                            autoFocus
                                            required
                                            min="0.01"
                                            step="any"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={updating}
                                            className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {updating ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                'Update Stock'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaterialStockAlerts;