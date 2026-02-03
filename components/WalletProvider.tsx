'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserRole = 'client' | 'freelancer' | null;

interface WalletContextType {
  wallet: string | null;
  userRole: UserRole;
  connectWallet: (address: string, role: string) => void;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);

  useEffect(() => {
    // Check if wallet is connected on load
    const storedWallet = localStorage.getItem("connectedWallet");
    const storedRole = localStorage.getItem("userRole");
    if (storedWallet) {
      setWallet(storedWallet);
      setUserRole(storedRole as UserRole);
    }
  }, []);

  const connectWallet = (address: string, role: string) => {
    setWallet(address);
    setUserRole(role as UserRole);
    localStorage.setItem("connectedWallet", address);
    localStorage.setItem("userRole", role);
  };

  const disconnectWallet = () => {
    setWallet(null);
    setUserRole(null);
    localStorage.removeItem("connectedWallet");
    localStorage.removeItem("userRole");
  };

  return (
    <WalletContext.Provider value={{ wallet, userRole, connectWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
