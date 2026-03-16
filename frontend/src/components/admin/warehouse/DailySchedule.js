import React, { useState, useEffect, useRef } from 'react';
import axios from '../../../api/axios';
import MessageAlert from '../../MessageAlert';
import html2pdf from 'html2pdf.js';

const DailySchedule = () => {
    const [date, setDate] = useState('');
    const [sweets, setSweets] = useState([{
        productName: '',
        category: '',
        isAssignWorkerEnabled: false,
        assignedWorkers: [],
        quantity: '',
        ingredients: [],
        ingredientsDisplay: '',
        price: '',
        unit: '',
        manufacturingProcess: null,
        description: '',
        isCollapsed: false,
        manuallyModified: {
            quantity: false,
            price: false,
            unit: false,
            ingredientsDisplay: false
        }
    }]);
    const [manufacturingProducts, setManufacturingProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [filteredSweetsForCategory, setFilteredSweetsForCategory] = useState({}); // To store filtered lists per row index

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
        const fetchInitialData = async () => {
            try {
                const [mfgResponse, catResponse, workerResponse] = await Promise.all([
                    axios.get('/admin/warehouse/manufacturing'),
                    axios.get('/admin/categories'),
                    axios.get('/admin/workers')
                ]);
                setManufacturingProducts(mfgResponse.data);
                setCategories(catResponse.data);
                setWorkers(Array.isArray(workerResponse.data) ? workerResponse.data : []);
            } catch (error) {
                console.error('Error fetching initial data:', error);
                setMessage('Failed to load initial data. Please ensure the backend is running.');
                setMessageType('error');
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const checkIngredientAvailability = async (ingredients) => {
        try {
            const response = await axios.get('/admin/warehouse/store-room');
            const storeRoomItems = response.data;

            const unavailableIngredients = [];
            const insufficientIngredients = [];
            const availableIngredients = [];

            (ingredients || []).forEach(ingredient => {
                const storeItem = storeRoomItems.find(item =>
                    (item?.name || '').toLowerCase() === (ingredient?.name || '').toLowerCase()
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

    const handleSelectSweetName = async (index, selectedProductName) => {
        const updatedSweets = [...sweets];
        updatedSweets[index].productName = selectedProductName;
        setOpenDropdownIndex(null);

        // Reset manual modification flags when selecting a new product
        updatedSweets[index].manuallyModified = {
            quantity: false,
            price: false,
            unit: false,
            ingredientsDisplay: false
        };

        const foundProduct = manufacturingProducts.find(
            (product) => (product?.productName || product?.sweetName || '').toLowerCase() === (selectedProductName || '').toLowerCase()
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
                    setMessage(`All ingredients available for "${foundProduct.productName || foundProduct.sweetName}".`);
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
            if (selectedProductName) {
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
                const recalculatedIngredients = (manufacturingProcess.ingredients || []).map(ing => {
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
                        setMessage(`All ingredients available for "${updatedSweets[index].productName || updatedSweets[index].sweetName}".`);
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

        // Track manual modifications for specific fields
        if (['quantity', 'price', 'unit', 'ingredientsDisplay'].includes(field)) {
            updatedSweets[index].manuallyModified = {
                ...updatedSweets[index].manuallyModified,
                [field]: true
            };
        }

        setSweets(updatedSweets);
    };

    // Helper function to parse ingredients from display text
    const parseIngredientsFromDisplay = (displayText) => {
        if (!displayText || displayText.trim() === '') {
            return [];
        }

        try {
            // Split by comma to get individual ingredients
            const ingredientStrings = displayText.split(',').map(str => str.trim());

            const ingredients = [];

            ingredientStrings.forEach(ingredientStr => {
                // Match pattern: "Name (QuantityUnit)" or "Name (Quantity Unit)"
                const match = ingredientStr.match(/^([^ (]+)\s*\(\s*([\d.]+)\s*([^)]*)\s*\)$/);

                if (match) {
                    const [, name, quantity, unit] = match;
                    ingredients.push({
                        name: name.trim(),
                        quantity: parseFloat(quantity),
                        unit: unit.trim()
                    });
                }
            });

            return ingredients;
        } catch (error) {
            console.error('Error parsing ingredients:', error);
            return [];
        }
    };

    const handleCategoryChange = (index, categoryId) => {
        const updatedSweets = [...sweets];
        updatedSweets[index].category = categoryId;
        updatedSweets[index].productName = ''; // Reset product name when category changes

        // Filter manufacturing products for this category
        const filtered = manufacturingProducts.filter(p =>
            p.category && (p.category._id === categoryId || p.category === categoryId)
        );

        setFilteredSweetsForCategory(prev => ({
            ...prev,
            [index]: filtered
        }));

        setSweets(updatedSweets);
    };

    const handleWorkerToggle = (index) => {
        const updatedSweets = [...sweets];
        updatedSweets[index].isAssignWorkerEnabled = !updatedSweets[index].isAssignWorkerEnabled;
        if (!updatedSweets[index].isAssignWorkerEnabled) {
            updatedSweets[index].assignedWorkers = [];
        }
        setSweets(updatedSweets);
    };

    const handleWorkerChange = (index, workerId) => {
        const updatedSweets = [...sweets];
        const currentWorkers = updatedSweets[index].assignedWorkers || [];

        if (currentWorkers.includes(workerId)) {
            updatedSweets[index].assignedWorkers = currentWorkers.filter(id => id !== workerId);
        } else {
            updatedSweets[index].assignedWorkers = [...currentWorkers, workerId];
        }

        setSweets(updatedSweets);
    };

    const addSweet = () => {
        // Auto-collapse the previous form if it has data
        if (sweets.length > 0 && (sweets[0].productName || sweets[0].sweetName) && sweets[0].quantity) {
            const updatedSweets = [...sweets];
            updatedSweets[0].isCollapsed = true;
            setSweets([{
                productName: '',
                category: '',
                isAssignWorkerEnabled: false,
                assignedWorkers: [],
                quantity: '',
                ingredients: [],
                ingredientsDisplay: '',
                price: '',
                unit: '',
                manufacturingProcess: null,
                description: '',
                isCollapsed: false,
                manuallyModified: {
                    quantity: false,
                    price: false,
                    unit: false,
                    ingredientsDisplay: false
                }
            }, ...updatedSweets]);
        } else {
            setSweets([{
                productName: '',
                category: '',
                isAssignWorkerEnabled: false,
                assignedWorkers: [],
                quantity: '',
                ingredients: [],
                ingredientsDisplay: '',
                price: '',
                unit: '',
                manufacturingProcess: null,
                description: '',
                isCollapsed: false,
                manuallyModified: {
                    quantity: false,
                    price: false,
                    unit: false,
                    ingredientsDisplay: false
                }
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
            margin: [0.3, 0.3, 0.3, 0.3], // top, left, bottom, right in inches
            filename: `Daily_Schedule_Multiple_Sweets_${date}.pdf`,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: {
                scale: 3,
                useCORS: true,
                letterRendering: true,
                logging: false,
                width: element.offsetWidth
            },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        html2pdf().from(element).set(opt).save();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);
        setMessageType(null);

        // Check if at least one sweet is selected
        const hasSelectedProduct = sweets.some(sweet => (sweet?.productName || sweet?.sweetName || '').trim() !== '');
        if (!hasSelectedProduct) {
            setMessage('Please select at least one product.');
            setMessageType('error');
            setSubmitting(false);
            return;
        }

        // Check if all selected sweets have available ingredients
        const hasIngredients = sweets.every(sweet =>
            (sweet?.productName || sweet?.sweetName || '').trim() === '' || (sweet?.ingredients || []).length > 0
        );
        if (!hasIngredients) {
            setMessage('Some sweets do not have available ingredients in store room.');
            setMessageType('error');
            setSubmitting(false);
            return;
        }

        try {
            // Create schedule for each sweet individually
            const selectedSweets = sweets.filter(sweet => (sweet?.productName || sweet?.sweetName || '').trim() !== '');
            const responses = [];

            for (const sweet of selectedSweets) {
                const response = await axios.post('/admin/warehouse/daily-schedules', {
                    productName: sweet.productName || sweet.sweetName,
                    quantity: sweet.quantity,
                    ingredients: sweet.ingredients,
                    price: sweet.price,
                    unit: sweet.unit,
                    date: (() => {
                        const [year, month, day] = date.split('-').map(Number);
                        const scheduleDate = new Date(year, month - 1, day);
                        const now = new Date();
                        // If it's today's date, use current time
                        if (scheduleDate.toDateString() === now.toDateString()) {
                            return now;
                        }
                        // Otherwise use local midnight
                        return scheduleDate;
                    })(),
                    description: sweet.description, // Include description in the request
                    category: sweet.category,
                    assignedWorkers: sweet.assignedWorkers
                });
                responses.push(response.data);
            }

            setMessage(`${selectedSweets.length} daily schedule(s) created successfully!`);
            setMessageType('success');
            setIsFormSubmitted(true);

            // Store the created schedule IDs in component state for later use
            const scheduleIds = responses.map(response => response.dailySchedule?._id || response._id);
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
                    productName: schedule.productName || schedule.sweetName,
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
                        productName: '',
                        quantity: '',
                        ingredients: [],
                        ingredientsDisplay: '',
                        price: '',
                        unit: '',
                        manufacturingProcess: null,
                        description: '',
                        category: '',
                        isAssignWorkerEnabled: false,
                        assignedWorkers: [],
                        isCollapsed: false,
                        manuallyModified: {
                            quantity: false,
                            price: false,
                            unit: false,
                            ingredientsDisplay: false
                        }
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
            <div id="daily-schedule-content" className="p-8 rounded-xl max-w-4xl mx-auto space-y-6 bg-white border border-gray-200 overflow-visible shadow-sm">
                <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">Daily Schedule</h2>
                <div className="space-y-2">
                    <p className="text-lg text-gray-700"><strong>Schedule Date:</strong> {date}</p>
                </div>
                <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-gray-800">Sweets to Prepare</h3>
                    {sweets.filter(sweet => (sweet?.productName || sweet?.sweetName || '').trim() !== '').map((sweet, index) => (
                        <div key={index} className="border-b border-gray-200 pb-4" style={{ pageBreakInside: 'avoid' }}>
                            <div className="space-y-2">
                                <p className="text-lg text-gray-700"><strong>Product Name:</strong> {sweet.productName || sweet.sweetName}</p>
                                {sweet.category && (
                                    <p className="text-lg text-gray-700">
                                        <strong>Category:</strong> {
                                            categories.find(c => c._id === sweet.category)?.name || sweet.category
                                        }
                                    </p>
                                )}
                                <p className="text-lg text-gray-700"><strong>Quantity:</strong> {sweet.quantity} {sweet.unit}</p>
                                <p className="text-lg text-gray-700"><strong>Price per Unit:</strong> {sweet.price}</p>
                                {sweet.assignedWorkers && sweet.assignedWorkers.length > 0 && (
                                    <p className="text-lg text-gray-700">
                                        <strong>Assigned workers :</strong> {
                                            sweet.assignedWorkers.map(id => {
                                                const worker = workers.find(w => w._id === id);
                                                return worker ? worker.name : id;
                                            }).join(', ')
                                        }
                                    </p>
                                )}
                                {sweet.description && (
                                    <p className="text-lg text-gray-700"><strong>Description:</strong> {sweet.description}</p>
                                )}
                            </div>
                            <div className="space-y-2 mt-3">
                                <p className="text-lg font-semibold text-gray-700">Ingredients Required:</p>
                                <ul className={`mt-2 ml-2 list-none grid ${sweet.ingredients.length > 10 ? 'grid-cols-2 gap-x-8' : 'grid-cols-1'} gap-y-1`}>
                                    {sweet.ingredients.length > 0 ? (
                                        sweet.ingredients.map((ing, ingIndex) => (
                                            <li key={ingIndex} className="text-gray-600 flex items-start text-base" style={{ pageBreakInside: 'avoid' }}>
                                                <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                                <span className="flex-1">{ing.name}: {ing.quantity}{ing.unit}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-gray-600 italic">No ingredients specified.</li>
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
                                    {(sweet.productName || sweet.sweetName) ? (
                                        <h4 className="text-lg font-semibold text-gray-800">
                                            {sweet.productName || sweet.sweetName} - {sweet.quantity} {sweet.unit}
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
                                    {(sweet.productName || sweet.sweetName) && sweet.quantity && (
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
                                        <path d="M6 9L12 15L18 9" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>

                            {/* Collapsible Content */}
                            {!sweet.isCollapsed && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <label className="block text-lg font-semibold text-gray-700 mb-2">
                                                Category
                                            </label>
                                            <select
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 transition duration-200 bg-white"
                                                value={sweet.category}
                                                onChange={(e) => handleCategoryChange(index, e.target.value)}
                                            >
                                                <option value="">Select a Category</option>
                                                {categories.map(cat => (
                                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-lg font-semibold text-gray-700 mb-2">
                                                Product Name
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
                                                    <span>{sweet.productName || sweet.sweetName || 'Select a product name'}</span>
                                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                                    </svg>
                                                </div>

                                                {openDropdownIndex === index && (
                                                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                                                        {(filteredSweetsForCategory[index] || manufacturingProducts).length > 0 ? (
                                                            (filteredSweetsForCategory[index] || manufacturingProducts).map((product) => (
                                                                <div
                                                                    key={product._id}
                                                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                                    onClick={() => handleSelectSweetName(index, product.productName || product.sweetName)}
                                                                >
                                                                    {product.productName || product.sweetName}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="px-4 py-2 text-gray-500">
                                                                No matching products found
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <label className="block text-lg font-semibold text-gray-700 mb-2">
                                                Quantity
                                            </label>
                                            <input
                                                type="text"
                                                className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 transition duration-200 ${sweet.manuallyModified.quantity ? 'bg-yellow-50 border-yellow-300' : ''}`}
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
                                                className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 transition duration-200 ${sweet.manuallyModified.unit ? 'bg-yellow-50 border-yellow-300' : ''}`}
                                                value={sweet.unit}
                                                onChange={(e) => handleSweetChange(index, 'unit', e.target.value)}
                                                placeholder="Auto-filled from Manufacturing (editable)"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <label className="block text-lg font-semibold text-gray-700 mb-2">
                                                Price per Unit
                                            </label>
                                            <input
                                                type="text"
                                                className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 transition duration-200 ${sweet.manuallyModified.price ? 'bg-yellow-50 border-yellow-300' : ''}`}
                                                value={sweet.price}
                                                onChange={(e) => handleSweetChange(index, 'price', e.target.value)}
                                                placeholder="Auto-filled from Manufacturing (editable)"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-lg font-semibold text-gray-700 mb-2">
                                                Ingredients Required
                                            </label>
                                            <textarea
                                                className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800 transition duration-200 ${sweet.manuallyModified.ingredientsDisplay ? 'bg-yellow-50 border-yellow-300' : ''}`}
                                                value={sweet.ingredientsDisplay}
                                                onChange={(e) => {
                                                    handleSweetChange(index, 'ingredientsDisplay', e.target.value);
                                                    // Also update the ingredients array based on the display text
                                                    const displayText = e.target.value;
                                                    const updatedIngredients = parseIngredientsFromDisplay(displayText);
                                                    const updatedSweets = [...sweets];
                                                    updatedSweets[index].ingredients = updatedIngredients;
                                                    setSweets(updatedSweets);
                                                }}
                                                placeholder="Auto-filled from Manufacturing (editable)\nFormat: Ingredient Name (QuantityUnit), e.g., Sugar (2kg), Milk (1L)"
                                                rows="3"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 border-t border-gray-100 pt-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <label className="text-lg font-semibold text-gray-700">
                                                Assign Workers for this Schedule
                                            </label>
                                            <div
                                                className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${sweet.isAssignWorkerEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                                onClick={() => handleWorkerToggle(index)}
                                            >
                                                <div
                                                    className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${sweet.isAssignWorkerEnabled ? 'translate-x-7' : 'translate-x-0'}`}
                                                ></div>
                                            </div>
                                        </div>

                                        {sweet.isAssignWorkerEnabled && (
                                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {workers.length > 0 ? (
                                                    workers.map(worker => (
                                                        <div
                                                            key={worker._id}
                                                            className={`flex items-center p-2 rounded-lg border cursor-pointer transition-all ${sweet.assignedWorkers?.includes(worker._id) ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-200'}`}
                                                            onClick={() => handleWorkerChange(index, worker._id)}
                                                        >
                                                            <div className={`w-4 h-4 rounded border mr-2 flex items-center justify-center ${sweet.assignedWorkers?.includes(worker._id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`}>
                                                                {sweet.assignedWorkers?.includes(worker._id) && (
                                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <span className="text-sm font-medium truncate">{worker.name}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="col-span-full text-center text-gray-500 py-2">No workers found</div>
                                                )}
                                            </div>
                                        )}
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
                    <>
                        <button
                            type="button"
                            onClick={handleCreatePDF}
                            className="w-full bg-green-700 text-white py-3 rounded-xl hover:bg-green-800 transition-all duration-300 ease-in-out font-bold text-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                            Create PDF & Deduct Ingredients
                        </button>

                        {/* Success Message at Bottom */}
                        {message && messageType === 'success' && (
                            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                                <p className="text-green-800 font-semibold text-center text-lg">
                                    ✓ {message}
                                </p>
                            </div>
                        )}
                    </>
                )}

                {message && (
                    <div className="mt-6">
                        <MessageAlert message={message} type={messageType} />
                    </div>
                )}
            </form>
        </div>
    );
};

export default DailySchedule;