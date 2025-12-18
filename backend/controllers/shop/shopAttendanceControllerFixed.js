const Attendance = require('../../models/attendanceModel');
const Worker = require('../../models/workerModel');
const fs = require('fs');

// Feature flag for face recognition service
const FACE_RECOGNITION_ENABLED = process.env.FACE_RECOGNITION_ENABLED !== 'false';

// Helper function to calculate working duration and permissions for a single in-out pair
const calculateAttendanceDetails = (checkIn, checkOut, shiftDetails) => {
  if (!checkIn || !checkOut) {
    return {
      workingDuration: 0,
      lateArrival: 0,
      earlyLeaving: 0,
      totalPermissionTime: 0,
      overtime: 0
    };
  }

  // Convert to moment objects for easier manipulation
  const checkInTime = new Date(checkIn);
  const checkOutTime = new Date(checkOut);
  
  // Calculate working duration in minutes
  const durationInMs = checkOutTime.getTime() - checkInTime.getTime();
  const workingDuration = Math.floor(durationInMs / (1000 * 60)); // Convert to minutes
  
  let lateArrival = 0;
  let earlyLeaving = 0;
  let overtime = 0;
  
  // If shift details are provided, calculate permissions
  if (shiftDetails && shiftDetails.startTime && shiftDetails.endTime) {
    const [shiftStartHours, shiftStartMinutes] = shiftDetails.startTime.split(':').map(Number);
    const [shiftEndHours, shiftEndMinutes] = shiftDetails.endTime.split(':').map(Number);
    
    // Create shift start and end times for the same day as checkIn
    const shiftStartDate = new Date(checkInTime);
    shiftStartDate.setHours(shiftStartHours, shiftStartMinutes, 0, 0);
    
    const shiftEndDate = new Date(checkInTime);
    shiftEndDate.setHours(shiftEndHours, shiftEndMinutes, 0, 0);
    
    // Calculate late arrival (if checkIn is after shift start)
    if (checkInTime > shiftStartDate) {
      const lateMs = checkInTime.getTime() - shiftStartDate.getTime();
      lateArrival = Math.floor(lateMs / (1000 * 60));
    }
    
    // Calculate early leaving (if checkOut is before shift end)
    if (checkOutTime < shiftEndDate) {
      const earlyMs = shiftEndDate.getTime() - checkOutTime.getTime();
      earlyLeaving = Math.floor(earlyMs / (1000 * 60));
    }
    
    // Calculate overtime (if working duration exceeds shift duration)
    const shiftDurationMs = shiftEndDate.getTime() - shiftStartDate.getTime();
    const shiftDurationMinutes = Math.floor(shiftDurationMs / (1000 * 60));
    
    if (workingDuration > shiftDurationMinutes) {
      overtime = workingDuration - shiftDurationMinutes;
    }
  }
  
  const totalPermissionTime = lateArrival + earlyLeaving;
  
  return {
    workingDuration,
    lateArrival,
    earlyLeaving,
    totalPermissionTime,
    overtime
  };
};

// Helper function to get today's and yesterday's date bounds
const getTodayAndYesterdayBounds = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const endOfYesterday = startOfToday; // Start of today is end of yesterday
    return { startOfToday, endOfToday, startOfYesterday, endOfYesterday };
};

// Helper function to check for incomplete records from previous day
const checkForIncompletePreviousDayRecord = async (workerId, shopId) => {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfYesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  
  // Find any incomplete attendance record from yesterday for this shop's worker
  const incompleteRecord = await Attendance.findOne({
    worker: workerId,
    checkIn: { $gte: startOfYesterday, $lt: startOfToday },
    checkOut: { $exists: false }
  }).sort({ checkIn: -1 });
  
  return incompleteRecord;
};

