import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../../api/axios';
import { LuPackageX, LuPlus } from 'react-icons/lu';

const MaterialStockAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // State for the "Add Stock" modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [addQuantity, setAddQuantity] = useState('');

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
            setError('Please enter a valid quantity.');
            return;
        }
        
        try {
            // We use the 'raw-materials' endpoint as it's designed to add quantity to existing items
            await axios.post('/admin/warehouse/raw-materials', {
                name: currentItem.name,
                quantity: addQuantity,
            });
            setMessage(`Stock for "${currentItem.name}" has been updated.`);
            closeModal();
            fetchAlerts(); // Refresh the alerts list
        } catch (err) {
            setError('Failed to update stock.');
            console.error(err);
        }
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
        <div className="text-red-500 font-medium">Loading Alerts...</div>
      </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h1 className="text-2xl font-bold mb-4">Material Stock Alerts</h1>

            {error && <div className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</div>}
            {message && <div className="text-green-700 bg-green-100 p-3 rounded mb-4">{message}</div>}

            {alerts.length === 0 && !loading && (
                <div className="text-center py-12">
                    <LuPackageX className="mx-auto text-6xl text-green-500" />
                    <h2 className="mt-4 text-xl font-semibold text-gray-700">All Good!</h2>
                    <p className="text-gray-500 mt-2">There are no material stock alerts at the moment.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {alerts.map((alert) => (
                    <div key={alert._id} className="border rounded-lg p-4 flex flex-col justify-between shadow-sm hover:shadow-lg transition-shadow">
                        <div>
                            <h3 className="font-bold text-lg text-gray-800">{alert.name}</h3>
                            <p className="text-sm text-gray-500">Threshold: {alert.stockAlertThreshold} {alert.unit}</p>
                            
                            <div className="my-3">
                                <p className="text-2xl font-bold text-red-600">{alert.quantity} <span className="text-base font-normal text-gray-600">{alert.unit}</span></p>
                                <p className="text-xs text-red-500">Current Stock is low</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => openAddStockModal(alert)}
                            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors"
                        >
                            <LuPlus />
                            Add Stock
                        </button>
                    </div>
                ))}
            </div>

            {isModalOpen && currentItem && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                        <h2 className="text-xl font-bold mb-4">Add Stock for {currentItem.name}</h2>
                        <p className="text-sm mb-4">Current Stock: {currentItem.quantity} {currentItem.unit}</p>
                        <form onSubmit={handleAddStock}>
                            <div>
                                <label className="block text-sm font-medium">Quantity to Add</label>
                                <input
                                    type="number"
                                    value={addQuantity}
                                    onChange={(e) => setAddQuantity(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border rounded-md"
                                    placeholder={`e.g., 50`}
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="mt-6 flex justify-end gap-4">
                                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Update Stock</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaterialStockAlerts;