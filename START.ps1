# FaceRating Platform - Startup Script (PowerShell)

Write-Host "================================" -ForegroundColor Cyan
Write-Host "FaceRating Platform - Quick Start" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check frontend
if (Test-Path "frontend\node_modules") {
    Write-Host "[✓] Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "[✗] Frontend dependencies NOT installed" -ForegroundColor Yellow
    Write-Host "Running: npm install in frontend..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
}

# Check backend venv
if (Test-Path "backend-ai\venv") {
    Write-Host "[✓] Backend virtual environment created" -ForegroundColor Green
} else {
    Write-Host "[✗] Backend venv NOT created" -ForegroundColor Yellow
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    Push-Location backend-ai
    python -m venv venv
    Pop-Location
}

# Check .env files
if (Test-Path "frontend\.env") {
    Write-Host "[✓] Frontend .env configured" -ForegroundColor Green
} else {
    Write-Host "[✗] Frontend .env missing" -ForegroundColor Yellow
}

if (Test-Path "backend-ai\.env") {
    Write-Host "[✓] Backend .env configured" -ForegroundColor Green
} else {
    Write-Host "[✗] Backend .env missing" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Setup Check Complete!" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Download Firebase Service Account JSON"
Write-Host "   Save to: backend-ai/firebase-service-account.json"
Write-Host ""
Write-Host "2. Start Backend:"
Write-Host "   Terminal 1: cd backend-ai"
Write-Host "              : .\venv\Scripts\Activate"
Write-Host "              : python main.py"
Write-Host ""
Write-Host "3. Start Frontend:"
Write-Host "   Terminal 2: cd frontend"
Write-Host "              : npm run dev"
Write-Host ""
Write-Host "4. Open Browser: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
