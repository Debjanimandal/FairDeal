# Deploy FairDeal Smart Contract to Stellar Testnet (PowerShell)
Write-Host "🚀 Deploying FairDeal Smart Contract to Stellar Testnet..." -ForegroundColor Cyan

# Check if contract is built
if (-not (Test-Path "contract/target/wasm32-unknown-unknown/release/fairdeal_escrow_optimized.wasm")) {
    Write-Host "❌ Contract not built. Run .\build-contract.ps1 first" -ForegroundColor Red
    exit 1
}

# Network configuration
$NETWORK = "testnet"
$RPC_URL = "https://soroban-testnet.stellar.org"

# Deploy contract
Write-Host "📤 Deploying to $NETWORK..." -ForegroundColor Yellow
$CONTRACT_ID = soroban contract deploy `
    --wasm contract/target/wasm32-unknown-unknown/release/fairdeal_escrow_optimized.wasm `
    --source-account default `
    --network $NETWORK `
    --rpc-url $RPC_URL

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Contract deployed successfully!" -ForegroundColor Green
    Write-Host "📋 Contract ID: $CONTRACT_ID" -ForegroundColor Green
    Write-Host ""
    Write-Host "Update your .env.local with:" -ForegroundColor Yellow
    Write-Host "NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}
