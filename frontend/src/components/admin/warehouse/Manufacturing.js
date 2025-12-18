import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../../api/axios';
import { LuPlus, LuPencil, LuTrash2 } from 'react-icons/lu';
import MessageAlert from '../../MessageAlert'; // Assuming you have this component for messages
import { UnitSelector, AddUnitForm } from '../../common'; // Import the shared unit components

const Manufacturing = () => {
    const [processes, setProcesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState(''); // Fixed: Properly initialize with useState

    const [storeRoomItems, setStoreRoomItems] = useState([]);
    const [ingredientAlerts, setIngredientAlerts] = useState({});

    // State for the modal and form
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProcess, setCurrentProcess] = useState({
        _id: null,
        sweetName: '',
        // Initialize ingredients as an array of objects
        ingredients: [{ name: '', quantity: '', unit: '', price: '' }],
        quantity: '', // For the output sweet product
        price: '',    // For the output sweet product
        unit: '',     // For the output sweet product
    });
    const [formSubmitting, setFormSubmitting] = useState(false); // To prevent multiple submissions

    const fetchProcesses = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/admin/warehouse/manufacturing');
            setProcesses(response.data);
            setError(''); // Clear any previous errors on successful fetch
        } catch (err) {
            console.error('Failed to fetch manufacturing processes:', err);
            setError('Failed to fetch manufacturing processes. Please check your network or server status.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProcesses();
    }, [fetchProcesses]);

    useEffect(() => {
        const fetchStoreRoomItems = async () => {
            try {
                const response = await axios.get('/admin/warehouse/store-room');
                setStoreRoomItems(response.data);
            } catch (error) {
                console.error('Error fetching store room items:', error);
            }
        };
        fetchStoreRoomItems();
    }, []);

    const checkIngredientAvailability = (ingredientName, quantity, index) => {
        const storeItem = storeRoomItems.find(item => 
            item.name.toLowerCase() === ingredientName.toLowerCase()
        );
        
        const alerts = { ...ingredientAlerts };
        
        if (!storeItem) {
            alerts[index] = {
                type: 'error',
                message: `"${ingredientName}" is not available in store room`
            };
        } else if (parseFloat(quantity) > storeItem.quantity) {
            alerts[index] = {
                type: 'warning',
                message: `Only ${storeItem.quantity} ${storeItem.unit} available in store room`
            };
        } else if (parseFloat(quantity) > 0) {
            alerts[index] = {
                type: 'success',
                message: `✓ Available (${storeItem.quantity} ${storeItem.unit} in stock)`
            };
        } else {
            delete alerts[index];
        }
        
        setIngredientAlerts(alerts);
    };
    
    // Handlers for modal form inputs
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentProcess(prev => ({ ...prev, [name]: value }));
    };

    const handleIngredientChange = (index, e) => {
        const { name, value } = e.target;
        const newIngredients = [...currentProcess.ingredients];
        newIngredients[index][name] = value;
        setCurrentProcess(prev => ({ ...prev, ingredients: newIngredients }));
        
        // Check availability when name or quantity changes
        if (name === 'name' || name === 'quantity') {
            const ingredientName = name === 'name' ? value : newIngredients[index].name;
            const quantity = name === 'quantity' ? value : newIngredients[index].quantity;
            
            if (ingredientName && quantity) {
                checkIngredientAvailability(ingredientName, quantity, index);
            }
        }
    };

    // Function to handle selecting an existing ingredient from store room
    const handleSelectExistingIngredient = (index, selectedItem) => {
        if (selectedItem) {
            const newIngredients = [...currentProcess.ingredients];
            newIngredients[index] = {
                ...newIngredients[index],
                name: selectedItem.name,
                unit: selectedItem.unit,
                price: selectedItem.price || ''
            };
            setCurrentProcess(prev => ({ ...prev, ingredients: newIngredients }));
            
            // Check availability
            checkIngredientAvailability(selectedItem.name, newIngredients[index].quantity, index);
        }
    };

    const addIngredient = () => {
        setCurrentProcess(prev => ({
            ...prev,
            ingredients: [...prev.ingredients, { name: '', quantity: '', unit: '', price: '' }]
        }));
    };

    const removeIngredient = (index) => {
        const newIngredients = currentProcess.ingredients.filter((_, i) => i !== index);
        setCurrentProcess(prev => ({ ...prev, ingredients: newIngredients }));
    };

    // New function to handle unit changes specifically for ingredients
    const handleIngredientUnitChange = (index, unit) => {
        const newIngredients = [...currentProcess.ingredients];
        newIngredients[index].unit = unit;
        setCurrentProcess(prev => ({ ...prev, ingredients: newIngredients }));
    };

    const openModal = (process = null) => {
        setError('');
        setMessage('');
        if (process) {
            setIsEditing(true);
            // Ensure ingredients is an array, default to empty if not
            setCurrentProcess({ 
                ...process, 
                ingredients: Array.isArray(process.ingredients) ? process.ingredients : [{ name: '', quantity: '', unit: '', price: '' }]
            });
        } else {
            setIsEditing(false);
            setCurrentProcess({ 
                _id: null, 
                sweetName: '', 
                ingredients: [{ name: '', quantity: '', unit: '', price: '' }],
                quantity: '',
                price: '',
                unit: '',
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        // Reset form state on close
        setCurrentProcess({ 
            _id: null, 
            sweetName: '', 
            ingredients: [{ name: '', quantity: '', unit: '', price: '' }],
            quantity: '',
            price: '',
            unit: '',
        });
        setIsEditing(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormSubmitting(true);
        setMessage('');
        setError('');

        try {
            // Validate ingredients before sending
            const hasEmptyIngredient = currentProcess.ingredients.some(ing => !ing.name || !ing.quantity || !ing.unit || !ing.price);
            if (hasEmptyIngredient) {
                setError('Please fill in all ingredient details.');
                setFormSubmitting(false);
                return;
            }

            if (isEditing) {
                await axios.put(`/admin/warehouse/manufacturing/${currentProcess._id}`, currentProcess);
                setMessage('Process updated successfully!');
            } else {
                await axios.post('/admin/warehouse/manufacturing', currentProcess);
                setMessage('Process added successfully!');
            }
            closeModal();
            fetchProcesses(); // Re-fetch to update the list
        } catch (err) {
            console.error('Failed to save the process:', err);
            setError(err.response?.data?.message || 'Failed to save the process.');
        } finally {
            setFormSubmitting(false);
        }
    };
    
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this process? This action cannot be undone.')) {
            try {
                await axios.delete(`/admin/warehouse/manufacturing/${id}`);
                setMessage('Process deleted successfully.');
                fetchProcesses(); // Re-fetch to update the list
            } catch (err) {
                console.error('Failed to delete the process:', err);
                setError(err.response?.data?.message || 'Failed to delete the process.');
            }
        }
    };
    
    if (loading) return (
      <div className="text-center p-5 flex flex-col items-center justify-center">
        <div className="relative flex justify-center items-center mb-4">
          <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
          <img 
            src="/sweethub-logo.png" 
            alt="Sweet Hub Logo" 
            className="absolute w-8 h-8"
          />
        </div>
        <div className="text-red-500 font-medium">Loading manufacturing processes...</div>
      </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Manufacturing Processes</h1>
                <button 
                    onClick={() => openModal()} 
                    className="bg-primary text-white py-2 px-4 rounded-md flex items-center hover:bg-primary-dark transition duration-200"
                >
                    <LuPlus className="mr-2" /> Add New Process
                </button>
            </div>

            {error && <MessageAlert message={error} type="error" />}
            {message && <MessageAlert message={message} type="success" />}

            <div className="overflow-x-auto mt-4">
                {processes.length === 0 && !loading && !error ? (
                    <p className="text-center text-gray-500">No manufacturing processes found. Add a new one!</p>
                ) : (
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-light-gray">
                            <tr>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Sweet Name</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Ingredients</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Output Quantity</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Output Price</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Output Unit</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(processes) && processes.map((process) => (
                                <tr key={process._id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{process.sweetName}</td>
                                    <td className="py-3 px-4 text-sm text-gray-700">
                                        {Array.isArray(process.ingredients) && process.ingredients.length > 0
                                            ? process.ingredients.map(ing => `${ing.name} (${ing.quantity}${ing.unit})`).join(', ')
                                            : 'N/A'}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-700">{process.quantity}</td>
                                    <td className="py-3 px-4 text-sm text-gray-700">{process.price}</td>
                                    <td className="py-3 px-4 text-sm text-gray-700">{process.unit}</td>
                                    <td className="py-3 px-4 text-sm">
                                        <button 
                                            onClick={() => openModal(process)} 
                                            className="text-blue-600 hover:text-blue-800 mr-3 p-1 rounded-md bg-blue-100"
                                            title="Edit Process"
                                        >
                                            <LuPencil size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(process._id)} 
                                            className="text-red-600 hover:text-red-800 p-1 rounded-md bg-red-100"
                                            title="Delete Process"
                                        >
                                            <LuTrash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">{isEditing ? 'Edit Manufacturing Process' : 'Add New Manufacturing Process'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sweet Name</label>
                                <input
                                    type="text"
                                    name="sweetName"
                                    value={currentProcess.sweetName}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-primary focus:border-primary"
                                    required
                                />
                            </div>

                            <h3 className="text-lg font-semibold mb-3 mt-6 text-gray-800">Overall Product Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Overall Quantity</label>
                                    <input
                                        type="text"
                                        name="quantity"
                                        value={currentProcess.quantity}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-primary focus:border-primary"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Overall Price</label>
                                    <input
                                        type="text"
                                        name="price"
                                        value={currentProcess.price}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-primary focus:border-primary"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Overall Unit</label>
                                    {/* Use the shared UnitSelector component */}
                                    <UnitSelector
                                        value={currentProcess.unit}
                                        onChange={(unit) => setCurrentProcess(prev => ({ ...prev, unit }))}
                                    />
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-semibold mb-3 mt-6 text-gray-800">Ingredients Required</h3>

                            {/* Header row for ingredients */}
                            <div className="grid grid-cols-5 gap-2 mb-2 px-0">
                                <div className="text-sm font-semibold text-gray-700 px-11 py-2">
                                    Ingredient 
                                </div>
                                <div className="text-sm font-semibold text-gray-700 px-20 py-2">
                                    Qty
                                </div>
                                <div className="text-sm font-semibold text-gray-700 px-14 py-2">
                                    Unit
                                </div>
                                <div className="text-sm font-semibold text-gray-700 px-10 py-2">
                                    Price
                                </div>
                                <div className="text-sm font-semibold text-gray-700 px-3 py-2">
                                    Action
                                </div>
                            </div>
                            {/* Ensure currentProcess.ingredients is an array before mapping */}
                            {Array.isArray(currentProcess.ingredients) && currentProcess.ingredients.map((ing, index) => (
                                <div key={index}>
                                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-2 items-center p-3 border border-gray-200 rounded-md bg-gray-50">
                                        {/* Improved: Dropdown for existing ingredients with better labeling */}
                                        <div className="md:col-span-2 relative">
                                            <label className="block text-xs text-gray-500 mb-1">Ingredient Name</label>
                                            <input 
                                                type="text" 
                                                name="name" 
                                                placeholder="Start typing to see suggestions..." 
                                                value={ing.name} 
                                                onChange={(e) => handleIngredientChange(index, e)} 
                                                className="w-full px-3 py-2 border rounded-md text-sm" 
                                                required 
                                                list={`ingredients-list-${index}`}
                                            />
                                            {/* Dropdown list of existing ingredients */}
                                            <datalist id={`ingredients-list-${index}`}>
                                                {storeRoomItems.map(item => (
                                                    <option 
                                                        key={item._id} 
                                                        value={item.name}
                                                    >
                                                        {item.name} ({item.quantity} {item.unit} available)
                                                    </option>
                                                ))}
                                            </datalist>
                                            {/* Display available quantity for selected ingredient */}
                                            {ing.name && (
                                                <div className="mt-1 text-xs text-gray-600">
                                                    {(() => {
                                                        const storeItem = storeRoomItems.find(item => 
                                                            item.name.toLowerCase() === ing.name.toLowerCase()
                                                        );
                                                        return storeItem ? `Available: ${storeItem.quantity} ${storeItem.unit}` : '';
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                                            <input 
                                                type="text" 
                                                name="quantity" 
                                                placeholder="Qty" 
                                                value={ing.quantity} 
                                                onChange={(e) => handleIngredientChange(index, e)} 
                                                className="w-full px-3 py-2 border rounded-md text-sm" 
                                                required 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Unit</label>
                                            {/* Use the shared UnitSelector component for ingredient units */}
                                            <UnitSelector
                                                value={ing.unit}
                                                onChange={(unit) => handleIngredientUnitChange(index, unit)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Price</label>
                                            <input 
                                                type="text" 
                                                name="price" 
                                                placeholder="Price" 
                                                value={ing.price} 
                                                onChange={(e) => handleIngredientChange(index, e)} 
                                                className="w-full px-3 py-2 border rounded-md text-sm" 
                                                required 
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button 
                                                type="button" 
                                                onClick={() => removeIngredient(index)} 
                                                className="w-full bg-red-500 text-white p-2 rounded-md hover:bg-red-600 transition duration-200 text-sm"
                                                title="Remove Ingredient"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                    {/* Alert message for this ingredient */}
                                    {ingredientAlerts[index] && (
                                        <div className={`mb-3 p-2 rounded text-sm ${
                                            ingredientAlerts[index].type === 'error' ? 'bg-red-100 text-red-700' :
                                            ingredientAlerts[index].type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                            {ingredientAlerts[index].message}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={addIngredient} 
                                className="bg-gray-200 text-gray-800 p-2 mb-4 w-full rounded-md hover:bg-gray-300 transition duration-200 flex items-center justify-center"
                            >
                                <LuPlus className="mr-2" /> Add Ingredient
                            </button>

                            {/* Add the AddUnitForm component so users can add new units directly from this form */}
                            <div className="mb-6">
                                <h4 className="text-md font-semibold mb-2 text-gray-800">Manage Units</h4>
                                <AddUnitForm />
                            </div>

                            <div className="mt-6 flex justify-end gap-4">
                                <button 
                                    type="button" 
                                    onClick={closeModal} 
                                    className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-200"
                                    disabled={formSubmitting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
                                    disabled={formSubmitting}
                                >
                                    {formSubmitting ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Save Changes' : 'Add Process')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Manufacturing;