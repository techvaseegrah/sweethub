import * as faceapi from 'face-api.js';
import axios from '../api/axios';

class FaceRecognitionService {
    constructor() {
        this.isModelLoaded = false;
        this.enrolledFaces = new Map(); // Store face descriptors
        this.initPromise = null;
    }

    async initialize() {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this._initializeWithRetry();
        return this.initPromise;
    }

    async _initializeWithRetry(maxRetries = 3, baseDelay = 1000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Face recognition initialization attempt ${attempt}/${maxRetries}`);
                await this._loadModels();
                // Load enrolled faces from backend and localStorage
                await this._loadEnrolledFaces();
                return; // Success!
            } catch (error) {
                console.error(`Initialization attempt ${attempt} failed:`, error.message);
                
                if (attempt === maxRetries) {
                    throw error; // Final attempt failed
                }
                
                // Wait before retrying (exponential backoff)
                const delay = baseDelay * Math.pow(2, attempt - 1);
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    async _loadModels() {
        if (this.isModelLoaded) {
            console.log('Models already loaded, skipping...');
            return;
        }

        try {
            console.log('Loading face-api.js models...');
            
            // Skip the verification step that's causing issues and directly load models
            // Load face detection models with error handling
            console.log('Loading models sequentially to avoid conflicts...');
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            console.log('✓ TinyFaceDetector loaded');
            
            await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
            console.log('✓ FaceLandmark68Net loaded');
            
            await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
            console.log('✓ FaceRecognitionNet loaded');
            
            // Note: faceExpressionNet is optional and can be skipped if causing issues
            // await faceapi.nets.faceExpressionNet.loadFromUri('/models');
            // console.log('✓ FaceExpressionNet loaded');
            
            this.isModelLoaded = true;
            console.log('✅ All face-api.js models loaded successfully');
            
        } catch (error) {
            console.error('❌ Error loading face-api.js models:', error);
            
            // Fallback: Try loading only essential models
            try {
                console.log('Trying fallback: loading only essential models...');
                await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
                await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
                await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
                
                this.isModelLoaded = true;
                console.log('✅ Face-api.js essential models loaded successfully (fallback)');
            } catch (fallbackError) {
                console.error('❌ Failed to load models even with fallback:', fallbackError);
                throw new Error(`Failed to load face recognition models. Please check network connectivity and model files. Error: ${error.message}`);
            }
        }
    }

    async _loadEnrolledFaces() {
        try {
            // First load from localStorage (for immediate access)
            console.log('Loading from localStorage...');
            this._loadFromStorage();
            console.log('Current enrolled faces after localStorage load:', this.enrolledFaces.size);
            
            // Then fetch from backend to ensure we have the latest data
            console.log('Fetching enrolled faces from backend...');
            
            // Check if we're in shop context or admin context
            let workersEndpoint = '/admin/workers';
            
            try {
                // Try to get current user info to determine role
                const token = localStorage.getItem('token');
                if (token) {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    if (payload.role === 'shop') {
                        workersEndpoint = '/shop/workers';
                    }
                }
            } catch (e) {
                console.warn('Could not determine user role from token, checking current URL...');
                // Fallback: check current URL to determine context
                if (window.location.pathname.startsWith('/shop')) {
                    workersEndpoint = '/shop/workers';
                }
            }
            
            console.log('Using workers endpoint:', workersEndpoint);
            
            const response = await axios.get(workersEndpoint);
            const workers = response.data;
            
            console.log('Fetched workers from backend:', workers.length);
            
            // Clear existing enrolled faces to ensure we start fresh
            this.enrolledFaces.clear();
            
            // Add any enrolled workers from backend
            console.log('Processing workers for face enrollment:', workers.length);
            for (const worker of workers) {
                console.log(`Checking worker ${worker.name} (${worker._id}):`, {
                    hasFaceEncodings: !!worker.faceEncodings,
                    faceEncodingsLength: worker.faceEncodings ? worker.faceEncodings.length : 0,
                    faceEncodingsType: worker.faceEncodings ? typeof worker.faceEncodings : 'undefined'
                });
                
                if (worker.faceEncodings && worker.faceEncodings.length > 0) {
                    // Convert the encodings to Float32Array
                    const descriptors = worker.faceEncodings.map(encoding => new Float32Array(encoding));
                    
                    // Add to enrolled faces
                    this.enrolledFaces.set(worker._id, descriptors);
                    console.log(`Loaded face data for worker: ${worker.name}, encodings: ${descriptors.length}`);
                    
                    // Log detailed information about the loaded encodings
                    descriptors.forEach((descriptor, index) => {
                        console.log(`  Descriptor ${index}: length=${descriptor.length}, sample=${Array.from(descriptor.slice(0, 5))}`);
                    });
                } else {
                    console.log(`Worker ${worker.name} has no face encodings or empty face encodings`);
                }
            }
            
            // Save updated data to localStorage to ensure consistency
            this._saveToStorage();
            
            console.log('Successfully loaded enrolled faces. Total enrolled workers:', this.enrolledFaces.size);
            return this.enrolledFaces.size;
        } catch (error) {
            console.error('Error loading enrolled faces from backend:', error);
            console.error('Error stack:', error.stack);
            // Continue with localStorage data if backend fetch fails
            return this.enrolledFaces.size;
        }
    }
    async detectFaceFromImage(imageElement) {
        if (!this.isModelLoaded) {
            await this.initialize();
        }

        try {
            // Add a small delay to ensure models are fully loaded
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const detection = await faceapi
                .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            return detection;
        } catch (error) {
            console.error('Error detecting face:', error);
            return null;
        }
    }

    async enrollFaceFromImages(workerId, imageElements) {
        if (!this.isModelLoaded) {
            await this.initialize();
        }

        console.log('Enrolling face from images for worker:', workerId, 'Images:', imageElements.length);

        const descriptors = [];
        
        for (const imageElement of imageElements) {
            const detection = await this.detectFaceFromImage(imageElement);
            if (detection && detection.descriptor) {
                descriptors.push(detection.descriptor);
            }
        }

        if (descriptors.length === 0) {
            throw new Error('No faces detected in the provided images');
        }

        // Store the descriptors for this worker
        this.enrolledFaces.set(workerId, descriptors);
        
        // Also save to localStorage for persistence
        this._saveToStorage();
        
        console.log('Face enrolled successfully from images. Total enrolled workers:', this.enrolledFaces.size);
        
        return {
            success: true,
            descriptorsCount: descriptors.length,
            message: `Successfully enrolled ${descriptors.length} face descriptor(s) for worker`
        };
    }

    async enrollFace(workerId, descriptors) {
        if (!this.isModelLoaded) {
            await this.initialize();
        }

        console.log('Enrolling face for worker:', workerId, 'Descriptors:', descriptors.length);

        if (!descriptors || descriptors.length === 0) {
            throw new Error('No face descriptors provided for enrollment');
        }

        // Store the descriptors for this worker
        this.enrolledFaces.set(workerId, descriptors);
        
        // Also save to localStorage for persistence
        this._saveToStorage();
        
        console.log('Face enrolled successfully. Total enrolled workers:', this.enrolledFaces.size);
        
        return {
            success: true,
            descriptorsCount: descriptors.length,
            message: `Successfully enrolled ${descriptors.length} face descriptor(s) for worker`
        };
    }

    async recognizeFace(imageElement) {
        if (!this.isModelLoaded) {
            await this.initialize();
        }

        const detection = await this.detectFaceFromImage(imageElement);
        if (!detection || !detection.descriptor) {
            throw new Error('No face detected in the image');
        }

        let bestMatch = null;
        let bestDistance = Infinity;
        const threshold = 0.5; // Similarity threshold

        console.log('Comparing with enrolled faces. Total enrolled workers:', this.enrolledFaces.size);
        
        // Log all enrolled workers for debugging
        for (const [workerId] of this.enrolledFaces.entries()) {
            console.log('Enrolled worker ID:', workerId);
        }
        
        // Log the detection descriptor for debugging
        console.log('Detection descriptor length:', detection.descriptor.length);
        console.log('Sample detection data (first 5 values):', detection.descriptor.slice(0, 5));

        // Compare with all enrolled faces
        for (const [workerId, descriptors] of this.enrolledFaces.entries()) {
            console.log(`Checking worker ${workerId} with ${descriptors.length} descriptors`);
            for (let i = 0; i < descriptors.length; i++) {
                const enrolledDescriptor = descriptors[i];
                const distance = faceapi.euclideanDistance(detection.descriptor, enrolledDescriptor);
                
                console.log(`Comparing with worker ${workerId}, descriptor ${i}: distance=${distance}`);
                
                if (distance < threshold && distance < bestDistance) {
                    bestDistance = distance;
                    bestMatch = workerId;
                    console.log(`New best match: worker ${workerId}, distance=${distance}`);
                }
            }
        }
        
        console.log('Best match result:', { bestMatch, bestDistance, threshold });
        
        // If no match found, log additional debugging information
        if (!bestMatch) {
            console.log('No match found. Detailed comparison info:');
            console.log('Threshold:', threshold);
            console.log('Best distance found:', bestDistance);
            
            // Log all distances for debugging
            for (const [workerId, descriptors] of this.enrolledFaces.entries()) {
                console.log(`Worker ${workerId} distances:`);
                for (let i = 0; i < descriptors.length; i++) {
                    const enrolledDescriptor = descriptors[i];
                    const distance = faceapi.euclideanDistance(detection.descriptor, enrolledDescriptor);
                    console.log(`  Descriptor ${i}: ${distance}`);
                }
            }
        }

        if (bestMatch) {
            return {
                success: true,
                workerId: bestMatch,
                descriptor: detection.descriptor, // Include the descriptor for backend verification
                confidence: 1 - bestDistance, // Convert distance to confidence
                message: `Face recognized with ${Math.round((1 - bestDistance) * 100)}% confidence`
            };
        } else {
            throw new Error('Face not recognized. Please enroll first or try again.');
        }
    }

    async loadImageFromFile(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    async loadImageFromDataURL(dataURL) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = dataURL;
        });
    }

    _saveToStorage() {
        try {
            const data = {};
            for (const [workerId, descriptors] of this.enrolledFaces.entries()) {
                // Convert Float32Array to regular arrays for JSON serialization
                data[workerId] = descriptors.map(desc => Array.from(desc));
            }
            localStorage.setItem('enrolledFaces', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    _loadFromStorage() {
        try {
            const data = localStorage.getItem('enrolledFaces');
            if (data) {
                const parsed = JSON.parse(data);
                this.enrolledFaces.clear();
                
                for (const [workerId, descriptors] of Object.entries(parsed)) {
                    // Convert regular arrays back to Float32Array
                    const float32Descriptors = descriptors.map(desc => new Float32Array(desc));
                    this.enrolledFaces.set(workerId, float32Descriptors);
                }
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
    }

    getEnrolledWorkers() {
        return Array.from(this.enrolledFaces.keys());
    }

    removeWorker(workerId) {
        const removed = this.enrolledFaces.delete(workerId);
        if (removed) {
            this._saveToStorage();
        }
        return removed;
    }

    isReady() {
        return this.isModelLoaded;
    }

    // Add a new method to manually add enrolled faces
    addEnrolledFace(workerId, descriptors) {
        // Convert descriptors to Float32Array if needed
        const float32Descriptors = descriptors.map(desc => 
            desc instanceof Float32Array ? desc : new Float32Array(desc)
        );
        
        this.enrolledFaces.set(workerId, float32Descriptors);
        this._saveToStorage();
        console.log(`Added enrolled face for worker: ${workerId}`, {
            descriptorsCount: float32Descriptors.length,
            sampleDescriptor: float32Descriptors.length > 0 ? 
                Array.from(float32Descriptors[0].slice(0, 5)) : null
        });
    }
}

// Create singleton instance
const faceRecognitionService = new FaceRecognitionService();

// Load stored data on initialization
faceRecognitionService._loadFromStorage();

// Listen for face enrollment updates
window.addEventListener('faceEnrollmentUpdated', async (event) => {
  console.log('Face enrollment updated event received:', event.detail);
  // Reload enrolled faces to ensure consistency
  try {
    const enrolledCount = await faceRecognitionService._loadEnrolledFaces();
    console.log('Reloaded enrolled faces after update event. Total enrolled workers:', enrolledCount);
  } catch (error) {
    console.error('Error reloading enrolled faces after update event:', error);
  }
});
export default faceRecognitionService;