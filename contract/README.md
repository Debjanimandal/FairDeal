# FairDeal Escrow Smart Contract

A secure, decentralized escrow smart contract built on Stellar's Soroban platform for freelance job payments.

## 🎯 Features

- **Secure Escrow**: Client funds are locked in the contract until work is approved
- **Partial Payments**: Support for initial payments (configurable percentage)
- **Automated Refunds**: Automatic refunds for rejected work or expired deadlines
- **Multi-Token Support**: Works with any Stellar Asset Contract (SAC) token
- **State Management**: Clear job states from creation to completion
- **Fraud Protection**: Built-in authorization checks and state validation

## 📋 Job Lifecycle

```
1. CREATE → Job created (no funds locked)
2. FUND → Client locks payment in escrow
3. SUBMIT → Freelancer submits completed work
4. [OPTIONAL] INITIAL_PAYMENT → Client releases partial payment
5a. APPROVE → Client approves work, remaining funds released to freelancer
5b. REJECT → Client rejects work, remaining funds refunded to client
```

Alternative paths:
- **CANCEL**: Job cancelled before funding (no funds involved)
- **EXPIRED**: Deadline passed without submission, full refund to client

## 🏗️ Architecture

### Job States

| State | Value | Description |
|-------|-------|-------------|
| `CREATED` | 0 | Job created, awaiting funding |
| `FUNDED` | 1 | Funds locked in escrow |
| `SUBMITTED` | 2 | Work submitted, awaiting review |
| `APPROVED` | 3 | Work approved, payment released |
| `REJECTED` | 4 | Work rejected, refund issued |
| `CANCELLED` | 5 | Job cancelled before funding |

### Data Structures

```rust
pub struct Job {
    pub id: u64,
    pub client: Address,
    pub freelancer: Address,
    pub amount: i128,
    pub initial_payment: i128,
    pub deadline: u64,
    pub description: String,
    pub state: u32,
    pub token: Address,
    pub work_submitted_at: u64,
    pub funded_at: u64,
}
```

## 📝 Contract Functions

### Administrative

#### `initialize()`
Initialize the contract (must be called once after deployment).

```rust
pub fn initialize(env: Env)
```

### Job Creation & Management

#### `create_job()`
Create a new escrow job.

```rust
pub fn create_job(
    env: Env,
    client: Address,
    freelancer: Address,
    amount: i128,
    initial_payment_percent: u32,
    deadline: u64,
    description: String,
    token: Address,
) -> Result<u64, EscrowError>
```

**Parameters:**
- `client`: Client's Stellar address
- `freelancer`: Freelancer's Stellar address
- `amount`: Total payment amount in token units
- `initial_payment_percent`: Percentage for initial payment (0-100)
- `deadline`: Unix timestamp deadline
- `description`: Job description
- `token`: Token contract address for payment

**Returns:** Job ID

#### `fund_job()`
Client funds the escrow (locks payment).

```rust
pub fn fund_job(env: Env, job_id: u64) -> Result<bool, EscrowError>
```

**Authorization:** Client only

#### `submit_work()`
Freelancer marks work as submitted.

```rust
pub fn submit_work(env: Env, job_id: u64) -> Result<bool, EscrowError>
```

**Authorization:** Freelancer only

### Payment Functions

#### `release_initial_payment()`
Client releases partial payment to freelancer.

```rust
pub fn release_initial_payment(env: Env, job_id: u64) -> Result<bool, EscrowError>
```

**Authorization:** Client only  
**Precondition:** Work must be submitted

#### `approve_job()`
Client approves work and releases remaining payment.

```rust
pub fn approve_job(env: Env, job_id: u64) -> Result<bool, EscrowError>
```

**Authorization:** Client only  
**Effect:** Transfers remaining funds to freelancer

#### `reject_job()`
Client rejects work and receives refund.

```rust
pub fn reject_job(env: Env, job_id: u64) -> Result<bool, EscrowError>
```

**Authorization:** Client only  
**Effect:** Refunds remaining funds to client

#### `refund_expired_job()`
Refund job if deadline passed without submission.

```rust
pub fn refund_expired_job(env: Env, job_id: u64) -> Result<bool, EscrowError>
```

**Authorization:** Client only  
**Precondition:** Deadline must have passed, work not submitted

### Query Functions

#### `get_job()`
Get detailed job information.

```rust
pub fn get_job(env: Env, job_id: u64) -> Result<Job, EscrowError>
```

#### `get_job_count()`
Get total number of jobs created.

```rust
pub fn get_job_count(env: Env) -> u64
```

