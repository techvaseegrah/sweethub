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
    
    // Helper function to safely convert date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleDateString();
        } catch (e) {
            return '-';
        }
    };

    const [storeRoomItems, setStoreRoomItems] = useState([]);
    const [ingredientAlerts, setIngredientAlerts] = useState({});
    
    // Add state for search and filter functionality
    const [searchTerm, setSearchTerm] = useState('');
    const [allProducts, setAllProducts] = useState([]); // Store all products from View Products

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
        expireDate: '', // New field
        usedByDate: '', // New field
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

    // Fetch all products from View Products
    useEffect(() => {
        const fetchAllProducts = async () => {
            try {
                const response = await axios.get('/admin/products');
                setAllProducts(response.data);
            } catch (error) {
                console.error('Error fetching all products:', error);
            }
        };
        fetchAllProducts();
    }, []);

    // Filter processes based on search term
    const filteredProcesses = processes.filter(process => 
        process.sweetName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Function to add a new ingredient row
    const addIngredient = () => {
        setCurrentProcess(prev => ({
            ...prev,
            ingredients: [...prev.ingredients, { name: '', quantity: '', unit: '', price: '' }]
        }));
    };

    // Function to remove an ingredient row
    const removeIngredient = (index) => {
        if (currentProcess.ingredients.length > 1) {
            const newIngredients = [...currentProcess.ingredients];
            newIngredients.splice(index, 1);
            setCurrentProcess(prev => ({
                ...prev,
                ingredients: newIngredients
            }));
        }
    };

    // Function to update ingredient data
    const updateIngredient = (index, field, value) => {
        const newIngredients = [...currentProcess.ingredients];
        newIngredients[index] = { ...newIngredients[index], [field]: value };
        setCurrentProcess(prev => ({
            ...prev,
            ingredients: newIngredients
        }));
    };

    // Function to handle input changes for the main process fields
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentProcess(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Function to open the modal for adding a new process
    const openModal = () => {
        setCurrentProcess({
            _id: null,
            sweetName: '',
            ingredients: [{ name: '', quantity: '', unit: '', price: '' }],
            quantity: '',
            price: '',
            unit: '',
            expireDate: '',
            usedByDate: '',
        });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    // Function to open the modal for editing an existing process
    const editProcess = (process) => {
        setCurrentProcess({
            _id: process._id,
            sweetName: process.sweetName,
            ingredients: process.ingredients && process.ingredients.length > 0 
                ? [...process.ingredients] 
                : [{ name: '', quantity: '', unit: '', price: '' }],
            quantity: process.quantity?.toString() || '',
            price: process.price?.toString() || '',
            unit: process.unit || '',
            expireDate: process.expireDate ? new Date(process.expireDate).toISOString().split('T')[0] : '',
            usedByDate: process.usedByDate ? new Date(process.usedByDate).toISOString().split('T')[0] : '',
        });
        setIsEditing(true);
        setIsModalOpen(true);
    };

    // Function to delete a process
    const deleteProcess = async (id) => {
        if (!window.confirm('Are you sure you want to delete this manufacturing process?')) {
            return;
        }
        
        try {
            await axios.delete(`/admin/warehouse/manufacturing/${id}`);
            setMessage('Process deleted successfully');
            fetchProcesses();
        } catch (err) {
            console.error('Failed to delete the process:', err);
            setError(err.response?.data?.message || 'Failed to delete the process.');
        }
    };

    // Function to submit the form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormSubmitting(true);
        setError('');
        setMessage('');

        try {
            // Validate ingredients
            const hasEmptyIngredients = currentProcess.ingredients.some(ingredient => 
                !ingredient.name || !ingredient.quantity || !ingredient.unit || !ingredient.price
            );
            
            if (hasEmptyIngredients) {
                setError('Please fill in all ingredient fields (name, quantity, unit, price).');
                setFormSubmitting(false);
                return;
            }

            // Prepare the data
            const data = {
                sweetName: currentProcess.sweetName,
                ingredients: currentProcess.ingredients.map(ing => ({
                    name: ing.name,
                    quantity: parseFloat(ing.quantity),
                    unit: ing.unit,
                    price: parseFloat(ing.price)
                })),
                quantity: parseFloat(currentProcess.quantity),
                price: parseFloat(currentProcess.price),
                unit: currentProcess.unit,
                expireDate: currentProcess.expireDate || undefined,
                usedByDate: currentProcess.usedByDate || undefined
            };

            let response;
            if (isEditing) {
                response = await axios.put(`/admin/warehouse/manufacturing/${currentProcess._id}`, data);
                setMessage('Manufacturing process updated successfully');
            } else {
                response = await axios.post('/admin/warehouse/manufacturing', data);
                setMessage('Manufacturing process added successfully');
            }

            setIsModalOpen(false);
            fetchProcesses();
            setCurrentProcess({
                _id: null,
                sweetName: '',
                ingredients: [{ name: '', quantity: '', unit: '', price: '' }],
                quantity: '',
                price: '',
                unit: '',
                expireDate: '',
                usedByDate: '',
            });
        } catch (err) {
            console.error('Error saving the process:', err);
            setError(err.response?.data?.message || 'Failed to save the manufacturing process.');
        } finally {
            setFormSubmitting(false);
        }
    };

    const checkIngredientAvailability = (ingredientName, quantity, index) => {
        const storeItem = storeRoomItems.find(item => 
            item.name.toLowerCase() === ingredientName.toLowerCase()
        );
        
        if (storeItem) {
            const available = storeItem.quantity;
            const required = parseFloat(quantity) || 0;
            const isLow = available < required;
            
            setIngredientAlerts(prev => ({
                ...prev,
                [index]: {
                    available,
                    required,
                    isLow
                }
            }));
        } else {
            setIngredientAlerts(prev => ({
                ...prev,
                [index]: {
                    available: 0,
                    required: parseFloat(quantity) || 0,
                    isLow: true
                }
            }));
        }
    };

    // Update ingredient availability check when ingredients change
    useEffect(() => {
        currentProcess.ingredients.forEach((ingredient, index) => {
            if (ingredient.name && ingredient.quantity) {
                checkIngredientAvailability(ingredient.name, ingredient.quantity, index);
            }
        });
    }, [currentProcess.ingredients]);

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

            {/* Add search bar */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search manufacturing processes..."
                    className="w-full md:w-1/3 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {error && <MessageAlert message={error} type="error" />}
            {message && <MessageAlert message={message} type="success" />}

            <div className="overflow-x-auto mt-4">
                {filteredProcesses.length === 0 && !loading && !error ? (
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
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Expire Date</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Used By Date</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(filteredProcesses) && filteredProcesses.map((process) => (
                                <tr key={process._id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{process.sweetName}</td>
                                    <td className="py-3 px-4 text-sm text-gray-700">
                                        {process.ingredients && process.ingredients.length > 0 ? (
                                            <ul className="list-disc list-inside">
                                                {process.ingredients.map((ing, idx) => (
                                                    <li key={idx}>{ing.name}: {ing.quantity}{ing.unit}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="text-gray-500">No ingredients</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-700">{process.quantity} {process.unit}</td>
                                    <td className="py-3 px-4 text-sm text-gray-700">₹{process.price}</td>
                                    <td className="py-3 px-4 text-sm text-gray-700">{process.unit}</td>
                                    <td className="py-3 px-4 text-sm text-gray-700">{formatDate(process.expireDate)}</td>
                                    <td className="py-3 px-4 text-sm text-gray-700">{formatDate(process.usedByDate)}</td>
                                    <td className="py-3 px-4 text-sm text-gray-700">
                                        <button
                                            onClick={() => editProcess(process)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                            title="Edit Process"
                                        >
                                            <LuPencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => deleteProcess(process._id)}
                                            className="text-red-600 hover:text-red-900"
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

            {/* Modal for adding/editing manufacturing process */}
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
                                    list="productSuggestions"
                                    placeholder="Start typing to search existing products..."
                                />
                                {/* Datalist for product suggestions */}
                                <datalist id="productSuggestions">
                                    {allProducts.map((product, index) => (
                                        <option key={index} value={product.name} />
                                    ))}
                                </datalist>
                            </div>

                            <h3 className="text-lg font-semibold mb-3 mt-6 text-gray-800">Overall Product Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Overall Quantity</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={currentProcess.quantity}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-primary focus:border-primary"
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                    <input
                                        type="text"
                                        name="unit"
                                        value={currentProcess.unit}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-primary focus:border-primary"
                                        required
                                        placeholder="e.g., kg, pieces"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={currentProcess.price}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-primary focus:border-primary"
                                        required
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            {/* New Date Fields */}
                            <h3 className="text-lg font-semibold mb-3 mt-6 text-gray-800">Date Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Expire Date</label>
                                    <input
                                        type="date"
                                        name="expireDate"
                                        value={currentProcess.expireDate}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Used By Date</label>
                                    <input
                                        type="date"
                                        name="usedByDate"
                                        value={currentProcess.usedByDate}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold mb-3 mt-6 text-gray-800">Ingredients</h3>
                            {currentProcess.ingredients.map((ingredient, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 p-3 border rounded-md">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <input
                                            type="text"
                                            value={ingredient.name}
                                            onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring focus:ring-primary focus:border-primary"
                                            required
                                            list={`ingredientSuggestions${index}`}
                                            placeholder="e.g., sugar"
                                        />
                                        <datalist id={`ingredientSuggestions${index}`}>
                                            {storeRoomItems.map((item, idx) => (
                                                <option key={idx} value={item.name} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                        <input
                                            type="number"
                                            value={ingredient.quantity}
                                            onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring focus:ring-primary focus:border-primary"
                                            required
                                            min="0"
                                            step="0.01"
                                        />
                                        {ingredientAlerts[index] && (
                                            <div className={`text-xs mt-1 ${
                                                ingredientAlerts[index].isLow ? 'text-red-600' : 'text-green-600'
                                            }`}>
                                                {ingredientAlerts[index].isLow 
                                                    ? `Available: ${ingredientAlerts[index].available}` 
                                                    : `Available: ${ingredientAlerts[index].available}`
                                                }
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                        <input
                                            type="text"
                                            value={ingredient.unit}
                                            onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring focus:ring-primary focus:border-primary"
                                            required
                                            placeholder="e.g., kg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Price per Unit</label>
                                        <input
                                            type="number"
                                            value={ingredient.price}
                                            onChange={(e) => updateIngredient(index, 'price', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring focus:ring-primary focus:border-primary"
                                            required
                                            min="0"
                                            step="0.01"
                                        />
                                        {currentProcess.ingredients.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeIngredient(index)}
                                                className="mt-2 text-red-600 hover:text-red-800 text-sm"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addIngredient}
                                className="text-primary hover:text-primary-dark text-sm font-medium mb-4"
                            >
                                + Add Ingredient
                            </button>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400"
                                    disabled={formSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
                                    disabled={formSubmitting}
                                >
                                    {formSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Save')}
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