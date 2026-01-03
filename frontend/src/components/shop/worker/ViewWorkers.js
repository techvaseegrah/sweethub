import React, { useState, useEffect, useRef } from 'react';
import axios from '../../../api/axios';
import CustomModal from '../../../components/CustomModal'; // Import CustomModal
import Webcam from 'react-webcam'; // Import Webcam for face enrollment
import { LuCamera, LuUpload, LuUserPlus, LuCheck, LuX } from 'react-icons/lu'; // Import icons
import { useNavigate, useLocation } from 'react-router-dom'; // Import useNavigate and useLocation for navigation and route change detection
import faceRecognitionService from '../../../services/faceRecognitionService';

// Utility function to format time in 12-hour format with AM/PM
const formatTimeTo12Hour = (time24) => {
  if (!time24) return 'Not set';
  const [hours, minutes] = time24.split(':');
  let hoursInt = parseInt(hours, 10);
  const ampm = hoursInt >= 12 ? 'PM' : 'AM';
  hoursInt = hoursInt % 12 || 12;
  return `${hoursInt}:${minutes} ${ampm}`;
};

const WORKER_URL = '/shop/workers';

const ViewWorkers = () => {
  const location = useLocation(); // Initialize location hook for route change detection
  const navigate = useNavigate(); // Initialize navigate hook
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const webcamRef = useRef(null);

  // State for modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [editedWorkerData, setEditedWorkerData] = useState({});
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);

  // State for face enrollment
  const [isFaceEnrollmentOpen, setIsFaceEnrollmentOpen] = useState(false);
  const [faceEnrollmentWorker, setFaceEnrollmentWorker] = useState(null);
  const [images, setImages] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // State for delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState(null);

  // Create a function to fetch data that can be called externally
  const fetchData = async () => {
      try {
          const [workersResponse, departmentsResponse, batchesResponse] = await Promise.all([
              axios.get(WORKER_URL, { withCredentials: true }),
              axios.get('/shop/departments', { withCredentials: true }),
              axios.get('/shop/settings/batches')
          ]);
          setWorkers(workersResponse.data);
          setDepartments(departmentsResponse.data);
          setBatches(batchesResponse.data);
      } catch (err) {
          setError('Failed to fetch data.');
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    fetchData();
  }, [location.key]); // Add location.key as dependency to refresh when route changes

  // Filter workers based on search term
  const filteredWorkers = workers.filter(worker =>
    (worker.name && worker.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (worker.department?.name && worker.department.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Open edit modal
  const handleEdit = (worker) => {
    setEditingWorker(worker);
    setEditedWorkerData({ 
      ...worker, 
      department: worker.department?._id || worker.department || '',
      selectedBatch: worker.batchId || ''
    });
    setIsEditModalOpen(true);
  };

  // Close edit modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingWorker(null);
    setEditedWorkerData({});
  };

  // Handle input changes in the edit form
  const handleInputChange = (e, field) => {
    const { value } = e.target;
    
    // Handle nested properties like workingHours.from
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setEditedWorkerData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else if (field === 'selectedBatch') {
      // When batch is changed, update working hours and lunch break from the selected batch
      setEditedWorkerData(prev => {
        const selectedBatch = batches.find(batch => batch.id === value);
        if (selectedBatch) {
          return {
            ...prev,
            selectedBatch: value,
            workingHours: selectedBatch.workingHours || null,
            lunchBreak: selectedBatch.lunchBreak || null,
            breakTime: selectedBatch.breakTime || null
          };
        } else {
          return {
            ...prev,
            selectedBatch: value,
            workingHours: null,
            lunchBreak: null,
            breakTime: null
          };
        }
      });
    } else {
      setEditedWorkerData({ ...editedWorkerData, [field]: value });
    }
  };

  // Handle department change
  const handleDepartmentChange = (e) => {
    setEditedWorkerData({ ...editedWorkerData, department: e.target.value });
  };

  // Update worker
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
        // Preserve face enrollment data during worker update
        const updateData = { ...editedWorkerData };
        
        // Map selectedBatch to batchId for backend
        if (editedWorkerData.selectedBatch !== undefined) {
          updateData.batchId = editedWorkerData.selectedBatch || null;
        }
        
        // If the worker already has face data, preserve it during the update
        if (editingWorker && editingWorker.faceEncodings) {
          updateData.faceEncodings = editingWorker.faceEncodings;
        }
        if (editingWorker && editingWorker.faceImages) {
          updateData.faceImages = editingWorker.faceImages;
        }
        
        const response = await axios.put(`${WORKER_URL}/${editingWorker._id}`, updateData, { withCredentials: true });
        setWorkers(workers.map(w => w._id === editingWorker._id ? response.data.worker : w));
        handleCloseEditModal();
    } catch (err) {
        setError('Failed to update worker.');
        console.error(err);
    }
  };

  // Open face enrollment modal
  const handleOpenFaceEnrollment = (worker) => {
    setFaceEnrollmentWorker(worker);
    setImages([]);
    setIsCapturing(true); // Automatically open camera
    setMessage({ type: '', text: '' });
    setIsFaceEnrollmentOpen(true);
  };

  // Close face enrollment modal
  const handleCloseFaceEnrollment = () => {
    setIsFaceEnrollmentOpen(false);
    setFaceEnrollmentWorker(null);
    setImages([]);
    setIsCapturing(false);
    setMessage({ type: '', text: '' });
  };

  // Capture image from webcam
  const captureImage = () => {
    if (images.length < 5) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        // Convert data URL to File object
        const arr = imageSrc.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const file = new File([blob], `capture-${Date.now()}.jpeg`, { type: mime });

        setImages(prev => [...prev, { file: file, preview: imageSrc }]);
      }
    } else {
      setMessage({ type: 'error', text: 'You can only add up to 5 images.' });
    }
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [];

    if (images.length + files.length <= 5) {
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          newImages.push({ file, preview: e.target.result });
          if (newImages.length === files.length) {
            setImages(prev => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    } else {
      setMessage({ type: 'error', text: 'You can only add up to 5 images.' });
    }
  };

  // Remove image from face enrollment
  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Submit face enrollment
  const handleSubmitFaceEnrollment = async (e) => {
    e.preventDefault();
    
    if (!faceEnrollmentWorker || images.length === 0) {
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
      await faceRecognitionService.enrollFace(faceEnrollmentWorker._id, faceDescriptors.map(desc => new Float32Array(desc)));

      // Create FormData for backend storage
      const formData = new FormData();
      formData.append('workerId', faceEnrollmentWorker._id);
      formData.append('faceDescriptors', JSON.stringify(faceDescriptors));
      
      // Add image files for display purposes
      images.forEach(image => {
        formData.append('faces', image.file);
      });

      // Send to backend
      await axios.post('/shop/attendance/enroll-face', formData);

      setMessage({ type: 'success', text: 'Face enrollment successful!' });
      
      // Refresh workers data to show updated face enrollment status
      await fetchData();
      
      // Update the editingWorker state to reflect the new face enrollment
      // Fetch the updated worker data to get the latest faceImages
      try {
        // Add a small delay to ensure the database update is complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const updatedWorkerResponse = await axios.get(`${WORKER_URL}/${faceEnrollmentWorker._id}`, { withCredentials: true });
        // Update the editingWorker state if it matches the enrolled worker
        if (editingWorker && editingWorker._id === faceEnrollmentWorker._id) {
          setEditingWorker(updatedWorkerResponse.data);
        }
      } catch (error) {
        console.error('Error fetching updated worker data:', error);
        // Fallback to updating locally
        if (editingWorker && editingWorker._id === faceEnrollmentWorker._id) {
          setEditingWorker(prev => ({
            ...prev,
            faceImages: [...(prev.faceImages || []), ...images],
            faceEncodings: faceDescriptors // Add the face encodings as well
          }));
        }
      }      
      // Update the face recognition service with the new face data
      try {
        // Convert descriptors to Float32Array format for the service
        const float32Descriptors = faceDescriptors.map(desc => new Float32Array(desc));
        faceRecognitionService.addEnrolledFace(faceEnrollmentWorker._id, float32Descriptors);
        
        // Small delay to ensure the face data is properly stored
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Reload enrolled faces to ensure consistency
        const enrolledCount = await faceRecognitionService._loadEnrolledFaces();
        console.log('Reloaded enrolled faces. Total enrolled workers:', enrolledCount);
        
        // Notify that face attendance records should be updated
        // This could trigger a refresh of any attendance tracking components
        window.dispatchEvent(new CustomEvent('faceEnrollmentUpdated', { 
          detail: { workerId: faceEnrollmentWorker._id, timestamp: Date.now() } 
        }));        
        // Also dispatch a custom event with more detailed information
        window.dispatchEvent(new CustomEvent('faceEnrollmentCompleted', { 
          detail: { 
            workerId: faceEnrollmentWorker._id, 
            workerName: faceEnrollmentWorker.name,
            descriptorsCount: float32Descriptors.length,
            timestamp: Date.now() 
          } 
        }));
      } catch (serviceError) {
        console.warn('Failed to update face recognition service:', serviceError);
      }
      
      // Close the modal after a delay
      setTimeout(() => {
        handleCloseFaceEnrollment();
      }, 2000);
      
    } catch (error) {
      console.error('Error enrolling face:', error);
      const errorMsg = error.response?.data?.message || error.message || 'An error occurred during enrollment.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete with confirmation modal
  const handleDeleteClick = (worker) => {
    setWorkerToDelete(worker);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!workerToDelete) return;
    
    try {
      await axios.delete(`${WORKER_URL}/${workerToDelete._id}`, { withCredentials: true });
      setWorkers(workers.filter((w) => w._id !== workerToDelete._id));
      setIsDeleteModalOpen(false);
      setWorkerToDelete(null);
    } catch (err) {
      setError('Failed to delete worker.');
      console.error(err);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setWorkerToDelete(null);
  };

  if (loading) {
    return <div className="p-6 text-center">Loading workers...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-2xl font-semibold mb-4 text-gray-800">Existing Workers</h3>
      
      {/* Search Bar */}
      <div className="relative w-full sm:w-1/3 mb-6">
        <input
          type="text"
          placeholder="Search by staff name or ID..."
          className="w-full pl-10 pr-4 py-2 border border-medium-gray rounded-lg text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {filteredWorkers.length === 0 ? (
        <p>No workers found. Please add a worker.</p>
      ) : (
        <div className="overflow-x-auto">
         <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
        <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Details</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RFID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
        {filteredWorkers.map((worker) => (
            <tr key={worker._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{worker.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{worker.department?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{worker.salary}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {worker.batchId ? (
                    <div>
                      <div>
                        Working Hours: {worker.workingHours?.from && worker.workingHours?.to 
                          ? `${formatTimeTo12Hour(worker.workingHours.from)} - ${formatTimeTo12Hour(worker.workingHours.to)}` 
                          : 'Not set'}
                      </div>
                      <div>
                        Lunch Break: {worker.lunchBreak?.from && worker.lunchBreak?.to 
                          ? `${formatTimeTo12Hour(worker.lunchBreak.from)} - ${formatTimeTo12Hour(worker.lunchBreak.to)}` 
                          : 'Not set'}
                      </div>
                      <div>
                        Break Time: {worker.breakTime?.startTime && worker.breakTime?.endTime 
                          ? `${formatTimeTo12Hour(worker.breakTime.startTime)} - ${formatTimeTo12Hour(worker.breakTime.endTime)}` 
                          : 'Not set'}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div>
                        Working Hours: {worker.workingHours?.from && worker.workingHours?.to 
                          ? `${formatTimeTo12Hour(worker.workingHours.from)} - ${formatTimeTo12Hour(worker.workingHours.to)}` 
                          : 'Not set'}
                      </div>
                      <div>
                        Lunch Break: {worker.lunchBreak?.from && worker.lunchBreak?.to 
                          ? `${formatTimeTo12Hour(worker.lunchBreak.from)} - ${formatTimeTo12Hour(worker.lunchBreak.to)}` 
                          : 'Not set'}
                      </div>
                      <div>
                        Break Time: {worker.breakTime?.startTime && worker.breakTime?.endTime 
                          ? `${formatTimeTo12Hour(worker.breakTime.startTime)} - ${formatTimeTo12Hour(worker.breakTime.endTime)}` 
                          : 'Not set'}
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{worker.rfid || 'Not Assigned'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleEdit(worker)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                    <button onClick={() => handleDeleteClick(worker)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
            </tr>
        ))}
    </tbody>
</table>
        </div>
      )}

      {/* Edit Worker Modal */}
      <CustomModal 
        isOpen={isEditModalOpen} 
        onClose={handleCloseEditModal} 
        title="Edit Worker"
      >
        {editingWorker && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={editedWorkerData.name || ''}
                onChange={(e) => handleInputChange(e, 'name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={editedWorkerData.department || ''}
                onChange={handleDepartmentChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
              <input
                type="number"
                value={editedWorkerData.salary || ''}
                onChange={(e) => handleInputChange(e, 'salary')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RFID</label>
              <input
                type="text"
                value={editedWorkerData.rfid || ''}
                onChange={(e) => handleInputChange(e, 'rfid')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Batch Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
              <select
                value={editedWorkerData.selectedBatch || ''}
                onChange={(e) => handleInputChange(e, 'selectedBatch')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No Batch</option>
                {batches.map(batch => (
                  <option key={batch.id} value={batch.id}>{batch.name}</option>
                ))}
              </select>
              
              {/* Display selected batch details */}
              {editedWorkerData.selectedBatch && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                  <p className="font-medium">Batch Details:</p>
                  {(() => {
                    const batch = batches.find(b => b.id === editedWorkerData.selectedBatch);
                    return batch ? (
                      <div>
                        <p>Working Hours: {batch.workingHours?.from ? formatTimeTo12Hour(batch.workingHours.from) : '--:--'} - {batch.workingHours?.to ? formatTimeTo12Hour(batch.workingHours.to) : '--:--'}</p>
                        <p>Lunch Break: {batch.lunchBreak?.from ? formatTimeTo12Hour(batch.lunchBreak.from) : '--:--'} - {batch.lunchBreak?.to ? formatTimeTo12Hour(batch.lunchBreak.to) : '--:--'}</p>
                        <p>Break Time: {batch.breakTime?.from ? formatTimeTo12Hour(batch.breakTime.from) : '--:--'} - {batch.breakTime?.to ? formatTimeTo12Hour(batch.breakTime.to) : '--:--'}</p>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
            
            {/* Face Enrollment Section */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700">Face Enrollment</h3>
                {editingWorker.faceImages && editingWorker.faceImages.length > 0 ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Enrolled
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Not Enrolled
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {editingWorker.faceImages && editingWorker.faceImages.length > 0 
                  ? `Worker has ${editingWorker.faceImages.length} face images enrolled.` 
                  : 'Worker has not been enrolled for face recognition.'}
              </p>
              <button
                type="button"
                onClick={() => handleOpenFaceEnrollment(editingWorker)}
                className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LuUserPlus className="mr-1" size={16} />
                {editingWorker.faceImages && editingWorker.faceImages.length > 0 
                  ? 'Update Face Enrollment' 
                  : 'Enroll Face'}
              </button>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Update Worker
              </button>
            </div>
          </form>
        )}
      </CustomModal>

      {/* Face Enrollment Modal */}
      <CustomModal 
        isOpen={isFaceEnrollmentOpen} 
        onClose={handleCloseFaceEnrollment} 
        title="Face Enrollment"
      >
        {faceEnrollmentWorker && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Enrolling face for worker: <span className="font-medium">{faceEnrollmentWorker.name}</span>
            </p>
            
            {/* Instructions */}
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Instructions</h4>
              <ul className="text-xs text-blue-700 list-disc pl-5 space-y-1">
                <li>Position the worker's face clearly in the camera frame</li>
                <li>Capture multiple images from different angles for better recognition</li>
                <li>Ensure good lighting and avoid glare or shadows on the face</li>
              </ul>
            </div>
            
            {/* Status Message */}
            {message.text && (
              <div className={`p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message.text}
              </div>
            )}
            
            <form onSubmit={handleSubmitFaceEnrollment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Preview ({images.length}/5)</h3>
                  {images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img src={image.preview} alt={`preview ${index}`} className="w-full h-20 object-cover rounded-md" />
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
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseFaceEnrollment}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || images.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
                      <LuUserPlus className="mr-2" /> Enroll Face
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </CustomModal>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                Delete Worker
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete <span className="font-semibold">{workerToDelete?.name}</span>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="button"
                onClick={confirmDelete}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={cancelDelete}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewWorkers;