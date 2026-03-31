# Vercel Deployment Fix - FairDeal

## Problem
The app was failing on Vercel with error:
```
ENOENT: no such file or directory, mkdir '/var/task/data'
```

This happens because Vercel's serverless environment:
1. **Doesn't allow writing to the file system** (except `/tmp`)
2. **Each Lambda function is isolated** - in-memory storage doesn't persist between requests
3. The `instrumentation.ts` file was trying to create `/data` directory at build time

## Solution Applied

### 1. Updated Storage System (`lib/storage.ts`)
- Wrapped all file operations in try/catch to fail gracefully
- Storage now works with in-memory Maps only in Vercel
- File persistence is optional (works locally, skipped in production)

### 2. Disabled Instrumentation (`instrumentation.ts`)
- Removed IPFS loading on startup (doesn't work in serverless)
- Simplified to just log startup message

### 3. Updated Code Execution (`lib/code-execution.ts`)
- Uses `os.tmpdir()` in production instead of `temp_execution/`
- Uses `/tmp` directory which Vercel allows

## How to Deploy

### Step 1: Push to Git
```bash
git add .
git commit -m "Fix Vercel serverless storage issues"
git push
```

### Step 2: Vercel will auto-deploy
Your app should now deploy successfully!

## ⚠️ Important Limitation

**Data persistence in serverless environment:**

Since each API request runs in an isolated Lambda function, **in-memory storage doesn't persist**. This means:

- ✅ Creating jobs works (saved to smart contract)
- ✅ Submitting work works (saved to IPFS)
- ❌ **Job metadata won't persist between requests**

### Recommended Solution

You need to use a database for production. Options:

1. **Vercel KV (Redis)** - Easiest, built-in
2. **Vercel Postgres** - SQL database
3. **MongoDB Atlas** - NoSQL database
4. **Supabase** - PostgreSQL with real-time features

For now, the app will work for **testing individual flows**, but you'll need to add a database for production use.

## Quick Fix for Testing

If you just want to test the deployment, you can:

1. Create a job
2. Get the job ID from the URL
3. Submit work immediately in the same session
4. Approve/reject immediately

The data will be in memory for that specific Lambda execution.

## Environment Variables

Make sure these are set in Vercel:

```
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_CONTRACT_ID=CBONHPWFT7D2USWDGC5G55LJNBCRRTN4YQE6O6CFJA3RROIQ4UIWUFDM
ESCROW_SECRET_KEY=your_secret_key
ESCROW_PUBLIC_KEY=your_public_key
PINATA_API_KEY=your_key
PINATA_SECRET_API_KEY=your_secret
```
