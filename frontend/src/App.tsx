import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import "./App.css";
import WalletConnect from "./components/WalletConnect";
import CreateJob from "./pages/CreateJob";
import Dashboard from "./pages/Dashboard";
import JobDetail from "./pages/JobDetail";
import SubmitWork from "./pages/SubmitWork";
import LandingPage from "./pages/LandingPage";

type UserRole = 'client' | 'freelancer' | null;

const App: React.FC = () => {
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

  const handleWalletConnect = (address: string, role: string) => {
    setWallet(address);
    setUserRole(role as UserRole);
    localStorage.setItem("connectedWallet", address);
    localStorage.setItem("userRole", role);
  };

  const handleDisconnect = () => {
    setWallet(null);
    setUserRole(null);
    localStorage.removeItem("connectedWallet");
    localStorage.removeItem("userRole");
    // Redirect to login page after disconnect
    window.location.href = "/login";
  };

  return (
    <Router>
      <div className="App">
        {/* Navbar */}
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              FairDeal
            </Link>
            <div className="nav-links">
              {wallet ? (
                <>
                  <div className="role-badge">
                    {userRole === "client" ? "PRO Client" : "DEV Freelancer"}
                  </div>
                  <div className="wallet-badge">
                    {wallet.substring(0, 6)}...{wallet.substring(wallet.length - 4)}
                  </div>
                  <button className="btn-disconnect" onClick={handleDisconnect} title="Disconnect Wallet">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </>
              ) : (
                <Link to="/login" className="btn btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}>
                  Login
                </Link>
              )}
            </div>
          </div>
        </nav>

        <main className="main-content" style={{ padding: 0 }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={wallet ? <Dashboard wallet={wallet} userRole={userRole} /> : <LandingPage />} />
            <Route path="/login" element={<WalletConnect onConnect={handleWalletConnect} />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={wallet ? <Dashboard wallet={wallet} userRole={userRole} /> : <WalletConnect onConnect={handleWalletConnect} />} />
            <Route path="/create-job" element={wallet ? <CreateJob wallet={wallet} /> : <WalletConnect onConnect={handleWalletConnect} />} />
            <Route path="/job/:jobId" element={wallet ? <JobDetail wallet={wallet} userRole={userRole} /> : <WalletConnect onConnect={handleWalletConnect} />} />
            <Route path="/job/:jobId/submit" element={wallet ? <SubmitWork wallet={wallet} /> : <WalletConnect onConnect={handleWalletConnect} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
