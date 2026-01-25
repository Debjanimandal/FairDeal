# 🚀 FairDeal Deployment Checklist

## ✅ Pre-Deployment Complete
- [x] Smart contract built (15779 bytes)
- [x] Backend configured with environment variable support
- [x] Frontend centralized API configuration
- [x] GitHub repository cleaned and pushed

## 🎯 Deployment Steps

### 1️⃣ Deploy Smart Contract to Stellar Testnet

**Prerequisites:**
- [ ] Get testnet XLM from: https://laboratory.stellar.org/#account-creator?network=test
- [ ] Note your funded account address

**Deploy Command:**
```bash
stellar contract deploy \
  --wasm contract/target/wasm32v1-none/release/fairdeal_escrow.wasm \
  --source deployer \
  --network testnet
```

**Result:** Save the CONTRACT_ID (e.g., `CBVK...XYZ`)

---

### 2️⃣ Deploy Backend to Render

**Quick Deploy:** https://render.com

1. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect GitHub: `Debjanimandal/FairDeal`

2. **Configuration**
   - **Name:** `fairdeal-backend`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` (or `node index.js`)
   - **Plan:** Free

3. **Environment Variables** (Critical!)
   ```
   PORT=5000
   WEB3_STORAGE_TOKEN=<your_web3_storage_token>
   STELLAR_CONTRACT_ID=<contract_id_from_step_1>
   STELLAR_NETWORK=testnet
   NODE_ENV=production
   ```

4. **Get Web3.Storage Token:**
   - Visit: https://web3.storage
   - Sign up and create API token
   - Add to environment variables

**Result:** Save backend URL (e.g., `https://fairdeal-backend.onrender.com`)

---

### 3️⃣ Deploy Frontend to Vercel

**Quick Deploy:** https://vercel.com

1. **Import Project**
   - Click "Add New" → "Project"
   - Import from GitHub: `Debjanimandal/FairDeal`

2. **Configuration**
   - **Framework Preset:** Create React App
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

3. **Environment Variables**
   ```
   REACT_APP_API_URL=<backend_url_from_step_2>
   ```
   Example: `REACT_APP_API_URL=https://fairdeal-backend.onrender.com`

4. **Deploy!**

**Result:** Get live URL (e.g., `https://fairdeal.vercel.app`)

---

### 4️⃣ Testing Deployed Platform

**Complete Workflow Test:**

1. **Visit Frontend**
   - Open your Vercel URL
   - Verify landing page loads

2. **Connect Wallet**
   - Install Freighter Wallet: https://www.freighter.app/
   - Switch to Testnet mode
   - Connect wallet to app

3. **Create Test Job**
   - Click "Create Job"
   - Fill in details (Title, Description, Budget)
   - Fund job with testnet XLM (job will deploy escrow)
   - Verify job appears in Dashboard

4. **Submit Work** (Switch to freelancer account)
   - Upload a test file
   - Verify watermark is applied
   - Verify encrypted preview available

5. **Approve & Release Payment**
   - Switch back to client account
   - Review submitted work
   - Approve job
   - Verify XLM released to freelancer

---

## 🔗 Important Links

**Your Deployments:**
- Frontend: `_________________` (Vercel)
- Backend: `_________________` (Render)
- Contract: `_________________` (Stellar Testnet)

**Tools & Resources:**
- Stellar Laboratory: https://laboratory.stellar.org/
- Stellar Expert (Testnet): https://stellar.expert/explorer/testnet
- Freighter Wallet: https://www.freighter.app/
- Web3.Storage: https://web3.storage
- Render Dashboard: https://dashboard.render.com
- Vercel Dashboard: https://vercel.com/dashboard

---

## 🐛 Troubleshooting

### Contract Deployment Issues
- **Error: "Account not found"** → Fund your account with testnet XLM first
- **Error: "Insufficient balance"** → Need at least 100 XLM for contract deployment

### Backend Issues
- **502 Bad Gateway** → Check Render logs, verify build succeeded
- **CORS errors** → Backend CORS is configured, check environment variables
- **File upload fails** → Verify WEB3_STORAGE_TOKEN is set correctly

### Frontend Issues
- **Can't connect to backend** → Verify REACT_APP_API_URL matches deployed backend
- **Wallet connection fails** → Ensure Freighter is on Testnet mode
- **Transactions fail** → Check if contract is properly deployed and funded

---

## 📋 Judging Demo Checklist

Before presenting to judges:

- [ ] All three components deployed and live
- [ ] Frontend URL accessible from any browser
- [ ] Freighter wallet installed and configured on testnet
- [ ] At least 2 test accounts with testnet XLM
- [ ] Sample job created and funded
- [ ] Sample work submitted with watermark
- [ ] Complete approve/reject workflow tested
- [ ] All features working: encryption, IPFS, escrow

**Demo Script:**
1. Show landing page with features
2. Connect wallet (show Stellar integration)
3. Create job (show escrow deployment)
4. Submit work (show watermarking & encryption)
5. Show encrypted preview
6. Approve work (show payment release)
7. Check blockchain explorer for transactions

---

## 🎉 Success Criteria

✅ **Smart Contract:** Deployed on Stellar testnet, transactions visible on explorer  
✅ **Backend API:** All endpoints responding, file uploads working, IPFS integration active  
✅ **Frontend UI:** Responsive, wallet connects, all pages functional  
✅ **End-to-End:** Complete job lifecycle works from creation → funding → submission → approval → payment  

---

**Estimated Deployment Time:** 30-45 minutes  
**Cost:** $0 (all services on free tier)  

🔥 **Pro Tip:** Deploy during off-peak hours to avoid service delays. Test with small files first!
