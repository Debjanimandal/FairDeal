# FairDeal 🤝

## Secure Freelance Payments on the Blockchain

**FairDeal** is a decentralized escrow platform built on Stellar blockchain that makes freelance payments safe, transparent, and trustless. No middlemen, no payment disputes, no broken promises.

---

## 🎯 The Problem We Solve

### Traditional Freelancing Platforms Have Issues:

❌ **High Fees** - Platforms take 10-20% commission  
❌ **Payment Delays** - Funds held for weeks  
❌ **Trust Issues** - Clients can refuse payment after work is done  
❌ **Disputes** - Manual resolution that favors platforms, not users  
❌ **Custody Risk** - Platforms control your money  
❌ **No Transparency** - Hidden fees and unclear processes  

### FairDeal's Solution:

✅ **Zero Platform Fees** - Only blockchain transaction costs (pennies)  
✅ **Instant Settlements** - Funds released immediately upon approval  
✅ **Smart Contract Escrow** - Money locked in code, not controlled by admins  
✅ **Automatic Protection** - Deadline-based refunds built-in  
✅ **Full Transparency** - Every transaction visible on blockchain  
✅ **Fraud Prevention** - Immutable on-chain reputation system  

---

## 💡 What is FairDeal?

FairDeal is a **trustless freelance marketplace** where:

- **Clients** post jobs and lock payment in a smart contract
- **Freelancers** deliver work encrypted and watermarked
- **Smart contracts** automatically release payment upon approval
- **Blockchain** ensures transparency and prevents fraud

**No platform controls your funds. No disputes. Just code.**

---

## 🌟 Key Benefits

### For Clients 👔

- **Pay Only for Completed Work** - Funds locked until you approve
- **Preview Before Paying** - Review watermarked files before release
- **Automatic Refunds** - Get money back if deadline is missed
- **Fraud Protection** - Flag bad actors permanently on-chain
- **No Platform Fees** - Keep 100% of your budget

### For Freelancers 💼

- **Guaranteed Payment** - Funds locked in escrow before you start
- **Fast Payouts** - Instant release upon client approval
- **No Custody Risk** - Platform can't freeze your earnings
- **Fair Deadlines** - Automatic compensation if client delays
- **Portable Reputation** - On-chain history follows you everywhere

---

## 🚀 How It Works

### Simple 4-Step Process:

1. **📝 Client Creates Job**
   - Enter freelancer's wallet address
   - Lock payment in smart contract (100% in escrow)
   - Set deadline and job description

2. **💼 Freelancer Delivers**
   - Upload work files (encrypted automatically)
   - Client sees watermarked preview
   - Files stored on decentralized IPFS

3. **👀 Client Reviews**
   - Preview work with watermarks
   - Approve to release full payment
   - Request revision if needed
   - Raise fraud flag for refund

4. **💰 Automatic Payment**
   - Smart contract releases funds
   - No manual processing
   - Instant settlement

---

## 🔐 Security & Trust Features

### Smart Contract Escrow
- Funds locked in **Soroban smart contracts** (Stellar blockchain)
- No human can access or freeze funds
- Code executes automatically based on job status

### File Protection
- **AES-256-CBC encryption** for submitted work
- **Watermarked previews** prevent theft
- **IPFS storage** for decentralized file hosting

### Fraud Prevention
- Immutable **on-chain reputation** system
- Fraud flags permanently recorded
- Transparent history for all users

### Deadline Protection
- Automatic refunds if freelancer misses deadline
- Emergency release if client doesn't respond
- Fair dispute resolution built into smart contract

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run the application
npm run dev

