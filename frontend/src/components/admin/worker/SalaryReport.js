import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import { createPortal } from 'react-dom';

const SalaryReport = () => {
    const [workers, setWorkers] = useState([]);
    const [filteredWorkers, setFilteredWorkers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [batches, setBatches] = useState({}); // Store batch information
    const [holidays, setHolidays] = useState([]); // Store holiday information
    const [generatedReport, setGeneratedReport] = useState(null);
    
    // State for Add Incentive Modal
    const [showIncentiveModal, setShowIncentiveModal] = useState(false);
    const [selectedWorkerForIncentive, setSelectedWorkerForIncentive] = useState(null);
    const [incentiveAmount, setIncentiveAmount] = useState('');
    const [incentiveMonth, setIncentiveMonth] = useState(new Date().getMonth() + 1); // Default to current month
    const [incentiveYear, setIncentiveYear] = useState(new Date().getFullYear());
    
    // State for Generate Report Modal
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedWorkerForReport, setSelectedWorkerForReport] = useState(null);
    const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1); // Default to current month
    const [reportYear, setReportYear] = useState(new Date().getFullYear());
    const [generatingReport, setGeneratingReport] = useState(false);

    // Fetch all workers, batch settings, and holidays
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                // Fetch workers
                const workersResponse = await axios.get('/admin/workers');
                console.log('Workers data:', workersResponse.data); // Debug log
                
                // Fetch batch settings
                const batchesResponse = await axios.get('/admin/settings/batches');
                console.log('Batches data:', batchesResponse.data); // Debug log
                
                // Fetch holidays
                const holidaysResponse = await axios.get('/admin/holidays');
                console.log('Holidays data:', holidaysResponse.data); // Debug log
                
                // Create a map of batch ID to batch name
                const batchMap = {};
                batchesResponse.data.forEach(batch => {
                    batchMap[batch.id] = batch.name || `Batch ${batch.id}`;
                });
                setBatches(batchMap);
                
                // Set holidays
                setHolidays(holidaysResponse.data);
                
                setWorkers(workersResponse.data);
                setFilteredWorkers(workersResponse.data);
            } catch (err) {
                setError('Failed to fetch data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Filter workers based on search term
    useEffect(() => {
        if (!searchTerm) {
            setFilteredWorkers(workers);
            return;
        }

        const filtered = workers.filter(worker => {
            const name = worker.name?.toLowerCase() || '';
            // Use worker RFID as employee ID
            const employeeId = (worker.rfid)?.toLowerCase() || '';
            const department = worker.department?.name?.toLowerCase() || '';
            // Search by working hours
            const workingHours = formatWorkingHours(worker)?.toLowerCase() || '';
            
            return (
                name.includes(searchTerm.toLowerCase()) ||
                employeeId.includes(searchTerm.toLowerCase()) ||
                department.includes(searchTerm.toLowerCase()) ||
                workingHours.includes(searchTerm.toLowerCase())
            );
        });

        setFilteredWorkers(filtered);
    }, [searchTerm, workers, batches]);

    // Function to determine worker's batch name
    const getWorkerBatchName = (worker) => {
        // This is a simplified approach - in a real implementation, you would need
        // a more sophisticated way to match workers to batches
        // For now, we'll just return a placeholder or try to find a match
        if (worker.batchId && batches[worker.batchId]) {
            return batches[worker.batchId];
        }
        
        // If no direct batchId, we could try to match by working hours
        // This is a simplified example - you would need more robust matching logic
        return 'N/A';
    };

    // Function to format working hours
    const formatWorkingHours = (worker) => {
        if (worker.workingHours && worker.workingHours.from && worker.workingHours.to) {
            return `${worker.workingHours.from} - ${worker.workingHours.to}`;
        }
        return 'N/A';
    };

    // Handle Add Incentive
    const handleAddIncentive = (worker) => {
        setSelectedWorkerForIncentive(worker);
        setIncentiveAmount('');
        setIncentiveMonth(new Date().getMonth() + 1);
        setIncentiveYear(new Date().getFullYear());
        setShowIncentiveModal(true);
    };

    // Submit Incentive
    const submitIncentive = async () => {
        if (!incentiveAmount || isNaN(incentiveAmount) || parseFloat(incentiveAmount) <= 0) {
            setError('Please enter a valid incentive amount');
            return;
        }

        try {
            // Call API to add incentive
            const response = await axios.post('/admin/incentives', {
                workerId: selectedWorkerForIncentive._id,
                amount: parseFloat(incentiveAmount),
                month: incentiveMonth,
                year: incentiveYear
            });
            
            setSuccess(`Incentive of ₹${incentiveAmount} added for ${selectedWorkerForIncentive.name}`);
            setShowIncentiveModal(false);
            
            // Refresh the worker list to get updated incentive data
            const workersResponse = await axios.get('/admin/workers');
            setWorkers(workersResponse.data);
            setFilteredWorkers(workersResponse.data);
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to add incentive: ' + (err.response?.data?.message || err.message));
            console.error('Incentive error:', err);
        }
    };

    // Handle Generate Report
    const handleGenerateReport = (worker) => {
        setSelectedWorkerForReport(worker);
        setReportMonth(new Date().getMonth() + 1);
        setReportYear(new Date().getFullYear());
        setGeneratedReport(null);
        setShowReportModal(true);
        // Call generateSalaryReport to populate the report data
        // Use a more reliable approach to ensure state is updated
        Promise.resolve().then(() => {
            generateSalaryReport();
        });
    };

    // Generate Salary Report
    const generateSalaryReport = async () => {
        if (!selectedWorkerForReport) return;
        
        setGeneratingReport(true);
        setError('');
        
        try {
            // In a real implementation, you would call an API endpoint to generate the report
            // For now, we'll mock the data in the format you've shown
            const currentDate = new Date(reportYear, reportMonth - 1, 1);
            const daysInMonth = new Date(reportYear, reportMonth, 0).getDate();
            
            // Generate mock daily data
            const dailyData = [];
            let totalWorkingDays = 0;
            let totalAbsentDays = 0;
            let totalHolidays = 0;
            let totalSundays = 0;
            let totalWorkingHours = 0;
            let totalPermissionTime = 0;
            let totalDeductions = 0;
            
            // Generate data for each day of the month
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(reportYear, reportMonth - 1, day);
                const dayOfWeek = date.getDay();
                const isSunday = dayOfWeek === 0;
                const isHoliday = Math.random() > 0.95; // 5% chance of being a holiday for demo
                
                // Determine status
                let status = 'Present';
                if (isSunday) {
                    status = 'Sunday';
                } else if (isHoliday) {
                    status = 'Holiday';
                } else if (Math.random() > 0.8) { // 20% chance of being absent
                    status = 'Absent';
                }
                
                // Calculate values based on status
                if (status === 'Present') {
                    totalWorkingDays++;
                    
                    // Generate mock times
                    const inTime = new Date(date);
                    inTime.setHours(9, 30, 0, 0);
                    
                    const outTime = new Date(date);
                    outTime.setHours(18, 30, 0, 0);
                    
                    // Add some randomness to times
                    inTime.setMinutes(inTime.getMinutes() + Math.floor(Math.random() * 20));
                    outTime.setMinutes(outTime.getMinutes() - Math.floor(Math.random() * 20));
                    
                    // Calculate delay time (if late entry)
                    const scheduledInTime = new Date(date);
                    scheduledInTime.setHours(9, 0, 0, 0);
                    const delayMinutes = Math.max(0, (inTime - scheduledInTime) / (1000 * 60));
                    
                    // Mock delay deduction (₹0.62 per minute as in your example)
                    const delayDeduction = delayMinutes * 0.6173;
                    
                    // Calculate working time
                    const workingTimeMs = outTime - inTime;
                    const workingHours = workingTimeMs / (1000 * 60 * 60);
                    
                    dailyData.push({
                        date: date.getDate(),
                        status,
                        inTime: inTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        outTime: outTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        delayTime: delayMinutes > 0 ? `${Math.round(delayMinutes)} mins` : '-',
                        delayDeduction: delayDeduction > 0 ? `₹${delayDeduction.toFixed(2)}` : '₹0.00'
                    });
                    
                    totalWorkingHours += workingHours;
                    totalPermissionTime += 0; // Simplified for demo
                    totalDeductions += delayDeduction;
                } else if (status === 'Absent') {
                    totalAbsentDays++;
                    dailyData.push({
                        date: date.getDate(),
                        status,
                        inTime: 'Absent',
                        outTime: 'Absent',
                        delayTime: '-',
                        delayDeduction: '₹333.33' // Full day deduction
                    });
                    totalDeductions += 333.33;
                } else if (status === 'Holiday') {
                    totalHolidays++;
                    dailyData.push({
                        date: date.getDate(),
                        status,
                        inTime: '-',
                        outTime: '-',
                        delayTime: '-',
                        delayDeduction: '₹0.00'
                    });
                } else if (status === 'Sunday') {
                    totalSundays++;
                    dailyData.push({
                        date: date.getDate(),
                        status,
                        inTime: '-',
                        outTime: '-',
                        delayTime: '-',
                        delayDeduction: '₹0.00'
                    });
                }
            }
            
            // Calculate salary details
            const originalSalary = parseFloat(selectedWorkerForReport.salary) || 0;
            const totalDaysInPeriod = daysInMonth;
            const actualWorkingDays = totalWorkingDays; // Simplified for demo
            
            // Calculate per day salary
            const totalWorkingDaysForCalc = 25; // Example: 30 days - 5 Sundays
            const perDaySalary = originalSalary / totalWorkingDaysForCalc;
            
            // Calculate per minute salary (assuming 8 hours per day = 480 minutes)
            const perMinuteSalary = perDaySalary / 480;
            
            // Calculate actual earned salary
            const absentDeduction = totalAbsentDays * (originalSalary / totalWorkingDaysForCalc);
            const permissionDeduction = totalPermissionTime * perMinuteSalary;
            const totalFinalDeductions = totalDeductions + absentDeduction + permissionDeduction;
            const actualEarnedSalary = originalSalary - totalFinalDeductions;
            
            // Add total salary for day to each daily entry
            const dailyDataWithSalary = dailyData.map(entry => {
                let totalSalaryForDay = 0;
                
                if (entry.status === 'Present') {
                    // For present days, calculate per day salary minus delay deductions
                    const delayDeductionValue = parseFloat(entry.delayDeduction.replace('₹', '')) || 0;
                    totalSalaryForDay = perDaySalary - delayDeductionValue;
                } else if (entry.status === 'Absent') {
                    // For absent days, no salary
                    totalSalaryForDay = 0;
                } else if (entry.status === 'Holiday' || entry.status === 'Sunday') {
                    // For holidays and Sundays, full per day salary (paid leave)
                    totalSalaryForDay = perDaySalary;
                }
                
                return {
                    ...entry,
                    totalSalaryForDay: `₹${totalSalaryForDay.toFixed(2)}`
                };
            });
            
            setGeneratedReport({
                worker: selectedWorkerForReport,
                month: reportMonth,
                year: reportYear,
                summary: {
                    employeeId: selectedWorkerForReport.user?.username || 'N/A',
                    originalSalary: `₹${originalSalary.toFixed(2)}`,
                    actualEarnedSalary: `₹${actualEarnedSalary.toFixed(2)}`,
                    totalFinalSalary: `₹${actualEarnedSalary.toFixed(2)}`,
                    totalDaysInPeriod,
                    totalWorkingDays,
                    totalAbsentDays,
                    totalHolidays,
                    totalSundays,
                    actualWorkingDays,
                    totalWorkingHours: totalWorkingHours.toFixed(2),
                    totalPermissionTime: totalPermissionTime.toFixed(2),
                    absentDeduction: `₹${absentDeduction.toFixed(2)}`,
                    permissionDeduction: `₹${permissionDeduction.toFixed(2)}`,
                    totalDeductions: `₹${totalFinalDeductions.toFixed(2)}`,
                    attendanceRate: `${((totalWorkingDays / totalDaysInPeriod) * 100).toFixed(2)}%`,
                    perMinuteSalary: `₹${perMinuteSalary.toFixed(4)}`
                },
                dailyData: dailyDataWithSalary
            });
        } catch (err) {
            setError('Failed to generate salary report');
            console.error('Salary report error:', err);
        } finally {
            setGeneratingReport(false);
        }
    };

    // Download PDF Report
    const downloadPDFReport = () => {
        // In a real implementation, you would generate and download a PDF
        // For now, we'll just show an alert
        alert('PDF download functionality would be implemented here');
    };

    // Get month name from number
    const getMonthName = (monthNumber) => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[monthNumber - 1] || '';
    };

    // Function to calculate total salary including incentives for current month
    const calculateTotalSalary = (worker) => {
        const baseSalary = parseFloat(worker.salary) || 0;
        const currentMonthIncentives = worker.currentMonthIncentives || 0;
        return baseSalary + currentMonthIncentives;
    };

    // Incentive Modal Component
    const IncentiveModal = () => {
        if (!showIncentiveModal) return null;

        return createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Incentive</h3>
                        
                        {selectedWorkerForIncentive && (
                            <div className="mb-4">
                                <p className="text-gray-700">
                                    <span className="font-medium">Worker:</span> {selectedWorkerForIncentive.name}
                                </p>
                            </div>
                        )}
                        
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Month
                            </label>
                            <select
                                value={incentiveMonth}
                                onChange={(e) => setIncentiveMonth(parseInt(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                                    <option key={month} value={month}>
                                        {getMonthName(month)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Year
                            </label>
                            <input
                                type="number"
                                value={incentiveYear}
                                onChange={(e) => setIncentiveYear(parseInt(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="2020"
                                max="2030"
                            />
                        </div>
                        
                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Incentive Amount (₹)
                            </label>
                            <input
                                type="number"
                                value={incentiveAmount}
                                onChange={(e) => setIncentiveAmount(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter incentive amount"
                                min="0"
                                step="0.01"
                                autoFocus
                            />
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowIncentiveModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={submitIncentive}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
                            >
                                Add Incentive
                            </button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    // Salary Report Modal Component
    const ReportModal = () => {
        if (!showReportModal) return null;

        return createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-screen overflow-y-auto">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Salary Report</h3>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        
                        {generatingReport && (
                            <div className="text-center py-4">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                <p className="mt-2 text-gray-600">Generating report...</p>
                            </div>
                        )}
                        
                        {generatedReport && (
                            <div className="space-y-6">
                                {/* Summary Section */}
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="text-md font-semibold text-gray-800 mb-3">Summary</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Employee ID</p>
                                            <p className="font-medium">{generatedReport.summary.employeeId}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Original Salary</p>
                                            <p className="font-medium">{generatedReport.summary.originalSalary}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Actual Earned Salary</p>
                                            <p className="font-medium text-green-600">{generatedReport.summary.actualEarnedSalary}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Total Final Salary</p>
                                            <p className="font-medium text-blue-600">{generatedReport.summary.totalFinalSalary}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Total Days</p>
                                            <p className="font-medium">{generatedReport.summary.totalDaysInPeriod}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Working Days</p>
                                            <p className="font-medium">{generatedReport.summary.totalWorkingDays}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Absent Days</p>
                                            <p className="font-medium">{generatedReport.summary.totalAbsentDays}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Holidays</p>
                                            <p className="font-medium">{generatedReport.summary.totalHolidays}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Sundays</p>
                                            <p className="font-medium">{generatedReport.summary.totalSundays}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Actual Working Days</p>
                                            <p className="font-medium">{generatedReport.summary.actualWorkingDays}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Working Hours</p>
                                            <p className="font-medium">{generatedReport.summary.totalWorkingHours} hrs</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Permission Time</p>
                                            <p className="font-medium">{generatedReport.summary.totalPermissionTime} mins</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Attendance Rate</p>
                                            <p className="font-medium">{generatedReport.summary.attendanceRate}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Absent Deduction</p>
                                            <p className="font-medium text-red-600">{generatedReport.summary.absentDeduction}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Permission Deduction</p>
                                            <p className="font-medium text-red-600">{generatedReport.summary.permissionDeduction}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Total Deductions</p>
                                            <p className="font-medium text-red-600">{generatedReport.summary.totalDeductions}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Per Minute Salary</p>
                                            <p className="font-medium">{generatedReport.summary.perMinuteSalary}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Daily Breakdown Table */}
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <h4 className="text-md font-semibold text-gray-800 p-4 bg-gray-50">Daily Breakdown</h4>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In Time</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Out Time</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delay Time</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delay Deduction</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Salary for Day</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {generatedReport.dailyData.map((entry, index) => (
                                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{entry.date} {new Date(generatedReport.year, generatedReport.month - 1, entry.date).toLocaleDateString('en-US', { month: 'long' })}</td>
                                                        <td className={`px-4 py-3 text-sm ${
                                                            entry.status === 'Present' ? 'text-green-600' : 
                                                            entry.status === 'Absent' ? 'text-red-600' : 
                                                            'text-blue-600'
                                                        }`}>
                                                            {entry.status}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{entry.inTime}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{entry.outTime}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{entry.delayTime}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{entry.delayDeduction}</td>
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.totalSalaryForDay}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Show message if no report is generated and not loading */}
                        {!generatingReport && !generatedReport && (
                            <div className="text-center py-4 text-gray-500">
                                <p>Select a worker and generate a report to view details.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">Salary Report</h3>
            </div>

            {success && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                    {success}
                </div>
            )}

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search workers by name, employee ID, department, or batch..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
            </div>

            {/* Loading Indicator */}
            {loading && (
                <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="mt-2 text-gray-600">Loading workers...</p>
                </div>
            )}

            {/* Workers Table */}
            {!loading && filteredWorkers.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="py-3 px-4 border-b text-left">Name</th>
                                <th className="py-3 px-4 border-b text-left">Salary</th>
                                <th className="py-3 px-4 border-b text-left">Salary (This Month)</th>
                                <th className="py-3 px-4 border-b text-left">Batch Name</th>
                                <th className="py-3 px-4 border-b text-left">Employee ID</th>
                                <th className="py-3 px-4 border-b text-left">Department</th>
                                <th className="py-3 px-4 border-b text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredWorkers.map((worker, index) => (
                                <tr key={worker._id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                    <td className="py-3 px-4 border-b">{worker.name}</td>
                                    <td className="py-3 px-4 border-b">₹{worker.salary || 0}</td>
                                    <td className="py-3 px-4 border-b">₹{calculateTotalSalary(worker)}</td>
                                    <td className="py-3 px-4 border-b">{formatWorkingHours(worker)}</td>
                                    <td className="py-3 px-4 border-b">{worker.rfid || 'N/A'}</td>
                                    <td className="py-3 px-4 border-b">{worker.department?.name || 'N/A'}</td>
                                    <td className="py-3 px-4 border-b">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleAddIncentive(worker)}
                                                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none text-sm flex items-center"
                                                title="Add Incentive"
                                            >
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                                </svg>
                                                Incentive
                                            </button>
                                            <button
                                                onClick={() => handleGenerateReport(worker)}
                                                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none text-sm flex items-center"
                                                title="Generate Report"
                                            >
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                                </svg>
                                                Report
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                        </tbody>
                    </table>
                </div>
            )}

            {/* No Data Message */}
            {!loading && filteredWorkers.length === 0 && !error && (
                <div className="text-center py-8 text-gray-500">
                    <p>No workers found.</p>
                </div>
            )}

            {/* No Search Results Message */}
            {!loading && workers.length > 0 && filteredWorkers.length === 0 && searchTerm && (
                <div className="text-center py-8 text-gray-500">
                    <p>No workers match your search criteria.</p>
                </div>
            )}

            {/* Modals */}
            <IncentiveModal />
            <ReportModal />
        </div>
    );
};

export default SalaryReport;