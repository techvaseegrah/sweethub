import React from 'react';

const CustomModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto my-8 sm:my-16">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
                        aria-label="Close"
                    >
                        &times;
                    </button>
                </div>
                <div className="p-4 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default CustomModal;