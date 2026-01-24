import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from '../../../api/axios';
import UnitSelector from '../../common/UnitSelector';
import CreateRawMaterialAccountModal from './CreateRawMaterialAccountModal';
import CustomModal from '../../CustomModal';
import { AuthContext } from '../../../context/AuthContext';

const RawMaterials = () => {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('');
    const [price, setPrice] = useState('');
    const [vendor, setVendor] = useState('');
    const [address, setAddress] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [usedByDate, setUsedByDate] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [storeRoomItems, setStoreRoomItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [newItemName, setNewItemName] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);  // Add this state
    const [showManageMode, setShowManageMode] = useState(false);  // Track if modal should open in manage mode
    const { authState } = useContext(AuthContext);
    const dropdownRef = useRef(null);

    // Fetch existing store room items
    useEffect(() => {
        const fetchStoreRoomItems = async () => {
            try {
                const response = await axios.get('/admin/warehouse/store-room');
                setStoreRoomItems(response.data);
                setFilteredItems(response.data);
            } catch (err) {
                console.error('Failed to fetch store room items:', err);
            }
        };

        fetchStoreRoomItems();
    }, []);

    // Handle name change for dropdown
    const handleNameChange = (e) => {
        const value = e.target.value;
        setName(value);
        
        if (value.trim() === '') {
            setFilteredItems(storeRoomItems);
            setShowDropdown(false);
        } else {
            const filtered = storeRoomItems.filter(item => 
                item.name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredItems(filtered);
            setShowDropdown(true);
        }
    };

    // Select an item from the dropdown
    const selectItem = (item) => {
        setName(item.name);
        setUnit(item.unit || '');
        setPrice(item.price.toString() || '');
        setVendor(item.vendor || '');
        setAddress(item.address || '');
        setQuantity('');
        setShowDropdown(false);
    };

    // Add a new item to the dropdown
    const handleAddNew = async (e) => {
        e.preventDefault();
        
        if (!newItemName.trim()) {
            setError('Please enter a name for the new item');
            return;
        }

        // Check if item already exists
        const existingItem = storeRoomItems.find(item => 
            item.name.toLowerCase() === newItemName.trim().toLowerCase()
        );

        if (existingItem) {
            setError('Item already exists in the list');
            return;
        }

        try {
            // Add to database with minimal data initially
            const response = await axios.post('/admin/warehouse/raw-materials', {
                name: newItemName.trim(),
                quantity: 0,
                unit: 'kg', // Default unit
                price: 0,
                vendor: '',
                address: '',
                expiryDate: '',
                usedByDate: ''
            });

            // Update local state
            const newItem = response.data;
            setStoreRoomItems(prev => [...prev, newItem]);
            setFilteredItems(prev => [...prev, newItem]);
            
            // Select the newly added item
            setName(newItem.name);
            setUnit(newItem.unit);
            setPrice(newItem.price.toString());
            
            // Reset form
            setNewItemName('');
            setShowAddForm(false);
            setShowDropdown(false);
            setMessage(`Successfully added "${newItem.name}" to the list`);
            
            // Clear message after 3 seconds
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError('Failed to add new item. Please try again.');
        }
    };

    // Remove an item from the dropdown
    const handleRemoveItem = async (itemName) => {
        if (!window.confirm(`Are you sure you want to remove "${itemName}" from the list?`)) {
            return;
        }

        try {
            const itemToRemove = storeRoomItems.find(item => item.name === itemName);
            if (itemToRemove) {
                await axios.delete(`/admin/warehouse/store-room/${itemToRemove._id}`);
                
                setStoreRoomItems(prev => prev.filter(item => item.name !== itemName));
                setFilteredItems(prev => prev.filter(item => item.name !== itemName));
                
                // If we removed the currently selected item, clear the form
                if (itemName === name) {
                    setName('');
                    setQuantity('');
                    setUnit('');
                    setPrice('');
                    setVendor('');
                }
                
                setMessage(`"${itemName}" has been removed from the list`);
                
                // Clear message after 3 seconds
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (err) {
            setError('Failed to remove item. Please try again.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            const response = await axios.post('/admin/warehouse/raw-materials', { 
                name, 
                quantity, 
                unit, 
                price, 
                vendor,
                address,
                expiryDate,
                usedByDate 
            });
            setMessage(`Successfully added/updated "${response.data.name}".`);
            // Clear the form for the next entry
            setName('');
            setQuantity('');
            setUnit('');
            setPrice('');
            setVendor('');
            setAddress('');
            setExpiryDate('');
            setUsedByDate('');
            
            // Refresh store room items to include the new item
            try {
                const response = await axios.get('/admin/warehouse/store-room');
                setStoreRoomItems(response.data);
            } catch (err) {
                console.error('Failed to refresh store room items:', err);
            }
        } catch (err) {
            setError('Failed to add raw material. Please try again.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Add Raw Material</h1>
                {/* Show Create Account button only for admin users (not for raw-materials-only users) */}
                {authState?.isAuthenticated && authState?.role === 'admin' && (
                    <button 
                        onClick={() => {
                            setEditingAccount(null);  // Ensure we're in create mode
                            setShowManageMode(false);  // Set to open modal in create mode
                            setShowCreateAccountModal(true);
                        }}
                        className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                        </svg>
                        Create Account
                    </button>
                )}
            </div>
            <p className="text-gray-600 mb-6">Use this form to add new raw materials or increase the quantity of existing ones. All materials can be managed in the "Store Room".</p>
            
            {message && <div className="text-green-700 bg-green-100 p-3 rounded mb-4">{message}</div>}
            {error && <div className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
                    <div className="md:col-span-2 relative" ref={dropdownRef}>
                        <label className="block text-sm font-medium">Ingredient Name</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="e.g., Sugar"
                                value={name}
                                onChange={handleNameChange}
                                className="w-full mt-1 px-3 py-2 border rounded-md"
                                required
                            />
                            {showDropdown && (
                                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                                    {filteredItems.map((item, index) => (
                                        <div key={index} className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center">
                                            <span 
                                                onClick={() => selectItem(item)} 
                                                className="flex-1"
                                            >
                                                {item.name}
                                            </span>
                                            {authState?.isAuthenticated && authState?.role !== 'attendance-only' && authState?.role !== 'raw-materials-only' && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveItem(item.name);
                                                    }}
                                                    className="ml-2 text-red-500 hover:text-red-700 text-sm"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {filteredItems.length === 0 && (
                                        <div className="p-2 text-gray-500">No items found</div>
                                    )}
                                    {!showAddForm && authState?.isAuthenticated && authState?.role !== 'attendance-only' && authState?.role !== 'raw-materials-only' && (
                                        <div className="border-t border-gray-200 my-1"></div>
                                    )}
                                    {!showAddForm && authState?.isAuthenticated && authState?.role !== 'attendance-only' && authState?.role !== 'raw-materials-only' && (
                                        <div className="p-2 bg-gray-50">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setShowAddForm(true);
                                                    setNewItemName('');
                                                }}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium w-full text-left"
                                            >
                                                + Add New Item
                                            </button>
                                        </div>
                                    )}
                                    {showAddForm && (
                                        <div className="p-2 border-t border-gray-200 bg-gray-50">
                                            <div className="flex items-end space-x-2">
                                                <input
                                                    type="text"
                                                    value={newItemName}
                                                    onChange={(e) => setNewItemName(e.target.value)}
                                                    className="flex-1 px-2 py-1 border rounded text-sm"
                                                    placeholder="Enter item name"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleAddNew(e);
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddNew}
                                                    className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded"
                                                >
                                                    Add
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setShowAddForm(false);
                                                        setError('');
                                                    }}
                                                    className="bg-gray-500 hover:bg-gray-600 text-white text-sm px-3 py-1 rounded"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                            {error && filteredItems.length === 0 && !showAddForm && (
                                                <p className="text-red-500 text-xs mt-1">{error}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Quantity</label>
                        <input
                            type="number"
                            min="0"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Unit</label>
                        <UnitSelector value={unit} onChange={setUnit} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Price</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Vendor</label>
                        <input
                            type="text"
                            value={vendor}
                            onChange={(e) => setVendor(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Address</label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-md"
                            placeholder="Enter vendor address"
                        />
                    </div>
                </div>
                
                {/* Expiry and Used By Date fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Expiry Date</label>
                        <input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Used By Date</label>
                        <input
                            type="date"
                            value={usedByDate}
                            onChange={(e) => setUsedByDate(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-md"
                        />
                    </div>
                </div>
                
                <button type="submit" className="w-full md:w-auto bg-primary text-white py-2 px-6 rounded-md hover:bg-primary-dark">Add Material to Store Room</button>
            </form>

            {/* Create Account Modal */}
            {showCreateAccountModal && (
                <CustomModal
                    isOpen={showCreateAccountModal}
                    onClose={() => {
                        setShowCreateAccountModal(false);
                        setEditingAccount(null);  // Reset editing state when modal is closed
                    }}
                    title={editingAccount ? "Edit Raw Materials Account" : "Create Raw Materials Account"}
                >
                    <CreateRawMaterialAccountModal 
                        onClose={() => {
                            setShowCreateAccountModal(false);
                            setEditingAccount(null);  // Reset editing state when modal is closed
                            setShowManageMode(false);  // Reset manage mode
                        }}
                        onAccountCreated={() => {
                            setShowCreateAccountModal(false);
                            setEditingAccount(null);  // Reset editing state when account is created
                            setShowManageMode(false);  // Reset manage mode
                            // Optionally refresh data or show success message
                        }}
                        editingAccount={editingAccount}
                        showManageAccountsInitial={showManageMode}
                    />
                </CustomModal>
            )}
        </div>
    );
};

export default RawMaterials;