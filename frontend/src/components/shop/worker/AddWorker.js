import React, { useState, useEffect, useRef } from 'react';
import axios from '../../../api/axios';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { LuUserPlus, LuCircleAlert, LuCamera, LuUpload, LuLoaderCircle, LuUserCheck } from 'react-icons/lu';
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
        username: '',
        department: '',
        workingHoursFrom: '9:00 AM',
        workingHoursTo: '5:00 PM',
        lunchBreakFrom: '12:00 PM',
        lunchBreakTo: '1:00 PM',
        salary: '',
    });
    const [departments, setDepartments] = useState([]);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [tempPassword, setTempPassword] = useState('');
    const [rfid, setRfid] = useState(''); // Add RFID state
    
    // RFID states
    const [createRFID, setCreateRFID] = useState(true); // Default to true
    const [generatedRFID, setGeneratedRFID] = useState('');
    
    // Face Enrollment states
    const [isCapturing, setIsCapturing] = useState(false);
    const [faceImages, setFaceImages] = useState([]);
    const [faceEnrollmentStatus, setFaceEnrollmentStatus] = useState({ type: '', text: '' });
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [newlyCreatedWorkerId, setNewlyCreatedWorkerId] = useState(null);
    const [serviceStatus, setServiceStatus] = useState(null);

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
        const fetchDepartments = async () => {
            try {
                // Fetch departments available for the specific shop
                const response = await axios.get('/shop/departments');
                setDepartments(response.data);
                // Set the first department as default if available
                if (response.data.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        department: response.data[0]._id
                    }));
                }
            } catch (err) {
                console.error('Failed to fetch departments:', err);
                setIsError(true);
                setMessage('Failed to load departments. Please try again later.');
            }
        };
        fetchDepartments();
        
        // Check service status on component mount
        const checkServiceStatus = async () => {
            try {
                // Initialize face recognition service first
                console.log('Initializing face recognition service...');
                await faceRecognitionService.initialize();
                console.log('Face recognition service initialized successfully');
                
                // Check backend service status
                const response = await axios.get('/shop/attendance/face-status');
                console.log('Service status response:', response.data);
                setServiceStatus(response.data);
            } catch (error) {
                console.error('Failed to check service status:', error);
                setServiceStatus({ serviceReady: false });
            }
        };
        
        checkServiceStatus();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsError(false);
        setTempPassword('');
        setRfid('');

        if (!formData.department) {
            setIsError(true);
            setMessage('Please select a department.');
            return;
        }

        // Convert 12-hour format to 24-hour format for backend
        const workingHoursFrom24 = formatTimeTo24Hour(formData.workingHoursFrom);
        const workingHoursTo24 = formatTimeTo24Hour(formData.workingHoursTo);
        
        // Only include lunchBreak if both from and to times are set
        let lunchBreakData = undefined;
        if (formData.lunchBreakFrom && formData.lunchBreakTo) {
            const lunchBreakFrom24 = formatTimeTo24Hour(formData.lunchBreakFrom);
            const lunchBreakTo24 = formatTimeTo24Hour(formData.lunchBreakTo);
            lunchBreakData = { from: lunchBreakFrom24, to: lunchBreakTo24 };
        }

        const submitData = {
            ...formData,
            workingHours: { from: workingHoursFrom24, to: workingHoursTo24 },
            ...(lunchBreakData && { lunchBreak: lunchBreakData }),
            createRFID, // Include the createRFID flag
            ...(createRFID && { rfid: generatedRFID }) // Include the generated RFID in the payload
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
            
            // Store the newly created worker ID for face enrollment
            if (response.data.workerId) {
                setNewlyCreatedWorkerId(response.data.workerId);
            }
            
            // Reset form
            setFormData({
                name: '',
                username: '',
                department: '',
                workingHoursFrom: '9:00 AM',
                workingHoursTo: '5:00 PM',
                lunchBreakFrom: '12:00 PM',
                lunchBreakTo: '1:00 PM',
                salary: '',
            });
            
            // Reset RFID generation
            setCreateRFID(true); // Reset to default
            setGeneratedRFID('');
        } catch (err) {
            setIsError(true);
            setMessage(err.response?.data?.message || 'An error occurred while adding the worker.');
            console.error('Error adding worker:', err);
        }
    };
    
    const handleFileChange = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files).slice(0, 5 - faceImages.length);
            const newImages = filesArray.map(file => ({
                file: file,
                preview: URL.createObjectURL(file)
            }));
            setFaceImages(prev => [...prev, ...newImages]);
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
        } else {
            setFaceEnrollmentStatus({ type: 'error', text: 'You can only add up to 5 images.' });
        }
    };

    const removeImage = (index) => {
        setFaceImages(faceImages.filter((_, i) => i !== index));
    };

    const handleFaceEnrollment = async () => {
        if (!newlyCreatedWorkerId || faceImages.length === 0) {
            setFaceEnrollmentStatus({ type: 'error', text: 'Please select a worker and provide at least one image.' });
            return;
        }

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
                setFaceEnrollmentStatus({ type: 'error', text: 'No faces detected in the uploaded images. Please ensure faces are clearly visible.' });
                setIsEnrolling(false);
                return;
            }

            // Enroll in local service for instant recognition
            await faceRecognitionService.enrollFace(newlyCreatedWorkerId, faceDescriptors.map(desc => new Float32Array(desc)));

            // Create FormData for backend storage
            const formData = new FormData();
            formData.append('workerId', newlyCreatedWorkerId);
            
            // Convert Float32Array descriptors to regular arrays for JSON serialization
            const serializableDescriptors = faceDescriptors.map(desc => Array.from(desc));
            formData.append('faceDescriptors', JSON.stringify(serializableDescriptors));
            
            // Add image files for display purposes
            faceImages.forEach((image, index) => {
                formData.append('faces', image.file);
            });

            // Log the data being sent for debugging
            console.log('Sending face enrollment data:', {
                workerId: newlyCreatedWorkerId,
                faceDescriptorsCount: serializableDescriptors.length,
                faceImagesCount: faceImages.length,
                faceDescriptorsSample: serializableDescriptors.length > 0 ? serializableDescriptors[0] : null
            });

            // Log FormData contents
            console.log('FormData contents:');
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }

            // Send to backend
            const response = await axios.post('/shop/attendance/enroll-face', formData);
            
            console.log('Face enrollment response:', response.data);

            setFaceEnrollmentStatus({ type: 'success', text: 'Face enrolled successfully!' });
            
            // Clear face images
            setFaceImages([]);
            setIsCapturing(false);
            
        } catch (error) {
            console.error('Error enrolling face:', error);
            console.error('Error response:', error.response);
            const errorMsg = error.response?.data?.message || error.message || 'An error occurred during enrollment.';
            setFaceEnrollmentStatus({ type: 'error', text: errorMsg });
        } finally {
            setIsEnrolling(false);
        }
    };
    
    // Style constants
    const inputStyle = "w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 transition-shadow";
    const labelStyle = "block text-sm font-semibold text-gray-600 mb-1";
    const buttonStyle = "w-full bg-red-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-transform transform hover:scale-105 shadow-md";
    const selectStyle = "w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 transition-shadow appearance-none";

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
                    {/* Username */}
                    <div>
                        <label htmlFor="username" className={labelStyle}>Username</label>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            value={formData.username}
                            onChange={handleChange}
                            className={inputStyle}
                            placeholder="Create a unique username"
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
                    {/* Working Hours From */}
                    <div>
                        <label htmlFor="workingHoursFrom" className={labelStyle}>Working Hours (From)</label>
                        <select
                            name="workingHoursFrom"
                            id="workingHoursFrom"
                            value={formData.workingHoursFrom}
                            onChange={handleChange}
                            className={selectStyle}
                            required
                        >
                            {generateTimeOptions().map((option) => (
                                <option key={option.value24} value={option.value}>
                                    {option.value}
                                </option>
                            ))}
                        </select>
                    </div>
                    {/* Working Hours To */}
                    <div>
                        <label htmlFor="workingHoursTo" className={labelStyle}>Working Hours (To)</label>
                        <select
                            name="workingHoursTo"
                            id="workingHoursTo"
                            value={formData.workingHoursTo}
                            onChange={handleChange}
                            className={selectStyle}
                            required
                        >
                            {generateTimeOptions().map((option) => (
                                <option key={option.value24} value={option.value}>
                                    {option.value}
                                </option>
                            ))}
                        </select>
                    </div>
                    {/* Lunch Break From */}
                    <div>
                        <label htmlFor="lunchBreakFrom" className={labelStyle}>Lunch Break (From)</label>
                        <select
                            name="lunchBreakFrom"
                            id="lunchBreakFrom"
                            value={formData.lunchBreakFrom}
                            onChange={handleChange}
                            className={selectStyle}
                            required
                        >
                            {generateTimeOptions().map((option) => (
                                <option key={option.value24} value={option.value}>
                                    {option.value}
                                </option>
                            ))}
                        </select>
                    </div>
                    {/* Lunch Break To */}
                    <div>
                        <label htmlFor="lunchBreakTo" className={labelStyle}>Lunch Break (To)</label>
                        <select
                            name="lunchBreakTo"
                            id="lunchBreakTo"
                            value={formData.lunchBreakTo}
                            onChange={handleChange}
                            className={selectStyle}
                            required
                        >
                            {generateTimeOptions().map((option) => (
                                <option key={option.value24} value={option.value}>
                                    {option.value}
                                </option>
                            ))}
                        </select>
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
                    
                    {/* Service Status Indicator */}
                    {serviceStatus && (
                        <div className={`mb-4 p-3 rounded-lg ${
                            serviceStatus.serviceReady 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                        }`}>
                            <div className="text-sm font-medium">
                                {serviceStatus.serviceReady 
                                    ? '✅ React Face Recognition: Ready (High Accuracy)' 
                                    : '⚠️ Face Recognition Service: Unavailable'
                                }
                            </div>
                        </div>
                    )}
                    
                    {/* Face Enrollment Status Message */}
                    {faceEnrollmentStatus.text && (
                        <div className={`p-3 mb-4 rounded-lg ${
                            faceEnrollmentStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {faceEnrollmentStatus.text}
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            {isCapturing ? (
                                <div>
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        className="w-full rounded-md"
                                    />
                                    <button
                                        type="button"
                                        onClick={captureImage}
                                        disabled={isEnrolling || faceImages.length >= 5}
                                        className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                    >
                                        <LuCamera className="mr-2" /> Capture Image
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <LuUpload className="text-4xl text-gray-400 mb-2" />
                                    <label htmlFor="face-upload" className="cursor-pointer text-sm font-medium text-red-600 hover:text-red-500">
                                        Upload up to 5 images
                                    </label>
                                    <input id="face-upload" type="file" multiple accept="image/*" onChange={handleFileChange} className="sr-only" disabled={isEnrolling || faceImages.length >= 5} />
                                    <p className="text-xs text-gray-500 mt-1">or</p>
                                    <button type="button" onClick={() => setIsCapturing(true)} className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500">
                                        Use Camera
                                    </button>
                                </div>
                            )}
                            {isCapturing && (
                                <button type="button" onClick={() => setIsCapturing(false)} className="mt-2 text-sm text-gray-600 hover:text-gray-800">
                                    Close Camera
                                </button>
                            )}
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-700">Image Previews ({faceImages.length}/5)</h3>
                            {faceImages.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {faceImages.map((image, index) => (
                                        <div key={index} className="relative group">
                                            <img src={image.preview} alt={`preview ${index}`} className="w-full h-24 object-cover rounded-md" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                &#x2715;
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-24 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                    <p className="text-sm text-gray-500">No images selected</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={handleFaceEnrollment}
                            disabled={isEnrolling || !newlyCreatedWorkerId || faceImages.length === 0}
                            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300"
                        >
                            {isEnrolling ? (
                                <>
                                    <LuLoaderCircle className="animate-spin mr-2" /> Enrolling...
                                </>
                            ) : (
                                <>
                                    <LuUserCheck className="mr-2"/> Enroll Face
                                </>
                            )}
                        </button>
                    </div>
                </div>
                
                <button type="submit" className={buttonStyle}>
                    Add Worker
                </button>
            </form>
        </div>
    );
};

export default AddWorker;