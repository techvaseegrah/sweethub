import React, { useState, useRef, useEffect } from 'react';
import axios from '../../../api/axios';

const PackingMaterialNameSelector = ({ value, onChange, className = '', ...props }) => {
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [error, setError] = useState('');
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const confirmModalRef = useRef(null);
  const addFormRef = useRef(null);

  // Fetch all packing materials
  const fetchMaterials = async () => {
    try {
      const response = await axios.get('/admin/warehouse/packing-materials');
      setMaterials(response.data);
      setFilteredMaterials(response.data);
    } catch (err) {
      console.error('Failed to fetch packing materials:', err);
    }
  };

  // Initialize materials on component mount
  useEffect(() => {
    fetchMaterials();
  }, []);

  // Filter materials based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = materials.filter(material => 
        material.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMaterials(filtered);
    } else {
      setFilteredMaterials(materials);
    }
  }, [searchTerm, materials]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
        setShowAddForm(false);
        setNewMaterialName('');
        setSearchTerm('');
        setError('');
      }
      
      // Close delete confirmation when clicking outside
      if (showDeleteConfirm && 
          confirmModalRef.current && 
          !confirmModalRef.current.contains(event.target)) {
        setShowDeleteConfirm(false);
        setMaterialToDelete(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDeleteConfirm]);

  // Function to show delete confirmation
  const confirmDeleteMaterial = (materialToRemove) => {
    setMaterialToDelete(materialToRemove);
    setShowDeleteConfirm(true);
  };

  // Function to actually remove a material
  const handleRemoveMaterial = async () => {
    if (!materialToDelete) return;
    
    try {
      // Check if material is in use (has quantity > 0)
      const material = materials.find(m => m.name === materialToDelete);
      if (material && material.quantity > 0) {
        alert('Cannot remove material that has quantity in stock');
        setShowDeleteConfirm(false);
        setMaterialToDelete(null);
        return;
      }
      
      // Find the material ID
      const materialToDeleteObj = materials.find(m => m.name === materialToDelete);
      if (!materialToDeleteObj) {
        throw new Error('Material not found');
      }
      
      // Remove the material from database
      await axios.delete(`/admin/warehouse/packing-materials/${materialToDeleteObj._id}`);
      
      // Refresh materials list
      await fetchMaterials();
      
      // If the deleted material was the selected one, clear the selection
      if (value === materialToDelete) {
        onChange('');
      }
    } catch (error) {
      alert(error.message || 'Failed to delete material');
    } finally {
      setShowDeleteConfirm(false);
      setMaterialToDelete(null);
    }
  };

  // Function to add a new material
  const handleAddNewMaterial = async (e) => {
    e.stopPropagation();
    if (!newMaterialName.trim()) {
      setError('Material name cannot be empty');
      return;
    }
    
    setAddingMaterial(true);
    setError('');
    
    try {
      // Check if material already exists
      const existingMaterial = materials.find(material => 
        material.name.toLowerCase() === newMaterialName.trim().toLowerCase()
      );
      
      if (existingMaterial) {
        setError('Material already exists');
        setAddingMaterial(false);
        return;
      }
      
      // Add to database
      const response = await axios.post('/admin/warehouse/packing-materials', {
        name: newMaterialName.trim(),
        quantity: 0,
        price: 0,
        stockAlertThreshold: 0
      });
      
      // Refresh materials list
      await fetchMaterials();
      
      // Select the newly added material
      onChange(newMaterialName.trim());
      
      setNewMaterialName('');
      setShowAddForm(false);
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add material');
    } finally {
      setAddingMaterial(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={confirmModalRef} className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete the material "<strong>{materialToDelete}</strong>"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setMaterialToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveMaterial}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Material Selector Display */}
      <div 
        className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm flex justify-between items-center cursor-pointer bg-white ${className}`}
        onClick={() => setOpen(!open)}
        {...props}
      >
        <span>{value || 'Select material'}</span>
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
        </svg>
      </div>
      
      {/* Dropdown List */}
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search materials..."
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {filteredMaterials.map((material) => (
            <div 
              key={material._id} 
              className="flex justify-between items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                onChange(material.name);
                setOpen(false);
                setSearchTerm('');
              }}
            >
              <span>{material.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDeleteMaterial(material.name);
                }}
                className="text-red-500 hover:text-red-700 font-bold ml-2"
                title="Delete this material"
              >
                ×
              </button>
            </div>
          ))}
          
          {/* Add New Material Option */}
          <>
            <div className="border-t border-gray-200 my-1"></div>
            {showAddForm ? (
              <div ref={addFormRef} className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newMaterialName}
                      onChange={(e) => setNewMaterialName(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                      placeholder="Enter material name"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddNewMaterial(e);
                        }
                      }}
                    />
                    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddNewMaterial}
                    disabled={addingMaterial}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-xs disabled:opacity-50"
                  >
                    {addingMaterial ? 'Adding...' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddForm(false);
                      setNewMaterialName('');
                      setError('');
                    }}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-blue-600 flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddForm(true);
                }}
              >
                <span>+ Add New Material</span>
              </div>
            )}
          </>
        </div>
      )}
    </div>
  );
};

export default PackingMaterialNameSelector;