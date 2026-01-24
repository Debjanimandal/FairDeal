# FairDeal Escrow Smart Contract Deployment Guide

## Prerequisites

1. **Install Stellar CLI**
   ```bash
   # Install Stellar CLI
   cargo install --locked stellar-cli --features opt
   
   # Verify installation
   stellar --version
   ```

2. **Install Rust** (if not already installed)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup target add wasm32-unknown-unknown
   ```

## Build the Contract

1. Navigate to the contract directory:
   ```bash
   cd contract
   ```

2. Build the contract:
   ```bash
   stellar contract build
   ```

   This will generate a `.wasm` file in `target/wasm32-unknown-unknown/release/`

## Run Tests

```bash
cargo test
```

## Deploy to Testnet

1. **Configure Stellar CLI for Testnet**
   ```bash
   stellar network add testnet \
     --rpc-url https://soroban-testnet.stellar.org \
     --network-passphrase "Test SDF Network ; September 2015"
   ```

2. **Create or Import Identity**
   ```bash
   # Create new identity
   stellar keys generate deployer --network testnet
   
   # Or import existing secret key
   stellar keys add deployer --secret-key SXXX...
   ```

3. **Fund Your Account**
   ```bash
   # Get testnet XLM from friendbot
   stellar keys fund deployer --network testnet
   ```

4. **Deploy the Contract**
   ```bash
   stellar contract deploy \
     --wasm target/wasm32-unknown-unknown/release/fairdeal_escrow.wasm \
     --source deployer \
     --network testnet
   ```

   This will output a Contract ID like: `CBMWBQ7SSWM2JRUVSBWHC2BL2GGR6HS...`

5. **Initialize the Contract**
   ```bash
   stellar contract invoke \
     --id <CONTRACT_ID> \
     --source deployer \
     --network testnet \
     -- initialize
   ```

## Deploy Native Token (for Testing)

If you need a test token for escrow payments:

```bash
# Deploy SAC (Stellar Asset Contract) for native XLM
stellar contract asset deploy \
  --asset native \
  --source deployer \
  --network testnet
```

## Interact with the Contract

### Create a Job

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source deployer \
  --network testnet \
  -- create_job \
  --client <CLIENT_ADDRESS> \
  --freelancer <FREELANCER_ADDRESS> \
  --amount 1000000000 \
  --initial_payment_percent 20 \
  --deadline 1748000000 \
  --description "Build a website" \
  --token <TOKEN_CONTRACT_ID>
```

### Fund a Job

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source client_key \
  --network testnet \
  -- fund_job \
  --job_id 1
```

### Submit Work

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source freelancer_key \
  --network testnet \
  -- submit_work \
  --job_id 1
```

### Approve Job (Release Payment)

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source client_key \
  --network testnet \
  -- approve_job \
  --job_id 1
```

### Reject Job (Get Refund)

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source client_key \
  --network testnet \
  -- reject_job \
  --job_id 1
```

### Get Job Details

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- get_job \
  --job_id 1
```

## Update Backend Configuration

After deployment, update your backend `.env` file:

```env
STELLAR_CONTRACT_ID=<YOUR_DEPLOYED_CONTRACT_ID>
STELLAR_NETWORK=testnet
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
```

## Deploy to Mainnet (Production)

⚠️ **Only deploy to mainnet after thorough testing on testnet!**

1. Configure mainnet network:
   ```bash
   stellar network add mainnet \
     --rpc-url https://soroban.stellar.org \
     --network-passphrase "Public Global Stellar Network ; September 2015"
   ```

2. Use a funded mainnet account and deploy:
   ```bash
   stellar contract deploy \
     --wasm target/wasm32-unknown-unknown/release/fairdeal_escrow.wasm \
     --source mainnet_deployer \
     --network mainnet
   ```

## Verify Contract

You can verify your contract deployment on:
- **Testnet Explorer**: https://stellar.expert/explorer/testnet/contract/YOUR_CONTRACT_ID
- **Mainnet Explorer**: https://stellar.expert/explorer/public/contract/YOUR_CONTRACT_ID

## Troubleshooting

### Build Errors

If you encounter build errors:
```bash
# Clean and rebuild
cargo clean
stellar contract build
```

### Insufficient Balance

If deployment fails due to insufficient balance:
```bash
# For testnet, request more XLM
stellar keys fund deployer --network testnet

# For mainnet, ensure you have enough XLM
```

### Contract Invocation Errors

Check the contract ID and ensure all parameters match the expected types:
- Addresses should be in Stellar format (G... or C...)
- Amounts should be in stroops (1 XLM = 10,000,000 stroops)
- Timestamps are in Unix epoch seconds

## Security Considerations

1. **Audit the Contract**: Before mainnet deployment, consider a professional security audit
2. **Test Thoroughly**: Run all tests and manual testing scenarios on testnet
3. **Start Small**: Begin with small amounts on mainnet to verify functionality
4. **Monitor Transactions**: Keep track of all contract interactions
5. **Backup Keys**: Securely store all private keys and recovery phrases

## Contract Upgrade Strategy

Soroban contracts can be upgraded. To upgrade:

1. Build the new version
2. Deploy using the same identity
3. Update the contract code:
   ```bash
   stellar contract install \
     --wasm target/wasm32-unknown-unknown/release/fairdeal_escrow.wasm \
     --source deployer \
     --network testnet
   ```

## Support

For issues or questions:
- Stellar Documentation: https://developers.stellar.org/docs/smart-contracts
- Stellar Discord: https://discord.gg/stellardev
- GitHub Issues: [Your Repository URL]
