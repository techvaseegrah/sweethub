import React, { useState, useEffect } from 'react';
import faceRecognitionService from '../../services/faceRecognitionService';
import axios from '../../api/axios';

function FaceServiceDiagnostic() {
    const [diagnostics, setDiagnostics] = useState({
        modelLoading: 'pending',
        serviceStatus: 'pending',
        modelsAccessible: 'pending',
        authentication: 'pending'
    });
    const [logs, setLogs] = useState([]);

    const addLog = (message) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
        console.log(message);
    };

    useEffect(() => {
        const runDiagnostics = async () => {
            addLog('Starting face recognition diagnostics...');
            
            // Test 1: Check if models are accessible
            try {
                const response = await fetch('/models/tiny_face_detector_model-weights_manifest.json');
                if (response.ok) {
                    setDiagnostics(prev => ({ ...prev, modelsAccessible: 'success' }));
                    addLog('✓ Models are accessible via HTTP');
                } else {
                    setDiagnostics(prev => ({ ...prev, modelsAccessible: 'error' }));
                    addLog('✗ Models are not accessible via HTTP');
                }
            } catch (error) {
                setDiagnostics(prev => ({ ...prev, modelsAccessible: 'error' }));
                addLog(`✗ Error accessing models: ${error.message}`);
            }

            // Test 2: Check authentication
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    setDiagnostics(prev => ({ ...prev, authentication: 'success' }));
                    addLog('✓ Authentication token found');
                } else {
                    setDiagnostics(prev => ({ ...prev, authentication: 'warning' }));
                    addLog('⚠ No authentication token found');
                }
            } catch (error) {
                setDiagnostics(prev => ({ ...prev, authentication: 'error' }));
                addLog(`✗ Authentication error: ${error.message}`);
            }

            // Test 3: Check backend service status
            try {
                const response = await axios.get('/admin/attendance/face-status');
                setDiagnostics(prev => ({ ...prev, serviceStatus: response.data.serviceReady ? 'success' : 'warning' }));
                addLog(`Backend service status: ${response.data.serviceReady ? 'Ready' : 'Not Ready'}`);
                addLog(`Current mode: ${response.data.currentMode}`);
            } catch (error) {
                setDiagnostics(prev => ({ ...prev, serviceStatus: 'error' }));
                addLog(`✗ Backend service error: ${error.message}`);
            }

            // Test 4: Initialize face recognition service
            try {
                addLog('Initializing face recognition service...');
                await faceRecognitionService.initialize();
                setDiagnostics(prev => ({ ...prev, modelLoading: 'success' }));
                addLog('✓ Face recognition service initialized successfully');
            } catch (error) {
                setDiagnostics(prev => ({ ...prev, modelLoading: 'error' }));
                addLog(`✗ Face recognition service initialization failed: ${error.message}`);
            }
        };

        runDiagnostics();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return 'text-green-600';
            case 'warning': return 'text-yellow-600';
            case 'error': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success': return '✓';
            case 'warning': return '⚠';
            case 'error': return '✗';
            default: return '⏳';
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Face Recognition Service Diagnostic</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Diagnostic Results</h2>
                    <div className="space-y-3">
                        <div className={`flex items-center ${getStatusColor(diagnostics.modelsAccessible)}`}>
                            <span className="mr-2">{getStatusIcon(diagnostics.modelsAccessible)}</span>
                            <span>Models Accessible</span>
                        </div>
                        <div className={`flex items-center ${getStatusColor(diagnostics.authentication)}`}>
                            <span className="mr-2">{getStatusIcon(diagnostics.authentication)}</span>
                            <span>Authentication</span>
                        </div>
                        <div className={`flex items-center ${getStatusColor(diagnostics.serviceStatus)}`}>
                            <span className="mr-2">{getStatusIcon(diagnostics.serviceStatus)}</span>
                            <span>Backend Service Status</span>
                        </div>
                        <div className={`flex items-center ${getStatusColor(diagnostics.modelLoading)}`}>
                            <span className="mr-2">{getStatusIcon(diagnostics.modelLoading)}</span>
                            <span>Model Loading</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                    <div className="space-y-2">
                        <button 
                            onClick={() => window.location.reload()} 
                            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Refresh Diagnostics
                        </button>
                        <button 
                            onClick={() => setLogs([])} 
                            className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            Clear Logs
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-4">Diagnostic Logs</h2>
                <div className="bg-gray-100 p-4 rounded max-h-60 overflow-y-auto">
                    {logs.length === 0 ? (
                        <p className="text-gray-500">No logs yet...</p>
                    ) : (
                        logs.map((log, index) => (
                            <div key={index} className="text-sm font-mono mb-1">
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default FaceServiceDiagnostic;