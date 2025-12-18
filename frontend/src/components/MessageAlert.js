// frontend/src/components/MessageAlert.js
import React, { useEffect } from 'react';
import { LuCircleCheck, LuX, LuInfo } from 'react-icons/lu';

const MessageAlert = ({ type, message, onClose }) => {
    // Hooks must be called unconditionally at the top level of the component.
    // We'll determine visibility and styling after the hook calls.

    // Determine background, border, and text colors based on the alert type
    const bgColor = {
        success: 'bg-green-100 border-green-400 text-green-700',
        error: 'bg-red-100 border-red-400 text-red-700',
        info: 'bg-blue-100 border-blue-400 text-blue-700',
        warning: 'bg-yellow-100 border-yellow-400 text-yellow-700', // Added warning for completeness
    }[type] || 'bg-gray-100 border-gray-400 text-gray-700'; // Default styling

    // Determine the icon to display based on the alert type
    const Icon = {
        success: LuCircleCheck,
        error: LuX,
        info: LuInfo,
        warning: LuInfo, // Using LuInfo for warning as well, or you could add LuAlertTriangle if available
    }[type];

    // Auto-close the alert after 5 seconds
    // This hook is now called unconditionally
    useEffect(() => {
        if (message && onClose) { // Only set timer if there's a message and onClose prop exists
            const timer = setTimeout(() => {
                onClose();
            }, 5000); 

            // Cleanup function to clear the timeout if the component unmounts or onClose changes
            return () => clearTimeout(timer);
        }
    }, [message, onClose]); // Dependency array includes message and onClose


    // Render the alert only if there's a message
    if (!message) {
        return null;
    }

    return (
        <div className={`flex items-center justify-between p-4 mb-4 rounded-md border ${bgColor} animate-fade-in`} role="alert">
            <div className="flex items-center">
                {/* Render the icon if available */}
                {Icon && <Icon className="mr-3 text-xl" />}
                <p className="text-sm font-medium">{message}</p>
            </div>
            {/* Button to manually close the alert */}
            <button onClick={onClose} className="text-current hover:opacity-75 focus:outline-none">
                <LuX size={20} />
            </button>
        </div>
    );
};

export default MessageAlert;
