<div align="center">

# 🤝 FairDeal

### Decentralized Freelance Marketplace on Stellar

**No middlemen. No trust required. Just code.**

FairDeal is a trustless escrow platform built on the Stellar blockchain. Clients lock funds in a Soroban smart contract, freelancers deliver work securely via encrypted IPFS uploads, and payments are released automatically — all without a central authority.

<br/>

[![Stellar](https://img.shields.io/badge/Stellar-Testnet-7B61FF?style=for-the-badge&logo=stellar&logoColor=white)](https://stellar.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![Soroban](https://img.shields.io/badge/Soroban-Smart%20Contracts-F97316?style=for-the-badge)](https://soroban.stellar.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![IPFS](https://img.shields.io/badge/IPFS-Pinata-65C2CB?style=for-the-badge)](https://pinata.cloud)


</div>

---

## 📖 What is FairDeal?

Freelancing platforms today take significant cuts, hold funds, and act as gatekeepers. FairDeal removes all of that.

Here's how it works in plain English:

1. **A client posts a job** and locks the payment into a smart contract on the Stellar blockchain. The money is held by code — not a company.
2. **A freelancer picks up the job** and uploads their completed work. Files are automatically encrypted with AES-256 before being stored on IPFS (a decentralized file network).
3. **The client reviews a watermarked preview** of the work to verify quality without receiving the full file.
4. **The client approves**, and the smart contract instantly releases the funds to the freelancer. The original, unencrypted file becomes available for download.
5. **If something's wrong**, the client can request a revision or cancel for a full refund — all enforced by the contract, not a support ticket.

No platform fees. No payment delays. No disputes with a helpdesk.

---

## ✨ Features

### 🔒 Trustless Escrow via Smart Contract
- Client funds are locked in a **Soroban smart contract** on Stellar — not held by FairDeal
- Payments are released **only when the client explicitly approves** the work
- Cancellations trigger an **automatic on-chain refund** to the client
- All fund movements require a **Freighter wallet signature** — the platform can never move your money

### 🗂️ Encrypted IPFS File Storage
- Submitted work is encrypted with **AES-256-CBC** before leaving the freelancer's machine
- Encrypted files are pinned to **IPFS via Pinata** — no central server holds your files
- Encryption keys are only released **after client approval**
- Even if someone gets the IPFS link, they cannot read the file without the key

### 🖼️ Watermarked Preview System
- When a freelancer submits, a **watermarked preview** is generated automatically
- Clients can verify the work is real and complete **before releasing payment**
- The clean, watermark-free file is only accessible **after funds are released**
- Prevents unauthorized use of deliverables before payment

### 🌐 Freighter Wallet Integration
- Connect your **Stellar Freighter wallet** in one click — no account creation needed
- Wallet signatures are only required for **fund movements** (create, approve, cancel)
- Submitting work and requesting revisions require **zero wallet popups**
- Works on **Stellar Testnet** for safe experimentation

### 📋 Full Job Lifecycle Management
The smart contract enforces a complete, tamper-proof workflow:

```
Created → Submitted → Approved ✅
                   ↘ Revision Requested 🔄
                   ↘ Rejected ❌
                   
```



---

## 🚀 Deployed Smart Contract

The FairDeal escrow contract is **live on Stellar Testnet**.

| | |
|---|---|
| **Network** | Stellar Testnet |
| **Language** | Rust (Soroban SDK) |
| **Deploy Tx** | [`286021c7...`](https://stellar.expert/explorer/testnet/tx/286021c7bff722a759f6c39e1e47e36d6d0758587e0ab50c17b6a2d88528a598) |

🔗 **[View on Stellar Expert](https://stellar.expert/explorer/testnet/tx/286021c7bff722a759f6c39e1e47e36d6d0758587e0ab50c17b6a2d88528a598)**  
🔗 **[Interact on Stellar Lab](https://lab.stellar.org/r/testnet/contract/CDX36UD34PUONFGMC4MA7ICGHOGE76L26YLMOTY4FUZCDZOWCB4R2SBL)**

### Contract Functions

| Function | What it does | Requires Wallet? |
|---|---|:---:|
| `create_job` | Locks client funds in escrow, creates the job | ✅ Yes |
| `submit_work` | Records the IPFS CID of submitted work on-chain | ❌ No |
| `approve_work` | Releases escrowed funds to the freelancer | ✅ Yes |
| `cancel_deal` | Refunds the client and cancels the job | ✅ Yes |
| `request_revision` | Marks job for revision without touching funds | ❌ No |
| `flag_fraud` | Records a fraud flag against a freelancer | ✅ Yes |
| `get_job` | Returns full job details by ID | ❌ No |
| `get_job_count` | Returns total number of jobs created | ❌ No |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Blockchain** | Stellar Testnet, Soroban Smart Contracts (Rust) |
| **Wallet** | Stellar Freighter |
| **File Storage** | IPFS via Pinata |
| **Encryption** | AES-256-CBC (Node.js `crypto`) |
| **Watermarking** | Jimp |
| **Stellar SDK** | `@stellar/stellar-sdk` v14 |

---

## 📁 Project Structure

```
FairDeal(stellar)/
├── app/                        # Next.js App Router pages & API routes
│   ├── api/
│   │   ├── jobs/               # Create, fetch, and manage jobs
│   │   ├── ipfs/               # IPFS upload & CID tracking
│   │   ├── decrypt-file/       # Decrypt & deliver files post-approval
│   │   ├── escrow-address/     # Escrow account helper
│   │   └── freelancers/        # Fraud flag endpoints
│   ├── create-job/             # Client: post a new job
│   ├── jobs/[jobId]/           # Job detail & action page
│   ├── submit-work/[jobId]/    # Freelancer: upload work
│   ├── login/                  # Wallet connect page
│   └── profile/                # User profile page
├── contract/
│   ├── src/lib.rs              # Soroban smart contract (Rust)
│   └── Cargo.toml
├── components/
│   └── WalletProvider.tsx      # Freighter wallet context
├── utils/
│   ├── contract-utils.ts       # Contract interaction helpers
│   └── stellar-utils.ts        # Stellar SDK utilities
├── lib/
│   ├── ipfs-utils.ts           # Pinata upload/download
│   ├── stellar-utils.ts        # Server-side Stellar helpers
│   └── storage.ts              # JSON file-based data store
└── data/                       # Local job & IPFS metadata storage
```

---

## ⚡ Getting Started

### What you'll need

- [Node.js 18+](https://nodejs.org)
- [Rust & Cargo](https://www.rust-lang.org/tools/install)
- [Stellar CLI](https://developers.stellar.org/docs/tools/stellar-cli)
- [Freighter Wallet](https://www.freighter.app/) browser extension
- A free [Pinata](https://pinata.cloud) account for IPFS

### 1. Clone & install

```bash
git clone https://github.com/yourusername/fairdeal.git
cd fairdeal
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the root:

```env
# Stellar
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_CONTRACT_ID=your_ContractID

# Escrow account (Stellar keypair for the platform escrow)
ESCROW_SECRET_KEY=your_escrow_secret_key

# IPFS via Pinata
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret
PINATA_JWT=your_pinata_jwt
```

> 💡 **Tip:** Get free Pinata API keys at [pinata.cloud](https://pinata.cloud). For the escrow key, generate a Stellar keypair at [laboratory.stellar.org](https://laboratory.stellar.org/#account-creator) and fund it on Testnet.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build & deploy your own contract

```bash
cd contract
cargo build --target wasm32-unknown-unknown --release
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/fairdeal_escrow.wasm
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/fairdeal_escrow.optimized.wasm \
  --source-account default \
  --network testnet
```

Then update `NEXT_PUBLIC_CONTRACT_ID` in `.env.local` with your new contract address.

---

## 💼 How to Use

### As a Client

1. Open the app and click **Connect Wallet** — approve the Freighter popup
2. Click **Post a Job**, fill in the details and payment amount
3. Confirm the transaction — your XLM is now locked in the smart contract
4. Wait for a freelancer to submit work
5. Review the **watermarked preview**
6. **Approve** to pay and unlock the file, **Request Revision** if changes are needed, or **Cancel** for a refund

### As a Freelancer

1. **Connect Wallet** with Freighter
2. Browse open jobs and pick one
3. Upload your work on the **Submit Work** page — files are encrypted automatically
4. Wait for the client to review your watermarked preview
5. Once approved, payment lands in your Stellar wallet automatically

---

## 🔐 Security Model

```
Client deposits payment
        ↓
Smart Contract holds funds (trustless)
        ↓
Freelancer uploads work
        ↓  AES-256-CBC encryption
IPFS stores encrypted file (Pinata)
        ↓
Client sees watermarked preview
        ↓
Client approves → Contract releases funds
        ↓
Decryption key released → Client downloads clean file
```

- **No single point of failure** — Funds are on-chain, files are on IPFS
- **Platform cannot steal funds** — Smart contract enforces all rules
- **Files are private** — Encrypted before upload; key only released on approval

---

## 📝 Environment Variables

| Variable | Description | Required |
|---|---|:---:|
| `NEXT_PUBLIC_STELLAR_NETWORK` | `testnet` or `mainnet` | ✅ |
| `NEXT_PUBLIC_CONTRACT_ID` | Deployed Soroban contract address | ✅ |
| `ESCROW_SECRET_KEY` | Stellar secret key for platform escrow account | ✅ |
| `PINATA_API_KEY` | Pinata API key | ✅ |
| `PINATA_SECRET_API_KEY` | Pinata secret API key | ✅ |
| `PINATA_JWT` | Pinata JWT for uploads | ✅ |

---

## 🚧 Roadmap

- [ ] USDC payment support (Stellar anchor assets)
- [ ] On-chain dispute resolution with arbitration
- [ ] Freelancer reputation & review system
- [ ] Multi-milestone payment schedules
- [ ] Mainnet deployment


---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 🙏 Acknowledgments

- [Stellar Development Foundation](https://stellar.org) — Blockchain infrastructure
- [Soroban](https://soroban.stellar.org) — Smart contract platform for Stellar
- [Pinata](https://pinata.cloud) — IPFS pinning service
- [Freighter](https://www.freighter.app/) — Stellar browser wallet

---


