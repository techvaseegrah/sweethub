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
    const [batches] = useState({}); // Store batch information
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

    // Fetch all workers and holidays
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                // Fetch workers
                const workersResponse = await axios.get('/shop/workers');
                setWorkers(workersResponse.data);
                setFilteredWorkers(workersResponse.data);

                // Try to fetch holidays (if accessible)
                try {
                    const holidaysResponse = await axios.get('/shop/holidays');
                    setHolidays(holidaysResponse.data);
                } catch (hErr) {
                    console.warn('Could not fetch holidays:', hErr);
                }
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
        const filtered = workers.filter(worker => {
            // Check if worker name, RFID, or department matches the search term
            const nameMatch = worker.name.toLowerCase().includes(searchTerm.toLowerCase());
            const rfidMatch = worker.rfid && worker.rfid.toLowerCase().includes(searchTerm.toLowerCase());
            const departmentMatch = worker.department?.name &&
                worker.department.name.toLowerCase().includes(searchTerm.toLowerCase());

            return nameMatch || rfidMatch || departmentMatch;
        });

        setFilteredWorkers(filtered);
    }, [searchTerm, workers, batches]);

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
        if (!selectedWorkerForIncentive || !incentiveAmount) return;

        try {
            await axios.post('/admin/incentives', {
                workerId: selectedWorkerForIncentive._id,
                amount: parseFloat(incentiveAmount),
                month: incentiveMonth,
                year: incentiveYear
            });

            setSuccess(`Incentive of ₹${incentiveAmount} added for ${selectedWorkerForIncentive.name}`);
            setShowIncentiveModal(false);

            // Refresh the worker list to get updated incentive data
            const workersResponse = await axios.get('/shop/workers');
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
            // Fetch real attendance data for the selected worker and month
            const attendanceResponse = await axios.get(`/shop/attendance/monthly/${reportYear}/${reportMonth}?workerId=${selectedWorkerForReport._id}`);

            // Find the selected worker's data in the response
            const workerData = attendanceResponse.data.find(w => w._id === selectedWorkerForReport._id);
            const attendanceByDate = workerData?.attendanceRecordsGroupedByDate || [];

            const daysInMonth = new Date(reportYear, reportMonth, 0).getDate();

            // Map attendance records to their respective days for easier access
            const attendanceMap = {};
            attendanceByDate.forEach(group => {
                const date = new Date(group.date);
                const day = date.getDate();
                attendanceMap[day] = group.records;
            });

            // Prepare summary counters
            const dailyData = [];
            let totalWorkingDays = 0;
            let totalAbsentDays = 0;
            let totalHolidays = 0;
            let totalSundays = 0;
            let totalWorkingMinutes = 0;
            let totalPermissionMinutes = 0;
            let totalDelayDeductions = 0;

            // Per day salary calculation (assuming 26 working days)
            const baseSalary = parseFloat(selectedWorkerForReport.salary) || 0;
            const workingDaysInMonth = 26;
            const perDaySalary = baseSalary / workingDaysInMonth;
            const perMinuteSalary = perDaySalary / 480; // Assuming 8 hours = 480 minutes

            // Get current date for checking if a day is in the past or future
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth() + 1;
            const currentDay = today.getDate();

            // Process each day of the month
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(reportYear, reportMonth - 1, day);
                const dayOfWeek = date.getDay();
                const isSunday = dayOfWeek === 0;

                // Check if this date is a holiday
                const isHoliday = holidays.find(h => {
                    const hDate = new Date(h.date);
                    return hDate.getDate() === day && hDate.getMonth() === (reportMonth - 1) && hDate.getFullYear() === reportYear;
                });

                const dayRecords = attendanceMap[day] || [];
                const isFutureDate = (reportYear > currentYear) ||
                    (reportYear === currentYear && reportMonth > currentMonth) ||
                    (reportYear === currentYear && reportMonth === currentMonth && day > currentDay);

                let status = 'Absent';
                let inTime = '-';
                let outTime = '-';
                let dayDeduction = 0;
                let dayWorkingMins = 0;
                let dayPermissionMins = 0;

                // Calculate total working minutes for the day to check threshold
                if (dayRecords.length > 0) {
                    dayRecords.forEach(record => {
                        dayWorkingMins += (record.workingDuration || 0);
                        dayPermissionMins += (record.totalPermissionTime || 0);
                    });
                }

                if (isSunday) {
                    status = 'Sunday';
                    totalSundays++;
                } else if (isHoliday) {
                    status = 'Holiday';
                    totalHolidays++;
                } else if (dayRecords.length > 0 && dayWorkingMins >= 1) { // At least 1 minute of work
                    status = 'Present';
                    totalWorkingDays++;

                    // Format all punch times for display
                    const sortedRecords = [...dayRecords].sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn));
                    
                    const punchInTimes = sortedRecords
                        .filter(record => record.checkIn)
                        .map(record => new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                    
                    const punchOutTimes = sortedRecords
                        .filter(record => record.checkOut)
                        .map(record => new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

                    inTime = punchInTimes;
                    outTime = punchOutTimes;

                    // Calculate delay deduction
                    // If backend recorded permission time (late arrival/early leaving), use it
                    if (dayPermissionMins > 0) {
                        dayDeduction = dayPermissionMins * perMinuteSalary;
                    }
                    // Otherwise, if worked duration is less than standard 8 hours (480 mins), 
                    // calculate deduction based on missing time. This serves as a fallback 
                    // if shifts are not properly configured or for legacy records.
                    else if (dayWorkingMins < 480) {
                        dayDeduction = (480 - dayWorkingMins) * perMinuteSalary;
                    }

                    totalWorkingMinutes += dayWorkingMins;
                    totalPermissionMinutes += dayPermissionMins;
                    totalDelayDeductions += dayDeduction;
                } else if (isFutureDate) {
                    status = '-';
                    inTime = '-';
                    outTime = '-';
                } else {
                    status = 'Absent';
                    totalAbsentDays++;
                    dayDeduction = perDaySalary;

                    // If there were records but not enough duration, show the times anyway
                    if (dayRecords.length > 0) {
                        const sortedRecords = [...dayRecords].sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn));
                        inTime = sortedRecords.filter(r => r.checkIn).map(r => new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                        outTime = sortedRecords.filter(r => r.checkOut).map(r => new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                    }
                }

                dailyData.push({
                    date: day,
                    status,
                    inTime,
                    outTime,
                    delayTime: status === 'Present' ? (dayPermissionMins > 0 ? `${dayPermissionMins.toFixed(2)} mins` : '-') : '-',
                    delayDeduction: dayDeduction > 0 ? `₹${dayDeduction.toFixed(2)}` : '₹0.00',
                    dayWorkingMins
                });
            }

            // Calculate final results
            const absentDeduction = totalAbsentDays * perDaySalary;
            const totalFinalDeductions = totalDelayDeductions + absentDeduction;
            const actualEarnedSalary = Math.max(0, baseSalary - totalFinalDeductions);

            // Add total daily salary to entries
            const dailyDataWithSalary = dailyData.map(entry => {
                let totalSalaryForDay = 0;
                if (entry.status === 'Present') {
                    const deduction = parseFloat(entry.delayDeduction.replace('₹', '')) || 0;
                    totalSalaryForDay = perDaySalary - deduction;
                } else if (entry.status === 'Sunday' || entry.status === 'Holiday') {
                    totalSalaryForDay = perDaySalary; // Paid days
                }

                return {
                    ...entry,
                    totalSalaryForDay: `₹${Math.max(0, totalSalaryForDay).toFixed(2)}`
                };
            });

            setGeneratedReport({
                worker: selectedWorkerForReport,
                month: reportMonth,
                year: reportYear,
                summary: {
                    employeeId: selectedWorkerForReport.rfid || 'N/A',
                    originalSalary: `₹${baseSalary.toFixed(2)}`,
                    actualEarnedSalary: `₹${actualEarnedSalary.toFixed(2)}`,
                    totalFinalSalary: `₹${actualEarnedSalary.toFixed(2)}`,
                    totalDaysInPeriod: daysInMonth,
                    totalWorkingDays,
                    totalAbsentDays,
                    totalHolidays,
                    totalSundays,
                    actualWorkingDays: totalWorkingDays,
                    totalWorkingHours: (totalWorkingMinutes / 60).toFixed(2),
                    totalPermissionTime: totalPermissionMinutes.toFixed(2),
                    absentDeduction: `₹${absentDeduction.toFixed(2)}`,
                    permissionDeduction: `₹${totalDelayDeductions.toFixed(2)}`,
                    totalDeductions: `₹${totalFinalDeductions.toFixed(2)}`,
                    attendanceRate: `${daysInMonth > 0 ? ((totalWorkingDays / (daysInMonth - totalSundays)) * 100).toFixed(2) : 0}%`,
                    perMinuteSalary: `₹${perMinuteSalary.toFixed(4)}`
                },
                dailyData: dailyDataWithSalary
            });
        } catch (err) {
            setError('Failed to generate salary report: ' + (err.response?.data?.message || err.message));
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
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Add Incentive</h3>
                            <button
                                onClick={() => setShowIncentiveModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        {selectedWorkerForIncentive && (
                            <div className="mb-4">
                                <p className="text-gray-700">
                                    Adding incentive for: <strong>{selectedWorkerForIncentive.name}</strong>
                                </p>
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Incentive Amount (₹)
                            </label>
                            <input
                                type="number"
                                value={incentiveAmount}
                                onChange={(e) => setIncentiveAmount(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter amount"
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

                        {selectedWorkerForReport && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Employee</p>
                                        <p className="font-medium">{selectedWorkerForReport.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Period</p>
                                        <p className="font-medium">{getMonthName(reportMonth)} {reportYear}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Employee ID</p>
                                        <p className="font-medium">{generatedReport?.summary?.employeeId || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="mt-4 flex space-x-3">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Month</label>
                                        <select
                                            value={reportMonth}
                                            onChange={(e) => setReportMonth(parseInt(e.target.value))}
                                            className="px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                                                <option key={month} value={month}>
                                                    {getMonthName(month)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Year</label>
                                        <select
                                            value={reportYear}
                                            onChange={(e) => setReportYear(parseInt(e.target.value))}
                                            className="px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {[2022, 2023, 2024, 2025, 2026].map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="self-end">
                                        <button
                                            onClick={generateSalaryReport}
                                            className="px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none text-sm"
                                        >
                                            Generate
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {generatingReport && (
                            <div className="text-center py-4">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                <p className="mt-2 text-gray-600">Generating report...</p>
                            </div>
                        )}

                        {generatedReport && !generatingReport && (
                            <div>
                                {/* Summary Section */}
                                <div className="mb-6">
                                    <h4 className="text-md font-medium text-gray-900 mb-3">Salary Summary</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="p-3 bg-blue-50 rounded-lg">
                                            <p className="text-sm text-gray-600">Original Salary</p>
                                            <p className="text-lg font-bold text-blue-700">{generatedReport.summary.originalSalary}</p>
                                        </div>
                                        <div className="p-3 bg-green-50 rounded-lg">
                                            <p className="text-sm text-gray-600">Actual Earned</p>
                                            <p className="text-lg font-bold text-green-700">{generatedReport.summary.actualEarnedSalary}</p>
                                        </div>
                                        <div className="p-3 bg-yellow-50 rounded-lg">
                                            <p className="text-sm text-gray-600">Total Deductions</p>
                                            <p className="text-lg font-bold text-yellow-700">{generatedReport.summary.totalDeductions}</p>
                                        </div>
                                        <div className="p-3 bg-purple-50 rounded-lg">
                                            <p className="text-sm text-gray-600">Attendance Rate</p>
                                            <p className="text-lg font-bold text-purple-700">{generatedReport.summary.attendanceRate}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Summary */}
                                <div className="mb-6">
                                    <h4 className="text-md font-medium text-gray-900 mb-3">Detailed Summary</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-600">Total Days</p>
                                            <p className="font-medium">{generatedReport.summary.totalDaysInPeriod}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Working Days</p>
                                            <p className="font-medium">{generatedReport.summary.totalWorkingDays}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Absent Days</p>
                                            <p className="font-medium">{generatedReport.summary.totalAbsentDays}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Holidays</p>
                                            <p className="font-medium">{generatedReport.summary.totalHolidays}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Sundays</p>
                                            <p className="font-medium">{generatedReport.summary.totalSundays}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Working Hours</p>
                                            <p className="font-medium">{generatedReport.summary.totalWorkingHours}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Permission Time (min)</p>
                                            <p className="font-medium">{generatedReport.summary.totalPermissionTime}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Per Minute Salary</p>
                                            <p className="font-medium">{generatedReport.summary.perMinuteSalary}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Daily Data Table */}
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-md font-medium text-gray-900">Daily Attendance</h4>
                                        <button
                                            onClick={downloadPDFReport}
                                            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none text-sm flex items-center"
                                        >
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                            </svg>
                                            Download PDF
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full bg-white border border-gray-200">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                    <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                    <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">In Time</th>
                                                    <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Out Time</th>
                                                    <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Delay</th>
                                                    <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Deduction</th>
                                                    <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Salary</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                 {generatedReport.dailyData.map((entry, index) => (
                                                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{entry.date}</td>
                                                        <td className={`px-4 py-3 text-sm font-medium ${entry.status === 'Present' ? 'text-green-600' :
                                                            entry.status === 'Absent' ? 'text-red-600' :
                                                                entry.status === 'Holiday' || entry.status === 'Sunday' ? 'text-blue-600' :
                                                                    'text-yellow-600'
                                                            }`}>
                                                            {entry.status}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-green-600 font-medium">
                                                            {Array.isArray(entry.inTime) ? (
                                                                <div className="flex flex-col">
                                                                    {entry.inTime.map((time, i) => <span key={i}>{time}</span>)}
                                                                </div>
                                                            ) : entry.inTime}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-red-600 font-medium">
                                                            {Array.isArray(entry.outTime) ? (
                                                                <div className="flex flex-col">
                                                                    {entry.outTime.map((time, i) => <span key={i}>{time}</span>)}
                                                                </div>
                                                            ) : entry.outTime}
                                                        </td>
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
                <div className="relative w-full sm:w-1/3">
                    <input
                        type="text"
                        placeholder="Search workers..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
            </div>

            {/* Loading Indicator */}
            {loading && (
                <div className="text-center py-8">
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
                                <th className="py-3 px-4 border-b text-left">Working Hours</th>
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