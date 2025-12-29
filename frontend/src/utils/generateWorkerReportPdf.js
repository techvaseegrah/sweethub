import html2pdf from 'html2pdf.js';

export const generateWorkerReportPdf = (workers, departments, filters = {}) => {
  // Format the date
  const currentDate = new Date().toLocaleDateString();
  
  // Calculate summary statistics
  const totalWorkers = workers.length;
  const totalSalary = workers.reduce((sum, worker) => sum + (parseFloat(worker.salary) || 0), 0);
  
  // Group workers by department if needed
  let workersByDepartment = {};
  let filteredWorkers = workers;
  
  if (filters.department && filters.department !== 'All') {
    const selectedDepartmentName = departments.find(dept => dept._id === filters.department)?.name || filters.department;
    filteredWorkers = workers.filter(worker => 
      worker.department?._id === filters.department
    );
    workersByDepartment[selectedDepartmentName] = filteredWorkers;
  } else {
    // Group all workers by their departments
    workers.forEach(worker => {
      const departmentName = worker.department?.name || 'No Department';
      if (!workersByDepartment[departmentName]) {
        workersByDepartment[departmentName] = [];
      }
      workersByDepartment[departmentName].push(worker);
    });
  }

  // Generate department summaries
  const departmentSummaries = Object.keys(workersByDepartment).map(departmentName => {
    const departmentWorkers = workersByDepartment[departmentName];
    const departmentTotalSalary = departmentWorkers.reduce((sum, worker) => sum + (parseFloat(worker.salary) || 0), 0);
    
    return `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; font-size: 14px;">${departmentName}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 14px;">${departmentWorkers.length}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px;">₹${departmentTotalSalary.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  // Generate worker items table
  const workerItems = filteredWorkers.map(worker => {
    const departmentName = worker.department?.name || 'No Department';
    const workingHours = worker.workingHours?.from && worker.workingHours?.to 
      ? `${formatTimeTo12Hour(worker.workingHours.from)} - ${formatTimeTo12Hour(worker.workingHours.to)}` 
      : 'Not set';
    const lunchBreak = worker.lunchBreak?.from && worker.lunchBreak?.to 
      ? `${formatTimeTo12Hour(worker.lunchBreak.from)} - ${formatTimeTo12Hour(worker.lunchBreak.to)}` 
      : 'Not set';
    
    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px; font-weight: bold;">${worker.name || 'N/A'}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px;">${departmentName}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-size: 14px;">₹${(parseFloat(worker.salary) || 0).toFixed(2)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px;">${workingHours}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px;">${lunchBreak}</td>
        <td style="padding: 8px; border: 1px solid #ddd; font-size: 14px;">${worker.rfid || 'Not Assigned'}</td>
      </tr>
    `;
  }).join('');

  // Generate filter information
  const filterInfo = [];
  if (filters.department && filters.department !== 'All') {
    const departmentName = departments.find(dept => dept._id === filters.department)?.name || filters.department;
    filterInfo.push(`Department: ${departmentName}`);
  }

  const filterText = filterInfo.length > 0 ? 
    `<p style="margin: 8px 0; font-size: 16px;"><strong>Filters Applied:</strong> ${filterInfo.join(', ')}</p>` : 
    '';

  // Utility function to format time in 12-hour format with AM/PM
  const formatTimeTo12Hour = (time24) => {
    if (!time24) return 'Not set';
    const [hours, minutes] = time24.split(':');
    let hoursInt = parseInt(hours, 10);
    const ampm = hoursInt >= 12 ? 'PM' : 'AM';
    hoursInt = hoursInt % 12 || 12;
    return `${hoursInt}:${minutes} ${ampm}`;
  };

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
        <h2 style="color: #333; margin: 0; font-size: 28px;">WORKER REPORT</h2>
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
            <p style="font-size: 16px; color: #666; margin: 0;">Total Workers</p>
            <p style="font-size: 28px; font-weight: bold; color: #333; margin: 10px 0 0 0;">${totalWorkers}</p>
          </div>
          <div>
            <p style="font-size: 16px; color: #666; margin: 0;">Total Salary</p>
            <p style="font-size: 28px; font-weight: bold; color: #333; margin: 10px 0 0 0;">₹${totalSalary.toFixed(2)}</p>
          </div>
        </div>
      </div>
      
      ${Object.keys(workersByDepartment).length > 0 ? `
      <!-- Department Summary -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 15px; font-size: 20px; padding-bottom: 10px; border-bottom: 2px solid #eee;">Workers by Department</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #e9ecef;">
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left; font-size: 16px; font-weight: bold;">Department</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: center; font-size: 16px; font-weight: bold;">Worker Count</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: right; font-size: 16px; font-weight: bold;">Total Salary</th>
            </tr>
          </thead>
          <tbody>
            ${departmentSummaries}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      <!-- Detailed Workers -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #333; margin-bottom: 15px; font-size: 20px; padding-bottom: 10px; border-bottom: 2px solid #eee;">Detailed Worker Information</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #e9ecef;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 14px; font-weight: bold;">Worker Name</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 14px; font-weight: bold;">Department</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; font-size: 14px; font-weight: bold;">Salary</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 14px; font-weight: bold;">Working Hours</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 14px; font-weight: bold;">Lunch Break</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 14px; font-weight: bold;">RFID</th>
            </tr>
          </thead>
          <tbody>
            ${workerItems}
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
        <p style="color: #777; font-size: 14px; margin: 0;">
          Generated on ${currentDate} at ${new Date().toLocaleTimeString()}
        </p>
        <p style="color: #777; font-size: 14px; margin: 5px 0 0 0;">
          Report generated by The Sweet Hub Worker Management System
        </p>
      </div>
    </div>
  `;

  const opt = {
    margin: 15,
    filename: `worker_report_${currentDate.replace(/\//g, '-')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  // Generate and download the PDF
  html2pdf().from(reportHtml).set(opt).save();
};