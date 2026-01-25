# 🚀 FairDeal Deployment Guide

Complete guide to deploy FairDeal platform for live demo.

---

## 📋 Prerequisites

Before deployment, ensure you have:

1. **Stellar CLI** installed
2. **Stellar Testnet Account** with XLM
3. **Web3.Storage API Key** (free at https://web3.storage)
4. **GitHub Account** (for Vercel deployment)
5. **Render/Railway Account** (for backend deployment)

---

## 🔧 Part 1: Smart Contract Deployment

### Step 1: Install Stellar CLI

```bash
# Install Stellar CLI
cargo install --locked stellar-cli --features opt

# Verify installation
stellar --version
```

### Step 2: Configure Stellar Network

```bash
# Add testnet configuration
stellar network add testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

### Step 3: Create/Import Identity

```bash
# Generate a new identity
stellar keys generate deployer --network testnet

# Or import existing secret key
stellar keys add deployer --secret-key YOUR_SECRET_KEY --network testnet

# Get the public key
stellar keys address deployer
```

### Step 4: Fund Your Account

Visit: https://laboratory.stellar.org/#account-creator?network=test

Or use friendbot:
```bash
curl "https://friendbot.stellar.org/?addr=$(stellar keys address deployer)"
```

### Step 5: Build Contract

```bash
cd contract
stellar contract build
```

This creates: `target/wasm32-unknown-unknown/release/fairdeal_escrow.wasm`

### Step 6: Deploy to Testnet

```bash
# Deploy contract
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/fairdeal_escrow.wasm \
  --source deployer \
  --network testnet

# Save the CONTRACT_ID that's returned!
# Example: CBQHNAXSI55GX2GN6D67GK7BHVPSLJUGZQEU7WJ5LKR5PNUCGLIMAO4K
```

**SAVE THIS CONTRACT ID - You'll need it for backend configuration!**

---

## 🖥️ Part 2: Backend Deployment (Render)

### Option A: Deploy via Render Dashboard

1. **Go to https://render.com and sign up/login**

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select: `Debjanimandal/FairDeal`

3. **Configure Build Settings**
   - **Name**: `fairdeal-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

4. **Add Environment Variables**
   ```
   PORT=5000
   NODE_ENV=production
   WEB3_STORAGE_TOKEN=<your_web3_storage_token>
   STELLAR_CONTRACT_ID=<deployed_contract_id>
   STELLAR_NETWORK=testnet
   SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Note your backend URL: `https://fairdeal-backend.onrender.com`

### Option B: Deploy via Railway

1. **Go to https://railway.app**

2. **New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `Debjanimandal/FairDeal`

3. **Configure**
   - Set root directory: `backend`
   - Add environment variables (same as above)

4. **Deploy**
   - Railway will auto-deploy
   - Note your backend URL

---

## 🌐 Part 3: Frontend Deployment (Vercel)

### Step 1: Update Frontend Configuration

Before deploying, update the API endpoint in your frontend:

```bash
# In frontend/src create .env.production
cd frontend
```

Create `frontend/.env.production`:
```env
REACT_APP_API_URL=https://your-backend-url.onrender.com
```

### Step 2: Deploy to Vercel

1. **Install Vercel CLI (Optional)**
   ```bash
   npm i -g vercel
   ```

2. **Deploy via Vercel Dashboard**
   - Go to https://vercel.com
   - Click "Add New" → "Project"
   - Import `Debjanimandal/FairDeal`
   - Configure:
     - **Framework Preset**: Create React App
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `build`
   
3. **Environment Variables**
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment
   - Your app will be live at: `https://fairdeal.vercel.app`

### Step 3: Update CORS in Backend

Update your backend's allowed origins to include your Vercel URL.

In `backend/index.js`, the CORS is already configured to allow all origins in production, but you can specify:

```javascript
app.use(cors({
  origin: ['https://fairdeal.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
```

---

## ✅ Part 4: Verification & Testing

### 1. Test Backend Health

```bash
curl https://your-backend-url.onrender.com/api/jobs
```

Should return: `[]` or list of jobs

### 2. Test Frontend

Visit: `https://your-fairdeal-app.vercel.app`

**Check:**
- ✅ Page loads without errors
- ✅ Wallet connect button appears
- ✅ Can connect Freighter wallet
- ✅ Can navigate between pages

### 3. End-to-End Test

1. **Connect Wallet**
   - Install Freighter wallet extension
   - Switch to Testnet
   - Get testnet XLM from friendbot

2. **Create Job**
   - Click "Create Job"
   - Fill in details
   - Sign transaction
   - Verify job appears in dashboard

3. **Submit Work**
   - Switch to freelancer role
   - Upload a test file
   - Verify watermarked preview is generated

4. **Approve/Reject**
   - Switch back to client
   - View preview
   - Approve or reject

---

## 🔗 Final Deployment URLs

After successful deployment, you'll have:

- **Smart Contract**: `<CONTRACT_ID>` on Stellar Testnet
- **Backend API**: `https://fairdeal-backend.onrender.com`
- **Frontend App**: `https://fairdeal.vercel.app`

---

## 📝 For Judges - Demo Instructions

**Live Demo Link**: `https://fairdeal.vercel.app`

### Quick Test Flow:

1. **Install Freighter Wallet**
   - Chrome: https://www.freighter.app/
   - Switch network to "Testnet"

2. **Get Testnet XLM**
   - Visit: https://laboratory.stellar.org/#account-creator?network=test
   - Or use friendbot with your public key

3. **Create Demo Job**
   - Connect wallet
   - Create job with test freelancer address
   - Fund job (testnet XLM)

4. **Submit Demo Work**
   - Upload sample file
   - View watermarked preview on IPFS

5. **Complete Transaction**
   - Approve work
   - Funds released to freelancer
   - View transaction on Stellar Explorer

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Backend not starting
- Check logs on Render/Railway dashboard
- Verify environment variables are set
- Check Node.js version compatibility

**Problem**: CORS errors
- Ensure frontend URL is in CORS whitelist
- Redeploy backend after changes

### Frontend Issues

**Problem**: API calls failing
- Check `REACT_APP_API_URL` is correct
- Verify backend is deployed and healthy
- Check browser console for errors

**Problem**: Wallet not connecting
- Ensure Freighter is installed
- Switch to Testnet in Freighter
- Clear browser cache and retry

### Smart Contract Issues

**Problem**: Contract calls failing
- Verify contract ID is correct
- Check account has XLM for gas fees
- Ensure using correct network (testnet)

---

## 🔄 Redeployment

To redeploy after changes:

### Backend
- Push to GitHub main branch
- Render/Railway auto-deploys
- Or manually trigger deploy in dashboard

### Frontend
- Push to GitHub main branch
- Vercel auto-deploys
- Or run: `vercel --prod`

### Contract
```bash
cd contract
stellar contract build
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/fairdeal_escrow.wasm \
  --source deployer \
  --network testnet
```

---

## 📊 Monitoring

- **Backend Logs**: Check Render/Railway dashboard
- **Frontend Errors**: Check Vercel analytics
- **Contract Activity**: https://stellar.expert/explorer/testnet

---

## 🎉 Success Checklist

- [ ] Smart contract deployed and verified
- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] Wallet connection works
- [ ] Job creation works
- [ ] File upload and watermarking works
- [ ] IPFS preview accessible
- [ ] Approval/rejection flow works
- [ ] Funds transfer correctly

---

**Need Help?** Check:
- Render logs for backend issues
- Vercel logs for frontend issues
- Stellar laboratory for contract debugging
- Browser console for client errors

**Demo is ready when all items in success checklist are complete!**