# Open browser
http://localhost:3000
```

That's it! Everything (frontend + backend) runs on port 3000.

---

---

## ⚡ Live Demo

**🌐 Try it now:** [FairDeal on Vercel](https://fair-deal.vercel.app)

**📊 Smart Contract:** `CBONHPWFT7D2USWDGC5G55LJNBCRRTN4YQE6O6CFJA3RROIQ4UIWUFDM` (Stellar Testnet)

---

## 🛠️ Tech Stack

Built with cutting-edge blockchain and web technologies:

- **Blockchain:** Stellar (Soroban Smart Contracts in Rust)
- **Frontend:** Next.js 14, TypeScript, React
- **Wallet:** Freighter Wallet Integration
- **Storage:** IPFS (Pinata) for decentralized file hosting
- **Encryption:** AES-256-CBC for file security
- **Network:** Currently on Stellar Testnet (Production ready for Mainnet)

---

## 📋 Complete Feature List

### 🔐 Trustless Escrow System
- Full amount locked in Soroban smart contract (not backend server)
- Automatic fund release via blockchain logic
- No custody risk - backend cannot access funds
- Deadline enforcement by smart contract code

### 💼 Job Management
- Create jobs with freelancer wallet address
- Set custom deadlines (1-30 days)
- Track job status in real-time
- View all jobs in dashboard (Client & Freelancer views)

### 📁 File Handling
- Upload up to 50 files (50MB total)
- Automatic AES-256-CBC encryption
- Watermarked preview generation
- IPFS decentralized storage
- Secure download after approval

### 🎨 Preview System
- Watermarked images for client review
- Code execution sandbox (Node.js, Python, Java, HTML)
- Preview before final payment
- Protects freelancer's intellectual property

### ⚖️ Dispute Resolution
- Approve & release payment
- Request revisions
- Raise fraud flags with automatic refund
- Immutable on-chain fraud tracking

### 🌐 Decentralized Architecture
- IPFS for persistent file storage
- Blockchain for payment transparency
- No single point of failure
- Censorship-resistant

---

## 🛠️ Setup

### 1. Environment Variables

Create `.env.local` file in the root directory:

```env
# Stellar Configuration
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_CONTRACT_ID=your_contract_id_here

# Escrow Configuration (Server-side only)
ESCROW_SECRET_KEY=your_escrow_secret_key
ESCROW_PUBLIC_KEY=your_escrow_public_key

# Pinata/IPFS Configuration (Server-side only)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_api_key

# Optional: Restore from IPFS on startup
RESTORE_FROM_IPFS_CID=your_ipfs_cid_here
```

### 2. Install Freighter Wallet

- Install Freighter browser extension
- Create or import testnet account
- Get testnet XLM from friendbot: https://laboratory.stellar.org/#account-creator?network=test

### 3. Run the Application

```bash
npm install
npm run dev
```

### 4. Build & Deploy Smart Contract (Optional - for production)

**Prerequisites:**
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown

# Install Soroban CLI
cargo install --locked soroban-cli
```

**Build:**
```bash
# Windows
.\build-contract.ps1

# Linux/Mac
./build-contract.sh
```

**Deploy to Testnet:**
```bash
# Windows
.\deploy-contract.ps1

# Linux/Mac
./deploy-contract.sh
```

See [CONTRACT_GUIDE.md](CONTRACT_GUIDE.md) for detailed smart contract documentation.

---

## 📁 Project Structure

```
FairDeal/
├── app/                        # Next.js App Router
│   ├── api/                    # Backend API routes
│   │   ├── jobs/               # Job management endpoints
│   │   ├── escrow-address/     # Escrow public key
│   │   ├── freelancers/        # Fraud flags
│   │   ├── decrypt-file/       # File decryption
│   │   ├── ipfs/               # IPFS CID tracking
│   │   └── health/             # Health check
│   ├── page.tsx                # Landing + Dashboard
│   ├── login/                  # Wallet connection
│   ├── create-job/             # Job creation
│   ├── jobs/[jobId]/           # Job detail
│   └── submit-work/[jobId]/    # Work submission
├── components/                 # React components
│   ├── WalletProvider.tsx      # Wallet context
│   └── Navigation.tsx          # Navigation bar
├── lib/                        # Server-side utilities
│   ├── storage.ts              # File-based persistence
│   ├── stellar-utils.ts        # Stellar blockchain
│   ├── ipfs-utils.ts           # IPFS & watermarking
│   └── code-execution.ts       # Code sandbox
├── utils/                      # Client-side utilities
│   └── stellar-utils.ts        # Client Stellar ops
├── config/                     # Configuration
│   └── api.ts                  # API endpoints config
├── contract/                   # Soroban Smart Contract (Rust)
│   ├── src/
│   │   ├── lib.rs              # Main contract logic
│   │   └── test.rs             # Contract tests
│   └── Cargo.toml              # Rust dependencies
├── data/                       # Persistent storage
│   ├── jobs.json               # Job database
│   ├── files.json              # File metadata
│   ├── fraud.json              # Fraud flags
│   └── ipfs-cid.json           # Latest IPFS CID
├── build-contract.ps1          # Build script (Windows)
├── build-contract.sh           # Build script (Linux/Mac)
├── deploy-contract.ps1         # Deploy script (Windows)
├── deploy-contract.sh          # Deploy script (Linux/Mac)
├── CONTRACT_GUIDE.md           # Smart contract documentation
├── instrumentation.ts          # Server startup logic
├── next.config.js              # Next.js configuration
├── tsconfig.json               # TypeScript config
├── .env.local                  # Environment variables
└── package.json                # Dependencies
```

---

## 🔗 API Endpoints

