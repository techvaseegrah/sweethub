import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../../api/axios';
import { LuPlus } from 'react-icons/lu';

const OutgoingPackingMaterials = () => {
    const [packingMaterials, setPackingMaterials] = useState([]);
    const [outgoingRecords, setOutgoingRecords] = useState([]);
    const [selectedMaterial, setSelectedMaterial] = useState('');
    const [quantityUsed, setQuantityUsed] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [packingRes, outgoingRes] = await Promise.all([
                axios.get('/admin/warehouse/packing-materials'),
                axios.get('/admin/warehouse/packing-materials/outgoing')
            ]);
            setPackingMaterials(packingRes.data.filter(item => item.quantity > 0)); // Only show items with stock
            setOutgoingRecords(outgoingRes.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/admin/warehouse/packing-materials/outgoing', {
                materialName: selectedMaterial,
                quantityUsed: parseFloat(quantityUsed),
                notes
            });
            setMessage('Outgoing material recorded successfully');
            setSelectedMaterial('');
            setQuantityUsed('');
            setNotes('');
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to record outgoing material');
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
        <div className="text-red-500 font-medium">Loading...</div>
      </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h1 className="text-2xl font-bold mb-6">Outgoing Packing Materials</h1>
            
            {error && <div className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</div>}
            {message && <div className="text-green-700 bg-green-100 p-3 rounded mb-4">{message}</div>}

            {/* Form to record outgoing materials */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h2 className="text-lg font-semibold mb-4">Select Outgoing Packing Materials</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <select
                            value={selectedMaterial}
                            onChange={(e) => setSelectedMaterial(e.target.value)}
                            className="px-3 py-2 border rounded-md"
                            required
                        >
                            <option value="">Select Material</option>
                            {packingMaterials.map(material => (
                                <option key={material._id} value={material.name}>
                                    {material.name} (Stock: {material.quantity})
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            placeholder="Quantity to Use"
                            value={quantityUsed}
                            onChange={(e) => setQuantityUsed(e.target.value)}
                            className="px-3 py-2 border rounded-md"
                            required
                            min="0.01"
                            step="0.01"
                            max={packingMaterials.find(m => m.name === selectedMaterial)?.quantity || 0}
                        />
                        <input
                            type="text"
                            placeholder="Notes (optional)"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="px-3 py-2 border rounded-md"
                        />
                        <button 
                            type="submit" 
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                            disabled={!selectedMaterial || !quantityUsed}
                        >
                            Record Outgoing
                        </button>
                    </div>
                </form>
                
                {/* Available Materials Display */}
                <div className="mt-4">
                    <h3 className="text-md font-medium mb-2">Available Packing Materials:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {packingMaterials.map(material => (
                            <div key={material._id} className="bg-white p-3 rounded border">
                                <div className="font-medium">{material.name}</div>
                                <div className="text-sm text-gray-600">Stock: {material.quantity}</div>
                                <div className="text-sm text-gray-600">Price: ₹{material.price}</div>
                                {material.quantity <= material.stockAlertThreshold && (
                                    <div className="text-xs text-red-600 mt-1">⚠️ Low Stock Alert</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Outgoing records table */}
            <div className="overflow-x-auto">
                <h2 className="text-lg font-semibold mb-4">Outgoing Records History</h2>
                <table className="min-w-full bg-white border">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="py-3 px-4 text-left">Material Name</th>
                            <th className="py-3 px-4 text-left">Quantity Used</th>
                            <th className="py-3 px-4 text-left">Price per Unit</th>
                            <th className="py-3 px-4 text-left">Total Value</th>
                            <th className="py-3 px-4 text-left">Date Used</th>
                            <th className="py-3 px-4 text-left">Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {outgoingRecords.length > 0 ? outgoingRecords.map(record => (
                            <tr key={record._id} className="border-b hover:bg-gray-50">
                                <td className="border px-4 py-2">{record.materialName}</td>
                                <td className="border px-4 py-2">{record.quantityUsed}</td>
                                <td className="border px-4 py-2">₹{record.pricePerUnit}</td>
                                <td className="border px-4 py-2">₹{(record.quantityUsed * record.pricePerUnit).toFixed(2)}</td>
                                <td className="border px-4 py-2">{new Date(record.usedDate).toLocaleDateString()}</td>
                                <td className="border px-4 py-2">{record.notes || '-'}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" className="text-center py-4 text-gray-500">No outgoing records found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OutgoingPackingMaterials;