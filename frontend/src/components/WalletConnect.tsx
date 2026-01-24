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
    <div className="wallet-page-container" style={{ display: "flex", width: "100%", height: "100vh", background: "white", overflow: "hidden" }}>

      {/* Left Panel - Content */}
      <div style={{
        flex: "1.2",
        padding: "6rem 6rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        zIndex: 10
      }}>
        <div style={{ maxWidth: "550px" }}>
          <h4 style={{
            fontSize: "0.85rem",
            fontWeight: "700",
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            marginBottom: "1.5rem"
          }}>
            Start for free
          </h4>

          <h1 style={{
            fontSize: "4rem",
            fontWeight: "800",
            color: "#0f172a",
            marginBottom: "0.5rem",
            lineHeight: "1.1",
            letterSpacing: "-0.02em"
          }}>
            Connect Wallet<span style={{ color: "var(--primary)" }}>.</span>
          </h1>

          <p style={{
            fontSize: "1.1rem",
            color: "#64748b",
            marginBottom: "3rem"
          }}>
            Already a member? <span style={{ color: "var(--primary)", fontWeight: "600", cursor: "pointer" }}>Log In</span>
          </p>

          <div style={{ marginBottom: "2.5rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "700", marginBottom: "1rem", display: "block", color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              I am connecting as
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div
                onClick={() => setSelectedRole("client")}
                style={{
                  padding: "1.5rem",
                  background: selectedRole === "client" ? "#eff6ff" : "#f8fafc",
                  borderRadius: "20px",
                  cursor: "pointer",
                  border: selectedRole === "client" ? "2px solid var(--primary)" : "2px solid transparent",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ fontWeight: "700", fontSize: "1.1rem", marginBottom: "0.25rem" }}>Client</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Hire Talent</div>
                </div>
                {selectedRole === "client" && <div style={{ color: "var(--primary)", fontSize: "1.2rem", lineHeight: 0 }}>●</div>}
              </div>

              <div
                onClick={() => setSelectedRole("freelancer")}
                style={{
                  padding: "1.5rem",
                  background: selectedRole === "freelancer" ? "#eff6ff" : "#f8fafc",
                  borderRadius: "20px",
                  cursor: "pointer",
                  border: selectedRole === "freelancer" ? "2px solid var(--primary)" : "2px solid transparent",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ fontWeight: "700", fontSize: "1.1rem", marginBottom: "0.25rem" }}>Freelancer</div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Find Work</div>
                </div>
                {selectedRole === "freelancer" && <div style={{ color: "var(--primary)", fontSize: "1.2rem", lineHeight: 0 }}>●</div>}
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={connectWallet}
            style={{
              width: "100%",
              padding: "1.25rem",
              borderRadius: "99px",
              fontSize: "1.1rem",
              marginBottom: "2rem",
              boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.4)"
            }}
          >
            Connect Account
          </button>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button style={{ flex: 1, padding: "1rem", borderRadius: "99px", border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontWeight: "600", cursor: "pointer" }}>Change Method</button>
          </div>
        </div>
      </div>

      {/* Right Panel - Wavy Image */}
      <div style={{
        flex: "1",
        position: "relative",
        background: "url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1000&auto=format&fit=crop')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        clipPath: "ellipse(170% 100% at 90% 50%)",
        borderTopLeftRadius: "50px",
        borderBottomLeftRadius: "150px",
        transform: "translateX(-15px)"
      }}>
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "linear-gradient(to right, rgba(255,255,255,0.4), rgba(0,0,0,0.1))"
        }}></div>

        <div style={{ position: "absolute", bottom: "4rem", right: "4rem", color: "white", textAlign: "right", zIndex: 20 }}>
          <h2 style={{ fontSize: "4rem", fontWeight: "800", textShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>FD.</h2>
        </div>
      </div>

    </div>
  );
};

export default WalletConnect;
