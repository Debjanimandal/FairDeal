'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/components/WalletProvider';
import axios from 'axios';
import { API_ENDPOINTS } from '@/config/api';
import { createJobContract } from '@/utils/contract-utils';
import { executePayment } from '@/utils/stellar-utils';

export default function CreateJobPage() {
  const router = useRouter();
  const { wallet } = useWallet();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [formData, setFormData] = useState({
    freelancerAddress: "",
    amount: "",
    deadlineDays: "7",
    description: "",
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

      // Lock full amount in smart contract escrow
      const totalAmount = parseFloat(formData.amount);

      setSuccess(`Creating smart contract and locking ${totalAmount} XLM in escrow...`);

      console.log("📝 Creating job in smart contract...");
      
      // Create job in smart contract (locks full amount in escrow)
      const { jobId: contractJobId, txHash: escrowTransactionHash } = await createJobContract(
        wallet, // client
        formData.freelancerAddress, // freelancer
        parseFloat(formData.amount), // total amount
        0, // no initial payment - full amount locked in escrow
        parseInt(formData.deadlineDays) // deadline in days
      );

      console.log("✅ Smart contract job created! Job ID:", contractJobId);
      console.log("✅ Full amount locked in contract! TX:", escrowTransactionHash);
      console.log(`🔒 Locked ${totalAmount} XLM in smart contract escrow`);

      setSuccess(
        `Job created successfully!\n` +
        `• ${totalAmount.toFixed(2)} XLM locked in SMART CONTRACT\n` +
        `• Contract TX: ${escrowTransactionHash.substring(0, 16)}...\n` +
        `• Contract Job ID: ${contractJobId}\n\n` +
        `Saving metadata to backend...`
      );

      // Calculate deadline
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + parseInt(formData.deadlineDays));

      // Save job metadata to backend (contract is source of truth)
      const response = await axios.post(API_ENDPOINTS.JOBS, {
        id: contractJobId, // Use contract-generated job ID
        client: wallet,
        freelancer: formData.freelancerAddress,
        amount: formData.amount,
        deadline: deadlineDate.toISOString(),
        description: formData.description,
        transactionHash: escrowTransactionHash, // Smart contract transaction hash
        contractJobId: contractJobId, // Store contract job ID for future contract calls
      });

      if (response.data.success) {
        const jobId = response.data.job.id;
        const ipfsCID = response.data.ipfsCID;

        setSuccess(
          `Job created successfully!\n\n` +
          `Job ID: ${jobId}\n` +
          `Total Amount: ${formData.amount} XLM - LOCKED IN ESCROW\n` +
          `Freelancer: ${formData.freelancerAddress.substring(0, 12)}...\n` +
          `Deadline: ${formData.deadlineDays} days\n` +
          `Saved to IPFS: ${ipfsCID ? ipfsCID.substring(0, 12) + '...' : 'Pending'}\n` +
          `TX Hash: ${escrowTransactionHash.substring(0, 16)}...\n\n` +
          `Redirecting to dashboard in 2 seconds...`
        );

        // Use window.location for reliable redirect
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
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
              onClick={() => router.push("/")}
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
              <li>Lock the full amount in smart contract escrow (1 transaction)</li>
              <li>Freelancer submits work</li>
              <li>You review and approve/reject</li>
              <li>On approval, full amount is released to freelancer automatically</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
