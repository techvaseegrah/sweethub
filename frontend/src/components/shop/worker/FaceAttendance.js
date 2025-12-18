import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import axios from '../../../api/axios';
import { LuCamera, LuLoaderCircle, LuCircleCheck, LuTriangleAlert } from 'react-icons/lu';
import faceRecognitionService from '../../../services/faceRecognitionService';

const FaceAttendance = ({ onAttendanceRecorded }) => {
    const webcamRef = useRef(null);
    const [status, setStatus] = useState({ type: 'info', text: 'Initializing Camera...' });
    const [isProcessing, setIsProcessing] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [autoScanEnabled, setAutoScanEnabled] = useState(true); // Enabled by default
    const [serviceStatus, setServiceStatus] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [workerName, setWorkerName] = useState('');
    const [workerCooldowns, setWorkerCooldowns] = useState({}); // Track cooldowns for workers
    const scanIntervalRef = useRef(null);

    // Check service status on component mount
    useEffect(() => {
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
                
                if (!response.data.serviceReady) {
                    setStatus({ 
                        type: 'error', 
                        text: 'Face recognition service unavailable. Use RFID attendance instead.' 
                    });
                } else {
                    setStatus({ 
                        type: 'success', 
                        text: 'Face recognition service is ready!' 
                    });
                }
            } catch (error) {
                console.error('Failed to check service status:', error);
                setServiceStatus({ serviceReady: false });
                setStatus({ 
                    type: 'error', 
                    text: `Unable to initialize face recognition: ${error.message}` 
                });
            }
        };
        
        checkServiceStatus();
    }, []);

    // Clean up cooldowns periodically to prevent memory leaks
    useEffect(() => {
        const cleanupInterval = setInterval(() => {
            const now = Date.now();
            const updatedCooldowns = {};
            Object.keys(workerCooldowns).forEach(workerId => {
                // Keep cooldowns that haven't expired (2 minutes = 120000 ms)
                if (workerCooldowns[workerId] > now) {
                    updatedCooldowns[workerId] = workerCooldowns[workerId];
                }
            });
            setWorkerCooldowns(updatedCooldowns);
        }, 30000); // Clean up every 30 seconds

        return () => clearInterval(cleanupInterval);
    }, [workerCooldowns]);

    const captureAndRecognize = useCallback(async () => {
        // Stop if already processing, camera isn't ready, or a success message is already shown
        if (isProcessing || !webcamRef.current || !isCameraReady) {
            return;
        }

        // Check if service is available
        if (serviceStatus && !serviceStatus.serviceReady) {
            setStatus({ 
                type: 'error', 
                text: 'Face recognition service is not available. Please use RFID attendance.' 
            });
            return;
        }

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) {
            setStatus({ type: 'error', text: 'Failed to capture image. Please try again.' });
            setTimeout(() => {
                setIsProcessing(false);
                if (status.type !== 'success') {
                   setStatus({ type: 'info', text: 'Scanning for face...' });
                }
            }, 3000);
            return;
        }

        setIsProcessing(true);
        setStatus({ type: 'info', text: 'Detecting face...' });

        try {
            // Initialize face recognition service
            await faceRecognitionService.initialize();

            // Load image from data URL
            const img = await faceRecognitionService.loadImageFromDataURL(imageSrc);
            
            // Recognize face using React service
            const result = await faceRecognitionService.recognizeFace(img);
            
            if (result.success) {
                // Check if worker is in cooldown period
                const now = Date.now();
                if (workerCooldowns[result.workerId] && workerCooldowns[result.workerId] > now) {
                    const remainingTime = Math.ceil((workerCooldowns[result.workerId] - now) / 1000);
                    setStatus({ 
                        type: 'error', 
                        text: `Please wait ${remainingTime} seconds before marking attendance again.` 
                    });
                    
                    // Reset processing state to allow retry
                    setTimeout(() => {
                        setIsProcessing(false);
                        setStatus({ type: 'info', text: 'Scanning for face...' });
                    }, 3000);
                    return;
                }
                
                // Send recognition result to backend
                const response = await axios.post('/shop/attendance/recognize-face', {
                    faceDescriptor: Array.from(result.descriptor || []),
                    workerId: result.workerId,
                    confidence: result.confidence
                });
                
                setStatus({ type: 'success', text: response.data.message });
                setRetryCount(0); // Reset retry count on success
                
                // Set cooldown for this worker (2 minutes = 120000 ms)
                setWorkerCooldowns(prev => ({
                    ...prev,
                    [result.workerId]: now + 120000
                }));
                
                // Show notification popup
                setWorkerName(response.data.worker);
                setNotificationMessage(response.data.message);
                setShowNotification(true);
                
                // Hide notification after 2 seconds and then reset processing state
                setTimeout(() => {
                    setShowNotification(false);
                    // Reset processing state to start detecting the next face
                    setIsProcessing(false);
                    setStatus({ type: 'info', text: 'Scanning for next face...' });
                }, 2000);
                
                // Call the callback with the attendance record in the format expected by AttendanceTracking
                if (onAttendanceRecorded) {
                    onAttendanceRecorded({
                        workerName: response.data.worker,
                        rfid: 'FACE', // Indicate this was a face attendance
                        checkIn: response.data.attendance?.checkIn,
                        checkOut: response.data.attendance?.checkOut,
                        type: response.data.type,
                        attendance: response.data.attendance,
                        // Add flag to indicate if this was an automatic punch out for yesterday
                        isYesterdayPunchOut: response.data.message.includes("completed yesterday's session")
                    });
                }
            } else {
                setStatus({ type: 'error', text: 'Face not recognized. Please enroll first or try again.' });
                // Reset processing state to allow retry
                setTimeout(() => {
                    setIsProcessing(false);
                    if (status.type !== 'success') {
                       setStatus({ type: 'info', text: 'Scanning for face...' });
                    }
                }, 3000);
            }
            
        } catch (error) {
            console.error('Face recognition error:', error);
            let errorMsg = 'Face recognition failed.';
            
            if (error.message.includes('No face detected')) {
                errorMsg = 'No face detected. Please position your face clearly in the camera.';
            } else if (error.message.includes('not recognized')) {
                errorMsg = 'Face not recognized. Please enroll first or try again.';
            } else if (error.response?.status === 429 && error.response?.data?.message) {
                // Handle cooldown error from backend
                errorMsg = error.response.data.message;
            } else if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            }
            
            setStatus({ type: 'error', text: errorMsg });
            
            // Reset processing state to allow retry
            setTimeout(() => {
                setIsProcessing(false);
                if (status.type !== 'success') {
                   setStatus({ type: 'info', text: 'Scanning for face...' });
                }
            }, 3000);
        }
    }, [isProcessing, isCameraReady, serviceStatus, workerCooldowns, onAttendanceRecorded, status.type]);

    // Auto-scan functionality
    useEffect(() => {
        if (autoScanEnabled && isCameraReady && !isProcessing && status.type !== 'success') {
            scanIntervalRef.current = setInterval(() => {
                captureAndRecognize();
            }, 3000); // Scan every 3 seconds
        }
        
        return () => {
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
            }
        };
    }, [autoScanEnabled, isCameraReady, isProcessing, status.type, captureAndRecognize]);

    const handleUserCapture = () => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
        }
        captureAndRecognize();
    };

    const handleCameraError = () => {
        setStatus({ type: 'error', text: 'Camera access denied or not available.' });
        setIsCameraReady(false);
    };

    const handleCameraLoad = () => {
        setIsCameraReady(true);
        setStatus({ type: 'info', text: 'Scanning for face...' });
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Face Recognition Attendance</h3>
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600">Auto-scan</span>
                    <button
                        onClick={() => setAutoScanEnabled(!autoScanEnabled)}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                            autoScanEnabled ? 'bg-red-600' : 'bg-gray-200'
                        }`}
                    >
                        <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                                autoScanEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        ></span>
                    </button>
                </div>
            </div>

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

            {/* Status Message */}
            <div className={`p-3 mb-4 rounded-lg text-center ${
                status.type === 'success' ? 'bg-green-100 text-green-800' :
                status.type === 'error' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
            }`}>
                {status.text}
            </div>

            {/* Camera and Capture */}
            <div className="relative">
                <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full h-64 object-cover"
                        onUserMedia={handleCameraLoad}
                        onUserMediaError={handleCameraError}
                    />
                </div>
                
                {isProcessing && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <LuLoaderCircle className="animate-spin text-white text-4xl" />
                    </div>
                )}
            </div>

            {/* Manual Capture Button */}
            <div className="mt-4">
                <button
                    onClick={handleUserCapture}
                    disabled={isProcessing || !isCameraReady}
                    className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                    <LuCamera className="mr-2" />
                    Capture & Recognize Face
                </button>
            </div>

            {/* Notification Popup */}
            {showNotification && (
                <div className="fixed top-4 right-4 bg-green-500 text-white py-3 px-6 rounded-lg shadow-lg z-50 animate-fade-in-down">
                    <div className="flex items-center">
                        <LuCircleCheck className="mr-2 text-xl" />
                        <div>
                            <p className="font-medium">{workerName}</p>
                            <p className="text-sm">{notificationMessage}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Retry Logic */}
            {retryCount > 2 && (
                <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg">
                    <p className="text-sm">
                        Having trouble? Make sure your face is clearly visible and well-lit.
                        If problems persist, please use RFID attendance instead.
                    </p>
                </div>
            )}
        </div>
    );
};

export default FaceAttendance;