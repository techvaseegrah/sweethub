import React, { useState, useEffect } from 'react';

const KeyboardShortcutsGuide = ({ context = 'billing' }) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('keyboardShortcutsExpanded');
    return saved === null ? false : JSON.parse(saved); // Default to collapsed
  });
  
  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    localStorage.setItem('keyboardShortcutsExpanded', JSON.stringify(newExpanded));
  };
  
  const getOrderShortcuts = () => [
    { keys: ['Ctrl', 'N'], description: 'Focus Search' },
    { keys: ['Ctrl', 'F'], description: 'Focus Search' },
    { keys: ['Ctrl', 'Enter'], description: 'Submit Order' },
    { keys: ['↑', '↓'], description: 'Navigate Products' },
    { keys: ['Enter'], description: 'Select Product/Add Item' },
    { keys: ['Esc'], description: 'Close Dropdowns' },
    { keys: ['Tab'], description: 'Navigate Fields' }
  ];
  
  const getBillShortcuts = () => [
    { keys: ['Ctrl', 'N'], description: 'New Bill' },
    { keys: ['Ctrl', 'F'], description: 'Focus Search' },
    { keys: ['Alt', 'D'], description: 'Focus Discount' },
    { keys: ['Ctrl', 'Enter'], description: 'Submit Bill' },
    { keys: ['F2'], description: 'New Bill in New Tab' },
    { keys: ['Ctrl', 'D'], description: 'Delete Last Item' },
    { keys: ['Tab'], description: 'Navigate Fields' },
    { keys: ['Esc'], description: 'Close Dropdowns' },
    { keys: ['Ctrl', 'Alt', 'F'], description: 'Focus Search' }
  ];
  
  const shortcuts = context === 'order' ? getOrderShortcuts() : getBillShortcuts();
  const title = context === 'order' ? 'Order Management Shortcuts' : 'Keyboard Shortcuts Guide';
  
  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div 
        className="flex items-center justify-between cursor-pointer hover:bg-blue-100 rounded p-1 -m-1"
        onClick={toggleExpanded}
      >
        <h4 className="text-lg font-semibold text-blue-800 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.68a1 1 0 011.414 0 1 1 0 010 1.414l-1.49 1.493a1 1 0 01-1.414 0 1 1 0 010-1.414l1.49-1.493zm-4.93 4.93a1 1 0 010 1.414l-1.49 1.493a1 1 0 01-1.414 0 1 1 0 010-1.414l1.49-1.493a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          {title}
        </h4>
        <svg 
          className={`w-5 h-5 text-blue-600 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {isExpanded && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center">
              {shortcut.keys.map((key, keyIndex) => (
                <React.Fragment key={keyIndex}>
                  <kbd className="bg-gray-200 text-gray-800 px-2 py-1 rounded mr-2 font-mono">{key}</kbd>
                  {keyIndex < shortcut.keys.length - 1 && (
                    <span className="text-gray-600">+</span>
                  )}
                  {keyIndex < shortcut.keys.length - 1 && (
                    <kbd className="bg-gray-200 text-gray-800 px-2 py-1 rounded ml-2 mr-2 font-mono">{shortcut.keys[keyIndex + 1]}</kbd>
                  )}
                </React.Fragment>
              ))}
              <span className="text-gray-700 ml-2">{shortcut.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KeyboardShortcutsGuide;