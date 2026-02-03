const StellarSdk = require('@stellar/stellar-sdk');

const CONTRACT_ID = 'CC2WVO5L4SIDCCXYQLRYESCKC6DYR6YH4BN5GRUOJHLNNQKNKKHW4F53';
const RPC_URL = 'https://soroban-testnet.stellar.org';

async function testContract() {
  try {
    const server = new StellarSdk.SorobanRpc.Server(RPC_URL, { allowHttp: false });
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    
    // Try to get job 1
    console.log('Testing contract:', CONTRACT_ID);
    console.log('Attempting to get job 1...');
    
    const NULL_ACCOUNT = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
    const account = await server.getAccount(NULL_ACCOUNT);
    
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(contract.call('get_job', StellarSdk.nativeToScVal(1, { type: 'u64' })))
      .setTimeout(30)
      .build();
    
    const result = await server.simulateTransaction(tx);
    
    if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(result) && result.result) {
      const job = StellarSdk.scValToNative(result.result.retval);
      console.log('✅ Job 1 found:', JSON.stringify(job, null, 2));
    } else {
      console.log('❌ Job 1 not found or simulation failed');
      console.log('Result:', JSON.stringify(result, null, 2));
    }
    
    // Try job 2
    console.log('\nAttempting to get job 2...');
    const tx2 = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(contract.call('get_job', StellarSdk.nativeToScVal(2, { type: 'u64' })))
      .setTimeout(30)
      .build();
    
    const result2 = await server.simulateTransaction(tx2);
    
    if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(result2) && result2.result) {
      const job = StellarSdk.scValToNative(result2.result.retval);
      console.log('✅ Job 2 found:', JSON.stringify(job, null, 2));
    } else {
      console.log('❌ Job 2 not found or simulation failed');
      console.log('Result:', JSON.stringify(result2, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testContract();
