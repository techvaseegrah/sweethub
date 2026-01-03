import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from '../../../api/axios';
import { AuthContext } from '../../../context/AuthContext'; // Import AuthContext
import RFIDAttendance from './RFIDAttendance';
import FaceAttendance from './FaceAttendance'; // Import FaceAttendance component
import CustomModal from '../../../components/CustomModal'; // Import CustomModal
import * as XLSX from 'xlsx'; // Import xlsx library
import CreateAttendanceAccountModal from './CreateAttendanceAccountModal'; // Import Create Attendance Account Modal
import { generateAttendanceReportPdf } from '../../../utils/generateAttendanceReportPdf'; // Import attendance PDF utility

// ATTENDANCE_URL will be determined dynamically based on user type

// Import for CreateAttendanceAccountModal
const CREATE_ATTENDANCE_ACCOUNT_MODAL = true; // This flag indicates the modal component exists

// Utility function to format time in 12-hour format with AM/PM
const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes}:${seconds} ${ampm}`;
};

// Helper function to calculate working time and format in HH.MM.SS format
const calculateWorkingTime = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '00.00.00';
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffMs = end - start;
    
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    const hours = diffHrs.toString().padStart(2, '0');
    const minutes = diffMins.toString().padStart(2, '0');
    const seconds = diffSecs.toString().padStart(2, '0');
    
    return `${hours}.${minutes}.${seconds}`;
};

// Helper function to format date
const formatDate = (dateInput) => {
    if (!dateInput) return '--/--/----';
    
    let date;
    if (typeof dateInput === 'string') {
        // If it's already a date string in YYYY-MM-DD format
        if (dateInput.includes('-')) {
            date = new Date(dateInput);
        } else {
            // Otherwise treat as a date string
            date = new Date(dateInput);
        }
    } else {
        // If it's already a Date object
        date = dateInput;
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
        return '--/--/----';
    }
    
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
};

// Helper function to group attendance records by worker and date
const groupAttendanceByWorkerAndDate = (workersWithAttendance) => {
    // First, create a map of unique workers by their ID
    const uniqueWorkers = new Map();
    
    workersWithAttendance.forEach(worker => {
        if (worker._id) {
            uniqueWorkers.set(worker._id.toString(), worker);
        }
    });
    
    // Then, create a map to store attendance records grouped by worker and date
    const workerDateMap = new Map();
    
    // Process each unique worker's attendance records
    uniqueWorkers.forEach(worker => {
        // For the new data structure, check attendanceRecordsGroupedByDate
        if (worker.attendanceRecordsGroupedByDate && worker.attendanceRecordsGroupedByDate.length > 0) {
            // Process the grouped records
            worker.attendanceRecordsGroupedByDate.forEach(groupedRecord => {
                const dateKey = groupedRecord.date;
                const records = groupedRecord.records;
                
                // Create a unique key for worker-date combination
                const workerId = worker._id.toString();
                const workerDateKey = `${workerId}-${dateKey}`;
                
                if (!workerDateMap.has(workerDateKey)) {
                    workerDateMap.set(workerDateKey, {
                        worker: worker,
                        date: dateKey,
                        records: []
                    });
                }
                
                // Add all records for this date to the worker-date group
                workerDateMap.get(workerDateKey).records.push(...records);
            });
        } else if (worker.attendanceRecords && worker.attendanceRecords.length > 0) {
            // Fallback to the old structure if needed
            // Create a map to track unique records by their _id to avoid duplicates
            const uniqueRecords = new Map();
            
            // Process each attendance record
            worker.attendanceRecords.forEach(record => {
                // Skip if we've already processed this record
                if (record._id && uniqueRecords.has(record._id)) {
                    return;
                }
                
                // Mark this record as processed
                if (record._id) {
                    uniqueRecords.set(record._id, true);
                }
                
                // Get worker ID safely
                let workerId;
                try {
                    if (worker._id) {
                        workerId = worker._id.toString();
                    } else {
                        console.warn('Worker missing _id:', worker);
                        return;
                    }
                } catch (error) {
                    console.error('Error processing worker ID:', worker, error);
                    return;
                }
                
                // Get the date for this record (use checkIn date as primary)
                const recordDate = new Date(record.checkIn);
                const dateKey = recordDate.toISOString().split('T')[0];
                
                // Create a unique key for worker-date combination
                const workerDateKey = `${workerId}-${dateKey}`;
                
                if (!workerDateMap.has(workerDateKey)) {
                    workerDateMap.set(workerDateKey, {
                        worker: worker,
                        date: dateKey,
                        records: []
                    });
                }
                
                // Add record to the worker-date group
                workerDateMap.get(workerDateKey).records.push(record);
            });
        }
    });
    
    // Convert map values to array
    const groupedData = [];
    workerDateMap.forEach((entry) => {
        // Sort records by checkIn time
        entry.records.sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn));
        groupedData.push(entry);
    });
    
    return groupedData;
};

// Helper function to check if a record from yesterday is missing a punch out
const getMissingPunchOutFromYesterday = (attendanceRecords, currentDate) => {
    // Get yesterday's date
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split('T')[0];
    
    // Find records from yesterday
    const yesterdayRecords = attendanceRecords.filter(record => {
        const recordDate = new Date(record.checkIn);
        const recordDateKey = recordDate.toISOString().split('T')[0];
        return recordDateKey === yesterdayKey;
    });
    
    // Find any incomplete record from yesterday (has checkIn but no checkOut)
    return yesterdayRecords.find(record => !record.checkOut);
};

// Helper function to check if a record is a missed punch-out from the previous day
const isMissedPunchOut = (record, currentDate) => {
    // Get yesterday's date
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split('T')[0];
    
    // Get the record date
    const recordDate = new Date(record.checkIn);
    const recordDateKey = recordDate.toISOString().split('T')[0];
    
    // Check if this record is from yesterday and has a checkOut (meaning it was a missed punch-out that got corrected)
    return recordDateKey === yesterdayKey && record.checkOut && record.isManualCorrection;
};

function AttendanceTracking() {
  const { authState } = useContext(AuthContext); // Get auth state to determine user type
  
  // Determine the attendance API URL based on user type
  const getAttendanceUrl = () => {
    if (authState?.role === 'attendance-only') {
      if (authState?.userType === 'shop') {
        return '/shop/attendance';
      } else {
        return '/admin/attendance';
      }
    }
    return '/admin/attendance'; // Default for admin users
  };
  
  const [todaysAttendanceData, setTodaysAttendanceData] = useState([]);
  const [displayedAttendanceData, setDisplayedAttendanceData] = useState([]);
  const [visibleDays, setVisibleDays] = useState(2); // Show only 2 days by default
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRFIDModal, setShowRFIDModal] = useState(false); // State for RFID Modal
  const [showFaceModal, setShowFaceModal] = useState(false); // State for Face Attendance Modal
  const [showMissingPunchModal, setShowMissingPunchModal] = useState(false); // State for Missing Punch Modal
  const [selectedWorkerForCorrection, setSelectedWorkerForCorrection] = useState(null); // Worker needing correction
  const [missingPunchOutTime, setMissingPunchOutTime] = useState(''); // Time for missing punch out
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false); // State for Create Account Modal

  const fetchTodaysAttendance = useCallback(async () => {
      try {
          const attendanceUrl = getAttendanceUrl();
          const response = await axios.get(attendanceUrl, { withCredentials: true });
          console.log('Attendance data received:', response.data);
          setTodaysAttendanceData(response.data);
          setLoading(false);
      } catch (err) {
          setError('Failed to fetch today\'s attendance data.');
          console.error(err);
          setLoading(false);
      }
  }, []);

  useEffect(() => {
    // Fetch data immediately when the component loads
    fetchTodaysAttendance();

    // Set up an interval to fetch data every 2 seconds for real-time updates
    const intervalId = setInterval(() => {
        fetchTodaysAttendance();
    }, 2000);
    
    // Clean up the interval when the component unmounts
    return () => {
        clearInterval(intervalId);
    };
  }, [fetchTodaysAttendance]);

  // Update displayed data when attendance data or visible days change
  useEffect(() => {
    // Filter workers to only show those with attendance records
    const workersWithAttendance = todaysAttendanceData
      .filter(worker => {
        // Check for the new data structure first
        if (worker.attendanceRecordsGroupedByDate && worker.attendanceRecordsGroupedByDate.length > 0) {
          return true;
        }
        // Fallback to the old structure
        if (worker.attendanceRecords && worker.attendanceRecords.length > 0) {
          return true;
        }
        return false;
      })
      .filter((worker, index, self) => 
        index === self.findIndex(w => w._id === worker._id)
      ); // Remove duplicate workers

    // Group attendance by worker and date
    const groupedAttendanceData = groupAttendanceByWorkerAndDate(workersWithAttendance);
    
    // Sort by most recent punch time (most recent first)
    const sortedGroupedData = [...groupedAttendanceData].sort((a, b) => {
      // Get the latest punch time for each entry
      const getLatestPunchTime = (entry) => {
        let latestTime = new Date(0); // Initialize to earliest possible date
        
        entry.records.forEach(record => {
          if (record.checkIn && new Date(record.checkIn) > latestTime) {
            latestTime = new Date(record.checkIn);
          }
          if (record.checkOut && new Date(record.checkOut) > latestTime) {
            latestTime = new Date(record.checkOut);
          }
        });
        
        return latestTime;
      };
      
      const latestTimeA = getLatestPunchTime(a);
      const latestTimeB = getLatestPunchTime(b);
      
      // Sort in descending order (most recent first)
      return latestTimeB - latestTimeA;
    });

    // Get today's date for comparison
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // Separate today's records from older records
    const todaysRecords = sortedGroupedData.filter(entry => entry.date === todayString);
    
    // Get unique dates from older records (excluding today)
    const olderRecords = sortedGroupedData.filter(entry => entry.date !== todayString);
    const uniqueOlderDates = [...new Set(olderRecords.map(entry => entry.date))]
      .sort((a, b) => new Date(b) - new Date(a)); // Sort dates descending (most recent first)
    
    // Check if there are more older dates to load
    const hasMoreRecords = uniqueOlderDates.length > visibleDays;

    // Get the records for the visible dates
    const visibleOlderDates = uniqueOlderDates.slice(0, visibleDays);
    const visibleOlderRecords = olderRecords.filter(entry => 
      visibleOlderDates.includes(entry.date)
    );

    // Always show today's records + visible older records
    const finalDisplayedData = [...todaysRecords, ...visibleOlderRecords];

    setDisplayedAttendanceData(finalDisplayedData);
  }, [todaysAttendanceData, visibleDays]);

  // Function to add RFID attendance record to the table
  const addRfidAttendanceRecord = (record) => {
      // Refresh the main attendance data to reflect the new record immediately
      fetchTodaysAttendance();
  };

  // Function to handle face attendance record
  const handleFaceAttendanceRecord = (record) => {
      // Refresh the main attendance data to reflect the new record immediately
      fetchTodaysAttendance();
  };

  // Function to handle missing punch correction
  const handleMissingPunchCorrection = async () => {
    if (!selectedWorkerForCorrection || !missingPunchOutTime) {
      alert('Please select a worker and enter a punch out time');
      return;
    }

    try {
      const attendanceUrl = getAttendanceUrl();
      // Use the appropriate URL for the missing punch correction endpoint
      const correctPunchUrl = attendanceUrl.replace('/attendance', '/attendance/correct-missing-punch');
      const response = await axios.post(correctPunchUrl, {
        workerId: selectedWorkerForCorrection.worker._id,
        checkOutTime: missingPunchOutTime
      }, { withCredentials: true });

      alert('Missing punch corrected successfully');
      setShowMissingPunchModal(false);
      setMissingPunchOutTime('');
      setSelectedWorkerForCorrection(null);
      // Refresh attendance data
      fetchTodaysAttendance();
    } catch (err) {
      console.error('Error correcting missing punch:', err);
      alert('Failed to correct missing punch: ' + (err.response?.data?.message || 'Server error'));
    }
  };

  // Function to load more days
  const loadMoreDays = () => {
    setVisibleDays(prev => prev + 2); // Load 2 more days each time
  };

  // Function to export attendance data to PDF
  const exportToPdf = () => {
    generateAttendanceReportPdf(displayedAttendanceData);
  };

  // Function to export attendance data to Excel
  const exportToExcel = () => {
    // Prepare data for export
    const exportData = [];
    
    displayedAttendanceData.forEach(entry => {
      // Sort records by time to ensure proper order
      const sortedRecords = [...entry.records].sort((a, b) => {
        const timeA = new Date(a.checkIn);
        const timeB = new Date(b.checkIn);
        return timeA - timeB;
      });
      
      // Get all punch in times
      const punchInTimes = sortedRecords
        .filter(record => record.checkIn)
        .map(record => {
          const currentDate = new Date(entry.date);
          // Check if this is a missed punch-out from yesterday
          if (isMissedPunchOut(record, currentDate)) {
            return {
              time: formatTime(record.checkIn),
              isMissedPunchOut: true,
              checkOutTime: formatTime(record.checkOut)
            };
          }
          return {
            time: formatTime(record.checkIn),
            isMissedPunchOut: false
          };
        });
      
      // Get all punch out times
      const punchOutTimes = sortedRecords
        .filter(record => record.checkOut)
        .map(record => {
          const currentDate = new Date(entry.date);
          // Check if this is a missed punch-out from yesterday
          if (isMissedPunchOut(record, currentDate)) {
            return {
              time: formatTime(record.checkOut),
              isMissedPunchOut: true
            };
          }
          return {
            time: formatTime(record.checkOut),
            isMissedPunchOut: false
          };
        });
      
      // Calculate total working time for all records of this worker on this date
      let totalMilliseconds = 0;
      sortedRecords.forEach(record => {
        if (record.checkIn && record.checkOut) {
          const start = new Date(record.checkIn);
          const end = new Date(record.checkOut);
          totalMilliseconds += (end - start);
        }
      });
      
      // Convert to formatted time
      const totalSeconds = Math.floor(totalMilliseconds / 1000);
      const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
      const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
      const seconds = (totalSeconds % 60).toString().padStart(2, '0');
      const totalDuration = `${hours}.${minutes}.${seconds}`;
      
      // Create a row for each punch in/punch out pair
      const maxPairs = Math.max(punchInTimes.length, punchOutTimes.length);
      
      for (let i = 0; i < maxPairs; i++) {
        exportData.push({
          'Employee Name': entry.worker.name,
          'RF ID': entry.worker.rfid || 'N/A',
          'Date': entry.date,
          'Punch In': punchInTimes[i] ? punchInTimes[i].time : '--:--',
          'Punch Out': punchOutTimes[i] ? punchOutTimes[i].time : '--:--',
          'Total Duration': totalDuration
        });
      }
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');
    
    // Export to Excel file
    XLSX.writeFile(wb, 'attendance_report.xlsx');
  };

  // Filter workers to only show those with attendance records
  const workersWithAttendance = todaysAttendanceData
    .filter(worker => {
      // Check for the new data structure first
      if (worker.attendanceRecordsGroupedByDate && worker.attendanceRecordsGroupedByDate.length > 0) {
        return true;
      }
      // Fallback to the old structure
      if (worker.attendanceRecords && worker.attendanceRecords.length > 0) {
        return true;
      }
      return false;
    })
    .filter((worker, index, self) => 
      index === self.findIndex(w => w._id === worker._id)
    ); // Remove duplicate workers

  // Group attendance by worker and date
  const groupedAttendanceData = groupAttendanceByWorkerAndDate(workersWithAttendance);
  
  // Sort by most recent punch time (most recent first)
  const sortedGroupedData = [...groupedAttendanceData].sort((a, b) => {
    // Get the latest punch time for each entry
    const getLatestPunchTime = (entry) => {
      let latestTime = new Date(0); // Initialize to earliest possible date
      
      entry.records.forEach(record => {
        if (record.checkIn && new Date(record.checkIn) > latestTime) {
          latestTime = new Date(record.checkIn);
        }
        if (record.checkOut && new Date(record.checkOut) > latestTime) {
          latestTime = new Date(record.checkOut);
        }
      });
      
      return latestTime;
    };
    
    const latestTimeA = getLatestPunchTime(a);
    const latestTimeB = getLatestPunchTime(b);
    
    // Sort in descending order (most recent first)
    return latestTimeB - latestTimeA;
  });

  // Get today's date for comparison
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];

  // Separate today's records from older records
  const todaysRecords = sortedGroupedData.filter(entry => entry.date === todayString);
  
  // Get unique dates from older records (excluding today)
  const olderRecords = sortedGroupedData.filter(entry => entry.date !== todayString);
  const uniqueOlderDates = [...new Set(olderRecords.map(entry => entry.date))]
    .sort((a, b) => new Date(b) - new Date(a)); // Sort dates descending (most recent first)
  
  // Check if there are more older dates to load
  const hasMoreRecords = uniqueOlderDates.length > visibleDays;

  // Handle loading state - this needs to be after all hooks
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center h-64">
        <div className="relative flex justify-center items-center mb-4">
          <div className="w-16 h-16 border-4 border-red-100 border-t-red-500 rounded-full animate-spin"></div>
          <img 
            src="/sweethub-logo.png" 
            alt="Sweet Hub Logo" 
            className="absolute w-10 h-10"
          />
        </div>
        <div className="text-red-500 font-medium">Loading attendance data...</div>
      </div>
    );
  }

  // Handle error state - this needs to be after all hooks
  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center h-64">
        <div className="text-red-500 font-medium mb-4">Error: {error}</div>
        <button 
          onClick={fetchTodaysAttendance}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-6">
        {/* Header Section with RF ID and Face Attendance buttons at top right */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Attendance Tracker</h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
                <button 
                    onClick={() => setShowRFIDModal(true)}
                    className="bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors text-sm sm:text-base"
                >
                    RFID
                </button>
                {/* Face Attendance button */}
                <button 
                    onClick={() => setShowFaceModal(true)}
                    className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                    Face Attendance
                </button>
                <button 
                    onClick={exportToExcel}
                    className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                >
                    Excel 
                </button>
                <button 
                    onClick={exportToPdf}
                    className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    PDF
                </button>
                <button 
                    onClick={() => setShowCreateAccountModal(true)}
                    className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
                >
                    Create Account
                </button>
            </div>
        </div>

        {/* RFID Attendance Modal */}
        <CustomModal
            isOpen={showRFIDModal}
            onClose={() => setShowRFIDModal(false)}
            title="RFID Attendance"
        >
            <RFIDAttendance onAttendanceRecorded={addRfidAttendanceRecord} />
        </CustomModal>

        {/* Face Attendance Modal */}
        <CustomModal
            isOpen={showFaceModal}
            onClose={() => setShowFaceModal(false)}
            title="Face Attendance"
        >
            <FaceAttendance onAttendanceRecorded={handleFaceAttendanceRecord} />
        </CustomModal>

        {/* Missing Punch Correction Modal */}
        <CustomModal
            isOpen={showMissingPunchModal}
            onClose={() => {
                setShowMissingPunchModal(false);
                setSelectedWorkerForCorrection(null);
                setMissingPunchOutTime('');
            }}
            title="Correct Missing Punch Out"
        >
            <div className="p-4">
                {selectedWorkerForCorrection && (
                    <div className="mb-4">
                        <p className="font-semibold text-sm sm:text-base">Worker: {selectedWorkerForCorrection.worker.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600">
                            Missing Punch In: {formatTime(selectedWorkerForCorrection.incompleteRecord.checkIn)}
                        </p>
                    </div>
                )}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Punch Out Time</label>
                    <input
                        type="datetime-local"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={missingPunchOutTime}
                        onChange={(e) => setMissingPunchOutTime(e.target.value)}
                    />
                </div>
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                    <button
                        onClick={() => {
                            setShowMissingPunchModal(false);
                            setSelectedWorkerForCorrection(null);
                            setMissingPunchOutTime('');
                        }}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleMissingPunchCorrection}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                    >
                        Correct Punch
                    </button>
                </div>
            </div>
        </CustomModal>

        {/* Create Account Modal */}
        <CustomModal
            isOpen={showCreateAccountModal}
            onClose={() => setShowCreateAccountModal(false)}
            title="Create Attendance Account"
        >
            <CreateAttendanceAccountModal 
                onClose={() => setShowCreateAccountModal(false)} 
                onAccountCreated={() => {
                    setShowCreateAccountModal(false);
                    // Optionally refresh data
                }}
                isShop={authState?.role === 'shop' || authState?.userType === 'shop'}
            />
        </CustomModal>

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

        {/* Attendance Table with specified columns */}
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-md">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Name</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RF ID</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punch In</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punch Out</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Duration</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {/* Render displayed attendance data */}
                    {displayedAttendanceData.map((entry, index) => {
                        // Sort records by time to ensure proper order
                        const sortedRecords = [...entry.records].sort((a, b) => {
                            const timeA = new Date(a.checkIn);
                            const timeB = new Date(b.checkIn);
                            return timeA - timeB;
                        });
                        
                        // Get all punch in times
                        const punchInTimes = sortedRecords
                            .filter(record => record.checkIn)
                            .map(record => {
                                const currentDate = new Date(entry.date);
                                // Check if this is a missed punch-out from yesterday
                                if (isMissedPunchOut(record, currentDate)) {
                                    return {
                                        time: formatTime(record.checkIn),
                                        isMissedPunchOut: true,
                                        checkOutTime: formatTime(record.checkOut)
                                    };
                                }
                                return {
                                    time: formatTime(record.checkIn),
                                    isMissedPunchOut: false
                                };
                            });
                        
                        // Get all punch out times
                        const punchOutTimes = sortedRecords
                            .filter(record => record.checkOut)
                            .map(record => {
                                const currentDate = new Date(entry.date);
                                // Check if this is a missed punch-out from yesterday
                                if (isMissedPunchOut(record, currentDate)) {
                                    return {
                                        time: formatTime(record.checkOut),
                                        isMissedPunchOut: true
                                    };
                                }
                                return {
                                    time: formatTime(record.checkOut),
                                    isMissedPunchOut: false
                                };
                            });
                        
                        // Calculate total working time for all records of this worker on this date
                        let totalMilliseconds = 0;
                        sortedRecords.forEach(record => {
                            if (record.checkIn && record.checkOut) {
                                const start = new Date(record.checkIn);
                                const end = new Date(record.checkOut);
                                totalMilliseconds += (end - start);
                            }
                        });
                        
                        // Convert to formatted time
                        const totalSeconds = Math.floor(totalMilliseconds / 1000);
                        const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
                        const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
                        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
                        const totalDuration = `${hours}.${minutes}.${seconds}`;
                        
                        // Check if there's an incomplete record from yesterday
                        const currentDate = new Date(entry.date);
                        const incompleteRecord = getMissingPunchOutFromYesterday(entry.records, currentDate);
                        
                        // Create a unique key for this row using a combination of worker ID, date, and a unique identifier
                        const rowKey = `${entry.worker._id}-${entry.date}-${Math.random().toString(36).substr(2, 9)}`;
                        
                        return (
                            <tr key={rowKey}>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{entry.worker.name}</td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{entry.worker.rfid || 'N/A'}</td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{formatDate(entry.date)}</td>
                                <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm">
                                    <div className="space-y-1">
                                        {punchInTimes.length > 0 ? (
                                            punchInTimes.map((item, idx) => (
                                                <div key={`in-${idx}`} className="flex items-center">
                                                    {item.isMissedPunchOut ? (
                                                        <span className="text-xs sm:text-sm text-gray-400 flex items-center">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                            {item.time}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs sm:text-sm text-green-500">{item.time}</span>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-xs sm:text-sm text-green-500">--:--</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm">
                                    <div className="space-y-1">
                                        {punchOutTimes.length > 0 ? (
                                            punchOutTimes.map((item, idx) => (
                                                <div key={`out-${idx}`} className="flex items-center">
                                                    {item.isMissedPunchOut ? (
                                                        <span className="text-xs sm:text-sm text-gray-400 flex items-center">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                            {item.time}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs sm:text-sm text-red-500">{item.time}</span>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-xs sm:text-sm text-red-500">--:--</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{totalDuration}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
        
        {/* Load More Button */}
        {hasMoreRecords && (
            <div className="flex justify-center mt-4">
                <button
                    onClick={loadMoreDays}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    Load More
                </button>
            </div>
        )}
    </div>
);
}

export default AttendanceTracking;