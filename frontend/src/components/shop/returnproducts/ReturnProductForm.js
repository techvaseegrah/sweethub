import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
// Correct import: using LuCircleCheck and LuX from the available exports
import { LuArrowBigRight, LuCircleCheck, LuX } from 'react-icons/lu';

const ReturnProductForm = ({ onReturnSuccess }) => {
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({
        productName: '',
        batchNumber: '',
        quantityReturned: '', 
        reasonForReturn: 'Damaged', 
        source: 'Shop',  // Keep default as Shop for shop side
        remarks: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get('/shop/products', {
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
        fetchProducts();
    }, []);

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
            await axios.post('/shop/returns', formData);
            setSuccess('Product return registered successfully!');
            setFormData({
                productName: '',
                batchNumber: '',
                quantityReturned: '', 
                reasonForReturn: 'Damaged', 
                source: 'Shop',  // Keep default as Shop for shop side
                remarks: ''
            });
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
            {/* Corrected JSX: using LuCircleCheck */}
            {success && <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4 flex items-center"><LuCircleCheck className="mr-2" />{success}</div>}
            {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 flex items-center"><LuX className="mr-2" />{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Product Name</label>
                    <select name="productName" value={formData.productName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50">
                        <option value="">Select a product</option>
                        {products.map((product) => (
                            <option key={product._id} value={product.name}>{product.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Batch Number (Optional)</label>
                    <input type="text" name="batchNumber" value={formData.batchNumber} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity Returned</label>
                    <input type="number" name="quantityReturned" value={formData.quantityReturned} onChange={handleChange} required min="1" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Reason for Return</label>
                    <select name="reasonForReturn" value={formData.reasonForReturn} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50">
                        <option value="Damaged">Damaged</option>
                        <option value="Expired">Expired</option>
                        <option value="Overproduction">Overproduction</option>
                        <option value="Customer Return">Customer Return</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Source</label>
                    <select name="source" value={formData.source} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50">
                        <option value="Shop">Shop</option>
                        <option value="Customer">Customer</option>
                        <option value="Factory">Factory</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Remarks (Optional)</label>
                    <textarea name="remarks" value={formData.remarks} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50"></textarea>
                </div>
                <button type="submit" disabled={loading} className={`w-full py-2 px-4 rounded-md text-white font-semibold transition-colors ${loading ? 'bg-gray-400' : 'bg-primary hover:bg-opacity-90'}`}>
                    {loading ? 'Registering...' : 'Register Return'}
                </button>
            </form>
        </div>
    );
};

export default ReturnProductForm;