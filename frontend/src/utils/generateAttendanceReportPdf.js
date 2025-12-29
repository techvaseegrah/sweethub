import html2pdf from 'html2pdf.js';

export const generateAttendanceReportPdf = (attendanceData, filters = {}) => {
  // Format the date
  const currentDate = new Date().toLocaleDateString();
  
  // Prepare data for the report
  const exportData = [];
  
  attendanceData.forEach(entry => {
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
        'Date': formatDate(entry.date),
        'Punch In': punchInTimes[i] ? punchInTimes[i].time : '--:--',
        'Punch Out': punchOutTimes[i] ? punchOutTimes[i].time : '--:--',
        'Total Duration': totalDuration
      });
    }
  });

  // Calculate summary statistics
  const totalEmployees = [...new Set(exportData.map(item => item['Employee Name']))].length;
  const totalRecords = exportData.length;

  // Generate employee summary
  const employeeSummaries = exportData.reduce((acc, record) => {
    const employeeName = record['Employee Name'];
    if (!acc[employeeName]) {
      acc[employeeName] = {
        name: employeeName,
        totalRecords: 0,
        totalDuration: '00.00.00'
      };
    }
    acc[employeeName].totalRecords++;
    return acc;
  }, {});

  // Generate employee summary rows
  const employeeSummaryRows = Object.values(employeeSummaries).map(employee => {
    return `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-size: 14px;">${employee.name}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 14px;">${employee.totalRecords}</td>
      </tr>
    `;
  }).join('');

  // Generate detailed attendance records
  const attendanceRecords = exportData.map(record => {
    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px;">${record['Employee Name']}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px; text-align: center;">${record['RF ID']}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px;">${record['Date']}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px; text-align: center;">${record['Punch In']}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px; text-align: center;">${record['Punch Out']}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px; text-align: right;">${record['Total Duration']}</td>
      </tr>
    `;
  }).join('');

  // Generate filter information
  const filterInfo = [];
  if (filters.date) filterInfo.push(`Date: ${filters.date}`);
  if (filters.worker) filterInfo.push(`Worker: ${filters.worker}`);

  const filterText = filterInfo.length > 0 ? 
    `<p style="margin: 8px 0; font-size: 16px;"><strong>Filters Applied:</strong> ${filterInfo.join(', ')}</p>` : 
    '';

  // Generate the complete HTML for the PDF
  const reportHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 1000px; margin: 0 auto;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #333; padding-bottom: 20px;">
        <h1 style="color: #333; margin: 0; font-size: 32px;">The Sweet Hub</h1>
        <p style="color: #666; font-size: 16px; margin: 10px 0 5px 0;">156, Dubai Main Road, Thanjavur, Tamil Nadu - 613006</p>
        <p style="color: #666; font-size: 16px; margin: 5px 0;">Phone: 7339200636</p>
      </div>
      
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #333; margin: 0; font-size: 28px;">ATTENDANCE REPORT</h2>
        <p style="color: #666; font-size: 18px; margin: 15px 0;">
          Generated on ${currentDate}
        </p>
        ${filterText}
      </div>
      
      <!-- Summary -->
      <div style="margin-bottom: 30px; background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6;">
        <h3 style="color: #333; margin-top: 0; font-size: 20px;">Report Summary</h3>
        <div style="display: flex; justify-content: space-around; text-align: center;">
          <div>
            <p style="font-size: 16px; color: #666; margin: 0;">Total Employees</p>
            <p style="font-size: 28px; font-weight: bold; color: #333; margin: 10px 0 0 0;">${totalEmployees}</p>
          </div>
          <div>
            <p style="font-size: 16px; color: #666; margin: 0;">Total Records</p>
            <p style="font-size: 28px; font-weight: bold; color: #333; margin: 10px 0 0 0;">${totalRecords}</p>
          </div>
        </div>
      </div>
      
      <!-- Employee Summary -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 15px; font-size: 20px; padding-bottom: 10px; border-bottom: 2px solid #eee;">Employee Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #e9ecef;">
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; font-size: 16px; font-weight: bold;">Employee Name</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: center; font-size: 16px; font-weight: bold;">Total Records</th>
            </tr>
          </thead>
          <tbody>
            ${employeeSummaryRows}
          </tbody>
        </table>
      </div>
      
      <!-- Detailed Attendance -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 15px; font-size: 20px; padding-bottom: 10px; border-bottom: 2px solid #eee;">Detailed Attendance Records</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #e9ecef;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 14px; font-weight: bold;">Employee Name</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 14px; font-weight: bold;">RF ID</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 14px; font-weight: bold;">Date</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 14px; font-weight: bold;">Punch In</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 14px; font-weight: bold;">Punch Out</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold;">Total Duration</th>
            </tr>
          </thead>
          <tbody>
            ${attendanceRecords}
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
        <p style="color: #777; font-size: 14px; margin: 0;">
          Generated on ${currentDate} at ${new Date().toLocaleTimeString()}
        </p>
        <p style="color: #777; font-size: 14px; margin: 5px 0 0 0;">
          Report generated by The Sweet Hub Attendance Management System
        </p>
      </div>
    </div>
  `;

  const opt = {
    margin: 15,
    filename: `attendance_report_${currentDate.replace(/\//g, '-')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  // Generate and download the PDF
  html2pdf().from(reportHtml).set(opt).save();
};

// Helper function to format time in 12-hour format with AM/PM
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