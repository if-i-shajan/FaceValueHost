# Quick deployment to Google Cloud Run
# Prerequisites: Google Cloud SDK installed and gcloud auth login completed

param(
    [string]$ProjectId = "facevalue-9eb02",
    [string]$ServiceName = "facerating-backend",
    [string]$Region = "us-central1",
    [int]$Memory = 512
)

Write-Host "🚀 Deploying FaceRating Backend to Google Cloud Run..." -ForegroundColor Green
Write-Host ""

# Step 1: Set Project
Write-Host "[1/4] Setting Google Cloud project..." -ForegroundColor Cyan
gcloud config set project $ProjectId
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to set project. Make sure you've run: gcloud auth login" -ForegroundColor Red
    exit 1
}

# Step 2: Navigate to backend
$backendPath = Join-Path (Get-Location) "backend-ai"
if (-not (Test-Path $backendPath)) {
    Write-Host "❌ backend-ai folder not found at: $backendPath" -ForegroundColor Red
    exit 1
}

Set-Location $backendPath
Write-Host "✅ Changed to backend-ai directory" -ForegroundColor Green

# Step 3: Deploy
Write-Host ""
Write-Host "[2/4] Building Docker image and deploying to Cloud Run..." -ForegroundColor Cyan
Write-Host "⏳ This may take 5-10 minutes on first deployment..." -ForegroundColor Yellow
Write-Host ""

gcloud run deploy $ServiceName `
    --source . `
    --platform managed `
    --region $Region `
    --allow-unauthenticated `
    --memory $Memory`Mi `
    --timeout 3600 `
    --set-env-vars "ENVIRONMENT=production"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host ""

# Step 4: Get Service URL
Write-Host "[3/4] Getting service URL..." -ForegroundColor Cyan
$serviceUrl = gcloud run services describe $ServiceName `
    --platform managed `
    --region $Region `
    --format 'value(status.url)'

Write-Host "✅ Service URL: $serviceUrl" -ForegroundColor Green
Write-Host ""

# Step 5: Instructions
Write-Host "[4/4] Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Update frontend environment variable:" -ForegroundColor Yellow
Write-Host "   frontend/.env → VITE_AI_API_URL=$serviceUrl" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Rebuild and redeploy frontend:" -ForegroundColor Yellow
Write-Host "   cd ../frontend" -ForegroundColor Gray
Write-Host "   npm run build" -ForegroundColor Gray
Write-Host "   firebase deploy --only hosting" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test the API:" -ForegroundColor Yellow
Write-Host "   curl $serviceUrl/api/health" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Full deployment will be complete!" -ForegroundColor Green