// Helper function to group attendance records by worker and date
// This function now properly groups all punch in and punch out times for each worker by date
const groupAttendanceByWorkerAndDate = (attendanceRecords) => {
    const grouped = {};
    
    attendanceRecords.forEach(record => {
        // Get worker ID safely
        let workerId;
        try {
            if (record.worker && record.worker._id) {
                workerId = record.worker._id.toString();
            } else {
                console.warn('Attendance record missing worker or worker._id:', record);
                return; // Skip this record if worker info is missing
            }
        } catch (error) {
            console.error('Error processing worker ID for record:', record, error);
            return; // Skip this record if there's an error processing the worker ID
        }
        
        // Initialize worker in grouped object if not exists
        if (!grouped[workerId]) {
            grouped[workerId] = {};
        }
        
        // Use the checkIn date as the primary date for grouping
        try {
            const checkInDate = new Date(record.checkIn);
            const dateKey = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate()).toISOString();
            
            // Initialize date for this worker if not exists
            if (!grouped[workerId][dateKey]) {
                grouped[workerId][dateKey] = [];
            }
            
            // Add record to the appropriate worker and date group
            grouped[workerId][dateKey].push(record);
        } catch (dateError) {
            console.error('Error processing date for record:', record, dateError);
            // Skip this record if there's an error processing the date
            return;
        }
    });
    
    return grouped;
};

// Unified handler for attendance punch (check-in/check-out)
const handleAttendancePunch = async (workerId) => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Find an incomplete attendance record for today
    const todaysIncompleteRecord = await Attendance.findOne({
        worker: workerId,
        checkIn: { $gte: startOfToday, $lt: endOfToday },
        checkOut: { $exists: false }
    });

    const worker = await Worker.findById(workerId).populate('shift');
    if (!worker) {
        throw new Error('Worker not found');
    }

    if (todaysIncompleteRecord) {
        // --- This is a PUNCH OUT ---
        todaysIncompleteRecord.checkOut = new Date();

        // Calculate attendance details
        const attendanceDetails = calculateAttendanceDetails(
            todaysIncompleteRecord.checkIn,
            todaysIncompleteRecord.checkOut,
            worker.shift
        );

        // Update record with calculated details
        Object.assign(todaysIncompleteRecord, attendanceDetails);

        const savedRecord = await todaysIncompleteRecord.save();
        worker.lastAttendanceTime = new Date();
        await worker.save();

        return {
            message: `Punch Out successful for ${worker.name}.`,
            worker: worker.name,
            attendance: savedRecord,
            type: 'checkout'
        };
    } else {
        // --- This is a PUNCH IN ---
        const newAttendance = new Attendance({
            worker: workerId,
            checkIn: new Date()
        });
        const savedRecord = await newAttendance.save();
        worker.lastAttendanceTime = new Date();
        await worker.save();

        return {
            message: `Punch In successful for ${worker.name}.`,
            worker: worker.name,
            attendance: savedRecord,
            type: 'checkin'
        };
    }
};

