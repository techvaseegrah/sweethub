import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../../../api/axios';
import { LuPlus, LuTrash2, LuDownload, LuFileText } from 'react-icons/lu';
import { formatDateWithTime } from '../../../utils/unitConversion';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';

const OutgoingMaterials = () => {
    const [outgoingMaterials, setOutgoingMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // Filter by status
    const [materialFilter, setMaterialFilter] = useState('all'); // New: Filter by material name
    const [dateRange, setDateRange] = useState({ start: '', end: '' }); // New: Custom date range
    const [predefinedFilter, setPredefinedFilter] = useState('all'); // New: Today, Week, Month
    const [materialSearchInput, setMaterialSearchInput] = useState(''); // For searchable dropdown
    const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [materialToDelete, setMaterialToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const materialDropdownRef = useRef(null);

    const fetchOutgoingMaterials = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch actual outgoing materials (ingredients used in production)
            const response = await axios.get('/admin/warehouse/outgoing-materials');
            setOutgoingMaterials(response.data);
        } catch (err) {
            setError('Failed to fetch outgoing materials.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOutgoingMaterials();
    }, [fetchOutgoingMaterials]);

    const handleDelete = async () => {
        if (!materialToDelete) return;

        setDeleting(true);
        try {
            await axios.delete(`/admin/warehouse/outgoing-materials/${materialToDelete._id}`);
            toast.success('Outgoing material record deleted successfully');
            fetchOutgoingMaterials();
            setShowDeleteModal(false);
            setMaterialToDelete(null);
        } catch (err) {
            console.error('Delete error:', err);
            toast.error(err.response?.data?.message || 'Failed to delete record');
        } finally {
            setDeleting(false);
        }
    };

    const downloadExcel = () => {
        const data = filteredMaterials.map(item => ({
            'Material Name': item.materialName,
            'Manufactured Product': item.manufacturedProductName || item.scheduleReference,
            'Quantity Used': item.quantityUsed,
            'Unit': item.unit,
            'Price per Unit': item.pricePerUnit,
            'Total Cost': (item.totalCost || item.quantityUsed * item.pricePerUnit).toFixed(2),
            'Date Used': formatDateWithTime(item.dateUsed || item.usedDate),
            'Status': item.status
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Outgoing Materials');
        XLSX.writeFile(wb, `Outgoing_Materials_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.text('Outgoing Materials Report', 14, 15);

        const tableColumn = ["Material Name", "Product", "Qty", "Unit", "Cost", "Date", "Status"];
        const tableRows = filteredMaterials.map(item => [
            item.materialName,
            item.manufacturedProductName || item.scheduleReference,
            item.quantityUsed,
            item.unit,
            (item.totalCost || item.quantityUsed * item.pricePerUnit).toFixed(2),
            formatDateWithTime(item.dateUsed || item.usedDate),
            item.status
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 20,
        });
        doc.save(`Outgoing_Materials_${new Date().toISOString().split('T')[0]}.pdf`);
    };

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

    // Get unique material names for the dropdown
    const uniqueMaterials = [...new Set(outgoingMaterials.map(item => item.materialName))].sort();

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
        } else if (filter === 'year') {
            const startOfYear = new Date(today.getFullYear(), 0, 1);
            setDateRange({
                start: startOfYear.toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0]
            });
        } else {
            setDateRange({ start: '', end: '' });
        }
    };

    const filteredMaterials = outgoingMaterials
        .filter(item => {
            const matchesSearch = (item.materialName && item.materialName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.manufacturedProductName && item.manufacturedProductName.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

            const matchesMaterial = materialFilter === 'all' || item.materialName === materialFilter;

            // Date filtering logic
            const itemDate = new Date(item.dateUsed || item.usedDate);
            let matchesDate = true;
            if (dateRange.start) {
                const startDate = new Date(dateRange.start);
                startDate.setHours(0, 0, 0, 0);
                matchesDate = matchesDate && itemDate >= startDate;
            }
            if (dateRange.end) {
                const endDate = new Date(dateRange.end);
                endDate.setHours(23, 59, 59, 999);
                matchesDate = matchesDate && itemDate <= endDate;
            }

            return matchesSearch && matchesStatus && matchesMaterial && matchesDate;
        })
        .sort((a, b) => {
            const dateDiff = new Date(b.dateUsed || b.usedDate) - new Date(a.dateUsed || a.usedDate);
            if (dateDiff !== 0) return dateDiff;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

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
            <div className="text-red-500 font-medium">Loading outgoing materials...</div>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-bold">Outgoing Materials (Ingredients Used)</h1>
                    <p className="text-gray-600">History of ingredients used in production processes with complete details.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={downloadExcel}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                    >
                        <LuDownload size={18} />
                        Excel
                    </button>
                    <button
                        onClick={downloadPDF}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                    >
                        <LuFileText size={18} />
                        PDF
                    </button>
                </div>
            </div>

            {error && <div className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</div>}
            {message && <div className="text-green-700 bg-green-100 p-3 rounded mb-4">{message}</div>}

            {/* Filters Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Range</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePredefinedFilter('today')}
                            className={`px-3 py-1 text-xs rounded-full border ${predefinedFilter === 'today' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300'}`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => handlePredefinedFilter('week')}
                            className={`px-3 py-1 text-xs rounded-full border ${predefinedFilter === 'week' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300'}`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => handlePredefinedFilter('month')}
                            className={`px-3 py-1 text-xs rounded-full border ${predefinedFilter === 'month' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300'}`}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => handlePredefinedFilter('all')}
                            className={`px-3 py-1 text-xs rounded-full border ${predefinedFilter === 'all' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300'}`}
                        >
                            All
                        </button>
                    </div>
                </div>

                <div className="relative" ref={materialDropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material Name</label>
                    <input
                        type="text"
                        placeholder="Search material..."
                        defaultValue={materialFilter === 'all' ? '' : materialFilter}
                        value={materialSearchInput}
                        onChange={(e) => {
                            setMaterialSearchInput(e.target.value);
                            setShowMaterialDropdown(true);
                        }}
                        onFocus={() => setShowMaterialDropdown(true)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                    {showMaterialDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
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
                            {uniqueMaterials.filter(name => name.toLowerCase().includes(materialSearchInput.toLowerCase())).length === 0 && (
                                <div className="px-4 py-2 text-sm text-gray-500 italic">No materials found</div>
                            )}
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
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
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
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex flex-col md:flex-row items-center gap-4 flex-1">
                    <div className="relative w-full md:w-1/3">
                        <input
                            type="text"
                            placeholder="Search materials or products..."
                            className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full md:w-auto px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white font-medium text-gray-700"
                    >
                        <option value="all">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>

                {filteredMaterials.length > 0 && (
                    <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-xl border border-primary/10 shadow-sm animate-fade-in">
                        <span className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Value</span>
                        <div className="h-4 w-px bg-gray-200 mx-1"></div>
                        <span className="font-bold text-2xl text-primary">
                            ₹{filteredMaterials.reduce((acc, item) => acc + (item.totalCost || item.quantityUsed * item.pricePerUnit), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border-collapse">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="py-3 px-4 text-left border text-sm font-bold text-gray-700">Material Name</th>
                            <th className="py-3 px-4 text-left border text-sm font-bold text-gray-700">Manufactured Product</th>
                            <th className="py-3 px-4 text-left border text-sm font-bold text-gray-700">Quantity Used</th>
                            <th className="py-3 px-4 text-left border text-sm font-bold text-gray-700">Unit</th>
                            <th className="py-3 px-4 text-left border text-sm font-bold text-gray-700">Price per Unit</th>
                            <th className="py-3 px-4 text-left border text-sm font-bold text-gray-700">Total Cost</th>
                            <th className="py-3 px-4 text-left border text-sm font-bold text-gray-700">Date Used</th>
                            <th className="py-3 px-4 text-left border text-sm font-bold text-gray-700">Manufacturing Process</th>
                            <th className="py-3 px-4 text-left border text-sm font-bold text-gray-700">Daily Schedule</th>
                            <th className="py-3 px-4 text-left border text-sm font-bold text-gray-700">Status</th>
                            <th className="py-3 px-4 text-center border text-sm font-bold text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMaterials.length > 0 ? filteredMaterials.map((item) => (
                            <tr key={item._id} className="border-b hover:bg-gray-50">
                                <td className="border px-4 py-3 text-sm">{item.materialName}</td>
                                <td className="border px-4 py-3 text-sm">{item.manufacturedProductName || item.scheduleReference}</td>
                                <td className="border px-4 py-3 text-sm">{item.quantityUsed}</td>
                                <td className="border px-4 py-3 text-sm">{item.unit}</td>
                                <td className="border px-4 py-3 text-sm">₹{item.pricePerUnit}</td>
                                <td className="border px-4 py-3 text-sm font-medium">₹{item.totalCost ? item.totalCost.toFixed(2) : (item.quantityUsed * item.pricePerUnit).toFixed(2)}</td>
                                <td className="border px-4 py-3 text-sm">
                                    {formatDateWithTime(item.dateUsed || item.usedDate)}
                                </td>
                                <td className="border px-4 py-3 text-sm font-mono text-xs">{item.manufacturingProcessReference}</td>
                                <td className="border px-4 py-3 text-sm font-mono text-xs">{item.dailyScheduleReference}</td>
                                <td className="border px-4 py-3 text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                        item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="border px-4 py-3 text-sm text-center">
                                    <button
                                        onClick={() => {
                                            setMaterialToDelete(item);
                                            setShowDeleteModal(true);
                                        }}
                                        className="text-red-600 hover:text-red-900 transition-colors p-1"
                                        title="Delete Record"
                                    >
                                        <LuTrash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="10" className="text-center py-8 text-gray-500 italic">No outgoing materials found for the selected filters.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 scale-100 animate-fade-in-up">
                        <div className="p-8">
                            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full">
                                <LuTrash2 className="w-8 h-8 text-red-600" />
                            </div>

                            <h3 className="mb-2 text-2xl font-bold text-center text-gray-900">
                                Delete Record?
                            </h3>

                            <p className="text-center text-gray-600 leading-relaxed mb-8">
                                Are you sure you want to delete this record for <span className="font-semibold text-gray-800">{materialToDelete?.materialName}</span>?
                                <br />
                                <span className="text-sm italic text-red-500 mt-2 block font-medium">
                                    Stock will be reverted back to the store room. This action cannot be undone.
                                </span>
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setMaterialToDelete(null);
                                    }}
                                    disabled={deleting}
                                    className="flex-1 px-6 py-3 text-sm font-semibold text-gray-700 transition-all bg-gray-100 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 active:scale-95 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 px-6 py-3 text-sm font-semibold text-white transition-all bg-red-600 rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 active:scale-95 shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {deleting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OutgoingMaterials;