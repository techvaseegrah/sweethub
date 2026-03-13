import React from 'react';
import { LuFileText, LuDownload, LuCalendar, LuPercent } from 'react-icons/lu';

const GSTReport = () => {
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">GST Report</h1>
                    <p className="text-gray-600">Tax summaries and filing information</p>
                </div>
                <div className="mt-4 md:mt-0 flex space-x-3">
                    <button className="flex items-center space-x-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                        <LuCalendar className="w-4 h-4" />
                        <span>Date Range</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors shadow-sm">
                        <LuDownload className="w-4 h-4" />
                        <span>Export PDF</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Total Taxable Sales', value: '₹0.00', color: 'blue' },
                    { label: 'CGST Amount', value: '₹0.00', color: 'green' },
                    { label: 'SGST Amount', value: '₹0.00', color: 'purple' },
                    { label: 'Total Tax Liability', value: '₹0.00', color: 'red' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 font-medium mb-1">{stat.label}</p>
                        <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-700">GST Summary Breakdown</h3>
                </div>
                <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LuPercent className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">No Tax Data</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">Tax calculations will be generated here based on your sales and purchase records for the selected period.</p>
                </div>
            </div>
        </div>
    );
};

export default GSTReport;
