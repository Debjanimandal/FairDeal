import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { requestAccess } from "@stellar/freighter-api";

interface WalletConnectProps {
  onConnect: (publicKey: string, role: string) => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect }) => {
  const [selectedRole, setSelectedRole] = useState<'client' | 'freelancer'>("client");
  const navigate = useNavigate();

  // Clear any cached wallet data when user visits the login page
  useEffect(() => {
    localStorage.removeItem("connectedWallet");
    localStorage.removeItem("userRole");
  }, []);

  const connectWallet = async () => {
    try {
      // Request access - this ALWAYS triggers the Freighter popup
      const { address, error } = await requestAccess();

      if (error) {
        console.error("Freighter error:", error);
        alert("Freighter connection error: " + error);
        return;
      }

      if (address) {
        onConnect(address, selectedRole);
        navigate("/");
        return;
      }

      // If no address returned
      alert("Failed to get wallet address from Freighter.");

    } catch (error: any) {
      console.error("Wallet connection failed:", error);

      // Check if Freighter is not installed
      if (error.message?.includes("not installed") || error.toString().includes("not installed")) {
        alert("Freighter wallet not detected. Please install the Freighter extension to continue.");
        window.open("https://www.freighter.app/", "_blank");
      } else {
        alert("Failed to connect wallet: " + error.message);
      }
    }
  };

  return (
    <div className="wallet-page-container" style={{
      display: "flex",
      width: "100%",
      height: "100vh",
      position: 'relative',
      overflow: "hidden",
      alignItems: 'center',
      justifyContent: 'center'
    }}>

      {/* Background Ambience */}
      <div className="bg-blob blob-1" style={{ width: '800px', height: '800px', top: '-400px', left: '-200px', opacity: 0.3 }}></div>
      <div className="bg-blob blob-2" style={{ width: '600px', height: '600px', bottom: '-200px', right: '-200px', opacity: 0.3 }}></div>


      <div className="glass-card animate-fade-in" style={{
        maxWidth: "500px",
        width: "100%",
        padding: "3rem 2.5rem",
        borderRadius: "24px",
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        background: 'rgba(15, 23, 42, 0.6)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>

        <div style={{ marginBottom: "2rem" }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '20px',
            background: 'var(--gradient-primary)',
            marginBottom: '1.5rem',
            boxShadow: '0 0 20px rgba(0, 114, 255, 0.4)'
          }}>
            {/* Diamond/Logo Icon */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9a3 3 0 0 1 0 0L12 2l10 7a3 3 0 0 1 0 0v9a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9z"></path>
              <path d="M12 22V12"></path>
              <path d="M12 12L2 9"></path>
              <path d="M12 12l10-3"></path>
            </svg>
          </div>

          <h1 className="hero-title" style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
            Welcome Back
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
            Connect your wallet to enter the secure workspace.
          </p>
        </div>

        <div style={{ marginBottom: "2.5rem" }}>
          <label style={{
            fontSize: "0.85rem",
            fontWeight: "600",
            marginBottom: "1rem",
            display: "block",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            I am connecting as
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div
              onClick={() => setSelectedRole("client")}
              className={selectedRole === "client" ? "role-card active" : "role-card"}
              style={{
                padding: "1.25rem",
                background: selectedRole === "client" ? "rgba(0, 114, 255, 0.15)" : "rgba(255, 255, 255, 0.05)",
                borderRadius: "16px",
                cursor: "pointer",
                border: selectedRole === "client" ? "1px solid #00C6FF" : "1px solid transparent",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                textAlign: 'left'
              }}
            >
              <div style={{ marginBottom: "0.5rem", color: selectedRole === "client" ? "#00C6FF" : "white" }}>
                {/* Briefcase Icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <div style={{ fontWeight: "600", fontSize: "1rem", color: "var(--text-main)" }}>Client</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Hire Talent</div>
            </div>

            <div
              onClick={() => setSelectedRole("freelancer")}
              className={selectedRole === "freelancer" ? "role-card active" : "role-card"}
              style={{
                padding: "1.25rem",
                background: selectedRole === "freelancer" ? "rgba(225, 0, 255, 0.15)" : "rgba(255, 255, 255, 0.05)",
                borderRadius: "16px",
                cursor: "pointer",
                border: selectedRole === "freelancer" ? "1px solid #E100FF" : "1px solid transparent",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                textAlign: 'left'
              }}
            >
              <div style={{ marginBottom: "0.5rem", color: selectedRole === "freelancer" ? "#E100FF" : "white" }}>
                {/* Code Icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
              </div>
              <div style={{ fontWeight: "600", fontSize: "1rem", color: "var(--text-main)" }}>Freelancer</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Find Work</div>
            </div>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={connectWallet}
          style={{
            width: "100%",
            padding: "1rem",
            borderRadius: "12px",
            fontSize: "1.1rem",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem'
          }}
        >
          {/* Wallet Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path>
            <path d="M4 6v12a2 2 0 0 0 2 2h14v-4"></path>
            <path d="M18 12a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4v-8h-4z"></path>
          </svg>
          Connect Freighter Wallet
        </button>

        <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          New to Stellar? <a href="https://www.freighter.app/" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: '600' }}>Get Freighter</a>
        </p>

      </div>
    </div>
  );
};

export default WalletConnect;
