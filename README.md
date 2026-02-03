# FairDeal - Decentralized Freelance Marketplace

A trustless escrow platform built on Stellar blockchain that enables secure freelance transactions with automated payment workflows, IPFS file storage, and client-side encryption.

![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Soroban](https://img.shields.io/badge/Soroban-Smart%20Contracts-orange)

---

## 🌟 Features

### Smart Contract Escrow
- **Trustless Transactions**: Funds locked in Soroban smart contract until work approval
- **Automated Workflows**: No intermediaries - smart contract handles fund release/refund
- **Multi-state Management**: Created → Submitted → Approved/Cancelled/Revision

### Enhanced Security
- **Client-Side Encryption**: Files encrypted before IPFS upload using AES-256-CBC
- **Watermarking**: Automatic watermark on preview files to prevent unauthorized use
- **Secure Key Management**: Encryption keys stored securely, only accessible post-approval

### IPFS Storage
- **Decentralized Storage**: All work files stored on IPFS via Pinata
- **Encrypted Uploads**: Files encrypted before upload for maximum privacy
- **Preview System**: Watermarked previews for client review before approval

### Seamless UX
- **Freighter Wallet Integration**: Connect with Stellar Freighter wallet
- **No Wallet Popups for Non-Payment Actions**: Submit work and request revisions without blockchain confirmations
- **Wallet Confirmations Only for Fund Movements**: Approve and cancel operations require signatures

---

## 🏗️ Architecture

### Tech Stack

**Frontend**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Freighter Wallet SDK

**Backend**
- Next.js API Routes
- File-based storage (jobs.json)
- IPFS (Pinata)

**Blockchain**
- Stellar Testnet
- Soroban Smart Contracts (Rust)
- Stellar SDK

**Storage & Encryption**
- IPFS via Pinata
- AES-256-CBC encryption
- Watermarking with Sharp.js

---

## 📁 Project Structure

```
FairDeal(stellar)/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── jobs/                 # Job management endpoints
│   │   ├── upload/               # File upload (IPFS)
│   │   └── download/             # File download (decrypt)
│   ├── jobs/[jobId]/             # Job details page
│   ├── submit-work/[jobId]/      # Freelancer submission page
│   └── dashboard/                # User dashboard
├── components/                   # React components
│   ├── WalletProvider.tsx        # Freighter wallet integration
│   └── ...
├── contract/                     # Soroban smart contract
│   ├── src/lib.rs               # Contract logic
│   └── Cargo.toml
├── utils/                        # Utilities
│   ├── contract-utils.ts         # Contract interaction
│   ├── encryption.ts             # AES encryption
│   └── ipfs.ts                   # IPFS upload/download
├── data/                         # Backend storage
│   └── jobs.json                 # Job metadata
└── .env.local                    # Environment variables
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Rust & Cargo
- Stellar CLI (`stellar`)
- Freighter Wallet Extension

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/fairdeal.git
   cd fairdeal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create `.env.local`:
   ```env
   # Stellar Configuration
   NEXT_PUBLIC_STELLAR_NETWORK=testnet
   NEXT_PUBLIC_CONTRACT_ID=your_contract_id_here
   
   # Escrow Configuration
   ESCROW_SECRET_KEY=your_escrow_secret_key
   
   # IPFS (Pinata)
   PINATA_API_KEY=your_pinata_api_key
   PINATA_SECRET_API_KEY=your_pinata_secret
   PINATA_JWT=your_pinata_jwt
   ```

4. **Build and deploy smart contract**
   ```bash
   cd contract
   cargo build --target wasm32-unknown-unknown --release
   stellar contract optimize --wasm target/wasm32-unknown-unknown/release/fairdeal_escrow.wasm
   stellar contract deploy --wasm target/wasm32-unknown-unknown/release/fairdeal_escrow.optimized.wasm --source-account default --network testnet
   ```

5. **Update contract ID in `.env.local`**

6. **Run development server**
   ```bash
   npm run dev
   ```

7. **Open [http://localhost:3000](http://localhost:3000)**

---

## 💼 Usage

### For Clients

1. **Connect Wallet**: Click "Connect Wallet" and approve Freighter connection
2. **Post Job**: Create job with amount, deadline, and description
3. **Funds Locked**: Payment automatically locked in smart contract escrow
4. **Review Work**: View watermarked preview when freelancer submits
5. **Decide**:
   - **Approve & Pay**: Release funds to freelancer (requires wallet confirmation)
   - **Request Revision**: Ask for changes without affecting escrow
   - **Cancel Deal**: Refund to your wallet (requires wallet confirmation)
6. **Download**: Access unencrypted files after approval

### For Freelancers

1. **Connect Wallet**: Link your Freighter wallet
2. **View Jobs**: Browse available jobs on dashboard
3. **Submit Work**: Upload files (encrypted automatically before IPFS upload)
4. **No Wallet Popup**: Submission happens without blockchain confirmation
5. **Get Paid**: Receive payment when client approves (automatic via smart contract)

---

## 🔐 Security Features

### Encryption Workflow
1. **Upload**: Files encrypted with AES-256-CBC before IPFS upload
2. **Storage**: Encrypted files stored on IPFS, keys stored in backend
3. **Preview**: Watermarked preview generated for client review
4. **Approval**: Original files decrypted and provided to client post-approval

### Smart Contract Security
- **Trustless Escrow**: Funds held by smart contract, not platform
- **State Validation**: Backend validates workflow transitions
- **Authorization**: Only job client can approve/cancel
- **No Double-Spend**: Contract prevents duplicate approvals

---

## 🔗 Smart Contract Functions

| Function | Description | Wallet Required? |
|----------|-------------|------------------|
| `create_job` | Lock funds in escrow | ✅ Yes |
| `submit_work` | Mark work as submitted | ❌ No (backend only) |
| `approve_work` | Release funds to freelancer | ✅ Yes |
| `cancel_deal` | Refund client | ✅ Yes |
| `get_job` | Query job details | ❌ No |
| `get_job_count` | Get total jobs | ❌ No |

---

## 🛠️ Development

### Running Tests
```bash
npm test                    # Frontend tests
cd contract && cargo test   # Contract tests
```

### Building for Production
```bash
npm run build
npm start
```

### Contract Development
```bash
cd contract
cargo build --target wasm32-unknown-unknown --release
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/fairdeal_escrow.wasm
```

---

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_STELLAR_NETWORK` | Stellar network (testnet/mainnet) | ✅ |
| `NEXT_PUBLIC_CONTRACT_ID` | Deployed contract ID | ✅ |
| `ESCROW_SECRET_KEY` | Escrow account secret key | ✅ |
| `PINATA_API_KEY` | Pinata API key | ✅ |
| `PINATA_SECRET_API_KEY` | Pinata secret | ✅ |
| `PINATA_JWT` | Pinata JWT token | ✅ |

---

## 🚧 Roadmap

- [ ] Support for multiple currencies (USDC, XLM)
- [ ] Dispute resolution mechanism
- [ ] Reputation system for freelancers
- [ ] Multi-milestone payments
- [ ] Mobile app (React Native)
- [ ] Mainnet deployment

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Stellar Development Foundation](https://stellar.org) - Blockchain infrastructure
- [Soroban](https://soroban.stellar.org) - Smart contract platform
- [Pinata](https://pinata.cloud) - IPFS pinning service
- [Freighter Wallet](https://www.freighter.app/) - Stellar wallet

---

## 📧 Contact

For questions and support, please open an issue or contact [your-email@example.com](mailto:your-email@example.com).

---

**Built with ❤️ for the Stellar ecosystem**
