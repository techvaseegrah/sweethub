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
    const [attendanceMarked, setAttendanceMarked] = useState(false); // Track if attendance has been marked
    const scanIntervalRef = useRef(null);

    // Check service status on component mount
    useEffect(() => {
        const checkServiceStatus = async () => {
            try {
                // Initialize face recognition service first
                console.log('Initializing face recognition service...');
                await faceRecognitionService.initialize();
                console.log('Face recognition service initialized successfully');
                
                // Force reload enrolled faces to ensure we have the latest data
                await faceRecognitionService._loadEnrolledFaces();
                
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
    
    // Listen for face enrollment updates
    useEffect(() => {
        const handleFaceEnrollmentUpdate = async () => {
            try {
                // Reload enrolled faces to ensure we have the latest data
                await faceRecognitionService._loadEnrolledFaces();
                
                // Update status to reflect that we have the latest data
                setStatus({ 
                    type: 'success', 
                    text: 'Face recognition service updated with latest enrollment data!' 
                });
                
                // Clear the success message after 3 seconds
                setTimeout(() => {
                    setStatus({ 
                        type: 'success', 
                        text: 'Face recognition service is ready!' 
                    });
                }, 3000);
            } catch (error) {
                console.error('Failed to update face recognition service:', error);
                setStatus({ 
                    type: 'error', 
                    text: 'Failed to update face recognition data. Please refresh the page.' 
                });
            }
        };
        
        const handleFaceEnrollmentCompleted = async (event) => {
            try {
                const { workerName, descriptorsCount } = event.detail;
                console.log(`Face enrollment completed for worker: ${workerName}, descriptors: ${descriptorsCount}`);
                
                // Reload enrolled faces to ensure we have the latest data
                await faceRecognitionService._loadEnrolledFaces();
                
                // Update status to reflect that we have the latest data
                setStatus({ 
                    type: 'success', 
                    text: `Face enrollment completed for ${workerName}! Ready for recognition.` 
                });
                
                // Clear the success message after 3 seconds
                setTimeout(() => {
                    setStatus({ 
                        type: 'success', 
                        text: 'Face recognition service is ready!' 
                    });
                }, 3000);
            } catch (error) {
                console.error('Failed to handle face enrollment completion:', error);
                setStatus({ 
                    type: 'error', 
                    text: 'Failed to update face recognition data. Please refresh the page.' 
                });
            }
        };
        
        window.addEventListener('faceEnrollmentUpdated', handleFaceEnrollmentUpdate);
        window.addEventListener('faceEnrollmentCompleted', handleFaceEnrollmentCompleted);
        
        return () => {
            window.removeEventListener('faceEnrollmentUpdated', handleFaceEnrollmentUpdate);
            window.removeEventListener('faceEnrollmentCompleted', handleFaceEnrollmentCompleted);
        };
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
            
            console.log('Attempting face recognition...');
            
            // Recognize face using React service
            const result = await faceRecognitionService.recognizeFace(img);
            
            console.log('Face recognition result:', result);
            
            if (result.success) {
                // Check if worker is in cooldown period (2 minutes)
                const now = Date.now();
                if (workerCooldowns[result.workerId] && workerCooldowns[result.workerId] > now) {
                    const remainingTime = Math.ceil((workerCooldowns[result.workerId] - now) / 1000);
                    setStatus({ 
                        type: 'error', 
                        text: `Please wait ${remainingTime} seconds before marking attendance again. Attendance must alternate between IN and OUT punches.` 
                    });
                    
                    // Reset processing state to allow retry
                    setTimeout(() => {
                        setIsProcessing(false);
                        setStatus({ type: 'info', text: 'Scanning for face...' });
                    }, 3000);
                    return;
                }
                
                // Send recognition result to backend
                const requestData = {
                    faceDescriptor: Array.from(result.descriptor || []),
                    workerId: result.workerId,
                    confidence: result.confidence
                };
                
                console.log('Sending recognition data to backend:', requestData);
                
                const response = await axios.post('/shop/attendance/recognize-face', requestData);
                
                console.log('Backend response:', response.data);
                
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
                setAttendanceMarked(true); // Mark that attendance has been recorded
                
                // Clear any existing scan intervals
                if (scanIntervalRef.current) {
                    clearInterval(scanIntervalRef.current);
                }
                
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
            
            // Implement exponential backoff for retries
            const newRetryCount = retryCount + 1;
            setRetryCount(newRetryCount);
            
            // Calculate delay with exponential backoff (2^retryCount * 1000ms, max 30s)
            const baseDelay = 3000; // 3 second base delay
            const backoffDelay = Math.min(baseDelay * Math.pow(2, Math.min(newRetryCount - 1, 4)), 30000);
            
            setTimeout(() => {
                setIsProcessing(false);
                if (status.type !== 'success') {
                   setStatus({ type: 'info', text: 'Scanning for face...' });
                }
            }, backoffDelay);
        }
    }, [isProcessing, isCameraReady, status.type, serviceStatus, retryCount, onAttendanceRecorded, workerCooldowns]);

    // This effect creates a loop to automatically scan for a face (only if enabled)
    useEffect(() => {
        // Clear any existing interval
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
        }
        
        if (isCameraReady && autoScanEnabled && !attendanceMarked) {
            // Immediately start scanning when camera is ready
            captureAndRecognize();
            
            // Set up interval for continuous scanning
            scanIntervalRef.current = setInterval(() => {
                captureAndRecognize();
            }, 2000); // Try to recognize a face every 2 seconds for more responsive detection
        }
        
        // Cleanup function to clear interval when component unmounts or dependencies change
        return () => {
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
            }
        };
    }, [isCameraReady, captureAndRecognize, autoScanEnabled, attendanceMarked]);
    
    // This helper function determines what UI to show
    const getStatusUI = () => {
        let icon = <LuLoaderCircle className="animate-spin text-4xl text-gray-500" />;
        let color = "border-gray-400";

        if (isCameraReady) {
            if (isProcessing) {
                icon = <LuLoaderCircle className="animate-spin text-4xl text-blue-500" />;
                color = "border-blue-500";
            } else if (status.type === 'success') {
                icon = <LuCircleCheck className="text-4xl text-green-500" />;
                color = "border-green-500";
            } else if (status.type === 'error') {
                icon = <LuTriangleAlert className="text-4xl text-red-500" />;
                color = "border-red-500";
            } else {
                icon = <LuCamera className="text-4xl text-gray-500" />;
                color = "border-gray-400";
            }
        }
        return { icon, color };
    };

    const uiStatus = getStatusUI();

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg max-w-2xl mx-auto">
            {/* Notification Popup */}
            {showNotification && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-2">
                    <div className="absolute inset-0 bg-black opacity-50"></div>
                    <div className="relative bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-2 shadow-xl">
                        <div className="text-center">
                            <LuCircleCheck className="text-3xl sm:text-4xl text-green-500 mx-auto mb-3 sm:mb-4" />
                            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-4">Attendance Recorded</h3>
                            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">{notificationMessage}</p>
                            <div className="bg-gray-100 rounded-lg p-3 sm:p-4 mb-4">
                                <p className="font-medium text-gray-800 text-sm">Worker:</p>
                                <p className="text-base sm:text-lg font-bold text-blue-600">{workerName}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">Automatic Face Attendance</h2>
            <p className="text-center text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                Position your face in the camera frame. The system will automatically mark your attendance.
            </p>

            <div className={`relative w-full aspect-square bg-gray-900 rounded-lg overflow-hidden border-4 ${uiStatus.color} transition-colors duration-500 mb-4 sm:mb-6`}>
                {!attendanceMarked ? (
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: 'user', width: 720, height: 720 }}
                        onUserMedia={() => {
                            setIsCameraReady(true);
                            setStatus({ type: 'info', text: 'Scanning for face...' });
                            // Immediately start scanning when camera is ready
                            if (autoScanEnabled) {
                                captureAndRecognize();
                            }
                        }}
                        className="absolute top-0 left-0 w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800">
                        <LuCircleCheck className="text-6xl text-green-500" />
                    </div>
                )}
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
                   <div className="w-3/4 h-3/4 border-4 border-dashed border-white rounded-full opacity-30" />
                </div>
            </div>

            <div className="text-center p-3 sm:p-4 rounded-lg bg-gray-50">
                {/* Service Status Indicator */}
                {serviceStatus && (
                    <div className={`mb-3 sm:mb-4 p-3 rounded-lg ${
                        serviceStatus.serviceReady 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                    }`}>
                        <div className="text-xs sm:text-sm font-medium">
                            {serviceStatus.serviceReady 
                                ? '✅ React Face Recognition: Ready (High Accuracy)' 
                                : '⚠️ Face Recognition Service: Unavailable'
                            }
                        </div>
                        {serviceStatus.currentMode && (
                            <div className="text-xs mt-1">
                                <strong>Mode:</strong> {serviceStatus.currentMode}
                            </div>
                        )}
                        {serviceStatus.features && serviceStatus.serviceReady && (
                            <div className="text-xs mt-1">
                                <strong>Features:</strong> Real-time detection, Neural networks, Browser-based
                            </div>
                        )}
                        {!serviceStatus.serviceReady && serviceStatus.alternatives && (
                            <div className="text-xs mt-1">
                                Available alternatives: {serviceStatus.alternatives.map(alt => alt.name).join(', ')}
                            </div>
                        )}
                    </div>
                )}
                
                {attendanceMarked ? (
                    <div className="flex flex-col items-center">
                        <p className="text-green-600 font-medium mb-2">Attendance marked successfully!</p>
                        <button 
                            onClick={() => {
                                setAttendanceMarked(false);
                                setIsCameraReady(false);
                                setStatus({ type: 'info', text: 'Restarting Camera...' });
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Mark Another Attendance
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-600 text-sm sm:text-base mb-2">
                            Position your face in the camera frame. The system will automatically mark your attendance.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <div className="flex items-center justify-center">
                                {uiStatus.icon}
                            </div>
                            <span className="text-sm sm:text-base font-medium text-gray-700">{status.text}</span>
                        </div>
                        
                        {/* Manual Controls - Removed Scan Face Now button */}
                        <div className="flex flex-col items-center gap-3">
                            {/* Removed Scan Face Now button */}
                            
                            <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={autoScanEnabled}
                                    onChange={(e) => setAutoScanEnabled(e.target.checked)}
                                    disabled={serviceStatus && !serviceStatus.serviceReady}
                                    className="w-4 h-4"
                                />
                                Enable auto-scan (every 2 seconds)
                            </label>
                            
                            {/* Alternative Options */}
                            {serviceStatus && !serviceStatus.serviceReady && (
                                <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg">
                                    <p className="text-xs sm:text-sm font-medium text-blue-800 mb-2 sm:mb-3">Face Recognition Setup Required:</p>
                                    
                                    {serviceStatus.setupInstructions && (
                                        <div className="text-xs text-blue-700 mb-2 sm:mb-3">
                                            <div className="mb-1 sm:mb-2">
                                                <strong>Missing:</strong> {serviceStatus.missingDependencies?.join(', ')}
                                            </div>
                                            <div className="space-y-1">
                                                <div>1. {serviceStatus.setupInstructions.step1}</div>
                                                <div>2. {serviceStatus.setupInstructions.step2}</div>
                                                <div>3. {serviceStatus.setupInstructions.step3}</div>
                                                {serviceStatus.setupInstructions.note && (
                                                    <div className="text-yellow-700 mt-1 sm:mt-2 text-xs">
                                                        ⚠️ {serviceStatus.setupInstructions.note}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="text-xs text-blue-600 border-t border-blue-200 pt-2">
                                        <strong>Alternative Methods (Available Now):</strong><br/>
                                        • Use RFID card scanner for quick check-in/out<br/>
                                        • Manual attendance tracking is available<br/>
                                        • Contact admin to configure face recognition
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FaceAttendance;