All backend APIs are available at `http://localhost:3000/api/*`

### Job Management
- `POST /api/jobs` - Create new job
- `GET /api/jobs` - List all jobs
- `GET /api/jobs/:jobId` - Get job details
- `GET /api/jobs/:jobId/status` - Get job status

### Work Submission & Preview
- `POST /api/jobs/submit-work` - Submit work files
- `GET /api/jobs/:jobId/preview` - Get preview status
- `GET /api/jobs/:jobId/preview-content` - View watermarked preview
- `GET /api/jobs/:jobId/download` - Download original files (approved only)

### Job Actions
- `POST /api/jobs/:jobId/release-initial-payment` - Mark initial payment released
- `POST /api/jobs/:jobId/approve` - Approve work & release funds
- `POST /api/jobs/:jobId/reject` - Reject work or request revision
- `POST /api/jobs/:jobId/raise-fraud-flag` - Raise fraud flag & refund

### Utilities
- `GET /api/escrow-address` - Get escrow public key
- `GET /api/freelancers/:address/fraud-flags` - Get fraud history
- `POST /api/decrypt-file` - Decrypt file
- `GET /api/ipfs/latest-cid` - Get latest IPFS CID
- `GET /api/health` - Health check

---

## 💰 How It Works

### 1. Client Creates Job
1. Connect wallet (Freighter)
2. Select "Client" role
3. Fill job details:
   - Freelancer address
   - Amount in XLM
   - Initial payment % (10/20/30/50%)
   - Deadline
   - Description
4. Two payments executed:
   - Initial % → Freelancer
   - Remaining % → Escrow

### 2. Freelancer Submits Work
1. Connect wallet
2. Select "Freelancer" role
3. View assigned jobs
4. Upload work files (up to 50 files, 50MB)
5. Files automatically:
   - Encrypted with AES-256-CBC
   - Watermarked for preview
   - Uploaded to IPFS

### 3. Client Reviews Work
1. View watermarked preview
2. For code projects: See execution results
3. Three options:
   - **Approve & Pay** - Release remaining funds
   - **Request Revision** - Allow resubmission
   - **Raise Fraud Flag** - Terminate & refund

### 4. Fraud Protection
- Clients can raise fraud flags
- Fraud history tracked by freelancer address
- Automatic refund on fraud flag
- Job immediately terminated

---

## 🔐 Security Features

### Encryption
- **AES-256-CBC** encryption for all submitted files
- Random 32-byte keys per file
- Random 16-byte IVs per file
- Keys stored encrypted in file metadata

### Watermarking
- "PREVIEW ONLY" text overlay on images
- Opacity reduction for visual indication
- Protects client's intellectual property

### Code Execution Sandbox
- Isolated temporary directories
- 30-second execution timeout
- Automatic cleanup after execution
- Supports: Node.js, Python, Java, HTML

### Stellar Testnet
- All transactions on testnet
- Escrow account management
- Transaction memos for tracking

---

## 📊 Job States

| State | Description | Client Actions | Freelancer Actions |
|-------|-------------|----------------|-------------------|
| 0 | Created | Wait | Upload Work |
| 1 | Work Submitted | Approve/Reject/Fraud | Wait |
| 2 | Approved | Download Files | - |
| 3 | Rejected/Refunded | - | - |
| 4 | Revision Requested | Wait | Re-upload Work |

---

## 🧪 Testing

### Example Test Flow

1. **Create Test Job** (as Client)
```
Freelancer: GBT2EHJKQAWW46QRJUY343YGEJDEPIU3U77S2R7ZXLP4NYQFUTGY3PRP
Amount: 10 XLM
Initial Payment: 20% (2 XLM)
Deadline: 7 days
Description: "Create a calculator app"
```

2. **Submit Work** (as Freelancer)
- Upload HTML/JS calculator files
- Preview shows watermarked version
- Code execution displays calculator

