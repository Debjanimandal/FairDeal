import * as StellarSdk from '@stellar/stellar-sdk';

const {
  Contract,
  TransactionBuilder,
  Networks,
  Address,
  nativeToScVal,
  BASE_FEE,
  scValToNative,
  xdr,
  Transaction
} = StellarSdk;

// Create a typed reference to SorobanRpc
const SorobanRpc = (StellarSdk as any).SorobanRpc || (StellarSdk as any).rpc || {};

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || '';
const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
const RPC_URL = NETWORK === 'mainnet'
  ? 'https://soroban-mainnet.stellar.org'
  : 'https://soroban-testnet.stellar.org';

// Stellar native token address (wrapped native XLM for Soroban)
const NATIVE_TOKEN = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

// Initialize server lazily
function getServer() {
  if (SorobanRpc.Server) {
    return new SorobanRpc.Server(RPC_URL, { allowHttp: false });
  }
  // Fallback for different SDK versions
  const ServerClass = (StellarSdk as any).Server || (StellarSdk as any).SorobanRpc?.Server;
  if (!ServerClass) {
    throw new Error('SorobanRpc.Server not found in @stellar/stellar-sdk. Please ensure you have the correct version installed.');
  }
  return new ServerClass(RPC_URL, { allowHttp: false });
}

/**
 * Convert XLM to stroops (1 XLM = 10,000,000 stroops)
 */
function xlmToStroops(xlm: number): bigint {
  return BigInt(Math.round(xlm * 10_000_000));
}

/**
 * Convert stroops to XLM
 */
function stroopsToXlm(stroops: bigint): number {
  return Number(stroops) / 10_000_000;
}

/**
 * Create a job in the smart contract
 * This locks the escrow amount in the contract
 */
export async function createJobContract(
  clientAddress: string,
  freelancerAddress: string,
  totalAmount: number,
  initialPayment: number,
  deadlineDays: number
): Promise<{ jobId: number; txHash: string }> {
  try {
    const contract = new Contract(CONTRACT_ID);

    const totalStroops = xlmToStroops(totalAmount);
    const initialStroops = xlmToStroops(initialPayment);

    // Build the transaction
    const account = await getServer().getAccount(clientAddress);

    // Create ScVal parameters using nativeToScVal
    const params = [
      nativeToScVal(Address.fromString(clientAddress), { type: 'address' }),
      nativeToScVal(Address.fromString(freelancerAddress), { type: 'address' }),
      nativeToScVal(totalStroops, { type: 'i128' }),
      nativeToScVal(initialStroops, { type: 'i128' }),
      nativeToScVal(deadlineDays, { type: 'u32' }),
      nativeToScVal(Address.fromString(NATIVE_TOKEN), { type: 'address' }),
    ];

    const builtTx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET,
    })
      .addOperation(contract.call('create_job', ...params))
      .setTimeout(30)
      .build();

    // Simulate to get the job ID from return value
    const simulationResponse = await getServer().simulateTransaction(builtTx);

    console.log('Simulation response:', simulationResponse);

    if (SorobanRpc.Api.isSimulationSuccess(simulationResponse)) {
      // Prepare transaction for signing
      const preparedTx = SorobanRpc.assembleTransaction(builtTx, simulationResponse).build();

      console.log('Prepared transaction for signing');

      // Request signing from Freighter
      const { signTransaction } = await import('@stellar/freighter-api');
      const signedResult = await signTransaction(preparedTx.toXDR(), {
        networkPassphrase: NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET,
      });

      console.log('Transaction signed by Freighter');
      console.log('Signed result type:', typeof signedResult, signedResult);

      // Freighter returns { signedTxXdr: string }, extract the XDR string
      const signedXdr = typeof signedResult === 'string' ? signedResult : (signedResult as any).signedTxXdr || signedResult;

      // Parse the signed transaction using TransactionBuilder.fromXDR (correct API for SDK v14)
      const networkPassphrase = NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
      const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);

      // Submit transaction
      const server = getServer();
      const response = await server.sendTransaction(signedTx);

      console.log('Transaction submitted:', response.hash);

      // Wait for confirmation
      let status = await getServer().getTransaction(response.hash);
      while (status.status === 'NOT_FOUND') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        status = await getServer().getTransaction(response.hash);
      }

      if (status.status === 'SUCCESS') {
        // Extract job ID from return value
        const result = status.returnValue;
        const jobId = scValToNative(result);

        console.log('✅ Job created successfully! Job ID:', jobId);
        
        // Verify the job exists in the contract
        try {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds for contract storage to persist
          const verifyJob = await getJobFromContract(Number(jobId));
          console.log('✅ Job verified in contract:', verifyJob);
        } catch (verifyError) {
          console.error('⚠️ Warning: Job created but verification failed:', verifyError);
          // Don't throw - the job might still be there, just delayed
        }

        return {
          jobId: Number(jobId),
          txHash: response.hash,
        };
      } else {
        throw new Error(`Transaction failed with status: ${status.status}`);
      }
    } else {
      const error = (simulationResponse as any).error || 'Unknown simulation error';
      console.error('Simulation failed:', error);
      throw new Error(`Simulation failed: ${error}`);
    }
  } catch (error: any) {
    console.error('Error creating job in contract:', error);
    throw new Error(`Failed to create job in contract: ${error.message}`);
  }
}

