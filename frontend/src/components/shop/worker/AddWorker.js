import React, { useState, useEffect, useRef } from 'react';
import axios from '../../../api/axios';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { LuUserPlus, LuCircleAlert, LuCamera, LuUpload, LuLoaderCircle, LuUserCheck, LuX } from 'react-icons/lu';
import faceRecognitionService from '../../../services/faceRecognitionService';

// Utility functions for time conversion
const formatTimeTo12Hour = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  let hoursInt = parseInt(hours, 10);
  const ampm = hoursInt >= 12 ? 'PM' : 'AM';
  hoursInt = hoursInt % 12 || 12;
  return `${hoursInt}:${minutes} ${ampm}`;
};

const formatTimeTo24Hour = (time12) => {
  if (!time12) return '09:00';
  const [time, modifier] = time12.split(' ');
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours, 10);
  
  if (modifier === 'PM' && hours !== 12) {
    hours += 12;
  }
  if (modifier === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

const AddWorker = () => {
    const navigate = useNavigate();
    const webcamRef = useRef(null);
    const [formData, setFormData] = useState({
        name: '',
        department: '',
        salary: '',
        selectedBatch: '',
    });
    const [departments, setDepartments] = useState([]);
    const [batches, setBatches] = useState([]);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [tempPassword, setTempPassword] = useState('');
    const [rfid, setRfid] = useState('');
    
    // RFID states
    const [createRFID, setCreateRFID] = useState(true);
    const [generatedRFID, setGeneratedRFID] = useState('');
    
    // Face Enrollment states
    const [isCapturing, setIsCapturing] = useState(false);
    const [faceImages, setFaceImages] = useState([]);
    const [faceEnrollmentStatus, setFaceEnrollmentStatus] = useState({ type: '', text: '' });
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [newlyCreatedWorkerId, setNewlyCreatedWorkerId] = useState(null);
    const [serviceStatus, setServiceStatus] = useState(null);
    const [workerAdded, setWorkerAdded] = useState(false);
    const [addedWorkerData, setAddedWorkerData] = useState(null);
    const [showSuccessNotification, setShowSuccessNotification] = useState(false);
    // Add new state for enabling/disabling face enrollment
    const [enableFaceEnrollment, setEnableFaceEnrollment] = useState(true);

    // Function to generate a random RFID in the frontend (for display purposes)
    const generateRandomRFID = () => {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const digits = '0123456789';
        
        let rfidLetters = '';
        let rfidDigits = '';
        
        // Generate 2 random letters
        for (let i = 0; i < 2; i++) {
            rfidLetters += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        
        // Generate 4 random digits
        for (let i = 0; i < 4; i++) {
            rfidDigits += digits.charAt(Math.floor(Math.random() * digits.length));
        }
        
        return rfidLetters + rfidDigits;
    };

    // Effect to generate RFID when component mounts or when createRFID is true
    useEffect(() => {
        if (createRFID) {
            const newRFID = generateRandomRFID();
            setGeneratedRFID(newRFID);
        } else {
            setGeneratedRFID('');
        }
    }, [createRFID]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch departments
                const departmentsResponse = await axios.get('/shop/departments', { withCredentials: true });
                setDepartments(departmentsResponse.data);
                
                // Fetch batches
                const batchesResponse = await axios.get('/shop/settings/batches');
                setBatches(batchesResponse.data);
                
                // Set the first department as default if available
                if (departmentsResponse.data.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        department: departmentsResponse.data[0]._id
                    }));
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
                setIsError(true);
                setMessage('Failed to load data. Please try again later.');
            }
        };
        
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setTempPassword('');
        setRfid('');
        setWorkerAdded(false);

        if (!formData.name.trim()) {
            setIsError(true);
            setMessage('Please enter a name for the worker.');
            return;
        }
        
        if (!formData.department) {
            setIsError(true);
            setMessage('Please select a department.');
            return;
        }

        // Prepare working hours and lunch break data
        // For now, we'll use default values or get them from the selected batch
        let workingHours = { from: '09:00', to: '18:00' };
        let lunchBreak = { from: '13:00', to: '14:00' };
        
        // If a batch is selected, get the working hours and lunch break from it
        if (formData.selectedBatch) {
            const selectedBatch = batches.find(batch => batch.id === formData.selectedBatch);
            if (selectedBatch) {
                workingHours = selectedBatch.workingHours || workingHours;
                lunchBreak = selectedBatch.lunchBreak || lunchBreak;
            }
        }

        const submitData = {
            ...formData,
            workingHours, // Include working hours
            lunchBreak,   // Include lunch break
            createRFID, // Include the createRFID flag
            ...(createRFID && { rfid: generatedRFID }), // Include the generated RFID in the payload
            batchId: formData.selectedBatch // Include batch ID
        };

        try {
            // Use the shop-specific endpoint to add a worker
            const response = await axios.post('/shop/workers', submitData);
            setMessage(response.data.message || 'Worker added successfully!');
            setIsError(false);
            setTempPassword(response.data.tempPassword || '');
            if (response.data.rfid) {
                setRfid(response.data.rfid);
            }
            
            // Store the newly created worker ID and data for face enrollment
            if (response.data.workerId) {
                setNewlyCreatedWorkerId(response.data.workerId);
                // Create worker data object to pass to ViewWorkers
                const workerData = {
                    _id: response.data.workerId,
                    name: formData.name,
                    department: departments.find(dept => dept._id === formData.department)?.name || '',
                    salary: formData.salary,
                    rfid: response.data.rfid || generatedRFID
                };
                
                setAddedWorkerData(workerData);
                
                // Show success notification
                setShowSuccessNotification(true);
                setTimeout(() => {
                    setShowSuccessNotification(false);
                }, 5000);
                
                // If face images are captured AND face enrollment is enabled, enroll the face automatically
                if (enableFaceEnrollment && faceImages.length > 0) {
                    await enrollFaceAutomatically(response.data.workerId);
                } else {
                    // If no face enrollment, navigate to ViewWorkers
                    setTimeout(() => {
                        navigate('/shop/workers/view');
                    }, 2000);
                }
            }
            
            setWorkerAdded(true);
            
        } catch (err) {
            setIsError(true);
            // Provide more specific error messages based on the error type
            if (err.response?.status === 400) {
                setMessage(err.response.data.message || 'Validation error. Please check your inputs.');
            } else if (err.response?.status === 500) {
                setMessage('Server error. Please try again later.');
            } else {
                setMessage(err.response?.data?.message || 'An error occurred while adding the worker.');
            }
            console.error('Error adding worker:', err);
        }
    };

    // New function to automatically enroll face after worker creation
    const enrollFaceAutomatically = async (workerId) => {
        if (!workerId || faceImages.length === 0) return;

        setIsEnrolling(true);
        setFaceEnrollmentStatus({ type: '', text: '' });

        try {
            // Initialize face recognition service
            await faceRecognitionService.initialize();

            // Process images to extract face descriptors
            const faceDescriptors = [];
            
            for (const imageData of faceImages) {
                try {
                    const img = await faceRecognitionService.loadImageFromDataURL(imageData.preview);
                    const detection = await faceRecognitionService.detectFaceFromImage(img);
                    
                    if (detection && detection.descriptor) {
                        faceDescriptors.push(Array.from(detection.descriptor));
                    }
                } catch (faceError) {
                    console.warn('Failed to detect face in one image:', faceError);
                }
            }

            if (faceDescriptors.length === 0) {
                setFaceEnrollmentStatus({ type: 'error', text: 'No faces detected in the captured images. Please try again.' });
                setIsEnrolling(false);
                return;
            }

            // Create FormData for backend storage
            const formData = new FormData();
            formData.append('workerId', workerId);
            formData.append('faceDescriptors', JSON.stringify(faceDescriptors));
            
            // Add image files for display purposes
            faceImages.forEach(image => {
                formData.append('faces', image.file);
            });

            // Send to backend
            const response = await axios.post('/shop/attendance/enroll-face', formData);
            
            setFaceEnrollmentStatus({ type: 'success', text: 'Face enrolled successfully!' });
            
            // Navigate to ViewWorkers page after successful face enrollment
            setTimeout(() => {
                navigate('/shop/workers/view');
            }, 2000);
            
        } catch (error) {
            console.error('Error enrolling face:', error);
            console.error('Error response:', error.response);
            const errorMsg = error.response?.data?.message || error.message || 'An error occurred during enrollment.';
            setFaceEnrollmentStatus({ type: 'error', text: errorMsg });
        } finally {
            setIsEnrolling(false);
            // Clear face images
            setFaceImages([]);
            setIsCapturing(false);
        }
    };

    const captureImage = () => {
        if (webcamRef.current && faceImages.length < 5) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                const byteString = atob(imageSrc.split(',')[1]);
                const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([ab], { type: mimeString });
                const file = new File([blob], `capture-${Date.now()}.jpeg`, { type: mimeString });

                setFaceImages(prev => [...prev, { file: file, preview: imageSrc }]);
            }
        }
    };

    const removeImage = (index) => {
        setFaceImages(prev => prev.filter((_, i) => i !== index));
    };

    // Style constants - Modified to remove hover effects
    const inputStyle = "w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400";
    const labelStyle = "block text-sm font-semibold text-gray-600 mb-1";
    const buttonStyle = "w-full bg-red-500 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-md"; // Removed hover and transform effects
    const selectStyle = "w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 appearance-none";
    // Small button styles without hover effects
    const smallButtonStyle = "inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"; // Removed hover and transform effects

    // Function to generate time options for select dropdowns
    const generateTimeOptions = () => {
        const options = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const hour12 = hour % 12 || 12;
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const time12 = `${hour12}:${minute === 0 ? '00' : minute} ${ampm}`;
                const time24 = `${hour.toString().padStart(2, '0')}:${minute === 0 ? '00' : minute}`;
                options.push({ value: time12, value24: time24 });
            }
        }
        return options;
    };

    return (
        <div className="container mx-auto p-6 bg-white rounded-2xl shadow-xl h-full max-h-[calc(100vh-2rem)] overflow-y-auto">
            {/* Success Notification */}
            {showSuccessNotification && addedWorkerData && (
                <div className="fixed top-4 right-4 bg-green-500 text-white py-3 px-6 rounded-lg shadow-lg z-50 animate-fade-in-down">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <LuUserCheck className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-white">Worker Added Successfully!</h3>
                            <div className="mt-2 text-sm text-white">
                                <p>Name: {addedWorkerData.name}</p>
                                <p>Department: {addedWorkerData.department}</p>
                                {enableFaceEnrollment && faceImages.length > 0 && <p>Face enrolled with {faceImages.length} images</p>}
                            </div>
                        </div>
                        <div className="ml-4 flex">
                            <button
                                type="button"
                                onClick={() => setShowSuccessNotification(false)}
                                className="inline-flex rounded-md bg-green-500 text-white hover:text-gray-200 focus:outline-none"
                            >
                                <LuX className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center mb-6 text-gray-800">
                <LuUserPlus className="text-3xl text-red-500" />
                <h1 className="text-3xl font-bold ml-3">Add New Worker</h1>
            </div>

            {message && (
                <div className={`flex items-center p-4 mb-4 rounded-lg ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`} role="alert">
                  <LuCircleAlert className="w-5 h-5 mr-3" />
                    <span className="font-medium">{message}</span>
                    {!isError && tempPassword && (
                        <span className="ml-2">Temporary Password: <strong>{tempPassword}</strong></span>
                    )}
                    {!isError && rfid && (
                        <span className="ml-2">RFID: <strong>{rfid}</strong></span>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                        <label htmlFor="name" className={labelStyle}>Full Name</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={inputStyle}
                            placeholder="e.g., John Doe"
                            required
                        />
                    </div>
                    {/* Department */}
                    <div>
                        <label htmlFor="department" className={labelStyle}>Department</label>
                        <select
                            name="department"
                            id="department"
                            value={formData.department}
                            onChange={handleChange}
                            className={selectStyle}
                            required
                        >
                            <option value="">Select Department</option>
                            {departments.map((dept) => (
                                <option key={dept._id} value={dept._id}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {/* Batch Selection */}
                    <div>
                        <label htmlFor="selectedBatch" className={labelStyle}>Batch (Optional)</label>
                        <select
                            name="selectedBatch"
                            id="selectedBatch"
                            value={formData.selectedBatch}
                            onChange={handleChange}
                            className={selectStyle}
                        >
                            <option value="">Select Batch</option>
                            {batches.map(batch => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
                        </select>
                        
                        {/* Display selected batch details */}
                        {formData.selectedBatch && (
                            <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                                <p className="font-medium">Batch Details:</p>
                                {(() => {
                                    const batch = batches.find(b => b.id === formData.selectedBatch);
                                    return batch ? (
                                        <div>
                                            <p>Working Hours: {batch.workingHours?.from ? formatTimeTo12Hour(batch.workingHours.from) : '--:--'} - {batch.workingHours?.to ? formatTimeTo12Hour(batch.workingHours.to) : '--:--'}</p>
                                            <p>Lunch Break: {batch.lunchBreak?.from ? formatTimeTo12Hour(batch.lunchBreak.from) : '--:--'} - {batch.lunchBreak?.to ? formatTimeTo12Hour(batch.lunchBreak.to) : '--:--'}</p>
                                        </div>
                                    ) : null;
                                })()}
                            </div>
                        )}
                    </div>
                    {/* Salary */}
                    <div>
                        <label htmlFor="salary" className={labelStyle}>Salary (per month)</label>
                        <input
                            type="text"
                            name="salary"
                            id="salary"
                            value={formData.salary}
                            onChange={handleChange}
                            className={inputStyle}
                            placeholder="Enter monthly salary amount"
                            required
                        />
                    </div>
                </div>
                
                {/* RFID Section */}
                <div className="border-t pt-6 mt-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">RFID Card</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-semibold text-gray-700">
                                Create RFID for this worker
                            </label>
                            <button
                                type="button"
                                onClick={() => setCreateRFID(!createRFID)}
                                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                                    createRFID ? 'bg-red-600' : 'bg-gray-200'
                                }`}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                                        createRFID ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                ></span>
                            </button>
                        </div>
                        
                        {createRFID && (
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">RFID</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-100"
                                    value={generatedRFID}
                                    readOnly
                                />
                                <p className="text-xs text-gray-500 mt-1">This RFID will be automatically assigned to the worker</p>
                            </div>
                        )}
                        
                        {!createRFID && (
                            <p className="text-sm text-gray-600">RFID creation is disabled. You can enable it using the toggle above.</p>
                        )}
                    </div>
                </div>
                
                {/* Face Enrollment Section */}
                <div className="border-t pt-6 mt-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Face Enrollment</h3>
                    
                    {/* Toggle for enabling/disabling face enrollment */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-semibold text-gray-700">
                                Enable Face Enrollment for this worker
                            </label>
                            <button
                                type="button"
                                onClick={() => setEnableFaceEnrollment(!enableFaceEnrollment)}
                                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                                    enableFaceEnrollment ? 'bg-red-600' : 'bg-gray-200'
                                }`}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                                        enableFaceEnrollment ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                ></span>
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {enableFaceEnrollment 
                                ? "Face enrollment is enabled. Capture images below to enroll worker's face." 
                                : "Face enrollment is disabled. Worker will be added without face enrollment."}
                        </p>
                    </div>
                    
                    {/* Face Enrollment Status Message */}
                    {faceEnrollmentStatus.text && (
                        <div className={`p-3 mb-4 rounded-lg ${
                            faceEnrollmentStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {faceEnrollmentStatus.text}
                        </div>
                    )}
                    
                    {/* Only show camera/capture options if face enrollment is enabled */}
                    {enableFaceEnrollment && (
                        <div className="grid grid-cols-1 gap-6">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                {isCapturing ? (
                                    <div>
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/jpeg"
                                            className="w-full max-w-xs mx-auto rounded-md"
                                            videoConstraints={{ width: 320, height: 240 }}
                                        />
                                        <button
                                            type="button"
                                            onClick={captureImage}
                                            disabled={isEnrolling || faceImages.length >= 5}
                                            className={`${smallButtonStyle} bg-red-600 text-white ${isEnrolling || faceImages.length >= 5 ? 'opacity-50' : 'hover:bg-red-700'}`}
                                        >
                                            <LuCamera className="mr-1" /> Capture Image
                                        </button>
                                        <p className="text-xs text-gray-500 mt-1">Captured: {faceImages.length}/5 images</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <LuCamera className="text-4xl text-gray-400 mb-2" />
                                        <button 
                                            type="button" 
                                            onClick={() => setIsCapturing(true)} 
                                            className={`${smallButtonStyle} text-red-600`}
                                        >
                                            Use Camera
                                        </button>
                                    </div>
                                )}
                                {isCapturing && (
                                    <button 
                                        type="button" 
                                        onClick={() => setIsCapturing(false)} 
                                        className={`${smallButtonStyle} text-gray-600 mt-2`}
                                    >
                                        Close Camera
                                    </button>
                                )}
                            </div>
                            
                            {faceImages.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-gray-700">Captured Images ({faceImages.length}/5)</h3>
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                        {faceImages.map((image, index) => (
                                            <div key={index} className="relative group">
                                                <img src={image.preview} alt={`Captured face ${index + 1}`} className="w-full h-20 object-cover rounded-md" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <LuX size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                <button 
                    type="submit" 
                    className={buttonStyle}
                    disabled={isEnrolling}
                >
                    {isEnrolling ? (
                        <>
                            <LuLoaderCircle className="animate-spin mr-2" />
                            Adding Worker...
                        </>
                    ) : (
                        'Add Worker'
                    )}
                </button>
            </form>
        </div>
    );
};

export default AddWorker;