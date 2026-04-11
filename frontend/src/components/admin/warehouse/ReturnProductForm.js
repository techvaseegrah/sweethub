import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
// Correct import: using LuCircleCheck and LuX from the available exports
import { LuArrowBigRight, LuCircleCheck, LuX, LuSearch } from 'react-icons/lu';

const ReturnProductForm = ({ onReturnSuccess }) => {
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({
        productName: '',
        category: '',
        batchNumber: '',
        quantityReturned: '',
        reasonForReturn: 'Damaged',
        source: 'Factory',  // Changed default to Factory for admin side
        remarks: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get('/admin/categories', {
                    withCredentials: true,
                });
                setCategories(response.data);
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };

        const fetchProducts = async () => {
            try {
                const response = await axios.get('/admin/products', {
                    params: { showAdmin: true },
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true,
                });
                setProducts(response.data);
                setError('');
            } catch (err) {
                console.error('Failed to fetch products:', err);
                setError('Failed to load products. Check your API connection.');
            }
        };
        fetchCategories();
        fetchProducts();
    }, []);

    // Handle click outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.suggestion-container')) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCategoryChange = (e) => {
        const categoryId = e.target.value;
        setSelectedCategory(categoryId);
        setSearchTerm(''); // Clear search when category changes
        setFormData(prev => ({ ...prev, productName: '' }));

        if (categoryId) {
            const filtered = products.filter(p =>
                p.category && (p.category._id === categoryId || p.category === categoryId)
            );
            setFilteredProducts(filtered);
            setShowSuggestions(true);
        } else {
            setFilteredProducts([]);
            setShowSuggestions(false);
        }
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setFormData(prev => ({ ...prev, productName: value }));

        if (value.trim() || selectedCategory) {
            let filtered = products;

            if (selectedCategory) {
                filtered = filtered.filter(p =>
                    p.category && (p.category._id === selectedCategory || p.category === selectedCategory)
                );
            }

            if (value.trim()) {
                filtered = filtered.filter(p =>
                    p.name.toLowerCase().includes(value.toLowerCase())
                );
            }

            setFilteredProducts(filtered);
            setShowSuggestions(true);
        } else {
            setFilteredProducts([]);
            setShowSuggestions(false);
        }
    };

    const handleSelectProduct = (product) => {
        setSearchTerm(product.name);
        setFormData(prev => ({
            ...prev,
            productName: product.name,
            category: product.category?._id || product.category
        }));
        setShowSuggestions(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            await axios.post('/admin/warehouse/returns', formData);
            setSuccess('Product return registered successfully!');
            setFormData({
                productName: '',
                category: '',
                batchNumber: '',
                quantityReturned: '',
                reasonForReturn: 'Damaged',
                source: 'Factory',
                remarks: ''
            });
            setSearchTerm('');
            setSelectedCategory('');
            onReturnSuccess();
        } catch (err) {
            console.error('Failed to register return:', err);
            setError('Failed to register return. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full">
            <h3 className="text-xl font-semibold mb-4 flex items-center text-primary">
                <LuArrowBigRight className="mr-2" /> Return Product Form
            </h3>
            {success && <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4 flex items-center"><LuCircleCheck className="mr-2" />{success}</div>}
            {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 flex items-center"><LuX className="mr-2" />{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Category</label>
                    <select
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                        className="block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50 focus:ring-primary focus:border-primary transition-all"
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div className="relative suggestion-container">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <div className="relative">
                        <input
                            type="text"
                            name="productName"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={() => (searchTerm || selectedCategory) && setShowSuggestions(true)}
                            placeholder="Type to search product..."
                            autoComplete="off"
                            required
                            className="block w-full border border-gray-300 rounded-md shadow-sm p-2 pl-9 bg-gray-50 focus:ring-primary focus:border-primary transition-all"
                        />
                        <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {showSuggestions && (
                        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-auto mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                    <div
                                        key={product._id}
                                        onClick={() => handleSelectProduct(product)}
                                        className="p-3 hover:bg-red-50 cursor-pointer text-sm border-b border-gray-50 last:border-b-0 flex items-center transition-colors"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-primary mr-3"></div>
                                        <span className="font-medium text-gray-700">{product.name}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-sm text-gray-500 italic">
                                    No products found matching "{searchTerm}"
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Batch Number (Optional)</label>
                    <input type="text" name="batchNumber" value={formData.batchNumber} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50 focus:ring-primary focus:border-primary" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity Returned</label>
                    <input type="number" name="quantityReturned" value={formData.quantityReturned} onChange={handleChange} required min="1" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50 focus:ring-primary focus:border-primary" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Reason for Return</label>
                    <select name="reasonForReturn" value={formData.reasonForReturn} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50 focus:ring-primary focus:border-primary">
                        <option value="Damaged">Damaged</option>
                        <option value="Expired">Expired</option>
                        <option value="Overproduction">Overproduction</option>
                        <option value="Customer Return">Customer Return</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Source</label>
                    <select name="source" value={formData.source} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50 focus:ring-primary focus:border-primary">
                        <option value="Factory">Factory</option>
                        <option value="Customer">Customer</option>
                        <option value="Shop">Shop</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Remarks (Optional)</label>
                    <textarea name="remarks" value={formData.remarks} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50 focus:ring-primary focus:border-primary"></textarea>
                </div>
                <button type="submit" disabled={loading} className={`w-full py-2 px-4 rounded-md text-white font-semibold transition-colors ${loading ? 'bg-gray-400' : 'bg-primary hover:bg-opacity-90'}`}>
                    {loading ? 'Registering...' : 'Register Return'}
                </button>
            </form>
        </div>
    );
};

export default ReturnProductForm;