/**
 * Submit work to the contract
 */
export async function submitWorkContract(
  jobId: number,
  freelancerAddress: string,
  workCid: string
): Promise<string> {
  try {
    const contract = new Contract(CONTRACT_ID);
    const account = await getServer().getAccount(freelancerAddress);

    const params = [
      nativeToScVal(jobId, { type: 'u64' }),
      nativeToScVal(workCid, { type: 'string' })
    ];

    const builtTx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET,
    })
      .addOperation(contract.call('submit_work', ...params))
      .setTimeout(30)
      .build();

    const simulationResponse = await getServer().simulateTransaction(builtTx);

    if (SorobanRpc.Api.isSimulationSuccess(simulationResponse)) {
      const preparedTx = SorobanRpc.assembleTransaction(builtTx, simulationResponse).build();

      const { signTransaction } = await import('@stellar/freighter-api');
      const signedResult = await signTransaction(preparedTx.toXDR(), {
        networkPassphrase: NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET,
      });

      const signedXdr = typeof signedResult === 'string' ? signedResult : (signedResult as any).signedTxXdr || signedResult;
      const networkPassphrase = NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
      const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
      const response = await getServer().sendTransaction(signedTx);

      return response.hash;
    } else {
      throw new Error('Simulation failed');
    }
  } catch (error: any) {
    console.error('Error submitting work to contract:', error);
    throw new Error(`Failed to submit work: ${error.message}`);
  }
}

/**
 * Approve work and release funds from contract
 */
export async function approveWorkContract(
  jobId: number,
  clientAddress: string
): Promise<string> {
  try {
    console.log('Approving job in contract. Job ID:', jobId, 'Client:', clientAddress);

    // First, verify the job exists in the contract
    try {
      const jobData = await getJobFromContract(jobId);
      console.log('Job found in contract:', jobData);
      console.log('Job state:', jobData.state);
    } catch (err) {
      console.error('Job not found in contract storage:', err);
      throw new Error(`Job ${jobId} not found in smart contract. The job may not have been created successfully or the contract was redeployed.`);
    }

    const contract = new Contract(CONTRACT_ID);
    const account = await getServer().getAccount(clientAddress);

    const params = [
      nativeToScVal(jobId, { type: 'u64' }),
      nativeToScVal(Address.fromString(NATIVE_TOKEN), { type: 'address' })
    ];

    const builtTx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET,
    })
      .addOperation(contract.call('approve_work', ...params))
      .setTimeout(30)
      .build();

    const simulationResponse = await getServer().simulateTransaction(builtTx);

    console.log('Simulation Response:', simulationResponse);

    if (SorobanRpc.Api.isSimulationSuccess(simulationResponse)) {
      const preparedTx = SorobanRpc.assembleTransaction(builtTx, simulationResponse).build();

      const { signTransaction } = await import('@stellar/freighter-api');
      const signedResult = await signTransaction(preparedTx.toXDR(), {
        networkPassphrase: NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET,
      });

      const signedXdr = typeof signedResult === 'string' ? signedResult : (signedResult as any).signedTxXdr || signedResult;
      const networkPassphrase = NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
      const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
      const response = await getServer().sendTransaction(signedTx);

      return response.hash;
    } else {
      // Log detailed simulation error
      const error = (simulationResponse as any).error;
      console.error('Simulation failed with error:', error);
      console.error('Full simulation response:', JSON.stringify(simulationResponse, null, 2));
      throw new Error(`Simulation failed: ${error || 'Unknown error'}`);
    }
  } catch (error: any) {
    console.error('Error approving work in contract:', error);
    throw new Error(`Failed to approve work: ${error.message}`);
  }
}

