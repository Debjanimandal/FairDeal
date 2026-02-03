# Build Soroban smart contract (PowerShell)
Write-Host "🔨 Building FairDeal Soroban Smart Contract..." -ForegroundColor Cyan

Set-Location contract

# Build the contract
Write-Host "Building WASM..." -ForegroundColor Yellow
cargo build --target wasm32-unknown-unknown --release

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Optimize the WASM
Write-Host "⚡ Optimizing WASM..." -ForegroundColor Yellow
soroban contract optimize `
    --wasm target/wasm32-unknown-unknown/release/fairdeal_escrow.wasm `
    --wasm-out target/wasm32-unknown-unknown/release/fairdeal_escrow_optimized.wasm

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Optimization failed!" -ForegroundColor Red
    exit 1
}

Set-Location ..

Write-Host "✅ Contract built successfully!" -ForegroundColor Green
Write-Host "📦 Optimized WASM: contract/target/wasm32-unknown-unknown/release/fairdeal_escrow_optimized.wasm" -ForegroundColor Green
