'use client';

import { useState } from 'react';
import { useWallet } from '@/components/WalletProvider';
import { useRouter } from 'next/navigation';
import { requestAccess } from '@stellar/freighter-api';

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<'client' | 'freelancer'>('client');
  const { connectWallet } = useWallet();
  const router = useRouter();

  const handleConnectWallet = async () => {
    try {
      const { address, error } = await requestAccess();

      if (error) {
        console.error("Freighter error:", error);
        alert("Freighter connection error: " + error);
        return;
      }

      if (address) {
        connectWallet(address, selectedRole);
        router.push('/');
        return;
      }

      alert("Failed to get wallet address from Freighter.");
    } catch (error: any) {
      console.error("Wallet connection failed:", error);
      if (error.message?.includes("not installed")) {
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
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="glass-card animate-fade-in" style={{
        maxWidth: "500px",
        width: "100%",
        padding: "3rem 2.5rem",
        textAlign: 'center'
      }}>
        <h1 className="hero-title" style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
          Welcome Back
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", marginBottom: "2.5rem" }}>
          Connect your wallet to enter the secure workspace.
        </p>

        <div style={{ marginBottom: "2.5rem" }}>
          <label style={{
            fontSize: "0.85rem",
            fontWeight: "600",
            marginBottom: "1rem",
            display: "block",
            color: "var(--text-muted)"
          }}>
            I am connecting as
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div
              onClick={() => setSelectedRole("client")}
              style={{
                padding: "1.25rem",
                background: selectedRole === "client" ? "rgba(0, 114, 255, 0.15)" : "rgba(255, 255, 255, 0.05)",
                borderRadius: "16px",
                cursor: "pointer",
                border: selectedRole === "client" ? "1px solid #00C6FF" : "1px solid transparent",
                transition: "all 0.3s"
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👔</div>
              <div style={{ fontWeight: "600" }}>Client</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Hire Talent</div>
            </div>

            <div
              onClick={() => setSelectedRole("freelancer")}
              style={{
                padding: "1.25rem",
                background: selectedRole === "freelancer" ? "rgba(0, 114, 255, 0.15)" : "rgba(255, 255, 255, 0.05)",
                borderRadius: "16px",
                cursor: "pointer",
                border: selectedRole === "freelancer" ? "1px solid #00C6FF" : "1px solid transparent",
                transition: "all 0.3s"
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💼</div>
              <div style={{ fontWeight: "600" }}>Freelancer</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Get Hired</div>
            </div>
          </div>
        </div>

        <button onClick={handleConnectWallet} className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
          Connect Freighter Wallet
        </button>
      </div>
    </div>
  );
}
