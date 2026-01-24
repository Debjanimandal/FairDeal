# Quick Reference - FairDeal Escrow Contract

## 🚀 Quick Start

```bash
# Build
cd contract && stellar contract build

# Test
cargo test

# Deploy to testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/fairdeal_escrow.wasm \
  --source deployer \
  --network testnet

# Initialize
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source deployer \
  --network testnet \
  -- initialize
```

## 📋 Contract Workflow

### Creating a Job

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source client \
  --network testnet \
  -- create_job \
  --client GCLIENT... \
  --freelancer GFREELA... \
  --amount 1000000000 \
  --initial_payment_percent 20 \
  --deadline 1748000000 \
  --description "Build website" \
  --token CTOKEN...
```

Returns: `job_id: 1`

### Funding the Job

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source client \
  --network testnet \
  -- fund_job \
  --job_id 1
```

💡 This locks the tokens in the contract!

### Submitting Work

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source freelancer \
  --network testnet \
  -- submit_work \
  --job_id 1
```

### Release Initial Payment (Optional)

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source client \
  --network testnet \
  -- release_initial_payment \
  --job_id 1
```

💰 Sends 20% to freelancer

### Approve Work (Final Payment)

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source client \
  --network testnet \
  -- approve_job \
  --job_id 1
```

✅ Sends remaining 80% to freelancer

### Reject Work (Refund)

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source client \
  --network testnet \
  -- reject_job \
  --job_id 1
```

❌ Refunds remaining amount to client

## 🔍 Query Functions

### Get Job Details

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- get_job \
  --job_id 1
```

### Get Client's Jobs

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- get_client_jobs \
  --client GCLIENT...
```

### Get Freelancer's Jobs

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- get_freelancer_jobs \
  --freelancer GFREELA...
```

## 📊 Job States

| Code | State | Description |
|------|-------|-------------|
| 0 | CREATED | Job created, not funded |
| 1 | FUNDED | Funds locked in escrow |
| 2 | SUBMITTED | Work submitted |
| 3 | APPROVED | Completed successfully |
| 4 | REJECTED | Rejected, refunded |
| 5 | CANCELLED | Cancelled before funding |

## 🛠️ Frontend Integration (TypeScript)

```typescript
import { contractService } from './utils/contract-utils';

// Create job
const jobId = await contractService.createJob(
  freelancerAddress,
  '1000000000',  // 100 XLM in stroops
  20,            // 20% initial payment
  deadline,
  'Job description',
  tokenAddress
);

// Fund job
await contractService.fundJob(jobId);

// Submit work (freelancer)
await contractService.submitWork(jobId);

// Approve (client)
await contractService.approveJob(jobId);

// Get job details
const job = await contractService.getJob(jobId);
console.log(job.state); // 0-5
```

## ⚠️ Error Codes

| Code | Error | Meaning |
|------|-------|---------|
| 1 | JobNotFound | Invalid job ID |
| 2 | Unauthorized | Not authorized for this action |
| 3 | InvalidState | Invalid state transition |
| 4 | DeadlinePassed | Operation after deadline |
| 5 | InvalidAmount | Invalid payment amount |
| 6 | AlreadyFunded | Job already funded |
| 7 | NotFunded | Job not funded yet |
| 8 | WorkNotSubmitted | Work not submitted |

## 💡 Common Patterns

### Happy Path (With Initial Payment)

```
1. create_job()    → state: 0 (CREATED)
2. fund_job()      → state: 1 (FUNDED)
3. submit_work()   → state: 2 (SUBMITTED)
4. release_initial_payment() → 20% paid
5. approve_job()   → state: 3 (APPROVED), 80% paid
```

### Rejection Path

```
1. create_job()    → state: 0
2. fund_job()      → state: 1
3. submit_work()   → state: 2
4. reject_job()    → state: 4 (REJECTED), full refund
```

### Deadline Expiry

```
1. create_job()    → state: 0
2. fund_job()      → state: 1
3. [deadline passes without submission]
4. refund_expired_job() → state: 4, full refund
```

## 🔐 Security Checklist

Before mainnet:
- [ ] Test all functions on testnet
- [ ] Verify token transfers work correctly
- [ ] Test deadline enforcement
- [ ] Test all error conditions
- [ ] Verify authorization checks
- [ ] Test with multiple tokens
- [ ] Consider professional audit

## 📦 Token Amounts

Stellar uses stroops (1 XLM = 10,000,000 stroops)

```
1 XLM     = 10000000 stroops
10 XLM    = 100000000 stroops
100 XLM   = 1000000000 stroops
1000 XLM  = 10000000000 stroops
```

## 🌐 Network Configuration

### Testnet
- RPC: `https://soroban-testnet.stellar.org`
- Passphrase: `Test SDF Network ; September 2015`
- Explorer: `https://stellar.expert/explorer/testnet`
- Friendbot: `https://friendbot.stellar.org`

### Mainnet
- RPC: `https://soroban.stellar.org`
- Passphrase: `Public Global Stellar Network ; September 2015`
- Explorer: `https://stellar.expert/explorer/public`

## 📞 Support Resources

- Contract README: `contract/README.md`
- Deployment Guide: `contract/DEPLOYMENT.md`
- Frontend Integration: `FRONTEND_INTEGRATION.md`
- Stellar Docs: https://developers.stellar.org
- Discord: https://discord.gg/stellardev

## 🐛 Troubleshooting

**"Insufficient balance"**
- Fund your account: `stellar keys fund <identity> --network testnet`

**"Contract not found"**
- Verify CONTRACT_ID is correct
- Check you're on the right network

**"Authorization failed"**
- Ensure you're using the correct identity
- Client operations require client's signature
- Freelancer operations require freelancer's signature

**"Invalid state"**
- Check current job state with `get_job()`
- Follow the correct workflow order

## 💻 Development Commands

```bash
# Clean build
cargo clean && stellar contract build

# Run specific test
cargo test test_create_and_fund_job -- --nocapture

# Check contract size
ls -lh target/wasm32-unknown-unknown/release/*.wasm

# Optimize contract (already done by stellar build)
stellar contract optimize \
  --wasm target/wasm32-unknown-unknown/release/fairdeal_escrow.wasm

# Install contract (get hash for upgrade)
stellar contract install \
  --wasm target/wasm32-unknown-unknown/release/fairdeal_escrow.wasm \
  --source deployer \
  --network testnet
```

## 🎯 Next Steps

1. ✅ Contract built and tested
2. 🔄 Deploy to testnet
3. 🔄 Test with real transactions
4. 🔄 Integrate with frontend
5. 🔄 Security audit (recommended)
6. 🔄 Deploy to mainnet
