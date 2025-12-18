import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

const RFID_ATTENDANCE_URL = '/shop/attendance/rfid-attendance';

function RFIDAttendance({ onAttendanceRecorded }) {
  const [rfid, setRfid] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [workerInfo, setWorkerInfo] = useState(null);
  const [attendanceType, setAttendanceType] = useState(''); // 'checkin' or 'checkout'
  const [clearTimer, setClearTimer] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingRfid, setPendingRfid] = useState('');

  // Clear the RFID input after 3 seconds when attendance is successful
  useEffect(() => {
    return () => {
      if (clearTimer) {
        clearTimeout(clearTimer);
      }
    };
  }, [clearTimer]);

  const handleRFIDSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setWorkerInfo(null);
    setAttendanceType('');

    // Allow whitespace in RFID but trim leading/trailing whitespace
    const trimmedRfid = rfid.trim();
    
    if (!trimmedRfid) {
      setError('Please enter an RFID.');
      return;
    }

    // Show confirmation popup before submitting
    setPendingRfid(trimmedRfid);
    setShowConfirmation(true);
  };

  const confirmRFIDSubmission = async () => {
    setShowConfirmation(false);
    
    try {
      const response = await axios.post(
        RFID_ATTENDANCE_URL,
        { rfid: pendingRfid }, // Send the pending RFID value
        { withCredentials: true }
      );

      setMessage(response.data.message);
      setWorkerInfo({ name: response.data.worker });
      setAttendanceType(response.data.type);
      
      // Set timer to clear RFID input after 3 seconds
      if (clearTimer) {
        clearTimeout(clearTimer);
      }
      const timer = setTimeout(() => {
        setRfid('');
      }, 3000);
      setClearTimer(timer);
      
      // Pass the attendance record to the parent component
      if (onAttendanceRecorded && response.data.attendance) {
        // Add a small delay to ensure UI updates properly
        setTimeout(() => {
          onAttendanceRecorded({
            workerName: response.data.worker,
            rfid: response.data.rfid,
            checkIn: response.data.attendance.checkIn,
            checkOut: response.data.attendance.checkOut,
            type: response.data.type,
            attendance: response.data.attendance
          });
        }, 100);
      }
    } catch (err) {
      if (err.response?.status === 429 && err.response?.data?.message) {
        // Handle cooldown error from backend (though it's now removed)
        setError(err.response.data.message);
      } else {
        setError(err.response?.data?.message || 'Failed to process RFID attendance.');
      }
      console.error(err);
    }
  };

  const cancelRFIDSubmission = () => {
    setShowConfirmation(false);
    setPendingRfid('');
  };

  const handleClear = () => {
    setRfid('');
    setMessage('');
    setError('');
    setWorkerInfo(null);
    setAttendanceType('');
    setShowConfirmation(false);
    setPendingRfid('');
    
    // Clear any existing timer
    if (clearTimer) {
      clearTimeout(clearTimer);
      setClearTimer(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-text-primary">RFID Attendance</h3>
      
      {/* RFID Input Form */}
      <form onSubmit={handleRFIDSubmit} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-gray-700 text-sm font-bold mb-2">Scan RFID</label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={rfid}
              onChange={(e) => setRfid(e.target.value)} // Remove toUpperCase() to preserve whitespace
              placeholder="Enter RFID (e.g., AB0000)"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-primary text-white font-semibold py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="bg-gray-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </form>

      {/* Confirmation Popup */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Confirm RFID Submission</h3>
            <p className="mb-4">Are you sure you want to submit this RFID for attendance?</p>
            <p className="mb-6 font-semibold">RFID: {pendingRfid}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelRFIDSubmission}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmRFIDSubmission}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {message && (
        <div className={`p-4 rounded-lg mb-4 ${attendanceType === 'checkin' ? 'bg-green-500 text-white' : attendanceType === 'checkout' ? 'bg-red-500 text-white' : 'bg-green-100 text-green-800'}`}>
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Worker Info Display */}
      {workerInfo && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-lg mb-2">Attendance Recorded</h4>
          <p className="text-gray-700">
            Worker: <span className="font-semibold">{workerInfo.name}</span>
          </p>
          <p className="text-gray-700">
            Action: <span className={`font-semibold capitalize ${attendanceType === 'checkin' ? 'text-green-500' : attendanceType === 'checkout' ? 'text-red-500' : ''}`}>{attendanceType}</span>
          </p>
          <p className="text-gray-700 text-sm mt-2">
            RFID input will clear automatically in 3 seconds...
          </p>
        </div>
      )}
    </div>
  );
}

export default RFIDAttendance;