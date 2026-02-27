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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      background: '#FFFFFF',
      marginTop: '-80px',
      paddingTop: '0',
      overflow: 'hidden' // contain the curve
    }}>

      {/* LEFT COLUMN: Guidance (White) */}
      <div style={{
        flex: '1 1 400px',
        background: '#FFFFFF',
        color: '#0F172A',
        padding: '6rem 6rem 2rem 4rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        <div className="animate-fade-in delay-100">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '99px',
            background: '#F1F5F9',
            border: '1px solid #E2E8F0',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            color: '#0072FF',
            fontWeight: '600'
          }}>
            Client Workspace
          </div>

          <h1 style={{
            fontSize: '3rem',
            fontWeight: '800',
            lineHeight: 1.1,
            marginBottom: '2rem',
            color: '#0F172A',
            letterSpacing: '-0.02em'
          }}>
            Create New<br />
            <span style={{ color: '#0072FF' }}>Smart Contract</span>
          </h1>

          <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>How it works</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E0F2FE', color: '#0072FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>1</div>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '0.2rem' }}>Define Terms</div>
                  <div style={{ fontSize: '0.9rem', color: '#64748B' }}>Set amount, deadline, and freelancer address.</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E0F2FE', color: '#0072FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>2</div>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '0.2rem' }}>Lock Funds</div>
                  <div style={{ fontSize: '0.9rem', color: '#64748B' }}>Full amount is deposited into the smart contract escrow.</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E0F2FE', color: '#0072FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>3</div>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '0.2rem' }}>Approve & Pay</div>
                  <div style={{ fontSize: '0.9rem', color: '#64748B' }}>Funds release instantly when you approve the work.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Form (Dark Blue) */}
      <div style={{
        flex: '1 1 500px',
        background: 'linear-gradient(135deg, #020617 0%, #172554 100%)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem 1rem 1rem 140px', // Add left padding to account for curve
        minHeight: '100vh'
      }}>
        {/* Curve */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: -1,
          bottom: 0,
          width: '120px',
          zIndex: 5,
          pointerEvents: 'none'
        }}>
          <svg
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
            height="100%"
            width="100%"
            style={{ display: 'block', transform: 'scaleX(-1)' }}
          >
            <path d="M0 0 C 40 0 60 100 0 100 L 100 100 L 100 0 Z" fill="#FFFFFF" />
          </svg>
        </div>

        <div className="glass-card animate-fade-in" style={{
          width: '100%',
          maxWidth: '500px',
          position: 'relative',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '1.5rem',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>

          {error && <div className="message-alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
          {success && <div className="message-alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label style={{ color: '#94A3B8' }}>Freelancer Wallet Address</label>
                <input
                  type="text"
                  name="freelancerAddress"
                  placeholder="GB... or GC..."
                  value={formData.freelancerAddress}
                  onChange={handleChange}
                  required
                  pattern="^G[A-Z0-9]{55}$"
                  style={{ fontFamily: "monospace", background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                />
              </div>

              <div className="form-group">
                <label style={{ color: '#94A3B8' }}>Amount (XLM)</label>
                <input
                  type="number"
                  name="amount"
                  placeholder="e.g., 500"
                  value={formData.amount}
                  onChange={handleChange}
                  min="1"
                  step="0.01"
                  required
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#94A3B8' }}>Deadline</label>
              <select
                name="deadlineDays"
                value={formData.deadlineDays}
                onChange={handleChange}
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              >
                <option value="1">1 day</option>
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: '#94A3B8' }}>Job Description</label>
              <textarea
                name="description"
                placeholder="Describe the work requirements..."
                value={formData.description}
                onChange={handleChange}
                required
                style={{ height: '80px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              />
            </div>

            <div style={{ display: "flex", gap: "1rem" }}>
              <button
                type="submit"
                className="btn"
                disabled={loading}
                style={{
                  flex: 2,
                  background: '#FFFFFF',
                  color: '#0F172A',
                  border: 'none',
                  padding: '0.6rem 1.2rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  borderRadius: '8px'
                }}
              >
                {loading ? "Creating..." : "Create Job Contract"}
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => router.push("/")}
                style={{
                  flex: 1,
                  background: 'transparent',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '0.6rem 1.2rem',
                  fontSize: '0.9rem'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