exports.getTodaysAttendance = async (req, res) => {
    try {
        console.log('Fetching today\'s attendance for shopId:', req.shopId);
        const { startOfToday, endOfToday, startOfYesterday, endOfYesterday } = getTodayAndYesterdayBounds();
        console.log('Date bounds:', { startOfToday, endOfToday, startOfYesterday, endOfYesterday });
        
        // Fetch ALL attendance records for today and yesterday for workers in this shop
        const todaysAttendance = await Attendance.find({ 
            $and: [
                { 
                    $or: [
                        { checkIn: { $gte: startOfYesterday, $lt: endOfToday } },
                        { 
                            checkIn: { $lt: startOfToday },
                            checkOut: { $gte: startOfToday, $lt: endOfToday }
                        }
                    ]
                },
                { 
                    worker: { $in: await Worker.find({ shop: req.shopId }).distinct('_id') }
                }
            ]
        }).populate('worker', 'name rfid shift').lean();
        
        console.log('Found attendance records:', todaysAttendance.length);
        
        // Group attendance records by worker and date
        const groupedAttendance = groupAttendanceByWorkerAndDate(todaysAttendance);
        console.log('Grouped attendance by worker and date');
        
        // Get workers - only get workers belonging to this shop
        const workersQuery = { shop: req.shopId };
        console.log('Workers query:', workersQuery);
        
        const workers = await Worker.find(workersQuery).lean();
        console.log('Found workers:', workers.length);
        
        // Combine worker data with their attendance records grouped by date
        const combinedData = workers.map(worker => {
            // Ensure worker has an _id before trying to access it
            if (worker && worker._id) {
                const workerId = worker._id.toString();
                const workerAttendanceByDate = groupedAttendance[workerId] || {};
                
                // Create an array to hold all attendance records grouped by date
                const attendanceRecordsGroupedByDate = [];
                
                // Process each date's records
                Object.keys(workerAttendanceByDate).forEach(dateKey => {
                    // Get all records for this date
                    const recordsForDate = workerAttendanceByDate[dateKey];
                    
                    // Create a consolidated record for this date
                    const consolidatedRecord = {
                        date: dateKey,
                        records: recordsForDate
                    };
                    
                    attendanceRecordsGroupedByDate.push(consolidatedRecord);
                });
                
                return {
                    ...worker,
                    attendanceRecordsGroupedByDate: attendanceRecordsGroupedByDate
                };
            }
            // Return worker as is if _id is missing
            return worker;
        });
        
        console.log('Sending combined data:', combinedData.length);
        res.json(combinedData);
    } catch (error) {
        console.error('Error fetching today\'s attendance:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.checkIn = async (req, res) => {
    const { workerId } = req.body;
    try {
      // Ensure the worker belongs to this shop
      const worker = await Worker.findOne({ _id: workerId, shop: req.shopId });
      if (!worker) {
        return res.status(404).json({ message: 'Worker not found or not authorized for this shop.' });
      }

      // Find any incomplete attendance records for this worker (records without checkOut)
      const incompleteRecords = await Attendance.find({ 
        worker: workerId, 
        checkOut: { $exists: false }
      }).sort({ checkIn: -1 });
      
      // If there are incomplete records, worker cannot check in
      if (incompleteRecords.length > 0) {
        return res.status(400).json({ 
          message: 'Worker has an incomplete attendance record. Please check out first.' 
        });
      }
      
      // Check for incomplete record from previous day
      const incompletePreviousRecord = await checkForIncompletePreviousDayRecord(workerId, req.shopId);
      if (incompletePreviousRecord) {
        return res.status(400).json({ 
          message: 'Worker has an incomplete attendance record from previous day. Please complete it first.',
          incompleteRecord: incompletePreviousRecord
        });
      }
      
      // Allow check-in - no incomplete records found
      const newAttendance = new Attendance({ worker: workerId, checkIn: new Date() });
      await newAttendance.save();
      res.status(201).json(newAttendance);
    } catch (error) {
      console.error('Error during check-in:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  };

exports.checkOut = async (req, res) => {
    const { workerId } = req.body;
    try {
      // Ensure the worker belongs to this shop
      const worker = await Worker.findOne({ _id: workerId, shop: req.shopId });
      if (!worker) {
        return res.status(404).json({ message: 'Worker not found or not authorized for this shop.' });
      }

      // Find any incomplete attendance records for this worker (records without checkOut)
      const incompleteRecords = await Attendance.find({ 
        worker: workerId, 
        checkOut: { $exists: false }
      }).sort({ checkIn: -1 });
      
      // Check if there's a record without check-out
      if (incompleteRecords.length > 0) {
        // Update the latest incomplete record with check-out time
        const latestIncompleteRecord = incompleteRecords[0];
        latestIncompleteRecord.checkOut = new Date();
        
        // Get worker shift details for calculation
        const worker = await Worker.findById(workerId).populate('shift');
        
        // Calculate attendance details for this specific in-out pair
        const attendanceDetails = calculateAttendanceDetails(
          latestIncompleteRecord.checkIn, 
          latestIncompleteRecord.checkOut, 
          worker.shift
        );
        
        // Update the record with calculated details
        latestIncompleteRecord.workingDuration = attendanceDetails.workingDuration;
        latestIncompleteRecord.lateArrival = attendanceDetails.lateArrival;
        latestIncompleteRecord.earlyLeaving = attendanceDetails.earlyLeaving;
        latestIncompleteRecord.totalPermissionTime = attendanceDetails.totalPermissionTime;
        latestIncompleteRecord.overtime = attendanceDetails.overtime;
        
        const attendanceRecord = await latestIncompleteRecord.save();
        res.json(attendanceRecord);
      } else {
        return res.status(404).json({ message: 'No active check-in found for this worker.' });
      }
    } catch (error) {
      console.error('Error during check-out:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  };

// Endpoint for manually correcting missing punches from previous day
exports.correctMissingPunch = async (req, res) => {
  const { workerId, checkOutTime } = req.body;
  
  if (!workerId || !checkOutTime) {
    return res.status(400).json({ message: 'Worker ID and check-out time are required.' });
  }
  
  try {
    // Ensure the worker belongs to this shop
    const worker = await Worker.findOne({ _id: workerId, shop: req.shopId });
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found or not authorized for this shop.' });
    }
    
    // Find incomplete record from previous day
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfYesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    
    const incompleteRecord = await Attendance.findOne({
      worker: workerId,
      checkIn: { $gte: startOfYesterday, $lt: startOfToday },
      checkOut: { $exists: false }
    }).sort({ checkIn: -1 });
    
    if (!incompleteRecord) {
      return res.status(404).json({ message: 'No incomplete attendance record found for previous day.' });
    }
    
    // Update the record with the provided check-out time
    incompleteRecord.checkOut = new Date(checkOutTime);
    incompleteRecord.isManualCorrection = true;
    
    // Get worker shift details for calculation
    const workerDetails = await Worker.findById(workerId).populate('shift');
    
    // Calculate attendance details for this specific in-out pair
    const attendanceDetails = calculateAttendanceDetails(
      incompleteRecord.checkIn, 
      incompleteRecord.checkOut, 
      workerDetails.shift
    );
    
    // Update the record with calculated details
    incompleteRecord.workingDuration = attendanceDetails.workingDuration;
    incompleteRecord.lateArrival = attendanceDetails.lateArrival;
    incompleteRecord.earlyLeaving = attendanceDetails.earlyLeaving;
    incompleteRecord.totalPermissionTime = attendanceDetails.totalPermissionTime;
    incompleteRecord.overtime = attendanceDetails.overtime;
    
    const updatedRecord = await incompleteRecord.save();
    
    res.json({ 
      message: 'Missing punch corrected successfully.',
      attendance: updatedRecord
    });
  } catch (error) {
    console.error('Error correcting missing punch:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getMonthlyAttendance = async (req, res) => {
    try {
        const { year, month } = req.params;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 1);
        
        // Only get workers belonging to this shop
        const workersQuery = { shop: req.shopId };
        
        const workers = await Worker.find(workersQuery).select('name username').lean();
        const attendanceRecords = await Attendance.find({ 
            $and: [
                { checkIn: { $gte: startDate, $lt: endDate } },
                { worker: { $in: await Worker.find({ shop: req.shopId }).distinct('_id') } }
            ]
        }).populate('worker', 'shift').lean();
        
        // Group attendance records by worker and date
        const groupedAttendance = groupAttendanceByWorkerAndDate(attendanceRecords);
        
        // Create response data with grouped records
        const responseData = workers.map(worker => {
            // Ensure worker has an _id before trying to access it
            if (worker && worker._id) {
                const workerId = worker._id.toString();
                const workerAttendanceByDate = groupedAttendance[workerId] || {};
                
                // Create an array to hold all attendance records grouped by date
                const attendanceRecordsGroupedByDate = [];
                
                // Process each date's records
                Object.keys(workerAttendanceByDate).forEach(dateKey => {
                    // Get all records for this date
                    const recordsForDate = workerAttendanceByDate[dateKey];
                    
                    // Create a consolidated record for this date
                    const consolidatedRecord = {
                        date: dateKey,
                        records: recordsForDate
                    };
                    
                    attendanceRecordsGroupedByDate.push(consolidatedRecord);
                });
                
                return {
                    ...worker,
                    attendanceRecordsGroupedByDate: attendanceRecordsGroupedByDate
                };
            }
            // Return worker as is if _id is missing
            return worker;
        });
        
        res.json(responseData);
    } catch (error) {
        console.error('Error fetching monthly attendance:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- RFID-based Attendance Logic for Shop ---
exports.recordRFIDAttendance = async (req, res) => {
    let { rfid } = req.body;

    // Handle whitespace in RFID values
    if (rfid) {
        // Trim leading/trailing whitespace but preserve internal whitespace
        rfid = rfid.trim();
    }

    if (!rfid) {
      return res.status(400).json({ message: 'RFID is required.' });
    }

    try {
      // Find worker by RFID and ensure they belong to this shop
      const worker = await Worker.findOne({ rfid, shop: req.shopId });
      if (!worker) {
        return res.status(404).json({ message: 'No worker found with this RFID in your shop.' });
      }

      // Use the unified attendance handler
      const result = await handleAttendancePunch(worker._id);
      
      res.json({
          ...result,
          rfid: worker.rfid
      });

    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
};

// Helper function to calculate Euclidean distance between two descriptors
function calculateEuclideanDistance(desc1, desc2) {
    if (!desc1 || !desc2 || desc1.length !== desc2.length) {
        return Infinity;
    }
    
    let sum = 0;
    for (let i = 0; i < desc1.length; i++) {
        const diff = desc1[i] - desc2[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}

// --- Face Recognition for Attendance (Shop-specific) ---
exports.recognizeFaceForAttendance = async (req, res) => {
    const { faceDescriptor, workerId, confidence } = req.body;
    const { file } = req;
    
    // Log the incoming request for debugging
    console.log('Face recognition request received:', { faceDescriptor: !!faceDescriptor, workerId, confidence, hasFile: !!file });
    
    // Check if we have either faceDescriptor (from React) or file (from traditional upload)
    if (!faceDescriptor && !file) {
        return res.status(400).json({ message: 'Face descriptor or image is required.' });
    }

    // Clean up file if provided
    const cleanupFile = () => {
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
    };

    try {
        // 1. Fetch workers with encodings, filtered by this specific shop
        const workerQuery = { 
            "faceEncodings.0": { "$exists": true },
            shop: req.shopId  // Only fetch workers from this shop
        };
        
        const workersWithEncodings = await Worker.find(workerQuery).select('_id name faceEncodings lastAttendanceTime');
        console.log('Found workers with encodings:', workersWithEncodings.length);
        
        if (!workersWithEncodings.length) {
            cleanupFile();
            return res.status(404).json({ message: 'No workers are enrolled for face recognition in your shop.' });
        }

        let descriptorToUse = faceDescriptor;
        
        // If we don't have a faceDescriptor but have a file, we would normally process the file here
        // But since we're using React-based face recognition, the frontend sends descriptors directly
        if (!faceDescriptor) {
            cleanupFile();
            return res.status(400).json({ message: 'Face descriptor is required for recognition.' });
        }

        // Parse faceDescriptor if it's a string (from multipart/form-data or JSON)
        if (typeof descriptorToUse === 'string') {
            try {
                descriptorToUse = JSON.parse(descriptorToUse);
                console.log('Parsed face descriptor, length:', descriptorToUse.length);
            } catch (parseError) {
                console.error('Error parsing faceDescriptor:', parseError);
                cleanupFile();
                return res.status(400).json({ message: 'Invalid faceDescriptor format. Must be valid JSON array.' });
            }
        }

        // 2. Find the best match by comparing descriptors
        let bestMatch = null;
        let bestDistance = Infinity;
        const threshold = 0.5; // Similarity threshold

        for (const worker of workersWithEncodings) {
            for (const enrolledDescriptor of worker.faceEncodings) {
                // Calculate Euclidean distance between descriptors
                const distance = calculateEuclideanDistance(descriptorToUse, enrolledDescriptor);
                
                if (distance < threshold && distance < bestDistance) {
                    bestDistance = distance;
                    bestMatch = worker;
                }
            }
        }

        if (!bestMatch) {
            cleanupFile();
            return res.status(404).json({ message: 'Face not recognized. Please enroll first or try again.' });
        }

        const workerIdMatch = bestMatch._id;
        const worker = bestMatch;
        const confidenceScore = confidence || Math.round((1 - bestDistance) * 100);

        console.log('Face recognized:', { worker: worker.name, confidence: confidenceScore, distance: bestDistance });
        
        // Check for cooldown period (2 minutes)
        const now = new Date();
        if (worker.lastAttendanceTime && (now.getTime() - worker.lastAttendanceTime.getTime()) < 120000) {
            const remainingTime = Math.ceil((120000 - (now.getTime() - worker.lastAttendanceTime.getTime())) / 1000);
            cleanupFile();
            return res.status(429).json({
                message: `Please wait ${remainingTime} seconds before marking attendance again.`,
                cooldown: remainingTime
            });
        }
        
        // Use the unified attendance handler
        const result = await handleAttendancePunch(workerIdMatch);
        
        cleanupFile();
        
        res.json({
            ...result,
            confidence: confidenceScore,
            message: `${result.message} (${confidenceScore}% match).`
        });

    } catch (error) {
        cleanupFile();
        console.error('Face recognition error:', error);
        res.status(500).json({ message: 'Server error during face recognition.' });
    }
};

// --- Face Enrollment Logic (React-based) ---
exports.enrollFace = async (req, res) => {
    console.log('=== Face Enrollment Request Received ===');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Content-Type header:', req.headers['content-type']);
    
    const { workerId } = req.body;
    let { faceDescriptors } = req.body;
    const files = req.files;

    // Clean up files if validation fails
    const cleanupFiles = () => {
        if (files) {
            files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }
    };

    // Parse faceDescriptors if it's a string (from multipart/form-data)
    if (typeof faceDescriptors === 'string') {
        try {
            faceDescriptors = JSON.parse(faceDescriptors);
            console.log('Parsed faceDescriptors from string:', faceDescriptors.length, 'descriptors');
        } catch (parseError) {
            console.error('Error parsing faceDescriptors:', parseError);
            console.error('Raw faceDescriptors string:', faceDescriptors);
            cleanupFiles();
            return res.status(400).json({ message: 'Invalid faceDescriptors format. Must be valid JSON array.' });
        }
    }
    
    console.log('After parsing:', {
        faceDescriptorsType: typeof faceDescriptors,
        faceDescriptors,
        isArray: Array.isArray(faceDescriptors),
        length: Array.isArray(faceDescriptors) ? faceDescriptors.length : 0
    });

    console.log('Received enrollment request:', {
        workerId,
        faceDescriptorsType: typeof faceDescriptors,
        faceDescriptors: faceDescriptors,
        faceDescriptorsLength: Array.isArray(faceDescriptors) ? faceDescriptors.length : 'not array',
        filesCount: files ? files.length : 0,
        files: files
    });

    // Fixed validation - properly check for required fields
    // We need workerId and either faceDescriptors (from frontend) or files (from upload)
    if (!workerId) {
        cleanupFiles();
        return res.status(400).json({ message: 'Worker ID is required.' });
    }
    
    // Check if we have face descriptors or files
    const hasFaceDescriptors = faceDescriptors && Array.isArray(faceDescriptors) && faceDescriptors.length > 0;
    const hasFiles = files && files.length > 0;
    
    console.log('Validation check:', {
        hasFaceDescriptors,
        hasFiles,
        faceDescriptorsValid: hasFaceDescriptors
    });
    
    if (!hasFaceDescriptors && !hasFiles) {
        cleanupFiles();
        return res.status(400).json({ message: 'Either face descriptors or face images are required.' });
    }

    // Check if face recognition service is available
    if (!FACE_RECOGNITION_ENABLED) {
        cleanupFiles();
        return res.status(503).json({ 
            message: 'Face recognition service is currently disabled. Please use RFID attendance instead.' 
        });
    }

    try {
        // For shop users, ensure the worker belongs to their shop
        let workerQuery = { _id: workerId, shop: req.shopId };
        
        const worker = await Worker.findOne(workerQuery);
        if (!worker) {
            cleanupFiles();
            return res.status(404).json({ message: 'Worker not found or not authorized for this shop.' });
        }

        let descriptors = [];
        
        // If face descriptors are provided directly (from React), use them
        if (faceDescriptors && Array.isArray(faceDescriptors)) {
            descriptors = faceDescriptors;
        }
        
        // If we have files but no descriptors, we might want to extract descriptors from files
        // But in this React-based implementation, descriptors are sent directly from frontend
        
        console.log('Processing descriptors:', {
            descriptorsCount: descriptors.length,
            firstDescriptorType: descriptors.length > 0 ? typeof descriptors[0] : 'none',
            firstDescriptorLength: descriptors.length > 0 && Array.isArray(descriptors[0]) ? descriptors[0].length : 'N/A'
        });

        if (descriptors.length === 0 && (!files || files.length === 0)) {
            cleanupFiles();
            return res.status(400).json({ message: 'No valid face descriptors or images found. Please ensure faces are properly detected.' });
        }

        // Save face descriptors to the database for recognition
        if (descriptors.length > 0) {
            // Ensure descriptors are properly formatted as arrays of numbers
            const formattedDescriptors = descriptors.map(desc => 
                Array.isArray(desc) ? desc : Array.from(desc)
            );
            worker.faceEncodings = (worker.faceEncodings || []).concat(formattedDescriptors);
        }
        
        // Handle image files if provided - store as binary data in database for display
        if (files && files.length > 0) {
            const imageDocuments = [];
            for (const file of files) {
                if (fs.existsSync(file.path)) {
                    // Read the file as binary data
                    const imageData = fs.readFileSync(file.path);
                    
                    // Create image document with binary data
                    imageDocuments.push({
                        data: imageData,
                        contentType: file.mimetype || 'image/jpeg',
                        originalName: file.originalname
                    });
                    
                    // Delete the temporary file
                    fs.unlinkSync(file.path);
                }
            }
            
            // Add the binary image data to the worker's faceImages array
            worker.faceImages = (worker.faceImages || []).concat(imageDocuments);
        }
        
        await worker.save();

        res.status(200).json({ 
            message: 'Face enrolled successfully with high-accuracy descriptors.',
            descriptorsSaved: descriptors.length
        });

    } catch (error) {
        console.error('Error enrolling face:', error);
        cleanupFiles();
        res.status(500).json({ message: 'Server error during face enrollment.' });
    }
};

// --- Service Status Check (React-based) ---
exports.getFaceRecognitionStatus = async (req, res) => {
    try {
        // For React-based face recognition, check if service is enabled
        const status = {
            enabled: FACE_RECOGNITION_ENABLED,
            reactFaceApiAvailable: true, // face-api.js is always available once installed
            faceRecognitionAvailable: true, // React-based recognition is available
            serviceReady: FACE_RECOGNITION_ENABLED,
            missingDependencies: [],
            currentMode: 'React Face Recognition (High Accuracy)',
            setupInstructions: {
                step1: 'Face-api.js models are loaded automatically',
                step2: 'High-accuracy face recognition using TensorFlow.js',
                step3: 'No additional dependencies required',
                step4: 'Service is ready to use',
                note: 'React-based face recognition provides excellent accuracy and performance',
                currentStatus: 'React face recognition is active and ready'
            },
            alternatives: [
                {
                    name: 'React Face Recognition',
                    description: 'High-accuracy face recognition using face-api.js and TensorFlow.js',
                    available: true,
                    recommended: true
                },
                {
                    name: 'RFID Attendance',
                    description: 'Use RFID cards for worker check-in/check-out',
                    available: true,
                    recommended: false
                },
                {
                    name: 'Manual Attendance',
                    description: 'Manual attendance tracking and reporting',
                    available: true,
                    recommended: false
                }
            ],
            features: [
                'Real-time face detection and recognition',
                'High accuracy with face-api.js neural networks',
                'Works entirely in the browser',
                'No server-side dependencies required',
                'Automatic model loading and initialization',
                'Confidence scoring for matches'
            ]
        };
        
        res.json(status);
    } catch (error) {
        console.error('Error checking face recognition status:', error);
        res.status(500).json({ 
            message: 'Unable to check service status',
            enabled: false,
            serviceReady: false,
            currentMode: 'Unavailable'
        });
    }
};