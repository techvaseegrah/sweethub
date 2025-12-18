import React, { useState, useRef, useEffect } from 'react';
import { useUnits } from './UnitContext';

const UnitSelector = ({ value, onChange, className = '', showAddUnitOption = true, ...props }) => {
  const { units, defaultUnits, deleteUnit, isUnitInUse, addUnit } = useUnits();
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [addingUnit, setAddingUnit] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef(null);
  const confirmModalRef = useRef(null);
  const addFormRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
        setShowAddForm(false);
        setNewUnitName('');
        setError('');
      }
      
      // Close delete confirmation when clicking outside
      if (showDeleteConfirm && 
          confirmModalRef.current && 
          !confirmModalRef.current.contains(event.target)) {
        setShowDeleteConfirm(false);
        setUnitToDelete(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDeleteConfirm]);

  // Function to show delete confirmation
  const confirmDeleteUnit = (unitToRemove) => {
    setUnitToDelete(unitToRemove);
    setShowDeleteConfirm(true);
  };

  // Function to actually remove a unit
  const handleRemoveUnit = async () => {
    if (!unitToDelete) return;
    
    try {
      // Check if unit is in use
      const inUse = await isUnitInUse(unitToDelete);
      if (inUse) {
        alert('Cannot remove unit that is currently in use');
        setShowDeleteConfirm(false);
        setUnitToDelete(null);
        return;
      }
      
      // Remove the unit
      await deleteUnit(unitToDelete);
    } catch (error) {
      alert(error.message || 'Failed to delete unit');
    } finally {
      setShowDeleteConfirm(false);
      setUnitToDelete(null);
    }
  };

  // Function to add a new unit
  const handleAddNewUnit = async (e) => {
    e.stopPropagation();
    if (!newUnitName.trim()) {
      setError('Unit name cannot be empty');
      return;
    }
    
    setAddingUnit(true);
    setError('');
    
    try {
      const addedUnit = await addUnit(newUnitName);
      setNewUnitName('');
      setShowAddForm(false);
      // Call onChange with the newly added unit
      onChange(addedUnit);
      setOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to add unit');
    } finally {
      setAddingUnit(false);
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
              Are you sure you want to delete the unit "<strong>{unitToDelete}</strong>"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setUnitToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveUnit}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Unit Selector Display */}
      <div 
        className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm flex justify-between items-center cursor-pointer bg-white ${className}`}
        onClick={() => setOpen(!open)}
        {...props}
      >
        <span>{value || 'Select unit'}</span>
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
        </svg>
      </div>
      
      {/* Dropdown List */}
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
          {units.map((unit) => {
            const isCustomUnit = !defaultUnits.includes(unit);
            return (
              <div 
                key={unit} 
                className="flex justify-between items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  onChange(unit);
                  setOpen(false);
                }}
              >
                <span>{unit}</span>
                {isCustomUnit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDeleteUnit(unit);
                    }}
                    className="text-red-500 hover:text-red-700 font-bold ml-2"
                    title="Delete this unit"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
          
          {/* Add New Unit Option */}
          {showAddUnitOption && (
            <>
              <div className="border-t border-gray-200 my-1"></div>
              {showAddForm ? (
                <div ref={addFormRef} className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={newUnitName}
                        onChange={(e) => setNewUnitName(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                        placeholder="Enter unit name"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddNewUnit(e);
                          }
                        }}
                      />
                      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddNewUnit}
                      disabled={addingUnit}
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-xs disabled:opacity-50"
                    >
                      {addingUnit ? 'Adding...' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAddForm(false);
                        setNewUnitName('');
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
                  <span>+ Add New Unit</span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default UnitSelector;