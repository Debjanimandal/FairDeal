# Frontend Integration with Escrow Smart Contract

This guide explains how to integrate the FairDeal frontend with the Stellar escrow smart contract.

## Prerequisites

1. Deployed smart contract on Stellar testnet/mainnet
2. Contract ID from deployment
3. Token contract address (for payments)

## Installation

The required packages are already in package.json:

```json
{
  "@stellar/freighter-api": "^6.0.1",
  "@stellar/stellar-sdk": "^14.4.3"
}
```

## Contract Integration Utility

Create `src/utils/contract-utils.ts`:

```typescript
import {
  Contract,
  SorobanRpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  xdr,
  scValToNative,
  nativeToScVal,
  Address,
  Operation,
} from '@stellar/stellar-sdk';
import { isConnected, getPublicKey, signTransaction } from '@stellar/freighter-api';

const CONTRACT_ID = process.env.REACT_APP_CONTRACT_ID || 'YOUR_CONTRACT_ID';
const RPC_URL = process.env.REACT_APP_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = process.env.REACT_APP_NETWORK_PASSPHRASE || Networks.TESTNET;

const server = new SorobanRpc.Server(RPC_URL);

export interface Job {
  id: bigint;
  client: string;
  freelancer: string;
  amount: bigint;
  initial_payment: bigint;
  deadline: bigint;
  description: string;
  state: number;
  token: string;
  work_submitted_at: bigint;
  funded_at: bigint;
}

// Job States
export enum JobState {
  CREATED = 0,
  FUNDED = 1,
  SUBMITTED = 2,
  APPROVED = 3,
  REJECTED = 4,
  CANCELLED = 5,
}

export class ContractService {
  private contract: Contract;

  constructor() {
    this.contract = new Contract(CONTRACT_ID);
  }

  /**
   * Get user's public key from Freighter wallet
   */
  async getUserPublicKey(): Promise<string> {
    const connected = await isConnected();
    if (!connected) {
      throw new Error('Wallet not connected');
    }
    return await getPublicKey();
  }

  /**
   * Build and sign a transaction
   */
  async buildAndSignTransaction(
    operation: xdr.Operation,
    userPublicKey: string
  ): Promise<string> {
    const account = await server.getAccount(userPublicKey);
    
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(180)
      .build();

    // Simulate first
    const simulated = await server.simulateTransaction(transaction);
    
    if (SorobanRpc.Api.isSimulationError(simulated)) {
      throw new Error(`Simulation failed: ${simulated.error}`);
    }

    // Prepare transaction
    const prepared = SorobanRpc.assembleTransaction(transaction, simulated).build();

    // Sign with Freighter
    const signedXDR = await signTransaction(prepared.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    return signedXDR;
  }

  /**
   * Submit signed transaction
   */
  async submitTransaction(signedXDR: string): Promise<any> {
    const transaction = TransactionBuilder.fromXDR(signedXDR, NETWORK_PASSPHRASE);
    const response = await server.sendTransaction(transaction);

    // Poll for result
    let status = await server.getTransaction(response.hash);
    while (status.status === 'NOT_FOUND') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      status = await server.getTransaction(response.hash);
    }

    if (status.status === 'SUCCESS') {
      return status;
    } else {
      throw new Error(`Transaction failed: ${status.status}`);
    }
  }

  /**
   * Create a new job
   */
  async createJob(
    freelancerAddress: string,
    amount: string,
    initialPaymentPercent: number,
    deadline: number,
    description: string,
    tokenAddress: string
  ): Promise<bigint> {
    const userPublicKey = await this.getUserPublicKey();

    const operation = this.contract.call(
      'create_job',
      new Address(userPublicKey).toScVal(),
      new Address(freelancerAddress).toScVal(),
      nativeToScVal(BigInt(amount), { type: 'i128' }),
      nativeToScVal(initialPaymentPercent, { type: 'u32' }),
      nativeToScVal(deadline, { type: 'u64' }),
      nativeToScVal(description, { type: 'string' }),
      new Address(tokenAddress).toScVal()
    );

    const signedXDR = await this.buildAndSignTransaction(operation, userPublicKey);
    const result = await this.submitTransaction(signedXDR);

    // Extract job ID from result
    const returnValue = result.returnValue;
    return scValToNative(returnValue);
  }

  /**
   * Fund a job (lock escrow)
   */
  async fundJob(jobId: string): Promise<boolean> {
    const userPublicKey = await this.getUserPublicKey();

    const operation = this.contract.call(
      'fund_job',
      nativeToScVal(BigInt(jobId), { type: 'u64' })
    );

    const signedXDR = await this.buildAndSignTransaction(operation, userPublicKey);
    const result = await this.submitTransaction(signedXDR);

    return scValToNative(result.returnValue);
  }

  /**
   * Submit work
   */
  async submitWork(jobId: string): Promise<boolean> {
    const userPublicKey = await this.getUserPublicKey();

    const operation = this.contract.call(
      'submit_work',
      nativeToScVal(BigInt(jobId), { type: 'u64' })
    );

    const signedXDR = await this.buildAndSignTransaction(operation, userPublicKey);
    const result = await this.submitTransaction(signedXDR);

    return scValToNative(result.returnValue);
  }

  /**
   * Release initial payment
   */
  async releaseInitialPayment(jobId: string): Promise<boolean> {
    const userPublicKey = await this.getUserPublicKey();

    const operation = this.contract.call(
      'release_initial_payment',
      nativeToScVal(BigInt(jobId), { type: 'u64' })
    );

    const signedXDR = await this.buildAndSignTransaction(operation, userPublicKey);
    const result = await this.submitTransaction(signedXDR);

    return scValToNative(result.returnValue);
  }

  /**
   * Approve job (release remaining payment)
   */
  async approveJob(jobId: string): Promise<boolean> {
    const userPublicKey = await this.getUserPublicKey();

    const operation = this.contract.call(
      'approve_job',
      nativeToScVal(BigInt(jobId), { type: 'u64' })
    );

    const signedXDR = await this.buildAndSignTransaction(operation, userPublicKey);
    const result = await this.submitTransaction(signedXDR);

    return scValToNative(result.returnValue);
  }

  /**
   * Reject job (get refund)
   */
  async rejectJob(jobId: string): Promise<boolean> {
    const userPublicKey = await this.getUserPublicKey();

    const operation = this.contract.call(
      'reject_job',
      nativeToScVal(BigInt(jobId), { type: 'u64' })
    );

    const signedXDR = await this.buildAndSignTransaction(operation, userPublicKey);
    const result = await this.submitTransaction(signedXDR);

    return scValToNative(result.returnValue);
  }

  /**
   * Get job details
   */
  async getJob(jobId: string): Promise<Job> {
    const operation = this.contract.call(
      'get_job',
      nativeToScVal(BigInt(jobId), { type: 'u64' })
    );

    const account = await server.getAccount(await this.getUserPublicKey());
    
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(180)
      .build();

    const simulated = await server.simulateTransaction(transaction);
    
    if (SorobanRpc.Api.isSimulationError(simulated)) {
      throw new Error(`Failed to get job: ${simulated.error}`);
    }

    return scValToNative(simulated.result!.retval);
  }

  /**
   * Get job count
   */
  async getJobCount(): Promise<number> {
    const operation = this.contract.call('get_job_count');

    const account = await server.getAccount(await this.getUserPublicKey());
    
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(180)
      .build();

    const simulated = await server.simulateTransaction(transaction);
    
    if (SorobanRpc.Api.isSimulationError(simulated)) {
      throw new Error(`Failed to get job count: ${simulated.error}`);
    }

    return Number(scValToNative(simulated.result!.retval));
  }

  /**
   * Get jobs by client
   */
  async getClientJobs(clientAddress: string): Promise<bigint[]> {
    const operation = this.contract.call(
      'get_client_jobs',
      new Address(clientAddress).toScVal()
    );

    const account = await server.getAccount(await this.getUserPublicKey());
    
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(180)
      .build();

    const simulated = await server.simulateTransaction(transaction);
    
    if (SorobanRpc.Api.isSimulationError(simulated)) {
      throw new Error(`Failed to get client jobs: ${simulated.error}`);
    }

    return scValToNative(simulated.result!.retval);
  }

  /**
   * Get jobs by freelancer
   */
  async getFreelancerJobs(freelancerAddress: string): Promise<bigint[]> {
    const operation = this.contract.call(
      'get_freelancer_jobs',
      new Address(freelancerAddress).toScVal()
    );

    const account = await server.getAccount(await this.getUserPublicKey());
    
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(180)
      .build();

    const simulated = await server.simulateTransaction(transaction);
    
    if (SorobanRpc.Api.isSimulationError(simulated)) {
      throw new Error(`Failed to get freelancer jobs: ${simulated.error}`);
    }

    return scValToNative(simulated.result!.retval);
  }
}

export const contractService = new ContractService();
```

