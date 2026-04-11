"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ShippingContextType {
  pincode: string;
  setPincode: (pincode: string) => void;
  estimationData: any | null;
  setEstimationData: (data: any | null) => void;
}

const ShippingContext = createContext<ShippingContextType | undefined>(undefined);

export function ShippingProvider({ children }: { children: React.ReactNode }) {
  const [pincode, setPincodeState] = useState("");
  const [estimationData, setEstimationData] = useState<any | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('swarna_shipping_pincode');
    if (saved) {
      setPincodeState(saved);
    }
  }, []);

  const setPincode = (code: string) => {
    setPincodeState(code);
    if (code) {
      localStorage.setItem('swarna_shipping_pincode', code);
    } else {
      localStorage.removeItem('swarna_shipping_pincode');
      setEstimationData(null);
    }
  };

  return (
    <ShippingContext.Provider value={{ pincode, setPincode, estimationData, setEstimationData }}>
      {children}
    </ShippingContext.Provider>
  );
}

export function useShipping() {
  const context = useContext(ShippingContext);
  if (context === undefined) {
    throw new Error('useShipping must be used within a ShippingProvider');
  }
  return context;
}
