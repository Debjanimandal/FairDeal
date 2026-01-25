# FairDeal - Smart Contract Build & Deploy Script

Write-Host "🚀 Building FairDeal Smart Contract..." -ForegroundColor Cyan
Write-Host ""

# Check if stellar CLI is installed
if (-not (Get-Command stellar -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Stellar CLI not found!" -ForegroundColor Red
    Write-Host "Install it with: cargo install --locked stellar-cli --features opt" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Stellar CLI found" -ForegroundColor Green

# Navigate to contract directory
Set-Location contract

Write-Host ""
Write-Host "📦 Building Rust smart contract..." -ForegroundColor Cyan

# Build the contract
stellar contract build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Contract built successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📁 WASM file location:" -ForegroundColor Cyan
    Write-Host "   target/wasm32-unknown-unknown/release/fairdeal_escrow.wasm" -ForegroundColor White
    Write-Host ""
    Write-Host "🔑 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Make sure you have a funded Stellar testnet account"
    Write-Host "   2. Deploy with:" -ForegroundColor Yellow
    Write-Host "      stellar contract deploy --wasm target/wasm32-unknown-unknown/release/fairdeal_escrow.wasm --source deployer --network testnet" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Set-Location ..
