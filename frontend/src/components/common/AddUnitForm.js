import React, { useState } from 'react';
import { useUnits } from './UnitContext';

const AddUnitForm = ({ onUnitAdded, className = '' }) => {
  const { addUnit } = useUnits();
  const [showForm, setShowForm] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [addingUnit, setAddingUnit] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Function to add a new unit
  const handleAddNewUnit = async () => {
    if (!newUnitName.trim()) {
      setError('Unit name cannot be empty');
      return;
    }
    
    setAddingUnit(true);
    setError('');
    setSuccess('');
    
    try {
      const addedUnit = await addUnit(newUnitName);
      setSuccess(`Unit "${addedUnit}" added successfully`);
      setNewUnitName('');
      setShowForm(false);
      
      // Notify parent component if callback provided
      if (onUnitAdded) {
        onUnitAdded(addedUnit);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add unit');
    } finally {
      setAddingUnit(false);
    }
  };

  return (
    <div className={className}>
      {success && <p className="mt-2 text-green-500 text-sm">{success}</p>}
      {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
      
      {showForm ? (
        <div className="mt-2 p-3 border rounded bg-gray-50">
          <h5 className="text-md font-medium text-gray-700 mb-2">Add New Unit</h5>
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <label className="block text-gray-700 text-xs font-bold mb-1">Unit Name</label>
              <input
                type="text"
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                placeholder="Enter unit name"
              />
            </div>
            <button
              type="button"
              onClick={handleAddNewUnit}
              disabled={addingUnit}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm disabled:opacity-50"
            >
              {addingUnit ? 'Adding...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setNewUnitName('');
                setError('');
              }}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-2 inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-200 transition-colors"
        >
          + Add New Unit
        </button>
      )}
    </div>
  );
};

export default AddUnitForm;