3. **Review & Approve** (as Client)
- View preview
- Test "Approve & Pay" (8 XLM released)
- Verify transaction on Stellar testnet

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Delete .next cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try again
npm run dev
```

### Jobs not showing up
- Check `data/jobs.json` exists
- Check console for errors
- Verify wallet connection

### File upload fails
- Check file size (max 50MB)
- Check file count (max 50 files)
- Verify PINATA keys in `.env.local`

### Stellar transaction fails
- Verify wallet has enough XLM
- Check testnet friendbot if needed
- Verify ESCROW_PUBLIC_KEY is correct

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel auto-detects Next.js configuration

3. **Add Environment Variables**
   
   In Vercel dashboard, add these variables:
   ```
   NEXT_PUBLIC_STELLAR_NETWORK=testnet
   NEXT_PUBLIC_CONTRACT_ID=your_contract_id
   ESCROW_SECRET_KEY=your_escrow_secret
   ESCROW_PUBLIC_KEY=your_escrow_public
   PINATA_API_KEY=your_pinata_key
   PINATA_SECRET_API_KEY=your_pinata_secret
   ```

4. **Deploy!**
   - Click "Deploy"
   - Your app will be live at `your-app.vercel.app`

### Other Platforms

FairDeal can be deployed on any platform that supports Next.js 14:
- Netlify
- Railway
- AWS Amplify
- Self-hosted VPS

---

## 🎓 Use Cases

### Freelance Development
Hire developers for web apps, mobile apps, or smart contracts with guaranteed payment

### Design Work
Commission logos, websites, or marketing materials with preview-before-pay

### Content Creation
Pay writers, video editors, or content creators securely

### Consulting Services
Lock payment for hourly consulting with milestone-based releases

### Any Remote Work
Any job that can be delivered digitally works on FairDeal

---

## 🌍 Why Blockchain Matters

### Traditional Escrow Problems:
- Platforms charge 10-20% fees
- Manual dispute resolution (slow & biased)
- Platform can freeze or confiscate funds
- Requires trust in centralized company

### Smart Contract Benefits:
- Near-zero transaction fees (~$0.00001 per transaction)
- Instant automatic execution
- Mathematically provable fairness
- Trustless - no intermediary needed
- Censorship-resistant
- Works globally without restrictions

---

## 📊 Comparison

| Feature | FairDeal | Upwork | Fiverr | Freelancer.com |
|---------|----------|--------|--------|----------------|
| **Platform Fee** | ~$0.00001 | 10-20% | 20% | 10% |
| **Payment Speed** | Instant | 5-10 days | 14 days | 7 days |
| **Escrow** | Smart Contract | Platform | Platform | Platform |
| **Transparency** | Full (Blockchain) | Limited | Limited | Limited |
| **Dispute** | Automatic | Manual | Manual | Manual |
| **Custody** | Trustless | Platform owns | Platform owns | Platform owns |
| **Fraud Protection** | On-chain permanent | Platform decision | Platform decision | Platform decision |
| **Global Access** | ✅ | ⚠️ Restricted | ⚠️ Restricted | ⚠️ Restricted |

---

## 🐛 Troubleshooting

### Wallet Connection Issues
- Ensure Freighter extension is installed
- Check you're on the correct network (Testnet)
- Refresh the page and try again

### Transaction Fails
- Verify you have enough XLM in your wallet
- Get free testnet XLM: [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test)
- Check if the contract ID is correct

### File Upload Fails
- Check file size (max 50MB total)
- Verify Pinata credentials in environment variables
- Try uploading fewer files

### Job Not Showing
- Check browser console for errors (F12)
- Verify you're connected with correct wallet address
- Clear cache and reload

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Report Bugs** - Open an issue on GitHub
2. **Suggest Features** - Share your ideas
3. **Submit PRs** - Fix bugs or add features
4. **Improve Docs** - Help others understand FairDeal
5. **Spread the Word** - Tell other freelancers!

---

## 📄 License

MIT License - Free to use, modify, and distribute

---

## 🙏 Acknowledgments

Built with ❤️ on **Stellar Blockchain**

Special thanks to:
- Stellar Development Foundation
- Soroban Smart Contracts team
- Freighter Wallet team
- IPFS/Pinata community

---

## 📧 Support & Community

- **Issues:** [GitHub Issues](https://github.com/Debjanimandal/FairDeal/issues)
- **Documentation:** See `/CONTRACT_GUIDE.md` for smart contract details
- **Stellar Network:** [stellar.org](https://stellar.org)

---

## 🎉 Get Started Today!

Ready to experience trustless freelancing?

1. Install [Freighter Wallet](https://www.freighter.app/)
2. Get testnet XLM from [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test)
3. Visit [FairDeal](https://fair-deal.vercel.app)
4. Create your first job or find work!

**The future of freelancing is decentralized. Welcome to FairDeal.** 🚀

---

## 🔧 For Developers

### Smart Contract Architecture
The app uses a **hybrid approach**:
- **Smart Contract**: Escrow logic, fund custody, deadline enforcement
- **Backend**: IPFS uploads, file encryption, preview generation, metadata

### Why This Design?
- **Smart Contract**: Trustless, automatic, transparent, secure
- **Backend**: Handles heavy off-chain operations (file processing, watermarking)

### Learn More
See [CONTRACT_GUIDE.md](CONTRACT_GUIDE.md) for detailed smart contract documentation and integration instructions.

