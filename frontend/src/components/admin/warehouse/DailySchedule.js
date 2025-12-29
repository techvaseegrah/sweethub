import React, { useState, useEffect, useRef } from 'react';
import axios from '../../../api/axios';
import MessageAlert from '../../MessageAlert';
import html2pdf from 'html2pdf.js';

const DailySchedule = () => {
    const [date, setDate] = useState('');
    const [sweets, setSweets] = useState([{ 
        sweetName: '', 
        quantity: '', 
        ingredients: [], 
        ingredientsDisplay: '', 
        price: '', 
        unit: '',
        manufacturingProcess: null,
        description: '',
        isCollapsed: false // Add collapsed state
    }]);
    const [manufacturingProducts, setManufacturingProducts] = useState([]);
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isFormSubmitted, setIsFormSubmitted] = useState(false);
    
    // State for the manufacturing process dropdowns
    const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
    const dropdownRefs = useRef([]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRefs.current) {
                const isClickInside = dropdownRefs.current.some(ref => 
                    ref && ref.contains(event.target)
                );
                if (!isClickInside) {
                    setOpenDropdownIndex(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const fetchManufacturingProducts = async () => {
            try {
                const response = await axios.get('/admin/warehouse/manufacturing');
                setManufacturingProducts(response.data);
            } catch (error) {
                console.error('Error fetching manufacturing products:', error);
                setMessage('Failed to load manufacturing products for auto-fill. Please ensure the backend is running and the Manufacturing processes are configured.');
                setMessageType('error');
            } finally {
                setLoading(false);
            }
        };
        fetchManufacturingProducts();
    }, []);

    const checkIngredientAvailability = async (ingredients) => {
        try {
            const response = await axios.get('/admin/warehouse/store-room');
            const storeRoomItems = response.data;
            
            const unavailableIngredients = [];
            const insufficientIngredients = [];
            const availableIngredients = [];
            
            ingredients.forEach(ingredient => {
                const storeItem = storeRoomItems.find(item => 
                    item.name.toLowerCase() === ingredient.name.toLowerCase()
                );
                
                if (!storeItem) {
                    unavailableIngredients.push(ingredient.name);
                } else if (storeItem.quantity < ingredient.quantity) {
                    insufficientIngredients.push({
                        name: ingredient.name,
                        required: ingredient.quantity,
                        available: storeItem.quantity
                    });
                } else {
                    availableIngredients.push(ingredient);
                }
            });
            
            return { unavailableIngredients, insufficientIngredients, availableIngredients };
        } catch (error) {
            console.error('Error checking ingredient availability:', error);
            throw new Error('Failed to check ingredient availability');
        }
    };

    const handleSelectSweetName = async (index, selectedSweetName) => {
        const updatedSweets = [...sweets];
        updatedSweets[index].sweetName = selectedSweetName;
        setOpenDropdownIndex(null);
        
        const foundProduct = manufacturingProducts.find(
            (product) => product.sweetName.toLowerCase() === selectedSweetName.toLowerCase()
        );
        
        if (foundProduct) {
            updatedSweets[index].quantity = foundProduct.quantity || '';
            updatedSweets[index].price = foundProduct.price || '';
            updatedSweets[index].unit = foundProduct.unit || '';
            updatedSweets[index].manufacturingProcess = foundProduct;
            
            try {
                const { unavailableIngredients, insufficientIngredients, availableIngredients } = 
                    await checkIngredientAvailability(foundProduct.ingredients || []);
                
                let alertMessages = [];
                
                if (unavailableIngredients.length > 0) {
                    alertMessages.push(`Unavailable ingredients: ${unavailableIngredients.join(', ')}`);
                }
                
                if (insufficientIngredients.length > 0) {
                    const insufficientDetails = insufficientIngredients.map(ing => 
                        `${ing.name} (need: ${ing.required}, available: ${ing.available})`
                    ).join(', ');
                    alertMessages.push(`Insufficient quantities: ${insufficientDetails}`);
                }
                
                if (alertMessages.length > 0) {
                    setMessage(`Alert: ${alertMessages.join(' | ')} | Proceeding with available ingredients only.`);
                    setMessageType('warning');
                } else {
                    setMessage(`All ingredients available for "${foundProduct.sweetName}".`);
                    setMessageType('success');
                }
                
                updatedSweets[index].ingredients = availableIngredients;
                
                if (availableIngredients.length > 0) {
                    const displayString = availableIngredients
                        .map(ing => `${ing.name} (${ing.quantity}${ing.unit})`)
                        .join(', ');
                    updatedSweets[index].ingredientsDisplay = displayString;
                } else {
                    updatedSweets[index].ingredientsDisplay = 'No ingredients available in store room.';
                }
                
            } catch (error) {
                setMessage('Failed to check ingredient availability.');
                setMessageType('error');
            }
        } else {
            updatedSweets[index].quantity = '';
            updatedSweets[index].ingredients = [];
            updatedSweets[index].ingredientsDisplay = '';
            updatedSweets[index].price = '';
            updatedSweets[index].unit = '';
            updatedSweets[index].manufacturingProcess = null;
            if (selectedSweetName) {
                setMessage('No matching manufacturing product found.');
                setMessageType('warning');
            } else {
                setMessage(null);
                setMessageType(null);
            }
        }
        
        setSweets(updatedSweets);
    };

    const handleQuantityChange = async (index, newQuantity) => {
        const updatedSweets = [...sweets];
        updatedSweets[index].quantity = newQuantity;
        
        // If we have a manufacturing process and a valid quantity, recalculate ingredients
        if (updatedSweets[index].manufacturingProcess && newQuantity && !isNaN(newQuantity)) {
            const manufacturingProcess = updatedSweets[index].manufacturingProcess;
            const manufacturingQuantity = parseFloat(manufacturingProcess.quantity);
            const newQty = parseFloat(newQuantity);
            
            if (manufacturingQuantity > 0) {
                // Calculate the ratio
                const ratio = newQty / manufacturingQuantity;
                
                // Recalculate ingredients based on the ratio
                const recalculatedIngredients = manufacturingProcess.ingredients.map(ing => {
                    const originalQty = parseFloat(ing.quantity);
                    const newIngredientQty = originalQty * ratio;
                    
                    // Round to appropriate decimal places
                    const roundedQty = Math.round(newIngredientQty * 1000) / 1000;
                    
                    return {
                        ...ing,
                        quantity: roundedQty
                    };
                });
                
                // Check availability for recalculated ingredients
                try {
                    const { unavailableIngredients, insufficientIngredients, availableIngredients } = 
                        await checkIngredientAvailability(recalculatedIngredients);
                    
                    let alertMessages = [];
                    
                    if (unavailableIngredients.length > 0) {
                        alertMessages.push(`Unavailable ingredients: ${unavailableIngredients.join(', ')}`);
                    }
                    
                    if (insufficientIngredients.length > 0) {
                        const insufficientDetails = insufficientIngredients.map(ing => 
                            `${ing.name} (need: ${ing.required}, available: ${ing.available})`
                        ).join(', ');
                        alertMessages.push(`Insufficient quantities: ${insufficientDetails}`);
                    }
                    
                    if (alertMessages.length > 0) {
                        setMessage(`Alert: ${alertMessages.join(' | ')} | Proceeding with available ingredients only.`);
                        setMessageType('warning');
                    } else {
                        setMessage(`All ingredients available for "${updatedSweets[index].sweetName}".`);
                        setMessageType('success');
                    }
                    
                    updatedSweets[index].ingredients = availableIngredients;
                    
                    if (availableIngredients.length > 0) {
                        const displayString = availableIngredients
                            .map(ing => `${ing.name} (${ing.quantity}${ing.unit})`)
                            .join(', ');
                        updatedSweets[index].ingredientsDisplay = displayString;
                    } else {
                        updatedSweets[index].ingredientsDisplay = 'No ingredients available in store room.';
                    }
                } catch (error) {
                    setMessage('Failed to check ingredient availability.');
                    setMessageType('error');
                }
            }
        }
        
        setSweets(updatedSweets);
    };

    const handleSweetChange = (index, field, value) => {
        const updatedSweets = [...sweets];
        updatedSweets[index][field] = value;
        setSweets(updatedSweets);
    };

    const addSweet = () => {
        // Auto-collapse the previous form if it has data
        if (sweets.length > 0 && sweets[0].sweetName && sweets[0].quantity) {
            const updatedSweets = [...sweets];
            updatedSweets[0].isCollapsed = true;
            setSweets([{ 
                sweetName: '', 
                quantity: '', 
                ingredients: [], 
                ingredientsDisplay: '', 
                price: '', 
                unit: '',
                manufacturingProcess: null,
                description: '',
                isCollapsed: false
            }, ...updatedSweets]);
        } else {
            setSweets([{ 
                sweetName: '', 
                quantity: '', 
                ingredients: [], 
                ingredientsDisplay: '', 
                price: '', 
                unit: '',
                manufacturingProcess: null,
                description: '',
                isCollapsed: false
            }, ...sweets]);
        }
    };

    const removeSweet = (index) => {
        if (sweets.length > 1) {
            const updatedSweets = sweets.filter((_, i) => i !== index);
            setSweets(updatedSweets);
        }
    };

    const generatePDF = () => {
        const element = document.getElementById('daily-schedule-content');
        const opt = {
            margin: 1,
            filename: `Daily_Schedule_Multiple_Sweets_${date}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().from(element).set(opt).save();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);
        setMessageType(null);

        // Check if at least one sweet is selected
        const hasSelectedSweet = sweets.some(sweet => sweet.sweetName.trim() !== '');
        if (!hasSelectedSweet) {
            setMessage('Please select at least one sweet.');
            setMessageType('error');
            setSubmitting(false);
            return;
        }

        // Check if all selected sweets have available ingredients
        const hasIngredients = sweets.every(sweet => 
            sweet.sweetName.trim() === '' || sweet.ingredients.length > 0
        );
        if (!hasIngredients) {
            setMessage('Some sweets do not have available ingredients in store room.');
            setMessageType('error');
            setSubmitting(false);
            return;
        }

        try {
            // Create schedule for each sweet individually
            const selectedSweets = sweets.filter(sweet => sweet.sweetName.trim() !== '');
            const responses = [];
            
            for (const sweet of selectedSweets) {
                const response = await axios.post('/admin/warehouse/daily-schedules', {
                    sweetName: sweet.sweetName,
                    quantity: sweet.quantity,
                    ingredients: sweet.ingredients,
                    price: sweet.price,
                    unit: sweet.unit,
                    date: date,
                    description: sweet.description // Include description in the request
                });
                responses.push(response.data);
            }
            
            setMessage(`${selectedSweets.length} daily schedule(s) created successfully!`);
            setMessageType('success');
            setIsFormSubmitted(true);

            // Store the created schedule IDs in component state for later use
            const scheduleIds = responses.map(response => response._id);
            window.createdScheduleIds = scheduleIds; // Store in window for access in handleCreatePDF

        } catch (error) {
            console.error('Error creating daily schedule:', error);
            setMessage(error.response?.data?.message || 'Failed to create daily schedule.');
            setMessageType('error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreatePDF = async () => {
        try {
            // Get the stored schedule IDs
            const scheduleIds = window.createdScheduleIds;
            
            if (!scheduleIds || scheduleIds.length === 0) {
                throw new Error('No daily schedules found to process');
            }
            
            // Fetch the specific schedules that were created
            for (const scheduleId of scheduleIds) {
                const scheduleResponse = await axios.get(`/admin/warehouse/daily-schedules/${scheduleId}`);
                const schedule = scheduleResponse.data;
                
                const outgoingMaterialsData = {
                    scheduleId: schedule._id, // Use the actual schedule ID
                    date: schedule.date,
                    sweetName: schedule.sweetName,
                    ingredients: schedule.ingredients.map(ingredient => ({
                        materialName: ingredient.name,
                        quantityUsed: ingredient.quantity,
                        unit: ingredient.unit,
                        pricePerUnit: ingredient.price || 0
                    }))
                };
                
                // Call the backend to create outgoing materials and deduct from store room
                await axios.post('/admin/warehouse/outgoing-materials', outgoingMaterialsData);
            }
            
            // Generate PDF
            setTimeout(() => {
                generatePDF();
                
                // Reset form
                setTimeout(() => {
                    setDate('');
                    setSweets([{ 
                        sweetName: '', 
                        quantity: '', 
                        ingredients: [], 
                        ingredientsDisplay: '', 
                        price: '', 
                        unit: '' 
                    }]);
                    setIsFormSubmitted(false);
                }, 1000);
            }, 500);
            
            setMessage('PDF generated and ingredients automatically deducted from store room!');
            setMessageType('success');
            
        } catch (error) {
            console.error('Error processing schedule:', error);
            setMessage(error.response?.data?.message || 'PDF generated but failed to deduct ingredients from store room.');
            setMessageType('warning');
            // Still generate PDF even if deduction fails
            setTimeout(() => {
                generatePDF();
            }, 500);
        }
    };

    const toggleSweetCollapse = (index) => {
        const updatedSweets = [...sweets];
        updatedSweets[index].isCollapsed = !updatedSweets[index].isCollapsed;
        setSweets(updatedSweets);
    };

    if (loading) {
      return (
        <div className="p-4 flex flex-col items-center justify-center">
          <div className="relative flex justify-center items-center mb-4">
            <div className="w-12 h-12 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
            <img 
              src="/sweethub-logo.png" 
              alt="Sweet Hub Logo" 
              className="absolute w-8 h-8"
            />
          </div>
          <div className="text-red-500 font-medium">Loading schedule data...</div>
        </div>
      );
    }

    return (
        <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
            <h1 className="text-4xl font-extrabold text-gray-800 mb-10 text-center">Create Daily Schedule</h1>

            {message && (
                <div className="mb-6">
                    <MessageAlert message={message} type={messageType} />
                </div>
            )}

            {/* Content to be converted to PDF */}
            <div id="daily-schedule-content" className="p-8 rounded-2xl shadow-xl max-w-2xl mx-auto space-y-6 bg-white border border-gray-200">
                <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">Daily Schedule</h2>
                <div className="space-y-2">
                    <p className="text-lg text-gray-700"><strong>Schedule Date:</strong> {date}</p>
                </div>
                <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-gray-800">Sweets to Prepare</h3>
                    {sweets.filter(sweet => sweet.sweetName.trim() !== '').map((sweet, index) => (
                        <div key={index} className="border-b border-gray-200 pb-4">
                            <div className="space-y-2">
                                <p className="text-lg text-gray-700"><strong>Sweet Name:</strong> {sweet.sweetName}</p>
                                <p className="text-lg text-gray-700"><strong>Quantity:</strong> {sweet.quantity} {sweet.unit}</p>
                                <p className="text-lg text-gray-700"><strong>Price per Unit:</strong> {sweet.price}</p>
                                {sweet.description && (
                                    <p className="text-lg text-gray-700"><strong>Description:</strong> {sweet.description}</p>
                                )}
                            </div>
                            <div className="space-y-2 mt-3">
                                <p className="text-lg font-semibold text-gray-700">Ingredients Required:</p>
                                <ul className="list-disc list-inside ml-4">
                                    {sweet.ingredients.length > 0 ? (
                                        sweet.ingredients.map((ing, ingIndex) => (
                                            <li key={ingIndex} className="text-gray-600">{ing.name}: {ing.quantity}{ing.unit}</li>
                                        ))
                                    ) : (
                                        <li className="text-gray-600">No ingredients specified.</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* The form for user input */}
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl mx-auto space-y-6 border border-gray-200 mt-6">
                <div>
                    <label htmlFor="date" className="block text-lg font-semibold text-gray-700 mb-2">
                        Schedule Date
                    </label>
                    <input
                        type="date"
                        id="date"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 transition duration-200"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-gray-800">Sweets to Prepare</h3>
                        <button
                            type="button"
                            onClick={addSweet}
                            className="bg-indigo-100 text-indigo-700 py-2 px-4 rounded-lg hover:bg-indigo-200 transition-all duration-200 ease-in-out font-medium"
                        >
                            + Add Sweet
                        </button>
                    </div>

                    {sweets.map((sweet, index) => (
                        <div key={index} className="border border-gray-200 rounded-xl p-6 relative">
                            {sweets.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeSweet(index)}
                                    className="absolute top-4 right-4 text-red-500 hover:text-red-700 font-bold"
                                    title="Remove this sweet"
                                >
                                    ×
                                </button>
                            )}
                            
                            {/* Collapsible Header */}
                            <div 
                                className="flex justify-between items-center cursor-pointer pb-2 border-b border-gray-100"
                                onClick={() => toggleSweetCollapse(index)}
                            >
                                <div>
                                    {sweet.sweetName ? (
                                        <h4 className="text-lg font-semibold text-gray-800">
                                            {sweet.sweetName} - {sweet.quantity} {sweet.unit}
                                        </h4>
                                    ) : (
                                        <h4 className="text-lg font-semibold text-gray-500">
                                            New Sweet Entry
                                        </h4>
                                    )}
                                    {sweet.description && (
                                        <p className="text-sm text-gray-600 mt-1 truncate max-w-md">
                                            {sweet.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center">
                                    {sweet.sweetName && sweet.quantity && (
                                        <span className="mr-2 text-sm text-gray-500">
                                            Click to {sweet.isCollapsed ? 'expand' : 'collapse'}
                                        </span>
                                    )}
                                    <svg 
                                        className={`transform transition-transform ${sweet.isCollapsed ? '' : 'rotate-180'}`}
                                        width="20" 
                                        height="20" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M6 9L12 15L18 9" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            </div>
                            
                            {/* Collapsible Content */}
                            {!sweet.isCollapsed && (
                                <>
                                    <div className="mt-4">
                                        <label className="block text-lg font-semibold text-gray-700 mb-2">
                                            Sweet Name
                                        </label>
                                        <div className="relative" ref={el => {
                                            if (el) {
                                                dropdownRefs.current[index] = el;
                                            }
                                        }}>
                                            <div 
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 transition duration-200 bg-white cursor-pointer flex justify-between items-center"
                                                onClick={() => setOpenDropdownIndex(openDropdownIndex === index ? null : index)}
                                            >
                                                <span>{sweet.sweetName || 'Select a sweet name'}</span>
                                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                                </svg>
                                            </div>
                                            
                                            {openDropdownIndex === index && (
                                                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                                                    {Array.isArray(manufacturingProducts) && manufacturingProducts.length > 0 ? (
                                                        manufacturingProducts.map((product) => (
                                                            <div 
                                                                key={product._id} 
                                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                                onClick={() => handleSelectSweetName(index, product.sweetName)}
                                                            >
                                                                {product.sweetName}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-2 text-gray-500">
                                                            No manufacturing products found
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <label className="block text-lg font-semibold text-gray-700 mb-2">
                                                Quantity
                                            </label>
                                            <input
                                                type="number"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 transition duration-200"
                                                placeholder="e.g., 100"
                                                value={sweet.quantity}
                                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                required
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-lg font-semibold text-gray-700 mb-2">
                                                Unit
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 transition duration-200"
                                                value={sweet.unit}
                                                readOnly
                                                placeholder="Auto-filled from Manufacturing"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <label className="block text-lg font-semibold text-gray-700 mb-2">
                                                Price per Unit
                                            </label>
                                            <input
                                                type="number"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 transition duration-200"
                                                value={sweet.price}
                                                readOnly
                                                placeholder="Auto-filled from Manufacturing"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-lg font-semibold text-gray-700 mb-2">
                                                Ingredients Required
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 transition duration-200"
                                                value={sweet.ingredientsDisplay}
                                                readOnly
                                                placeholder="Auto-filled from Manufacturing"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4">
                                        <label className="block text-lg font-semibold text-gray-700 mb-2">
                                            Description/Notes
                                        </label>
                                        <textarea
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 transition duration-200"
                                            placeholder="e.g., For order #123, Special Diwali package, etc."
                                            value={sweet.description}
                                            onChange={(e) => handleSweetChange(index, 'description', e.target.value)}
                                            rows="3"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {!isFormSubmitted ? (
                    <button
                        type="submit"
                        className="w-full bg-indigo-700 text-white py-3 rounded-xl hover:bg-indigo-800 transition-all duration-300 ease-in-out font-bold text-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        disabled={submitting}
                    >
                        {submitting ? 'Creating Schedule...' : 'Submit Daily Schedule'}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleCreatePDF}
                        className="w-full bg-green-700 text-white py-3 rounded-xl hover:bg-green-800 transition-all duration-300 ease-in-out font-bold text-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                        Create PDF & Deduct Ingredients
                    </button>
                )}
            </form>
        </div>
    );
};

export default DailySchedule;