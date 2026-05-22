@echo off
REM Quick Start Script for FaceRating Platform

echo ================================
echo FaceRating Platform - Quick Start
echo ================================
echo.

REM Check if frontend dependencies are installed
if exist "frontend\node_modules" (
    echo [✓] Frontend dependencies installed
) else (
    echo [✗] Frontend dependencies NOT installed
    echo Running: npm install in frontend...
    cd frontend
    call npm install
    cd ..
)

REM Check if backend venv exists
if exist "backend-ai\venv" (
    echo [✓] Backend virtual environment created
) else (
    echo [✗] Backend venv NOT created
    echo Creating Python virtual environment...
    cd backend-ai
    python -m venv venv
    cd ..
)

REM Check if .env files exist
if exist "frontend\.env" (
    echo [✓] Frontend .env configured
) else (
    echo [✗] Frontend .env missing
)

if exist "backend-ai\.env" (
    echo [✓] Backend .env configured
) else (
    echo [✗] Backend .env missing
)

echo.
echo ================================
echo Setup Check Complete!
echo ================================
echo.
echo Next Steps:
echo 1. Download Firebase Service Account JSON
echo    Save to: backend-ai/firebase-service-account.json
echo.
echo 2. Start Backend:
echo    Terminal 1: cd backend-ai
echo              : venv\Scripts\Activate
echo              : python main.py
echo.
echo 3. Start Frontend:
echo    Terminal 2: cd frontend
echo              : npm run dev
echo.
echo 4. Open Browser: http://localhost:5173
echo.
