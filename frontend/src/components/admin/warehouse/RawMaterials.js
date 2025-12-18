import React, { useState, useEffect, useRef } from 'react';
import axios from '../../../api/axios';
import UnitSelector from '../../common/UnitSelector';

const RawMaterials = () => {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('');
    const [price, setPrice] = useState('');
    const [vendor, setVendor] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [storeRoomItems, setStoreRoomItems] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [filteredItems, setFilteredItems] = useState([]);
    const [newItemName, setNewItemName] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
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

    // Handle clicks outside dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
                setShowAddForm(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Filter items based on input
    useEffect(() => {
        if (name) {
            const filtered = storeRoomItems.filter(item => 
                item.name.toLowerCase().includes(name.toLowerCase())
            );
            setFilteredItems(filtered);
        } else {
            setFilteredItems(storeRoomItems);
        }
    }, [name, storeRoomItems]);

    // Handle name input change
    const handleNameChange = (e) => {
        const value = e.target.value;
        setName(value);
        setShowDropdown(true);
        setShowAddForm(false);
    };

    // Select an item from dropdown
    const selectItem = (itemName) => {
        setName(itemName);
        setShowDropdown(false);
        setShowAddForm(false);
        
        // Auto-fill unit, price, and vendor if available
        const selectedItem = storeRoomItems.find(item => item.name === itemName);
        if (selectedItem) {
            setUnit(selectedItem.unit || '');
            setPrice(selectedItem.price || '');
            setVendor(selectedItem.vendor || '');
        }
    };

    // Add a new item to the dropdown
    const handleAddItem = async () => {
        if (!newItemName.trim()) {
            setError('Please enter a valid item name');
            return;
        }

        try {
            // Check if item already exists
            const existingItem = storeRoomItems.find(item => 
                item.name.toLowerCase() === newItemName.trim().toLowerCase()
            );
            
            if (existingItem) {
                setError('Item already exists in the list');
                return;
            }

            // Add to database with minimal data initially
            const response = await axios.post('/admin/warehouse/raw-materials', {
                name: newItemName.trim(),
                quantity: 0,
                unit: 'kg', // Default unit
                price: 0,
                vendor: ''
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
    const handleRemoveItem = async (itemId, itemName) => {
        try {
            // Prevent removing items that have quantity
            const item = storeRoomItems.find(i => i._id === itemId);
            if (item && item.quantity > 0) {
                setError('Cannot remove items that have quantity in stock');
                return;
            }

            // Delete from database
            await axios.delete(`/admin/warehouse/store-room/${itemId}`);
            
            // Update local state
            setStoreRoomItems(prev => prev.filter(item => item._id !== itemId));
            setFilteredItems(prev => prev.filter(item => item._id !== itemId));
            
            // If the removed item was selected, clear the selection
            if (name === itemName) {
                setName('');
                setUnit('');
                setPrice('');
                setVendor('');
            }
            
            setMessage(`Successfully removed "${itemName}" from the list`);
            
            // Clear message after 3 seconds
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError('Failed to remove item. Please try again.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            const response = await axios.post('/admin/warehouse/raw-materials', { name, quantity, unit, price, vendor });
            setMessage(`Successfully added/updated "${response.data.name}".`);
            // Clear the form for the next entry
            setName('');
            setQuantity('');
            setUnit('');
            setPrice('');
            setVendor('');
            
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
            <h1 className="text-2xl font-bold mb-4">Add Raw Material</h1>
            <p className="text-gray-600 mb-6">Use this form to add new raw materials or increase the quantity of existing ones. All materials can be managed in the "Store Room".</p>
            
            {message && <div className="text-green-700 bg-green-100 p-3 rounded mb-4">{message}</div>}
            {error && <div className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
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
                                onFocus={() => setShowDropdown(true)}
                            />
                            <button
                                type="button"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                onClick={() => setShowAddForm(!showAddForm)}
                            >
                                +
                            </button>
                        </div>
                        
                        {/* Add new item form */}
                        {showAddForm && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-md border">
                                <input
                                    type="text"
                                    placeholder="Enter new item name"
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md text-sm mb-2"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
                                    >
                                        Add Item
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddForm(false)}
                                        className="px-3 py-1 bg-gray-300 rounded-md text-sm hover:bg-gray-400"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {/* Dropdown list */}
                        {showDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {filteredItems.map((item) => (
                                    <div
                                        key={item._id}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                                        onClick={() => selectItem(item.name)}
                                    >
                                        <span>{item.name} ({item.quantity} {item.unit} available)</span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveItem(item._id, item.name);
                                            }}
                                            className="text-red-500 hover:text-red-700 text-sm"
                                            title="Remove item"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {filteredItems.length === 0 && name && (
                                    <div className="px-4 py-2 text-gray-500">
                                        No items found. Click "+" to add "{name}" as a new item.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Quantity</label>
                        <input
                            type="text"
                            placeholder="e.g., 50"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Unit</label>
                        <UnitSelector
                            value={unit}
                            onChange={setUnit}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Price (per unit)</label>
                        <input
                            type="text"
                            placeholder="e.g., 55"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Vendor Name</label>
                        <input
                            type="text"
                            placeholder="e.g., ABC Supplier"
                            value={vendor}
                            onChange={(e) => setVendor(e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-md"
                        />
                    </div>
                </div>
                <button type="submit" className="w-full md:w-auto bg-primary text-white py-2 px-6 rounded-md hover:bg-primary-dark">Add Material to Store Room</button>
            </form>
        </div>
    );
};

export default RawMaterials;