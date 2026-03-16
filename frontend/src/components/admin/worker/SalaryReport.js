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
            await axios.post('/admin/incentives', {
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
        const month = new Date().getMonth() + 1;
        const year = new Date().getFullYear();

        setSelectedWorkerForReport(worker);
        setReportMonth(month);
        setReportYear(year);
        setGeneratedReport(null);
        setShowReportModal(true);

        // Generate report immediately with the selected worker and dates
        generateSalaryReport(worker, month, year);
    };

    // Generate Salary Report
    const generateSalaryReport = async (workerOverride, monthOverride, yearOverride) => {
        // If the first argument is an event or other non-worker object, ignore it
        const worker = (workerOverride && workerOverride._id) ? workerOverride : selectedWorkerForReport;
        const month = (typeof monthOverride === 'number') ? monthOverride : reportMonth;
        const year = (typeof yearOverride === 'number') ? yearOverride : reportYear;

        if (!worker) return;

        setGeneratingReport(true);
        setError('');

        try {
            // Fetch real attendance data for the selected worker and month
            const attendanceResponse = await axios.get(`/admin/attendance/monthly/${year}/${month}?workerId=${worker._id}`);

            // The response for a single worker will be an array with one element (or empty if no worker found)
            const workerData = attendanceResponse.data.find(w => w._id === worker._id);
            const attendanceRecords = workerData?.attendance || [];

            const daysInMonth = new Date(year, month, 0).getDate();

            // Map attendance records to their respective days
            const attendanceMap = {};
            attendanceRecords.forEach(record => {
                const date = new Date(record.checkIn);
                const day = date.getDate();
                if (!attendanceMap[day]) {
                    attendanceMap[day] = [];
                }
                attendanceMap[day].push(record);
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

            // Per day salary calculation
            const baseSalary = parseFloat(worker.salary) || 0;

            // Calculate actual working days (excluding Sundays) in this month
            let totalPossibleWorkingDays = 0;
            for (let d = 1; d <= daysInMonth; d++) {
                if (new Date(year, month - 1, d).getDay() !== 0) {
                    totalPossibleWorkingDays++;
                }
            }
            const workingDaysInMonth = totalPossibleWorkingDays || 26;
            const perDaySalary = baseSalary / workingDaysInMonth;

            // Helper to calculate shift duration in minutes
            // Helper to calculate shift duration and breaks in minutes
            const getExpectedDetails = (w) => {
                let from = "09:00 AM";
                let to = "05:00 PM";
                if (w.workingHours && w.workingHours.from && w.workingHours.to) {
                    from = w.workingHours.from;
                    to = w.workingHours.to;
                } else if (w.shift && w.shift.startTime && w.shift.endTime) {
                    from = w.shift.startTime;
                    to = w.shift.endTime;
                }

                const parseTime = (timeStr) => {
                    if (!timeStr) return 0;
                    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
                    if (match) {
                        let hours = parseInt(match[1]);
                        const mins = parseInt(match[2]);
                        const ampm = match[3].toUpperCase();
                        if (ampm === 'PM' && hours < 12) hours += 12;
                        if (ampm === 'AM' && hours === 12) hours = 0;
                        return hours * 60 + mins;
                    }
                    const simpleMatch = timeStr.match(/(\d+):(\d+)/);
                    if (simpleMatch) {
                        return parseInt(simpleMatch[1]) * 60 + parseInt(simpleMatch[2]);
                    }
                    return 0;
                };

                const start = parseTime(from);
                let end = parseTime(to);
                if (end <= start && to !== from) end += 24 * 60; // Overnight

                let totalMins = end - start;
                let breakMins = 0;

                const getOverlap = (s, e, bs, be) => Math.max(0, Math.min(e, be) - Math.max(s, bs));

                const subtractBreak = (b) => {
                    if (!b || !b.from || !b.to || b.from === b.to) return 0;
                    let bStart = parseTime(b.from);
                    let bEnd = parseTime(b.to);
                    if (bEnd <= bStart) bEnd += 24 * 60;

                    const overlap1 = getOverlap(start, end, bStart, bEnd);
                    const overlap2 = getOverlap(start, end, bStart + 24 * 60, bEnd + 24 * 60);
                    const overlap3 = getOverlap(start, end, bStart - 24 * 60, bEnd - 24 * 60);

                    return overlap1 + overlap2 + overlap3;
                };

                const lunchOverlap = subtractBreak(w.lunchBreak);
                const otherBreakOverlap = subtractBreak(w.breakTime);

                breakMins = lunchOverlap + otherBreakOverlap;
                const finalExpected = Math.max(0, totalMins - breakMins);

                return {
                    expectedDailyMins: finalExpected,
                    breakMins,
                    shiftSpan: totalMins,
                    isOvernight: (end - start) > 720 // More than 12h span
                };
            };

            const shiftInfo = getExpectedDetails(worker);
            const expectedDailyMins = shiftInfo.expectedDailyMins;
            const perMinuteSalary = expectedDailyMins > 0 ? perDaySalary / expectedDailyMins : 0;

            // Get current date for checking if a day is in the past or future
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth() + 1;
            const currentDay = today.getDate();

            // Process each day of the month
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month - 1, day);
                const dayOfWeek = date.getDay();
                const isSunday = dayOfWeek === 0;

                // Check if this date is a holiday
                const isHoliday = holidays.find(h => {
                    const hDate = new Date(h.date);
                    return hDate.getDate() === day && hDate.getMonth() === (month - 1) && hDate.getFullYear() === year;
                });

                const dayRecords = attendanceMap[day] || [];
                const isFutureDate = (year > currentYear) ||
                    (year === currentYear && month > currentMonth) ||
                    (year === currentYear && month === currentMonth && day > currentDay);

                let status = 'Absent';
                let inTime = '-';
                let outTime = '-';
                let dayDeduction = 0;
                let dayWorkingMinutes = 0;
                let dayPermissionMinutes = 0;

                // Calculate total working minutes for the day to check threshold
                if (dayRecords.length > 0) {
                    dayRecords.forEach(record => {
                        dayWorkingMinutes += (record.workingDuration || 0);
                        dayPermissionMinutes += (record.totalPermissionTime || 0);
                    });
                }

                if (isSunday) {
                    status = 'Sunday';
                    totalSundays++;
                } else if (isHoliday) {
                    status = 'Holiday';
                    totalHolidays++;
                } else if (dayRecords.length > 0 && dayWorkingMinutes >= 1) { // At least 1 minute of work
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
                    if (dayPermissionMinutes > 0) {
                        dayDeduction = dayPermissionMinutes * perMinuteSalary;
                    }
                    // Otherwise, if worked duration is less than expected shift duration,
                    // calculate deduction based on missing time.
                    else if (dayWorkingMinutes < expectedDailyMins) {
                        dayDeduction = (expectedDailyMins - dayWorkingMinutes) * perMinuteSalary;
                    }

                    totalWorkingMinutes += dayWorkingMinutes;
                    totalPermissionMinutes += dayPermissionMinutes;
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
                    expectedMins: (status === 'Sunday' || status === 'Holiday') ? 0 : expectedDailyMins,
                    workedMins: dayWorkingMinutes,
                    breakMins: shiftInfo.breakMins,
                    shiftDetails: (status === 'Sunday' || status === 'Holiday') ? '-' : `${worker.workingHours?.from || worker.shift?.startTime || '9:00 AM'} - ${worker.workingHours?.to || worker.shift?.endTime || '5:00 PM'}${shiftInfo.isOvernight ? ' (Overnight)' : ''}`,
                    delayTime: status === 'Present' ? (
                        dayPermissionMinutes > 0
                            ? `${dayPermissionMinutes.toFixed(2)} mins`
                            : (dayWorkingMinutes < expectedDailyMins
                                ? `${(expectedDailyMins - dayWorkingMinutes).toFixed(2)} mins (undertime)`
                                : '-')
                    ) : '-',
                    delayDeduction: dayDeduction > 0 ? `₹${dayDeduction.toFixed(2)}` : '₹0.00',
                    dayWorkingMinutes // Store for later if needed
                });
            }

            // Add total daily salary to entries and calculate accumulated earned salary
            let accumulatedEarnedSalary = 0;
            const dailyDataWithSalary = dailyData.map(entry => {
                let totalSalaryForDay = 0;
                if (entry.status === 'Present') {
                    const deduction = parseFloat(entry.delayDeduction.replace('₹', '')) || 0;
                    totalSalaryForDay = perDaySalary - deduction;
                } else if (entry.status === 'Sunday' || entry.status === 'Holiday') {
                    totalSalaryForDay = 0;
                }

                const earnedForDay = Math.max(0, totalSalaryForDay);
                accumulatedEarnedSalary += earnedForDay;

                return {
                    ...entry,
                    totalSalaryForDay: `₹${earnedForDay.toFixed(2)}`
                };
            });

            const totalFinalDeductions = Math.max(0, baseSalary - accumulatedEarnedSalary);

            setGeneratedReport({
                worker: worker,
                month: month,
                year: year,
                summary: {
                    workerName: worker.name,
                    employeeId: worker.rfid || 'N/A',
                    originalSalary: `₹${baseSalary.toFixed(2)}`,
                    actualEarnedSalary: `₹${accumulatedEarnedSalary.toFixed(2)}`,
                    totalFinalSalary: `₹${accumulatedEarnedSalary.toFixed(2)}`,
                    totalDaysInPeriod: daysInMonth,
                    totalWorkingDays: totalPossibleWorkingDays,
                    totalAbsentDays,
                    totalHolidays,
                    totalSundays,
                    actualWorkingDays: totalWorkingDays,
                    totalWorkingHours: (totalWorkingMinutes / 60).toFixed(2),
                    totalPermissionTime: totalPermissionMinutes.toFixed(2),
                    absentDeduction: `₹${(totalAbsentDays * perDaySalary).toFixed(2)}`,
                    permissionDeduction: `₹${totalDelayDeductions.toFixed(2)}`,
                    totalDeductions: `₹${totalFinalDeductions.toFixed(2)}`,
                    attendanceRate: `${daysInMonth > 0 ? ((totalWorkingDays / (daysInMonth - totalSundays)) * 100).toFixed(2) : 0}%`,
                    perMinuteSalary: `₹${perMinuteSalary.toFixed(4)}`,
                    expectedDailyMins: expectedDailyMins
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
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                    <div>
                                        <p className="text-sm text-gray-600">Original Salary</p>
                                        <p className="font-bold text-blue-600">{generatedReport?.summary?.originalSalary || '₹0.00'}</p>
                                    </div>
                                </div>

                                {generatedReport && (
                                    <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-x-12 gap-y-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Working Hours:</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {generatedReport.worker.workingHours?.from || '-'} - {generatedReport.worker.workingHours?.to || '-'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Lunch Break:</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {generatedReport.worker.lunchBreak?.from || '-'} - {generatedReport.worker.lunchBreak?.to || '-'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Break Time:</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {generatedReport.worker.breakTime?.from || '-'} - {generatedReport.worker.breakTime?.to || '-'}
                                            </span>
                                        </div>
                                    </div>
                                )}

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
                                            onClick={() => generateSalaryReport()}
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
                                <div className="mb-6 bg-white p-6 border rounded-lg shadow-sm">
                                    <h4 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Summary</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                        <div className="space-y-3">
                                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                                <span className="text-gray-700 font-semibold">Actual Earned Salary:</span>
                                                <span className="font-bold text-green-600 text-lg">{generatedReport.summary.actualEarnedSalary}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                                <span className="text-gray-700 font-semibold">Total Final Salary:</span>
                                                <span className="font-extrabold text-green-700 text-xl">{generatedReport.summary.totalFinalSalary}</span>
                                            </div>
                                            <div className="pt-2">
                                                <div className="flex justify-between border-b border-gray-50 pb-1">
                                                    <span className="text-gray-600 font-medium">Total Days in Period:</span>
                                                    <span className="font-bold text-gray-900">{generatedReport.summary.totalDaysInPeriod}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-gray-50 pb-1">
                                                    <span className="text-gray-600 font-medium">Total Working Days (Excl. Sundays):</span>
                                                    <span className="font-bold text-gray-900">{generatedReport.summary.totalWorkingDays}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-gray-50 pb-1">
                                                    <span className="text-gray-600 font-medium">Actual Working Days:</span>
                                                    <span className="font-bold text-green-600">{generatedReport.summary.actualWorkingDays}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-gray-50 pb-1">
                                                    <span className="text-gray-600 font-medium">Total Absent Days:</span>
                                                    <span className="font-bold text-red-600">{generatedReport.summary.totalAbsentDays}</span>
                                                </div>

                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div className="bg-blue-50 p-2 rounded-md text-center">
                                                    <p className="text-xs text-blue-600 font-semibold uppercase">Holidays</p>
                                                    <p className="text-xl font-bold text-blue-800">{generatedReport.summary.totalHolidays}</p>
                                                </div>
                                                <div className="bg-blue-50 p-2 rounded-md text-center">
                                                    <p className="text-xs text-blue-600 font-semibold uppercase">Sundays</p>
                                                    <p className="text-xl font-bold text-blue-800">{generatedReport.summary.totalSundays}</p>
                                                </div>
                                            </div>

                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <span className="text-gray-600 font-medium">Total Working Hours:</span>
                                                <span className="font-bold text-gray-900">{generatedReport.summary.totalWorkingHours} hrs</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <span className="text-gray-600 font-medium">Total Permission Time:</span>
                                                <span className="font-bold text-gray-900">{generatedReport.summary.totalPermissionTime} mins</span>
                                            </div>
                                            <div className="pt-2">
                                                <div className="flex justify-between border-b border-gray-50 pb-1">
                                                    <span className="text-gray-600 font-medium">Absent Deduction:</span>
                                                    <span className="font-bold text-red-600">{generatedReport.summary.absentDeduction}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-gray-50 pb-1">
                                                    <span className="text-gray-600 font-medium">Permission Deduction:</span>
                                                    <span className="font-bold text-red-600">{generatedReport.summary.permissionDeduction}</span>
                                                </div>
                                                <div className="flex justify-between border-b border-gray-100 pb-2 bg-red-50 p-1 rounded">
                                                    <span className="text-red-700 font-bold">Total Deductions:</span>
                                                    <span className="font-extrabold text-red-700">{generatedReport.summary.totalDeductions}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1 pt-2">
                                                <span className="text-gray-600 font-medium">Attendance Rate:</span>
                                                <span className="font-bold text-purple-600">{generatedReport.summary.attendanceRate}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-1">
                                                <span className="text-gray-600 font-medium">Per Minute Salary:</span>
                                                <span className="font-bold text-gray-900">{generatedReport.summary.perMinuteSalary}</span>
                                            </div>
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
                                                    <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Shift / Punches</th>
                                                    <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Worked / Expected</th>
                                                    <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Delay / Deduction</th>
                                                    <th className="px-4 py-2 border-b text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {generatedReport.dailyData.map((entry, index) => (
                                                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{entry.date} {getMonthName(generatedReport.month)}</td>
                                                        <td className={`px-4 py-3 text-sm font-medium ${entry.status === 'Present' ? 'text-green-600' :
                                                            entry.status === 'Absent' ? 'text-red-600' :
                                                                entry.status === 'Holiday' || entry.status === 'Sunday' ? 'text-blue-600' :
                                                                    'text-yellow-600'
                                                            }`}>
                                                            {entry.status}
                                                        </td>
                                                        <td className="px-4 py-3 text-xs">
                                                            <div className="flex flex-col gap-1">
                                                                {Array.isArray(entry.inTime) && entry.inTime.map((inT, i) => (
                                                                    <div key={i} className="flex gap-2">
                                                                        <span className="text-green-600">IN: {inT}</span>
                                                                        {entry.outTime && entry.outTime[i] && <span className="text-red-600">OUT: {entry.outTime[i]}</span>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-gray-700">
                                                            {entry.status === 'Present' ? (
                                                                <div>
                                                                    <p>Worked: <span className="font-bold">{(entry.workedMins / 60).toFixed(2)} hrs</span> ({entry.workedMins.toFixed(1)}m)</p>
                                                                    <p>Expected: <span className="font-bold">{(entry.expectedMins / 60).toFixed(2)} hrs</span> ({entry.expectedMins.toFixed(1)}m)</p>
                                                                    {entry.breakMins > 0 && <p className="text-blue-600 text-[10px]">Inc. {entry.breakMins}m break deduction</p>}
                                                                </div>
                                                            ) : '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-xs">
                                                            <div className="flex flex-col">
                                                                <span className="text-red-700 font-bold">{entry.delayTime}</span>
                                                                <span className="text-gray-500">Deduct: {entry.delayDeduction}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-bold text-gray-900">{entry.totalSalaryForDay}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

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