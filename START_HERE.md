# 🎯 FINAL DEPLOYMENT INSTRUCTIONS FOR JUDGES DEMO

## ✅ COMPLETED: Smart Contract (Step 1/3)

**Status:** ✅ **DEPLOYED & INITIALIZED**

- **Contract ID:** `CAECHULRZ333YABL2E5Y2LLNRJ2PLHEZSR3UUNQSIBPCMAS4DGUXRI4C`
- **Network:** Stellar Testnet
- **Explorer:** [View Contract](https://stellar.expert/explorer/testnet/contract/CAECHULRZ333YABL2E5Y2LLNRJ2PLHEZSR3UUNQSIBPCMAS4DGUXRI4C)
- **Transaction:** [View Deployment TX](https://stellar.expert/explorer/testnet/tx/1738d5960744a19bfc7c8f76d3778a6ef9191cbb23937149b8cca7dc41f8c46e)

---

## 🚀 NEXT: Deploy Backend (Step 2/3)

### Option A: Deploy to Render (Recommended - Free Tier)

1. **Go to Render:**
   - Visit: https://dashboard.render.com/
   - Sign in with GitHub

2. **Create New Web Service:**
   - Click **"New +"** → **"Web Service"**
   - Click **"Build and deploy from a Git repository"** → **Next**
   - Select **"Configure account"** and authorize Render to access GitHub
   - Find and select: **`Debjanimandal/FairDeal`**

3. **Configure Service:**
   ```
   Name: fairdeal-backend
   Region: Oregon (US West) or closest to you
   Branch: main
   Root Directory: backend
   Runtime: Node
   Build Command: npm install
   Start Command: node index.js
   Instance Type: Free
   ```

4. **Add Environment Variables:** (Click "Advanced" → "Add Environment Variable")
   ```
   PORT=5000
   NODE_ENV=production
   STELLAR_NETWORK=testnet
   STELLAR_CONTRACT_ID=CAECHULRZ333YABL2E5Y2LLNRJ2PLHEZSR3UUNQSIBPCMAS4DGUXRI4C
   ```

5. **Get Web3.Storage Token:**
   - Open new tab: https://web3.storage
   - Sign up with GitHub
   - Go to **Account** → **Create API Token**
   - Name it "FairDeal Backend"
   - Copy the token
   - Back in Render, add environment variable:
     ```
     WEB3_STORAGE_TOKEN=<paste_your_token_here>
     ```

6. **Deploy:**
   - Click **"Create Web Service"**
   - Wait 3-5 minutes for build and deployment
   - Once status shows **"Live"**, copy your backend URL
   - Format will be: `https://fairdeal-backend.onrender.com`

7. **Test Backend:**
   - Visit: `https://your-backend-url.onrender.com/api/jobs`
   - Should see: `{"jobs":[]}`
   - If you see this, backend is working! ✅

**Save your backend URL:**
```
https://___________________________________.onrender.com
```

### Option B: Deploy to Railway (Alternative)

1. Visit: https://railway.app/
2. Sign in with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select **`Debjanimandal/FairDeal`**
5. Configure:
   - Root Directory: `backend`
   - Add same environment variables as above
6. Deploy and copy URL

---

## 🎨 NEXT: Deploy Frontend (Step 3/3)

### Deploy to Vercel (Recommended - Free Tier)

1. **Go to Vercel:**
   - Visit: https://vercel.com/new
   - Sign in with GitHub

2. **Import Project:**
   - Click **"Add New"** → **"Project"**
   - Find and select: **`Debjanimandal/FairDeal`**
   - Click **"Import"**

3. **Configure Project:**
   ```
   Framework Preset: Create React App
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

4. **Add Environment Variable:**
   - Click **"Environment Variables"**
   - Add:
     ```
     Name: REACT_APP_API_URL
     Value: <YOUR_BACKEND_URL_FROM_STEP_2>
     ```
   - Example: `https://fairdeal-backend.onrender.com`
   - **Important:** NO trailing slash!

5. **Deploy:**
   - Click **"Deploy"**
   - Wait 2-3 minutes
   - Once complete, click **"Visit"**
   - Copy your frontend URL

**Save your frontend URL:**
```
https://___________________________________.vercel.app
```

---

## 🧪 TEST YOUR DEPLOYMENT

### 1. Install Freighter Wallet

1. Download: https://www.freighter.app/
2. Install browser extension
3. Create new wallet or import existing
4. **Switch to Testnet:**
   - Click Freighter icon
   - Settings → Network → **Testnet**
5. **Fund with testnet XLM:**
   - Visit: https://laboratory.stellar.org/#account-creator?network=test
   - Paste your Freighter address
   - Click **"Get test network lumens"**
   - You should receive 10,000 testnet XLM

### 2. Test Complete Workflow

**A. Connect Wallet:**
1. Visit your frontend URL
2. Click **"Connect Wallet"**
3. Approve Freighter connection

**B. Create Job (as Client):**
1. Click **"Create Job"**
2. Fill in details:
   - Title: "Test Website Design"
   - Description: "Create a landing page"
   - Budget: 100 XLM
   - Initial Payment: 20% (20 XLM)
   - Deadline: Tomorrow
   - Freelancer: Any other Stellar testnet address
3. Click **"Create and Fund Job"**
4. Approve transaction in Freighter
5. Wait for confirmation
6. Job should appear in Dashboard ✅

**C. Submit Work (as Freelancer):**
1. Open Freighter and switch to freelancer account
2. Disconnect current wallet and reconnect
3. Go to **"Submit Work"**
4. Select the job
5. Upload a test file (image or document)
6. Click **"Submit Work"**
7. Approve transaction
8. Check that watermark is applied ✅

**D. Approve & Release Payment:**
1. Switch back to client account
2. Go to job details
3. View submitted work (encrypted preview)
4. Click **"Approve Work"**
5. Approve transaction
6. Payment released to freelancer ✅

**E. Verify on Blockchain:**
1. Visit: https://stellar.expert/explorer/testnet
2. Search for contract: `CAECHULRZ333YABL2E5Y2LLNRJ2PLHEZSR3UUNQSIBPCMAS4DGUXRI4C`
3. See all transactions (create_job, fund_job, submit_work, approve_job)
4. Verify escrow worked correctly ✅

---

## 📋 JUDGES DEMO CHECKLIST

Before presenting:

- [ ] Backend is live and responding
- [ ] Frontend loads without errors
- [ ] Wallet connects successfully
- [ ] Created at least one test job
- [ ] Submitted work with watermark
- [ ] Approved and released payment
- [ ] Verified transactions on blockchain explorer
- [ ] Prepared 2 Freighter wallets (client + freelancer)
- [ ] Both wallets funded with testnet XLM

**Demo Flow (5 minutes):**
1. Show landing page, explain problem (30 sec)
2. Connect wallet (15 sec)
3. Create job with escrow (1 min)
4. Submit work, show watermark (1 min)
5. Show encrypted preview (30 sec)
6. Approve and release payment (1 min)
7. Show blockchain explorer (30 sec)
8. Highlight key features (fraud protection, encryption) (30 sec)

---

## 🎯 KEY FEATURES TO HIGHLIGHT FOR JUDGES

1. **Smart Contract Escrow**
   - Automated fund locking
   - No intermediary needed
   - Trustless payment release

2. **Watermarking**
   - Automatic copyright protection
   - Prevents work theft before payment

3. **Encryption**
   - AES-256-CBC file encryption
   - Secure IPFS storage
   - Preview without exposing full work

4. **Blockchain Integration**
   - Full transparency
   - Immutable transaction history
   - Built on Stellar (fast & cheap)

5. **Fraud Protection**
   - Dispute mechanism
   - Expiry-based refunds
   - Initial payment system

---

## 🔗 ALL YOUR LINKS

**Deployed Platform:**
- Frontend: `_______________________`
- Backend: `_______________________`
- Contract: `CAECHULRZ333YABL2E5Y2LLNRJ2PLHEZSR3UUNQSIBPCMAS4DGUXRI4C`

**Blockchain Explorer:**
- Contract: https://stellar.expert/explorer/testnet/contract/CAECHULRZ333YABL2E5Y2LLNRJ2PLHEZSR3UUNQSIBPCMAS4DGUXRI4C
- Stellar Lab: https://lab.stellar.org/r/testnet/contract/CAECHULRZ333YABL2E5Y2LLNRJ2PLHEZSR3UUNQSIBPCMAS4DGUXRI4C

**Tools:**
- Freighter Wallet: https://www.freighter.app/
- Testnet Faucet: https://laboratory.stellar.org/#account-creator?network=test
- Web3.Storage: https://web3.storage

**GitHub:**
- Repository: https://github.com/Debjanimandal/FairDeal

---

## 🐛 TROUBLESHOOTING

### Backend Issues

**"Application failed to respond"**
- Check Render logs for errors
- Verify all environment variables are set
- Ensure PORT=5000 is set
- Check if WEB3_STORAGE_TOKEN is valid

**"502 Bad Gateway"**
- Wait 2-3 minutes for first deploy
- Render free tier may take time to spin up
- Check build logs for npm errors

### Frontend Issues

**"Cannot connect to backend"**
- Verify REACT_APP_API_URL is correct
- No trailing slash in URL
- Check if backend is actually live
- Try visiting backend URL directly

**"Network Error"**
- CORS is already configured
- Check browser console for exact error
- Verify backend environment variables

### Wallet Issues

**"Transaction failed"**
- Ensure you're on Testnet mode
- Check if account has sufficient XLM (need ~110 XLM for test)
- Verify contract is deployed

**"Can't connect wallet"**
- Install Freighter from official site
- Refresh page after installing
- Try in incognito mode

---

## 📞 NEED HELP?

If deployment fails:

1. **Check Render Logs:** Dashboard → Your Service → Logs
2. **Check Vercel Logs:** Dashboard → Your Project → Deployments → View Function Logs
3. **Check Browser Console:** F12 → Console tab
4. **Verify Environment Variables:** Make sure all are set correctly

**Common Fix:** Re-deploy with fresh environment variables

---

## ✅ SUCCESS CRITERIA

Your platform is ready for demo when:

✅ All 3 components deployed (contract, backend, frontend)  
✅ Frontend accessible via public URL  
✅ Wallet connects successfully  
✅ Can create, fund, and view jobs  
✅ File upload works with watermarking  
✅ Payment release works correctly  
✅ Transactions visible on blockchain explorer  

---

**Estimated Time:** 15-20 minutes for backend + frontend deployment  
**Cost:** $0 (Free tiers)  

🚀 **You're almost done! Just deploy backend and frontend, then test!**
