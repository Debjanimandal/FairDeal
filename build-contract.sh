#!/bin/bash

echo "🚀 Building FairDeal Smart Contract..."
echo ""

# Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo "❌ Stellar CLI not found!"
    echo "Install it with: cargo install --locked stellar-cli --features opt"
    exit 1
fi

echo "✅ Stellar CLI found"

# Navigate to contract directory
cd contract

echo ""
echo "📦 Building Rust smart contract..."

# Build the contract
stellar contract build

if [ $? -eq 0 ]; then
    echo "✅ Contract built successfully!"
    echo ""
    echo "📁 WASM file location:"
    echo "   target/wasm32-unknown-unknown/release/fairdeal_escrow.wasm"
    echo ""
    echo "🔑 Next steps:"
    echo "   1. Make sure you have a funded Stellar testnet account"
    echo "   2. Deploy with:"
    echo "      stellar contract deploy --wasm target/wasm32-unknown-unknown/release/fairdeal_escrow.wasm --source deployer --network testnet"
    echo ""
else
    echo "❌ Build failed!"
    exit 1
fi

cd ..
