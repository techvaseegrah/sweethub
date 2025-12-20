import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from '../../../api/axios';
import Webcam from 'react-webcam';
import { LuCamera, LuUpload, LuUserPlus, LuArrowLeft, LuLoaderCircle, LuCircleCheck, LuTriangleAlert } from 'react-icons/lu';
import faceRecognitionService from '../../../services/faceRecognitionService';
import { useLocation } from 'react-router-dom';

const FaceEnrollment = () => {
    const location = useLocation();
    const [workers, setWorkers] = useState([]);
    const [selectedWorker, setSelectedWorker] = useState('');
    const [images, setImages] = useState([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [serviceStatus, setServiceStatus] = useState(null);
    const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);
    const [enrolledWorkerName, setEnrolledWorkerName] = useState('');
    const [attendanceStatus, setAttendanceStatus] = useState({ type: 'info', text: 'Ready to mark attendance...' });
    const [isProcessingAttendance, setIsProcessingAttendance] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [autoScanEnabled, setAutoScanEnabled] = useState(true);
    const webcamRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Initialize face recognition service first
                console.log('Initializing face recognition service...');
                await faceRecognitionService.initialize();
                console.log('Face recognition service initialized successfully');
                
                // Check service status
                const statusResponse = await axios.get('/shop/attendance/face-status');
                console.log('Service status response:', statusResponse.data);
                console.log('Service ready status:', statusResponse.data.serviceReady);
                setServiceStatus(statusResponse.data);
                
                if (!statusResponse.data.serviceReady) {
                    console.log('Service is NOT ready - showing error message');
                    setMessage({ 
                        type: 'error', 
                        text: 'Face recognition service is not available. Please use RFID attendance instead.' 
                    });
                } else {
                    console.log('Service IS ready - showing success message');
                    setMessage({ 
                        type: 'success', 
                        text: 'Face recognition service ready!' 
                    });
                }
                
                // Always fetch workers regardless of service status
                const response = await axios.get('/shop/workers');
                const unenrolled = response.data.filter(w => !w.faceImages || w.faceImages.length === 0);
                setWorkers(unenrolled);
                
                // Check if a workerId was passed in the URL query parameters
                const urlParams = new URLSearchParams(location.search);
                const workerIdFromUrl = urlParams.get('workerId');
                if (workerIdFromUrl) {
                    // Check if this worker is in our list of unenrolled workers
                    const worker = unenrolled.find(w => w._id === workerIdFromUrl);
                    if (worker) {
                        setSelectedWorker(workerIdFromUrl);
                        setMessage({ 
                            type: 'info', 
                            text: `Setting up face enrollment for ${worker.name}. Please upload or capture images.` 
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setMessage({ type: 'error', text: `Failed to initialize: ${error.message}` });
            }
        };
        fetchData();
    }, [location.search]);

    const handleFileChange = (e) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files).slice(0, 5 - images.length);
            const newImages = filesArray.map(file => ({
                file: file,
                preview: URL.createObjectURL(file)
            }));
            setImages(prev => [...prev, ...newImages]);
        }
    };

    const captureImage = () => {
        if (webcamRef.current && images.length < 5) {
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

                setImages(prev => [...prev, { file: file, preview: imageSrc }]);
            }
        } else {
            setMessage({ type: 'error', text: 'You can only add up to 5 images.' });
        }
    };

    const captureAndRecognize = useCallback(async () => {
        if (isProcessingAttendance || !webcamRef.current || !isCameraReady || attendanceStatus.type === 'success') {
            return;
        }

        if (serviceStatus && !serviceStatus.serviceReady) {
            setAttendanceStatus({ 
                type: 'error', 
                text: 'Face recognition service is not available.' 
            });
            return;
        }

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setIsProcessingAttendance(true);
        setAttendanceStatus({ type: 'info', text: 'Recognizing face...' });

        try {
            // Initialize face recognition service
            await faceRecognitionService.initialize();

            // Load image from data URL
            const img = await faceRecognitionService.loadImageFromDataURL(imageSrc);
            
            // Recognize face using React service
            const result = await faceRecognitionService.recognizeFace(img);
            
            if (result.success) {
                // Send recognition result to backend
                const response = await axios.post('/shop/attendance/recognize-face', {
                    faceDescriptor: Array.from(result.descriptor || []),
                    workerId: result.workerId,
                    confidence: result.confidence
                });
                
                setAttendanceStatus({ type: 'success', text: response.data.message });
                setAutoScanEnabled(false); // Stop auto-scanning after success
            } else {
                setAttendanceStatus({ type: 'error', text: 'Face not recognized. Please enroll first or try again.' });
            }
            
        } catch (error) {
            console.error('Face recognition error:', error);
            let errorMsg = 'Face recognition failed.';
            
            if (error.message.includes('No face detected')) {
                errorMsg = 'No face detected. Please position your face clearly in the camera.';
            } else if (error.message.includes('not recognized')) {
                errorMsg = 'Face not recognized. Please enroll first or try again.';
            } else if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            }
            
            setAttendanceStatus({ type: 'error', text: errorMsg });
            
            setTimeout(() => {
                setIsProcessingAttendance(false);
                if (attendanceStatus.type !== 'success') {
                   setAttendanceStatus({ type: 'info', text: 'Ready to scan again...' });
                }
            }, 3000);
        }
    }, [isProcessingAttendance, isCameraReady, attendanceStatus.type, serviceStatus]);

    // Auto-scan effect for attendance
    useEffect(() => {
        if (enrollmentSuccess && isCameraReady && attendanceStatus.type !== 'success' && autoScanEnabled) {
            const scanInterval = setInterval(() => {
                captureAndRecognize();
            }, 3000);

            return () => clearInterval(scanInterval);
        }
    }, [enrollmentSuccess, isCameraReady, attendanceStatus.type, captureAndRecognize, autoScanEnabled]);

    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!serviceStatus?.serviceReady) {
            setMessage({ type: 'error', text: 'Face recognition service is not available.' });
            return;
        }
        
        if (!selectedWorker || images.length === 0) {
            setMessage({ type: 'error', text: 'Please select a worker and provide at least one image.' });
            return;
        }

        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Initialize face recognition service
            await faceRecognitionService.initialize();

            // Process images to extract face descriptors
            const faceDescriptors = [];
            
            for (const imageData of images) {
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
                setMessage({ type: 'error', text: 'No faces detected in the uploaded images. Please ensure faces are clearly visible.' });
                setIsLoading(false);
                return;
            }

            // Enroll in local service for instant recognition
            await faceRecognitionService.enrollFace(selectedWorker, faceDescriptors.map(desc => new Float32Array(desc)));

            // Create FormData for backend storage
            const formData = new FormData();
            formData.append('workerId', selectedWorker);
            formData.append('faceDescriptors', JSON.stringify(faceDescriptors));
            
            console.log('Sending enrollment data:', {
                workerId: selectedWorker,
                faceDescriptorsCount: faceDescriptors.length,
                faceDescriptorsStringified: JSON.stringify(faceDescriptors),
                imageFilesCount: images.length
            });
            
            // Add image files
            images.forEach(image => {
                formData.append('faces', image.file);
            });

            // Send to backend
            await axios.post('/shop/attendance/enroll-face', formData);

            // Get enrolled worker name
            const enrolledWorker = workers.find(w => w._id === selectedWorker);
            setEnrolledWorkerName(enrolledWorker?.name || 'Worker');
            
            setMessage({ type: 'success', text: `${enrolledWorker?.name} enrolled successfully! Now mark attendance by looking at the camera.` });
            setEnrollmentSuccess(true);
            setIsCapturing(true);
            setAttendanceStatus({ type: 'info', text: 'Position your face in the camera to mark attendance...' });
            
            // Clear form
            setSelectedWorker('');
            setImages([]);
            
            // Update workers list
            const response = await axios.get('/shop/workers');
            const unenrolled = response.data.filter(w => !w.faceImages || w.faceImages.length === 0);
            setWorkers(unenrolled);
            
            // Notify that face attendance records should be updated
            window.dispatchEvent(new CustomEvent('faceEnrollmentUpdated', { 
              detail: { workerId: selectedWorker, timestamp: Date.now() } 
            }));
            
            // Also dispatch a custom event with more detailed information
            window.dispatchEvent(new CustomEvent('faceEnrollmentCompleted', { 
              detail: { 
                workerId: selectedWorker, 
                workerName: selectedWorker ? workers.find(w => w._id === selectedWorker)?.name : 'Unknown',
                descriptorsCount: faceDescriptors.length,
                timestamp: Date.now() 
              } 
            }));

        } catch (error) {
            console.error('Error enrolling face:', error);
            const errorMsg = error.response?.data?.message || error.message || 'An error occurred during enrollment.';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setIsLoading(false);
        }
    };

    const resetToEnrollment = () => {
        setEnrollmentSuccess(false);
        setEnrolledWorkerName('');
        setIsCapturing(false);
        setIsCameraReady(false);
        setAttendanceStatus({ type: 'info', text: 'Ready to mark attendance...' });
        setIsProcessingAttendance(false);
        setAutoScanEnabled(true);
        setMessage({ type: '', text: '' });
    };

    const getAttendanceStatusUI = () => {
        let icon = <LuLoaderCircle className="animate-spin text-4xl text-gray-500" />;
        let color = "border-gray-400";

        if (isCameraReady) {
            if (isProcessingAttendance) {
                icon = <LuLoaderCircle className="animate-spin text-4xl text-blue-500" />;
                color = "border-blue-500";
            } else if (attendanceStatus.type === 'success') {
                icon = <LuCircleCheck className="text-4xl text-green-500" />;
                color = "border-green-500";
            } else if (attendanceStatus.type === 'error') {
                icon = <LuTriangleAlert className="text-4xl text-red-500" />;
                color = "border-red-500";
            } else {
                icon = <LuCamera className="text-4xl text-gray-500" />;
                color = "border-gray-400";
            }
        }
        return { icon, color };
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
            {enrollmentSuccess ? (
                // Attendance Interface
                <>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Mark Attendance - {enrolledWorkerName}</h2>
                        <button
                            onClick={resetToEnrollment}
                            className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                        >
                            <LuArrowLeft className="mr-2" /> Back to Enrollment
                        </button>
                    </div>
                    
                    <p className="text-center text-gray-600 mb-6">
                        Enrollment successful! Now position your face in the camera frame to mark your attendance.
                    </p>

                    <div className={`relative w-full aspect-square bg-gray-900 rounded-lg overflow-hidden border-4 ${getAttendanceStatusUI().color} transition-colors duration-500 mb-6`}>
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ facingMode: 'user', width: 720, height: 720 }}
                            onUserMedia={() => {
                                setIsCameraReady(true);
                                setAttendanceStatus({ type: 'info', text: 'Ready to scan for attendance' });
                            }}
                            className="absolute top-0 left-0 w-full h-full object-cover"
                        />
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                           <div className="w-3/4 h-3/4 border-4 border-dashed border-white rounded-full opacity-30" />
                        </div>
                    </div>

                    <div className="text-center p-4 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            {getAttendanceStatusUI().icon}
                            <span className="text-lg font-medium text-gray-700">{attendanceStatus.text}</span>
                        </div>
                        
                        <button
                            onClick={captureAndRecognize}
                            disabled={isProcessingAttendance || !isCameraReady || attendanceStatus.type === 'success'}
                            className="w-full py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                        >
                            {isProcessingAttendance ? 'Processing...' : 'Mark Attendance Now'}
                        </button>
                        
                        <div className="mt-4 flex items-center justify-center space-x-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={autoScanEnabled}
                                    onChange={(e) => setAutoScanEnabled(e.target.checked)}
                                    className="mr-2"
                                    disabled={attendanceStatus.type === 'success'}
                                />
                                <span className="text-sm text-gray-600">Auto-scan enabled</span>
                            </label>
                        </div>
                    </div>
                </>
            ) : (
                // Enrollment Interface
                <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Face Enrollment</h2>
                    
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
                            {serviceStatus.currentMode && (
                                <div className="text-xs mt-1">
                                    <strong>Current Mode:</strong> {serviceStatus.currentMode}
                                </div>
                            )}
                            {serviceStatus.features && serviceStatus.serviceReady && (
                                <div className="text-xs mt-1 space-y-1">
                                    <div><strong>Features:</strong></div>
                                    <ul className="text-xs text-green-700 ml-4 space-y-1">
                                        <li>• Real-time face detection and recognition</li>
                                        <li>• High accuracy with neural networks</li>
                                        <li>• Works entirely in the browser</li>
                                        <li>• No server dependencies required</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {message.text && (
                        <div className={`p-4 mb-4 rounded-lg ${
                            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {message.text}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="worker" className="block text-sm font-medium text-gray-700 mb-1">Select Worker</label>
                            <select
                                id="worker"
                                value={selectedWorker}
                                onChange={(e) => setSelectedWorker(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                                disabled={isLoading}
                            >
                                <option value="">-- Select a Worker --</option>
                                {workers.map(worker => (
                                    <option key={worker._id} value={worker._id}>{worker.name} ({worker.username})</option>
                                ))}
                            </select>
                        </div>
                        
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
                                            disabled={isLoading || images.length >= 5}
                                            className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                        >
                                            <LuCamera className="mr-2" /> Capture Image
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <LuUpload className="text-4xl text-gray-400 mb-2" />
                                        <label htmlFor="file-upload" className="cursor-pointer text-sm font-medium text-red-600 hover:text-red-500">
                                            Upload up to 5 images
                                        </label>
                                        <input id="file-upload" type="file" multiple accept="image/*" onChange={handleFileChange} className="sr-only" disabled={isLoading || images.length >= 5} />
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
                                <h3 className="text-sm font-medium text-gray-700">Image Previews ({images.length}/5)</h3>
                                {images.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {images.map((image, index) => (
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
                                    <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-500">No images selected</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading || !selectedWorker || images.length === 0 || !serviceStatus?.serviceReady}
                                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Enrolling...
                                    </>
                                ) : (
                                   <>
                                       <LuUserPlus className="mr-2"/> Enroll Worker
                                   </>
                                )}
                            </button>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
};

export default FaceEnrollment;