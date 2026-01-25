import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_ENDPOINTS } from '../config/api';
import { executePayment } from "../utils/stellar-utils";

interface CreateJobProps {
  wallet: string | null;
}

const CreateJob: React.FC<CreateJobProps> = ({ wallet }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [formData, setFormData] = useState({
    freelancerAddress: "",
    amount: "",
    deadlineDays: "7",
    description: "",
    initialPaymentPercent: "10", // Default 10% upfront payment
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validation
      if (!formData.freelancerAddress) {
        throw new Error("Freelancer address is required");
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error("Amount must be greater than 0");
      }
      if (!formData.description) {
        throw new Error("Description is required");
      }

      // Check if wallet is connected
      if (!wallet) {
        throw new Error("Please connect your wallet first");
      }

      console.log("Creating job with:", formData);
      console.log("Client wallet:", wallet);

      // **Calculate Initial Payment (only send percentage to freelancer)**
      const initialPaymentPercent = parseInt(formData.initialPaymentPercent);
      const totalAmount = parseFloat(formData.amount);

      // Use proper rounding to avoid floating-point precision issues
      const initialPayment = Math.round((totalAmount * initialPaymentPercent) * 10000000) / 10000000 / 100;
      const remainingAmount = Math.round((totalAmount - initialPayment) * 10000000) / 10000000;

      setSuccess(`Building payment transaction...\nSplitting: ${initialPaymentPercent}% now, ${100 - initialPaymentPercent}% on approval`);

      // **Send ONLY initial percentage to freelancer**
      // Format amount to max 7 decimal places (Stellar requirement)
      const formattedInitialPayment = initialPayment.toFixed(7);

      console.log(`💰 Sending: ${formattedInitialPayment} XLM (${initialPaymentPercent}% of ${totalAmount})`);

      const transactionHash = await executePayment(
        wallet, // From (client wallet)
        formData.freelancerAddress, // To (freelancer wallet) - ONLY initial %
        formattedInitialPayment, // Amount: properly formatted
        `FairDeal ${initialPaymentPercent}%` // Memo (max 28 bytes)
      );

      console.log("✅ Initial payment successful! Transaction hash:", transactionHash);
      console.log(`💰 Sent ${initialPayment} (${initialPaymentPercent}%) to freelancer`);

      // **Fetch escrow address and send remaining amount**
      setSuccess(
        `Initial payment sent!\n` +
        `• ${initialPayment.toFixed(2)} XLM (${initialPaymentPercent}%) sent to freelancer\n` +
        `• Sending remaining ${remainingAmount.toFixed(2)} (%${100 - initialPaymentPercent}) to escrow...`
      );

      // Get escrow address from backend
      const escrowResponse = await axios.get(API_ENDPOINTS.ESCROW_ADDRESS);
      if (!escrowResponse.data.success || !escrowResponse.data.escrowAddress) {
        throw new Error("Failed to fetch escrow address");
      }
      const escrowAddress = escrowResponse.data.escrowAddress;
      console.log("📍 Escrow address:", escrowAddress);

      // Send remaining amount to escrow
      const formattedRemainingAmount = remainingAmount.toFixed(7);
      console.log(`🔒 Sending ${formattedRemainingAmount} XLM (${100 - initialPaymentPercent}%) to escrow`);

      const escrowTransactionHash = await executePayment(
        wallet, // From (client wallet)
        escrowAddress, // To (escrow wallet)
        formattedRemainingAmount, // Remaining amount
        `FairDeal Escrow ${100 - initialPaymentPercent}%` // Memo
      );

      console.log("✅ Escrow payment successful! Transaction hash:", escrowTransactionHash);
      console.log(`🔒 Locked ${remainingAmount} (${100 - initialPaymentPercent}%) in escrow`);

      setSuccess(
        `Payments complete!\n` +
        `• ${initialPayment.toFixed(2)} XLM (${initialPaymentPercent}%) sent to freelancer\n` +
        `• ${remainingAmount.toFixed(2)} XLM (${100 - initialPaymentPercent}%) locked in escrow\n` +
        `• Initial TX: ${transactionHash.substring(0, 16)}...\n` +
        `• Escrow TX: ${escrowTransactionHash.substring(0, 16)}...\n\n` +
        `Creating job and saving to IPFS...`
      );

      // Calculate deadline
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + parseInt(formData.deadlineDays));

      // Create job on backend (now includes BOTH transaction hashes)
      const response = await axios.post(API_ENDPOINTS.JOBS, {
        client: wallet,
        freelancer: formData.freelancerAddress,
        amount: formData.amount,
        deadline: deadlineDate.toISOString(),
        description: formData.description,
        transactionHash: transactionHash, // Transaction hash for initial payment to freelancer
        escrowTransactionHash: escrowTransactionHash, // Transaction hash for escrow payment
        initialPaymentPercent: initialPaymentPercent, // Include initial payment %
        initialPaymentReleased: true, // Mark as released since we just sent it
      });

      if (response.data.success) {
        const jobId = response.data.job.id;
        const ipfsCID = response.data.ipfsCID;

        setSuccess(
          `Job created successfully!\n\n` +
          `Job ID: ${jobId}\n` +
          `Total Amount: ${formData.amount} XLM\n` +
          `  • Initial: ${initialPayment.toFixed(2)} XLM (${initialPaymentPercent}%) - SENT\n` +
          `  • Remaining: ${remainingAmount.toFixed(2)} XLM (${100 - initialPaymentPercent}%) - IN ESCROW\n` +
          `Freelancer: ${formData.freelancerAddress.substring(0, 12)}...\n` +
          `Deadline: ${formData.deadlineDays} days\n` +
          `Saved to IPFS: ${ipfsCID ? ipfsCID.substring(0, 12) + '...' : 'Pending'}\n` +
          `TX Hash: ${transactionHash.substring(0, 16)}...\n\n` +
          `Redirecting to dashboard...`
        );

        setTimeout(() => {
          navigate("/");
        }, 4000);
      } else {
        throw new Error("Failed to create job");
      }

    } catch (err: any) {
      console.error("Error creating job:", err);
      setError(err.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to build transaction XDR for wallet signing
  const buildJobCreationTransaction = async () => {
    // For MVP: Build a simple test transaction
    // In production: Build a Soroban contract invocation with create_job parameters

    // Return a minimal XDR that Freighter can sign
    // This demonstrates the wallet integration is working
    return new Promise((resolve) => {
      // Simplified XDR for demonstration
      // In a real app, use stellar-sdk to build proper Soroban contract calls
      const mockXDR = "AAAAAgAAAABexSIg06FtXzmFBQQtHZsrnyWxUzmthkBEhs/ktoeVYgAAAGQADKI4AAAABAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAF7FIiDToW1fOYUFBC0dmyufJbFTOa2GQESGz+S2h5ViAAAACgAAABBGYWlyRGVhbCBDcmVhdGUAAAAAAAAAAAAA";
      setTimeout(() => resolve(mockXDR), 500);
    });
  };

  return (
    <div style={{ paddingTop: "8rem", paddingBottom: "4rem", paddingLeft: "2rem", paddingRight: "2rem", minHeight: "100vh" }}>
      <div className="page-header" style={{ maxWidth: "800px", margin: "0 auto 2rem auto" }}>
        <div className="page-title">
          <h1>Create New Job</h1>
          <p>Set up an escrow contract for your freelancer.</p>
        </div>
      </div>

      <div className="glass-card animate-fade-in" style={{ maxWidth: "800px", margin: "0 auto" }}>

        {error && <div className="message-alert alert-error">{error}</div>}
        {success && <div className="message-alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="grid-cols-2" style={{ display: "grid", gap: "2rem", marginBottom: "1.5rem" }}>
            <div className="form-group">
              <label>Freelancer Wallet Address *</label>
              <input
                type="text"
                name="freelancerAddress"
                placeholder="GB... or GC..."
                value={formData.freelancerAddress}
                onChange={handleChange}
                required
                pattern="^G[A-Z0-9]{55}$"
                style={{ fontFamily: "monospace" }}
              />
            </div>

            <div className="form-group">
              <label>Payment Amount (USD) *</label>
              <input
                type="number"
                name="amount"
                placeholder="e.g., 500"
                value={formData.amount}
                onChange={handleChange}
                min="1"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Deadline (days from now) *</label>
            <select
              name="deadlineDays"
              value={formData.deadlineDays}
              onChange={handleChange}
            >
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </select>
          </div>

          <div className="form-group">
            <label>Initial Payment (% paid upfront) *</label>
            <select
              name="initialPaymentPercent"
              value={formData.initialPaymentPercent}
              onChange={handleChange}
            >
              <option value="5">5% upfront</option>
              <option value="10">10% upfront (Recommended)</option>
              <option value="15">15% upfront</option>
              <option value="20">20% upfront</option>
            </select>
            <small style={{ color: "#888", marginTop: "0.5rem", display: "block" }}>
              {formData.amount && `Initial payment: $${(parseFloat(formData.amount) * parseInt(formData.initialPaymentPercent) / 100).toFixed(2)} | Remaining: $${(parseFloat(formData.amount) * (100 - parseInt(formData.initialPaymentPercent)) / 100).toFixed(2)}`}
            </small>
          </div>

          <div className="form-group">
            <label>Job Description *</label>
            <textarea
              name="description"
              placeholder="Describe the work you need done..."
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ flex: 2 }}
            >
              {loading ? "Creating Job..." : "Create Job & Lock Funds"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/")}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="message-alert alert-info" style={{ marginTop: "3rem" }}>
          <div>
            <strong>How it works:</strong>
            <ol style={{ marginTop: "0.5rem", marginLeft: "1.5rem", lineHeight: "1.8" }}>
              <li>Create the job with freelancer details</li>
              <li>Deposit funds to lock them in escrow</li>
              <li>Freelancer submits work</li>
              <li>You review and approve/reject</li>
              <li>On approval, funds are released to freelancer</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateJob;
