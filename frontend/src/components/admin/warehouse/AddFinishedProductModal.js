import React, { useState } from 'react';
import axios from '../../../api/axios';
import { LuPlus, LuX } from 'react-icons/lu';

const AddFinishedProductModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        productName: '',
        quantity: '',
        unit: 'kg',
        price: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await axios.post('/admin/warehouse/before-packing', {
                scheduleId: `FP-${Date.now()}`,
                batchId: `B-FP-${Date.now().toString().slice(-6)}`,
                productName: formData.productName,
                quantity: formData.quantity,
                unit: formData.unit,
                price: formData.price || 0,
                date: formData.date,
                description: formData.description,
                source: 'FINISHED PRODUCT'
            });
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add finished product');
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                    <input
                        type="text"
                        name="productName"
                        value={formData.productName}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="Enter product name"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                        <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            required
                            min="0.01"
                            step="any"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                        <select
                            name="unit"
                            value={formData.unit}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            <option value="kg">kg</option>
                            <option value="gram">gram</option>
                            <option value="piece">piece</option>
                            <option value="box">box</option>
                            <option value="liter">liter</option>
                            <option value="ml">ml</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        rows="3"
                        placeholder="Any additional details..."
                    ></textarea>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center disable-when-loading"
                    >
                        {loading ? 'Adding...' : 'Add Product'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddFinishedProductModal;