#### `get_client_jobs()`
Get all job IDs for a specific client.

```rust
pub fn get_client_jobs(env: Env, client: Address) -> Vec<u64>
```

#### `get_freelancer_jobs()`
Get all job IDs for a specific freelancer.

```rust
pub fn get_freelancer_jobs(env: Env, freelancer: Address) -> Vec<u64>
```

#### `get_contract_balance()`
Get contract balance for a specific token.

```rust
pub fn get_contract_balance(env: Env, token: Address) -> i128
```

## 🛡️ Security Features

### Authorization
- All sensitive operations require proper authorization
- Only authorized parties can perform specific actions:
  - Client: Fund, approve, reject, refund
  - Freelancer: Submit work

### State Validation
- Strict state transitions prevent invalid operations
- Cannot fund a job twice
- Cannot approve/reject before work submission
- Cannot submit work after deadline

### Error Handling
Comprehensive error types:
- `JobNotFound`: Invalid job ID
- `Unauthorized`: Caller not authorized
- `InvalidState`: Invalid state transition
- `DeadlinePassed`: Operation after deadline
- `InvalidAmount`: Invalid payment amount
- `AlreadyFunded`: Attempt to fund twice
- `NotFunded`: Operation requires funding
- `WorkNotSubmitted`: Operation requires submission

### Amount Calculations
- Precise calculation of initial and remaining payments
- No rounding errors or loss of funds
- All amounts verified before transfers

## 🧪 Testing

The contract includes comprehensive tests:

```bash
cargo test
```

**Test Coverage:**
- ✅ Job creation and funding
- ✅ Work submission and approval
- ✅ Work rejection and refund
- ✅ Initial payment release
- ✅ Expired job refund
- ✅ Job cancellation
- ✅ Double funding prevention
- ✅ Authorization checks

## 💡 Usage Examples

### Example 1: Simple Job with Full Payment

```rust
// 1. Create job
let job_id = contract.create_job(
    client_addr,
    freelancer_addr,
    1000,
    0, // No initial payment
    deadline,
    "Build website",
    token_addr
);

// 2. Client funds escrow
contract.fund_job(job_id);

// 3. Freelancer submits work
contract.submit_work(job_id);

// 4. Client approves
contract.approve_job(job_id);
// → Freelancer receives 1000 tokens
```

### Example 2: Job with Initial Payment

```rust
// 1. Create job with 30% initial payment
let job_id = contract.create_job(
    client_addr,
    freelancer_addr,
    1000,
    30, // 30% initial
    deadline,
    "Design logo",
    token_addr
);

// 2. Fund escrow
contract.fund_job(job_id);

// 3. Submit work
contract.submit_work(job_id);

// 4. Release initial 30% (300 tokens)
contract.release_initial_payment(job_id);

// 5. Approve and release remaining 70% (700 tokens)
contract.approve_job(job_id);
// → Freelancer receives total 1000 tokens
```

### Example 3: Rejected Work

```rust
// 1-3. Create, fund, submit...

// 4. Client rejects work
contract.reject_job(job_id);
// → Client receives full refund of 1000 tokens
```

## 📊 Gas & Performance

- **Create Job**: ~100,000 gas
- **Fund Job**: ~150,000 gas (includes token transfer)
- **Submit Work**: ~80,000 gas
- **Approve/Reject**: ~150,000 gas (includes token transfer)

*Note: Actual gas costs may vary based on network conditions*

## 🔄 Integration Guide

### Frontend Integration

```typescript
import { SorobanRpc, Contract, Networks } from '@stellar/stellar-sdk';

// Initialize contract
const contract = new Contract(CONTRACT_ID);

// Create job
const result = await contract.call('create_job', 
  clientAddress,
  freelancerAddress,
  BigInt(1000),
  20,
  deadline,
  'Job description',
  tokenAddress
);
```

### Backend Integration

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment and integration instructions.

## 📦 Dependencies

- `soroban-sdk`: ^21.7.0

## 🚀 Getting Started

1. **Build**: `stellar contract build`
2. **Test**: `cargo test`
3. **Deploy**: See [DEPLOYMENT.md](DEPLOYMENT.md)

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## 🔗 Links

- [Stellar Documentation](https://developers.stellar.org)
- [Soroban Documentation](https://developers.stellar.org/docs/smart-contracts)
- [FairDeal Platform](https://github.com/yourusername/fairdeal)

## ⚠️ Disclaimer

This smart contract is provided as-is. Users should conduct their own security audits before using in production with real funds.
