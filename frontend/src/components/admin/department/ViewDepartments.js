import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';


function ViewDepartments({ baseUrl = '/admin' }) {
  const DEPARTMENTS_URL = `${baseUrl}/departments`;
  const SHOPS_URL = `${baseUrl}/shops`;
  const [departments, setDepartments] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('admin'); // Changed default to 'admin'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [expandedDept, setExpandedDept] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);


  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        let params = {};
        if (selectedShop === 'admin') {
            params = { showAdmin: true }; // New parameter for backend
        } else if (selectedShop) {
            params = { shopId: selectedShop };
        }
        
        const response = await axios.get(DEPARTMENTS_URL, {
          params,
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        });
        setDepartments(response.data);
      } catch (err) {
        setError('Failed to fetch departments.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchShops = async () => {
      try {
        const response = await axios.get(SHOPS_URL, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        });
        setShops(response.data);
      } catch (err) {
        console.error('Failed to fetch shops:', err);
      }
    };

    if (baseUrl === '/admin') {
      fetchShops();
    }
    fetchDepartments();
  }, [baseUrl, selectedShop]);

  const handleUpdate = async (id) => {
    try {
      const response = await axios.put(`${DEPARTMENTS_URL}/${id}`,
        { name: editingName },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );
      setDepartments(departments.map(d => d._id === id ? response.data : d));
      closeEditModal(); // Close modal on successful update
    } catch (err) {
      setError('Failed to update department.');
      console.error(err);
    }
};

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${DEPARTMENTS_URL}/${id}`, {
        withCredentials: true,
      });
      setDepartments(departments.filter((d) => d._id !== id));
    } catch (err) {
      setError('Failed to delete department.');
      console.error(err);
    }
  };

  const openEditModal = (department) => {
    setEditingId(department._id);
    setEditingName(department.name);
    setIsModalOpen(true);
};

const closeEditModal = () => {
    setEditingId(null);
    setEditingName('');
    setIsModalOpen(false);
};

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center">
        <div className="relative flex justify-center items-center mb-4">
          <div className="w-16 h-16 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
          <img 
            src="/sweethub-logo.png" 
            alt="Sweet Hub Logo" 
            className="absolute w-10 h-10"
          />
        </div>
        <div className="text-red-500 font-medium">Loading departments...</div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
     <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800">Existing Departments</h3>

         {/* Add the new filter dropdown for admin panel */}
      {baseUrl === '/admin' && (
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Filter by Shop</label>
          <select
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="admin">Admin Departments Only</option>
            {shops.map((shop) => (
              <option key={shop._id} value={shop._id}>
                {shop.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {departments.length === 0 ? (
        <p>No departments found. Please create one.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {departments.map((dept) => (
            <li key={dept._id} className="py-4 flex justify-between items-center">
              {editingId === dept._id ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              ) : (
                <div>
                  <div onClick={() => setExpandedDept(expandedDept === dept._id ? null : dept._id)} className="cursor-pointer">
                      <p className="font-medium text-gray-900">{dept.name}</p>
                      <p className="text-sm text-gray-500">Workers: {dept.workers.length}</p>
                  </div>
                  {expandedDept === dept._id && (
                  <div className="mt-2 pl-4">
                      {dept.workers.length > 0 ? (
                      <ul className="list-disc list-inside">
                          {dept.workers.map(worker => (
                          <li key={worker._id} className="text-sm text-gray-600">{worker.name}</li>
                          ))}
                      </ul>
                      ) : (
                      <p className="text-sm text-gray-500">No workers in this department.</p>
                      )}
                  </div>
                  )}
              </div>
              )}
             <div className="w-full flex justify-end items-center space-x-4 sm:w-auto sm:space-x-2">
                {editingId === dept._id ? (
                  <button onClick={() => handleUpdate(dept._id)} className="text-green-600 hover:text-green-900">Save</button>
                ) : (
                  <button onClick={() => openEditModal(dept)} className="text-blue-600 hover:text-blue-900">Edit</button>
                )}
                <button onClick={() => handleDelete(dept._id)} className="text-red-600 hover:text-red-900">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {isModalOpen && (
<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
<div className="relative m-4 p-4 sm:p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Edit Department Name</h3>
    <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
        type="text"
        value={editingName}
        onChange={(e) => setEditingName(e.target.value)}
        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
    </div>
    <div className="mt-6 flex justify-end space-x-3">
        <button onClick={closeEditModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
        <button onClick={() => handleUpdate(editingId)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Update</button>
    </div>
    </div>
</div>
)}
    </div>
  );
}

export default ViewDepartments;