/**
 * Request revision
 */
export async function requestRevisionContract(
  jobId: number,
  clientAddress: string
): Promise<string> {
  try {
    const contract = new Contract(CONTRACT_ID);
    const account = await getServer().getAccount(clientAddress);

    const params = [
      nativeToScVal(jobId, { type: 'u64' })
    ];

    const builtTx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET,
    })
      .addOperation(contract.call('request_revision', ...params))
      .setTimeout(30)
      .build();

    const simulationResponse = await getServer().simulateTransaction(builtTx);

    if (SorobanRpc.Api.isSimulationSuccess(simulationResponse)) {
      const preparedTx = SorobanRpc.assembleTransaction(builtTx, simulationResponse).build();

      const { signTransaction } = await import('@stellar/freighter-api');
      const signedResult = await signTransaction(preparedTx.toXDR(), {
        networkPassphrase: NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET,
      });

      const signedXdr = typeof signedResult === 'string' ? signedResult : (signedResult as any).signedTxXdr || signedResult;
      const networkPassphrase = NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
      const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
      const response = await getServer().sendTransaction(signedTx);

      return response.hash;
    } else {
      throw new Error('Simulation failed');
    }
  } catch (error: any) {
    console.error('Error requesting revision in contract:', error);
    throw new Error(`Failed to request revision: ${error.message}`);
  }
}

/**
 * Get job details from smart contract
 */
export async function getJobFromContract(jobId: number): Promise<any> {
  try {
    console.log('🔍 Fetching job from contract. Job ID:', jobId, 'Contract:', CONTRACT_ID);
    
    const contract = new Contract(CONTRACT_ID);
    
    // Use a dummy account for read-only operations
    const dummyAccount = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
    const account = await getServer().getAccount(dummyAccount).catch(() => {
      // If dummy account doesn't exist, use any funded account
      return getServer().getAccount('GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H');
    });

    const builtTx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET,
    })
      .addOperation(contract.call('get_job', nativeToScVal(jobId, { type: 'u64' })))
      .setTimeout(30)
      .build();

    const simulationResponse = await getServer().simulateTransaction(builtTx);

    console.log('📊 Simulation response for get_job:', simulationResponse);

    if (SorobanRpc.Api.isSimulationSuccess(simulationResponse)) {
      const result = simulationResponse.result?.retval;
      if (result) {
        const jobData = scValToNative(result);
        console.log('✅ Job found in contract:', jobData);
        return jobData;
      }
    } else {
      const error = (simulationResponse as any).error || 'Unknown error';
      console.error('❌ Failed to get job from contract:', error);
      throw new Error(`Job ${jobId} not found in contract: ${error}`);
    }
  } catch (error: any) {
    console.error('❌ Error fetching job from contract:', error);
    throw error;
  }
}

/**
 * Cancel deal and get refund (no fraud flag)
 */
