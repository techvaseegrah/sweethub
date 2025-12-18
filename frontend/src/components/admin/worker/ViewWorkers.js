import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import CustomModal from '../../../components/CustomModal'; // Import CustomModal
import Webcam from 'react-webcam'; // Import Webcam for face enrollment
import { LuCamera, LuUpload, LuUserPlus, LuCheck, LuX } from 'react-icons/lu'; // Import icons

// Utility function to format time in 12-hour format with AM/PM
const formatTimeTo12Hour = (time24) => {
  if (!time24) return 'Not set';
  const [hours, minutes] = time24.split(':');
  let hoursInt = parseInt(hours, 10);
  const ampm = hoursInt >= 12 ? 'PM' : 'AM';
  hoursInt = hoursInt % 12 || 12;
  return `${hoursInt}:${minutes} ${ampm}`;
};

const WORKER_URL = '/admin/workers';

function ViewWorkers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [editedWorkerData, setEditedWorkerData] = useState({});
  const [departments, setDepartments] = useState([]);

  // State for face enrollment
  const [isFaceEnrollmentOpen, setIsFaceEnrollmentOpen] = useState(false);
  const [faceEnrollmentWorker, setFaceEnrollmentWorker] = useState(null);
  const [images, setImages] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const webcamRef = React.useRef(null);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [workersResponse, departmentsResponse] = await Promise.all([
                axios.get(WORKER_URL, { withCredentials: true }),
                axios.get('/admin/departments', { withCredentials: true })
            ]);
            setWorkers(workersResponse.data);
            setDepartments(departmentsResponse.data);
        } catch (err) {
            setError('Failed to fetch data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
}, []);

// Open edit modal
const handleEdit = (worker) => {
  setEditingWorker(worker);
  setEditedWorkerData({ 
    ...worker, 
    department: worker.department?._id || worker.department || '' 
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
  setEditedWorkerData({ ...editedWorkerData, [field]: e.target.value });
};

// Handle department change
const handleDepartmentChange = (e) => {
  setEditedWorkerData({ ...editedWorkerData, department: e.target.value });
};

// Update worker
const handleUpdate = async (e) => {
  e.preventDefault();
  try {
      const response = await axios.put(`${WORKER_URL}/${editingWorker._id}`, editedWorkerData, { withCredentials: true });
      setWorkers(workers.map(w => w._id === editingWorker._id ? response.data : w));
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

// Handle file change for face enrollment
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

// Capture image from webcam
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
    // Create FormData for backend storage
    const formData = new FormData();
    formData.append('workerId', faceEnrollmentWorker._id);
    
    // Add image files
    images.forEach(image => {
      formData.append('faces', image.file);
    });

    // Send to backend
    await axios.post('/admin/attendance/enroll-face', formData);

    setMessage({ type: 'success', text: 'Face enrollment successful!' });
    
    // Refresh workers data to show updated face enrollment status
    const fetchData = async () => {
      try {
        const workersResponse = await axios.get(WORKER_URL, { withCredentials: true });
        setWorkers(workersResponse.data);
      } catch (err) {
        setError('Failed to refresh worker data.');
        console.error(err);
      }
    };
    fetchData();
    
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

const handleDelete = async (id) => {
  if (window.confirm('Are you sure you want to delete this worker?')) {
      try {
          await axios.delete(`${WORKER_URL}/${id}`, { withCredentials: true });
          setWorkers(workers.filter((w) => w._id !== id));
      } catch (err) {
          setError('Failed to delete worker.');
          console.error(err);
      }
  }
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
      {workers.length === 0 ? (
        <p>No workers found. Please add a worker.</p>
      ) : (
        <div className="overflow-x-auto">
         <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
        <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Working Hours</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lunch Break</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RFID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Face Enrolled</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
        {workers.map((worker) => (
            <tr key={worker._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{worker.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{worker.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{worker.user?.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{worker.department?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{worker.salary}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {worker.workingHours?.from && worker.workingHours?.to 
                    ? `${formatTimeTo12Hour(worker.workingHours.from)} - ${formatTimeTo12Hour(worker.workingHours.to)}` 
                    : 'Not set'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {worker.lunchBreak?.from && worker.lunchBreak?.to 
                    ? `${formatTimeTo12Hour(worker.lunchBreak.from)} - ${formatTimeTo12Hour(worker.lunchBreak.to)}` 
                    : 'Not set'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{worker.rfid || 'Not Assigned'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {worker.faceImages && worker.faceImages.length > 0 ? (
                    <div className="flex items-center">
                      <LuCheck className="text-green-500 mr-2" size={20} />
                      <span className="text-green-600 font-medium">Yes</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <LuX className="text-red-500 mr-2" size={20} />
                      <span className="text-red-600 font-medium">No</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleEdit(worker)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                    <button onClick={() => handleDelete(worker._id)} className="text-red-600 hover:text-red-900">Delete</button>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={editedWorkerData.username || ''}
                onChange={(e) => handleInputChange(e, 'username')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={editedWorkerData.email || ''}
                onChange={(e) => handleInputChange(e, 'email')}
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
            
            {/* Working Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours (From)</label>
                <input
                  type="time"
                  value={editedWorkerData.workingHours?.from || ''}
                  onChange={(e) => handleInputChange(e, 'workingHours.from')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours (To)</label>
                <input
                  type="time"
                  value={editedWorkerData.workingHours?.to || ''}
                  onChange={(e) => handleInputChange(e, 'workingHours.to')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Lunch Break */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lunch Break (From)</label>
                <input
                  type="time"
                  value={editedWorkerData.lunchBreak?.from || ''}
                  onChange={(e) => handleInputChange(e, 'lunchBreak.from')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lunch Break (To)</label>
                <input
                  type="time"
                  value={editedWorkerData.lunchBreak?.to || ''}
                  onChange={(e) => handleInputChange(e, 'lunchBreak.to')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
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
                className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
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
                <li>Ensure good lighting and avoid shadows on the face</li>
                <li>Remove glasses or hats that might obstruct facial features</li>
                <li>Click "Capture Image" to take a photo, or upload existing images</li>
              </ul>
            </div>
            
            {message.text && (
              <div className={`p-3 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
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
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
    </div>
  );
}

export default ViewWorkers;