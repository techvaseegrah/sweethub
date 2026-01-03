import React, { createContext, useContext, useState } from 'react';

const FullScreenBillContext = createContext();

export const useFullScreenBill = () => {
  const context = useContext(FullScreenBillContext);
  if (!context) {
    throw new Error('useFullScreenBill must be used within a FullScreenBillProvider');
  }
  return context;
};

export const FullScreenBillProvider = ({ children }) => {
  const [isFullScreenBill, setIsFullScreenBill] = useState(false);

  const enterFullScreenBill = () => {
    setIsFullScreenBill(true);
    // Add class to body to hide scrollbar when in full screen bill mode
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.classList.add('fullscreen-bill-mode');
  };

  const exitFullScreenBill = () => {
    setIsFullScreenBill(false);
    // Remove class to restore scrollbar
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.classList.remove('fullscreen-bill-mode');
  };

  return (
    <FullScreenBillContext.Provider value={{ isFullScreenBill, enterFullScreenBill, exitFullScreenBill }}>
      {children}
    </FullScreenBillContext.Provider>
  );
};