export async function cancelDealContract(
  jobId: number,
  clientAddress: string
): Promise<string> {
  try {
    console.log('🔍 cancelDealContract called with:', { jobId, clientAddress, CONTRACT_ID });
    
    // First, check if job exists in contract
    try {
      await getJobFromContract(jobId);
      console.log('✅ Job exists in contract, proceeding with cancellation...');
    } catch (err: any) {
      console.error('❌ Job does not exist in contract!', err);
      throw new Error(`Job ${jobId} does not exist in the smart contract. This job may have been created with an old contract before the recent redeployment. Please create a completely NEW job to test the cancel feature.`);
    }
    
    const contract = new Contract(CONTRACT_ID);
    const account = await getServer().getAccount(clientAddress);

    const params = [
      nativeToScVal(jobId, { type: 'u64' }),
      nativeToScVal(Address.fromString(NATIVE_TOKEN), { type: 'address' })
    ];

    console.log('📝 Building transaction with params:', { jobId, NATIVE_TOKEN });

    const builtTx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET,
    })
      .addOperation(contract.call('cancel_deal', ...params))
      .setTimeout(30)
      .build();

    console.log('🔄 Simulating transaction...');
    const simulationResponse = await getServer().simulateTransaction(builtTx);

    console.log('📊 Simulation response:', simulationResponse);

    if (SorobanRpc.Api.isSimulationSuccess(simulationResponse)) {
      const preparedTx = SorobanRpc.assembleTransaction(builtTx, simulationResponse).build();

      const { signTransaction } = await import('@stellar/freighter-api');
      const signedResult = await signTransaction(preparedTx.toXDR(), {
        networkPassphrase: NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET,
      });

      const signedXdr = typeof signedResult === 'string' ? signedResult : (signedResult as any).signedTxXdr || signedResult;
      const networkPassphrase = NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
      const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
      const response = await getServer().sendTransaction(signedTx);

      return response.hash;
    } else {
      // Log detailed simulation error
      console.error('❌ Simulation Response:', simulationResponse);

      let errorMessage = 'Simulation failed';
      if ('error' in simulationResponse && simulationResponse.error) {
        errorMessage = simulationResponse.error;
        console.error('❌ Simulation failed with error:', errorMessage);
      }

      // Check if it's a "job not found" error
      if (errorMessage.includes('UnreachableCodeReached')) {
        console.error('⚠️ Job not found in contract. Job ID:', jobId);
        throw new Error(`Job ${jobId} not found in smart contract. The job may not have been created successfully in the contract, or you're using an old job from before the contract was redeployed.`);
      }

      throw new Error(`Simulation failed: ${errorMessage}`);
    }
  } catch (error: any) {
    console.error('❌ Error cancelling deal in contract:', error);
    throw error;
  }
}

/**
 * Raise fraud flag and get refund
 */
export async function raiseFraudFlagContract(
  jobId: number,
  clientAddress: string
): Promise<string> {
  try {
    const contract = new Contract(CONTRACT_ID);
    const account = await getServer().getAccount(clientAddress);

    const params = [
      nativeToScVal(jobId, { type: 'u64' }),
      nativeToScVal(Address.fromString(NATIVE_TOKEN), { type: 'address' })
    ];

    const builtTx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET,
    })
      .addOperation(contract.call('raise_fraud_flag', ...params))
      .setTimeout(30)
      .build();

    const simulationResponse = await getServer().simulateTransaction(builtTx);

    if (SorobanRpc.Api.isSimulationSuccess(simulationResponse)) {
      const preparedTx = SorobanRpc.assembleTransaction(builtTx, simulationResponse).build();

      const { signTransaction } = await import('@stellar/freighter-api');
      const signedResult = await signTransaction(preparedTx.toXDR(), {
        networkPassphrase: NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET,
      });

      const signedXdr = typeof signedResult === 'string' ? signedResult : (signedResult as any).signedTxXdr || signedResult;
      const networkPassphrase = NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET;
      const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
      const response = await getServer().sendTransaction(signedTx);

      return response.hash;
    } else {
      // Log detailed simulation error
      console.error('Simulation Response:', simulationResponse);

      let errorMessage = 'Simulation failed';
      if ('error' in simulationResponse && simulationResponse.error) {
        errorMessage = simulationResponse.error;
        console.error('Simulation failed with error:', errorMessage);
      }

      if ('events' in simulationResponse && simulationResponse.events) {
        console.error('Events:', simulationResponse.events);
      }

      console.error('Full simulation response:', JSON.stringify(simulationResponse, null, 2));

      throw new Error(`Simulation failed: ${errorMessage}`);
    }
  } catch (error: any) {
    console.error('Error raising fraud flag in contract:', error);
    throw new Error(`Failed to raise fraud flag: ${error.message}`);
  }
}

/**
 * Get fraud count for a freelancer
 */
export async function getFraudCountFromContract(freelancerAddress: string): Promise<number> {
  try {
    const contract = new Contract(CONTRACT_ID);
    const params = [nativeToScVal(Address.fromString(freelancerAddress), { type: 'address' })];

    // For read-only calls, use a dummy null account as source
    const NULL_ACCOUNT = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
    const account = await getServer().getAccount(NULL_ACCOUNT);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET,
    })
      .addOperation(contract.call('get_fraud_count', ...params))
      .setTimeout(30)
      .build();

    const result = await getServer().simulateTransaction(tx);

    if (SorobanRpc.Api.isSimulationSuccess(result) && result.result) {
      return Number(scValToNative(result.result.retval));
    }

    return 0;
  } catch (error: any) {
    console.error('Error getting fraud count from contract:', error);
    return 0;
  }
}
