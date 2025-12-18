import React, { createContext, useContext, useState, useEffect } from 'react';

const EWayBillContext = createContext();

export const useEWayBills = () => {
  const context = useContext(EWayBillContext);
  if (!context) {
    throw new Error('useEWayBills must be used within an EWayBillProvider');
  }
  return context;
};

export const EWayBillProvider = ({ children }) => {
  const [ewayBills, setEwayBills] = useState(() => {
    // Load E-Way bills from localStorage on initial render
    try {
      const savedBills = localStorage.getItem('ewayBills');
      return savedBills ? JSON.parse(savedBills) : [];
    } catch (error) {
      console.error('Error loading E-Way bills from localStorage:', error);
      return [];
    }
  });

  // Save E-Way bills to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('ewayBills', JSON.stringify(ewayBills));
    } catch (error) {
      console.error('Error saving E-Way bills to localStorage:', error);
    }
  }, [ewayBills]);

  const addEWayBill = (bill) => {
    // Calculate total amount from goods details if not provided
    let totalAmount = 0;
    if (bill.totalInvoiceValue) {
      totalAmount = parseFloat(bill.totalInvoiceValue);
    } else if (bill.goodsDetails && bill.goodsDetails.length > 0) {
      totalAmount = bill.goodsDetails.reduce((sum, item) => {
        return sum + (parseFloat(item.totalAmount) || 0);
      }, 0);
    }
    
    // Generate a unique ID for the new bill
    const newBill = {
      ...bill,
      id: Date.now(), // Simple ID generation for now
      totalAmount: totalAmount,
      status: calculateStatus(bill.validTo)
    };
    setEwayBills(prev => [...prev, newBill]);
  };

  const calculateStatus = (validToDate) => {
    const today = new Date();
    const validTo = new Date(validToDate);
    return validTo >= today ? 'Active' : 'Expired';
  };

  const value = {
    ewayBills,
    addEWayBill
  };

  return (
    <EWayBillContext.Provider value={value}>
      {children}
    </EWayBillContext.Provider>
  );
};