## Environment Variables

Add to `.env`:

```env
REACT_APP_CONTRACT_ID=YOUR_CONTRACT_ID_HERE
REACT_APP_RPC_URL=https://soroban-testnet.stellar.org
REACT_APP_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
REACT_APP_TOKEN_CONTRACT_ID=YOUR_TOKEN_CONTRACT_ID_HERE
```

## Usage in Components

```typescript
import { contractService, JobState } from '../utils/contract-utils';

// Create a job
const createJob = async () => {
  try {
    const jobId = await contractService.createJob(
      freelancerAddress,
      '1000000000', // 100 XLM in stroops
      20, // 20% initial payment
      Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
      'Build a website',
      tokenContractId
    );
    console.log('Job created:', jobId);
  } catch (error) {
    console.error('Failed to create job:', error);
  }
};

// Fund a job
const fundJob = async (jobId: string) => {
  try {
    await contractService.fundJob(jobId);
    console.log('Job funded successfully');
  } catch (error) {
    console.error('Failed to fund job:', error);
  }
};

// Get job details
const fetchJob = async (jobId: string) => {
  try {
    const job = await contractService.getJob(jobId);
    console.log('Job:', job);
    console.log('State:', JobState[job.state]);
  } catch (error) {
    console.error('Failed to fetch job:', error);
  }
};
```

## Error Handling

The contract can return these errors:
- `JobNotFound`: Job ID doesn't exist
- `Unauthorized`: User not authorized for this action
- `InvalidState`: Invalid state transition
- `DeadlinePassed`: Operation after deadline
- `InvalidAmount`: Invalid payment amount
- `AlreadyFunded`: Job already funded
- `NotFunded`: Job not funded yet
- `WorkNotSubmitted`: Work not submitted yet

Always wrap contract calls in try-catch blocks and provide user-friendly error messages.

## Testing

Test with Freighter wallet on testnet before deploying to mainnet.

1. Install Freighter browser extension
2. Switch to testnet
3. Fund your account via friendbot
4. Connect wallet to your app
5. Test all contract functions

## Security Notes

1. Always validate user inputs before sending to contract
2. Show transaction details to users before signing
3. Handle wallet connection errors gracefully
4. Implement proper loading states during transactions
5. Never expose private keys in frontend code
