Write-Host "🚀 FairDeal One-Click Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check command existence
function Test-Command {
    param($Command)
    return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

# Step 1: Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

$missingTools = @()

if (-not (Test-Command "stellar")) {
    $missingTools += "Stellar CLI (install: cargo install --locked stellar-cli --features opt)"
}

if (-not (Test-Command "node")) {
    $missingTools += "Node.js (install from: https://nodejs.org/)"
}

if (-not (Test-Command "git")) {
    $missingTools += "Git (install from: https://git-scm.com/)"
}

if ($missingTools.Count -gt 0) {
    Write-Host "❌ Missing required tools:" -ForegroundColor Red
    foreach ($tool in $missingTools) {
        Write-Host "   - $tool" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please install missing tools and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ All prerequisites found!" -ForegroundColor Green
Write-Host ""

# Step 2: Build Smart Contract
Write-Host "📦 Building Smart Contract..." -ForegroundColor Yellow
Set-Location contract
stellar contract build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Contract build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "✅ Contract built successfully!" -ForegroundColor Green
Set-Location ..
Write-Host ""

# Step 3: Deployment instructions
Write-Host "🎯 Next Steps for Deployment:" -ForegroundColor Cyan
Write-Host ""

Write-Host "STEP 1: Deploy Smart Contract" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Get testnet XLM:" -ForegroundColor White
Write-Host "   Visit: https://laboratory.stellar.org/#account-creator?network=test"
Write-Host ""
Write-Host "2. Deploy contract:" -ForegroundColor White
Write-Host "   stellar contract deploy --wasm contract/target/wasm32-unknown-unknown/release/fairdeal_escrow.wasm --source deployer --network testnet" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Save the CONTRACT_ID that's displayed!" -ForegroundColor White
Write-Host ""

Write-Host "STEP 2: Deploy Backend to Render" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to: https://render.com" -ForegroundColor White
Write-Host "2. Click 'New +' → 'Web Service'" -ForegroundColor White
Write-Host "3. Connect your GitHub repository" -ForegroundColor White
Write-Host "4. Configure:" -ForegroundColor White
Write-Host "   - Root Directory: backend" -ForegroundColor Gray
Write-Host "   - Build Command: npm install" -ForegroundColor Gray
Write-Host "   - Start Command: npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Add Environment Variables:" -ForegroundColor White
Write-Host "   PORT=5000" -ForegroundColor Gray
Write-Host "   WEB3_STORAGE_TOKEN=<your_token>" -ForegroundColor Gray
Write-Host "   STELLAR_CONTRACT_ID=<deployed_contract_id>" -ForegroundColor Gray
Write-Host "   STELLAR_NETWORK=testnet" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Save your backend URL!" -ForegroundColor White
Write-Host ""

Write-Host "STEP 3: Deploy Frontend to Vercel" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to: https://vercel.com" -ForegroundColor White
Write-Host "2. Click 'Add New' → 'Project'" -ForegroundColor White
Write-Host "3. Import your GitHub repository" -ForegroundColor White
Write-Host "4. Configure:" -ForegroundColor White
Write-Host "   - Root Directory: frontend" -ForegroundColor Gray
Write-Host "   - Build Command: npm run build" -ForegroundColor Gray
Write-Host "   - Output Directory: build" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Add Environment Variable:" -ForegroundColor White
Write-Host "   REACT_APP_API_URL=<your_backend_url>" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Deploy!" -ForegroundColor White
Write-Host ""

Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "For detailed instructions, see: DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your FairDeal platform will be ready after completing the above steps!" -ForegroundColor Green
