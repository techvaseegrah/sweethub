import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { LuHistory, LuSearch } from 'react-icons/lu';

const ReturnProductsHistory = ({ refresh }) => {
    const [returns, setReturns] = useState([]);
    const [filteredReturns, setFilteredReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('/shop/categories');
                setCategories(response.data);
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };

        const fetchReturns = async () => {
            try {
                const response = await axios.get('/shop/returns');
                setReturns(response.data);
                setFilteredReturns(response.data);
            } catch (err) {
                setError('Failed to fetch return history');
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
        fetchReturns();
    }, [refresh]);

    useEffect(() => {
        let result = [...returns];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(item =>
                item.productName.toLowerCase().includes(query) ||
                item.returnId.toLowerCase().includes(query)
            );
        }

        if (selectedCategory) {
            result = result.filter(item =>
                item.category && (item.category._id === selectedCategory || item.category === selectedCategory)
            );
        }

        setFilteredReturns(result);
    }, [searchQuery, selectedCategory, returns]);

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
        <div className="bg-white p-6 rounded-xl shadow-md">
            {error && <div className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</div>}

            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <LuHistory className="mr-2" /> Return History
                </h3>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm shadow-sm bg-white"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search product or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm w-64 shadow-sm"
                        />
                        <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="py-3 px-4 text-left">Return ID</th>
                            <th className="py-3 px-4 text-left">Product Name</th>
                            <th className="py-3 px-4 text-left">Category</th>
                            <th className="py-3 px-4 text-left">Quantity</th>
                            <th className="py-3 px-4 text-left">Reason</th>
                            <th className="py-3 px-4 text-left">Source</th>
                            <th className="py-3 px-4 text-left">Date</th>
                            <th className="py-3 px-4 text-left">Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredReturns.map(returnItem => (
                            <tr key={returnItem._id} className="border-b hover:bg-gray-50 transition-colors">
                                <td className="border px-4 py-2 font-medium text-gray-600">{returnItem.returnId}</td>
                                <td className="border px-4 py-2">{returnItem.productName}</td>
                                <td className="border px-4 py-2">{returnItem.category?.name || '-'}</td>
                                <td className="border px-4 py-2">{returnItem.quantityReturned}</td>
                                <td className="border px-4 py-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${returnItem.reasonForReturn === 'Damaged' ? 'bg-red-100 text-red-600' :
                                        returnItem.reasonForReturn === 'Expired' ? 'bg-orange-100 text-orange-600' :
                                            'bg-blue-100 text-blue-600'
                                        }`}>
                                        {returnItem.reasonForReturn}
                                    </span>
                                </td>
                                <td className="border px-4 py-2">{returnItem.source}</td>
                                <td className="border px-4 py-2">{new Date(returnItem.dateOfReturn).toLocaleDateString()}</td>
                                <td className="border px-4 py-2 text-gray-500 text-sm italic">{returnItem.remarks || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredReturns.length === 0 && (
                    <div className="p-10 text-center text-gray-400">
                        No return records found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReturnProductsHistory;