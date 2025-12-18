import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../../api/axios';

const ViewPackingMaterials = () => {
    const [materials, setMaterials] = useState([]);
    const [filteredMaterials, setFilteredMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchMaterials = useCallback(async () => {
        setLoading(true);
        try {
            // Assuming there will be a shop side endpoint for packing materials
            const response = await axios.get('/shop/warehouse/packing-materials');
            setMaterials(response.data);
            setFilteredMaterials(response.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch packing materials.');
            console.error('Error fetching packing materials:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMaterials();
    }, [fetchMaterials]);

    useEffect(() => {
        const results = materials.filter(material =>
            material.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredMaterials(results);
    }, [searchTerm, materials]);

    // Function to update threshold for a material
    const updateThreshold = async (materialId, newThreshold) => {
        try {
            // Update the threshold in the backend
            await axios.put(`/admin/warehouse/packing-materials/${materialId}`, {
                stockAlertThreshold: newThreshold
            });
            
            // Update the local state
            setMaterials(prevMaterials => 
                prevMaterials.map(material => 
                    material._id === materialId 
                        ? { ...material, stockAlertThreshold: newThreshold }
                        : material
                )
            );
            
            setMessage('Threshold updated successfully');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError('Failed to update threshold');
            console.error('Error updating threshold:', err);
        }
    };

    // Group materials by name to show units separately
    const groupMaterialsByName = (materials) => {
        const grouped = {};
        materials.forEach(material => {
            if (!grouped[material.name]) {
                grouped[material.name] = [];
            }
            grouped[material.name].push(material);
        });
        return grouped;
    };

    const groupedMaterials = groupMaterialsByName(filteredMaterials);

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
            <h1 className="text-2xl font-bold mb-4">View Packing Materials</h1>
            
            {error && <div className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</div>}
            {message && <div className="text-green-700 bg-green-100 p-3 rounded mb-4">{message}</div>}

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by material name..."
                    className="w-full md:w-1/3 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Grouped display of materials */}
            <div className="space-y-6">
                {Object.keys(groupedMaterials).length > 0 ? (
                    Object.entries(groupedMaterials).map(([materialName, materials]) => (
                        <div key={materialName} className="border rounded-lg shadow-sm overflow-hidden">
                            <div className="bg-gray-100 px-4 py-3 font-semibold text-lg">
                                🍬 {materialName}
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {materials.map((material) => (
                                        <div 
                                            key={material._id} 
                                            className={`border rounded-lg p-4 ${
                                                material.quantity <= (material.stockAlertThreshold || 0) 
                                                    ? 'bg-red-50 border-red-200' 
                                                    : 'bg-white'
                                            }`}
                                        >
                                            <div>
                                                <div className="font-medium text-gray-900">Unit: {material.quantity}</div>
                                                <div className="text-sm text-gray-600 mt-1">Price: ₹{material.price}</div>
                                                <div className="flex items-center mt-2">
                                                    <span className="text-sm text-gray-600 mr-2">Threshold:</span>
                                                    <input
                                                        type="number"
                                                        value={material.stockAlertThreshold || 0}
                                                        onChange={(e) => updateThreshold(material._id, parseInt(e.target.value) || 0)}
                                                        className="w-20 border rounded p-1 text-center"
                                                        min="0"
                                                    />
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    Stock: {material.quantity}
                                                </div>
                                            </div>
                                            {material.quantity <= (material.stockAlertThreshold || 0) && (
                                                <div className="mt-2 text-xs text-red-600 font-medium">
                                                    ⚠️ Low Stock Alert: Only {material.quantity} left!
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        No packing materials found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewPackingMaterials;