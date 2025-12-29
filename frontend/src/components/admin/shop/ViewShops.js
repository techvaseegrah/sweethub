import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import CustomModal from '../../CustomModal';

const SHOPS_URL = '/admin/shops';

// Function to generate a consistent color based on shop name
const getShopColor = (shopName) => {
  if (!shopName) return 'bg-gray-100';
  
  // Simple hash function to generate a consistent color
  let hash = 0;
  for (let i = 0; i < shopName.length; i++) {
    hash = shopName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate HSL color with consistent saturation and lightness
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 90%)`;
};

function ViewShops() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingShopId, setEditingShopId] = useState(null);
  const [editedShop, setEditedShop] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // State for update confirmation modal
  const [showUpdateConfirmation, setShowUpdateConfirmation] = useState(false);
  // State for delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [shopToDelete, setShopToDelete] = useState(null);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await axios.get(SHOPS_URL, {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        });
        setShops(response.data);
      } catch (err) {
        setError('Failed to fetch shops.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  const handleEdit = (shop) => {
    setEditingShopId(shop._id);
    setEditedShop({
      ...shop,
      name: shop.name || '',
      location: shop.location || '',
      shopPhoneNumber: shop.shopPhoneNumber || '',
      gstNumber: shop.gstNumber || '',
      fssaiNumber: shop.fssaiNumber || '',
      newPassword: '',
      confirmNewPassword: ''
    });
    setIsModalOpen(true);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setErrorMessage(''); // Clear any previous error messages
  };

  const handleCancelEdit = () => {
    setEditingShopId(null);
    setEditedShop({});
    setIsModalOpen(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setErrorMessage(''); // Clear any previous error messages
  };

  const handleInputChange = (e, field) => {
    setEditedShop({ ...editedShop, [field]: e.target.value });
    // Clear error message when user starts typing
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleUpdate = async () => {
    // If new password is provided, check if passwords match
    if (editedShop.newPassword && editedShop.newPassword !== editedShop.confirmNewPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }
    
    // Show update confirmation modal
    setShowUpdateConfirmation(true);
  };
  
  const confirmUpdate = async () => {
    setShowUpdateConfirmation(false);
    
    try {
      // Prepare update data
      const updateData = {
        name: editedShop.name,
        location: editedShop.location,
        shopPhoneNumber: editedShop.shopPhoneNumber,
        gstNumber: editedShop.gstNumber,
        fssaiNumber: editedShop.fssaiNumber
      };
      
      // Include new password only if it's provided
      if (editedShop.newPassword) {
        updateData.password = editedShop.newPassword;
      }
      
      const response = await axios.put(`${SHOPS_URL}/${editingShopId}`, updateData, {
        withCredentials: true,
      });
      setShops(shops.map(s => s._id === editingShopId ? response.data : s));
      
      // Show success modal if password was updated
      if (editedShop.newPassword) {
        setShowSuccessModal(true);
      }
      
      handleCancelEdit();
    } catch (err) {
      setErrorMessage('Failed to update shop.');
      console.error(err);
    }
  };
  
  const cancelUpdate = () => {
    setShowUpdateConfirmation(false);
  };

  // Open delete confirmation modal
  const openDeleteConfirmation = (shopId) => {
    setShopToDelete(shopId);
    setIsDeleteModalOpen(true);
  };

  // Handle actual deletion
  const handleDelete = async () => {
    try {
      await axios.delete(`${SHOPS_URL}/${shopToDelete}`, { withCredentials: true });
      setShops(shops.filter((s) => s._id !== shopToDelete));
      setIsDeleteModalOpen(false);
      setShopToDelete(null);
    } catch (err) {
      setError('Failed to delete shop.');
      console.error(err);
      setIsDeleteModalOpen(false);
      setShopToDelete(null);
    }
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
        <div className="text-red-500 font-medium">Loading shops...</div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
    <h3 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-800">Existing Shops</h3>
      {shops.length === 0 ? (
        <p>No shops found. Please add one.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {shops.map((shop) => (
           <li key={shop._id} className="py-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-gray-900 px-3 py-1 rounded-md inline-block" style={{ backgroundColor: getShopColor(shop.name) }}>
                  {shop.name}
                </p>
                {/* Display username and other details */}
                {shop.user && <p className="text-sm text-gray-500 mt-2">Username: {shop.user.username}</p>}
                <p className="text-sm text-gray-500">Location: {shop.location}</p>
                <p className="text-sm text-gray-500">Phone Number: {shop.shopPhoneNumber}</p>
                {shop.gstNumber && <p className="text-sm text-gray-500">GST Number: {shop.gstNumber}</p>}
                {shop.fssaiNumber && <p className="text-sm text-gray-500">FSSAI Number: {shop.fssaiNumber}</p>}
              </div>
              <div className="w-full flex justify-end items-center space-x-4 sm:w-auto sm:space-x-2">
                <button
                  onClick={() => handleEdit(shop)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => openDeleteConfirmation(shop._id)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {/* Edit Shop Modal */}
      <CustomModal 
        isOpen={isModalOpen} 
        onClose={handleCancelEdit} 
        title="Edit Shop"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
            <input
              type="text"
              value={editedShop.name || ''}
              onChange={(e) => handleInputChange(e, 'name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Phone Number</label>
            <input
              type="tel"
              value={editedShop.shopPhoneNumber || ''}
              onChange={(e) => handleInputChange(e, 'shopPhoneNumber')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Location</label>
            <input
              type="text"
              value={editedShop.location || ''}
              onChange={(e) => handleInputChange(e, 'location')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
            <input
              type="text"
              value={editedShop.gstNumber || ''}
              onChange={(e) => handleInputChange(e, 'gstNumber')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter GST number (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">FSSAI Number</label>
            <input
              type="text"
              value={editedShop.fssaiNumber || ''}
              onChange={(e) => handleInputChange(e, 'fssaiNumber')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter FSSAI number (optional)"
            />
          </div>
          
          {/* Password Management Section */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-md font-medium text-gray-800 mb-3">Password Management</h4>
            <div className="bg-blue-50 p-3 rounded-md mb-4">
              <p className="text-sm text-blue-700">
                <strong>Security Note:</strong> Existing passwords are securely hashed and cannot be retrieved. 
                Use the fields below to set a new password if needed.
              </p>
            </div>
            
            {/* New Password Fields */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={editedShop.newPassword || ''}
                  onChange={(e) => handleInputChange(e, 'newPassword')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new password"
                />
                {editedShop.newPassword && (
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? "Hide" : "Show"}
                  </button>
                )}
              </div>
            </div>
            
            {editedShop.newPassword && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={editedShop.confirmNewPassword || ''}
                    onChange={(e) => handleInputChange(e, 'confirmNewPassword')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleCancelEdit}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Update Shop
          </button>
        </div>
      </CustomModal>

      {/* Error Message Modal */}
      <CustomModal 
        isOpen={!!errorMessage} 
        onClose={() => setErrorMessage('')} 
        title="Error"
      >
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-medium text-gray-900">Update Failed</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                {errorMessage}
              </p>
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </CustomModal>

      {/* Success Confirmation Modal */}
      <CustomModal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)} 
        title="Password Updated Successfully"
      >
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-medium text-gray-900">Password Updated</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                The password for this shop has been successfully updated.
              </p>
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </CustomModal>

      {/* Update Confirmation Modal */}
      <CustomModal 
        isOpen={showUpdateConfirmation} 
        onClose={cancelUpdate} 
        title="Confirm Update"
      >
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-medium text-gray-900">Are you sure you want to update this shop?</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                This will update the shop details including GST and FSSAI numbers. Do you want to continue?
              </p>
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={cancelUpdate}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmUpdate}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      </CustomModal>

      {/* Delete Confirmation Modal */}
      <CustomModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => {
          setIsDeleteModalOpen(false);
          setShopToDelete(null);
        }} 
        title="Confirm Deletion"
      >
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-medium text-gray-900">Are you sure?</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete this shop? This action cannot be undone.
              </p>
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setShopToDelete(null);
                }}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}

export default ViewShops;