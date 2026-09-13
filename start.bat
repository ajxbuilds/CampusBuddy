@echo off
title CampusBuddy Launcher - Complete Digital Campus Platform
color 0B

echo ======================================================================
echo                 CAMPUSBUDDY - DIGITAL CAMPUS COMPANION
echo     Community - Complaints - Study Buddy - AI Guide - Gamification
echo     Student Portal - Faculty Portal - Parent Oversight - Admin Command
echo ======================================================================
echo.

set ROOT_DIR=%~dp0
cd /d "%ROOT_DIR%"

:: 1. Check Python Virtual Environment
echo [1/5] Checking Python Virtual Environment...
if not exist "backend\venv\Scripts\python.exe" (
    echo [ERROR] Python virtual environment not found in backend\venv!
    echo Please create the virtual environment and install requirements first:
    echo   python -m venv backend\venv
    echo   backend\venv\Scripts\pip install -r backend\requirements.txt
    pause
    exit /b 1
)

:: 2. Check Environment Configuration
echo [2/5] Checking Environment Configuration (.env)...
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        echo [INFO] Creating backend\.env from backend\.env.example...
        copy "backend\.env.example" "backend\.env" >nul
        echo [OK] backend\.env created with default settings.
    ) else (
        echo [WARNING] backend\.env.example not found. Using default environment variables.
    )
) else (
    echo [OK] backend\.env detected.
)

:: 3. Check Frontend Dependencies
echo [3/5] Checking Frontend Dependencies (node_modules)...
if not exist "frontend\node_modules" (
    echo [INFO] frontend\node_modules missing. Installing npm packages...
    cd /d "%ROOT_DIR%frontend"
    call npm install
    cd /d "%ROOT_DIR%"
) else (
    echo [OK] Frontend dependencies detected.
)

:: 4. Database Initialization & Seeding
echo [4/5] Initializing Database Schema & Seed Data...
backend\venv\Scripts\python.exe backend\seed.py
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Database seed check reported an issue, continuing startup...
) else (
    echo [OK] Database verified: Users, Categories, and Community Seed Data.
)

:: 5. Launch Services
echo [5/5] Launching Backend & Frontend Services...
echo   - Starting FastAPI Backend on http://localhost:8000...
start "CampusBuddy Backend (Port 8000)" cmd /k "cd /d "%ROOT_DIR%" && backend\venv\Scripts\python.exe -m uvicorn app.main:app --port 8000 --app-dir backend --reload --env-file backend\.env --reload-include ".env""

echo   - Starting Vite Frontend on http://localhost:5173...
start "CampusBuddy Frontend (Port 5173)" cmd /k "cd /d "%ROOT_DIR%frontend" && npm run dev"

echo.
echo ======================================================================
echo                 ALL SERVICES LAUNCHED SUCCESSFULLY!
echo ======================================================================
echo.
echo   * Web Portal Application : http://localhost:5173
echo   * FastAPI API Root       : http://localhost:8000
echo   * Interactive Swagger UI : http://localhost:8000/docs
echo.
echo ----------------------------------------------------------------------
echo Dedicated Role Portals & Authentication:
echo.
echo   [Student Portal]  http://localhost:5173/login/student
echo     - Account: student@campusbuddy.edu / Student@123
echo     - Google OAuth 2.0 / OpenID Connect + 1-Click Demo Switcher
echo     - Community Forums, Study Buddy, Complaints, Leaderboard, AI Guide
echo.
echo   [Faculty Portal]  http://localhost:5173/login/teacher
echo     - Account: teacher@campusbuddy.edu / Teacher@123
echo     - Assigned Complaints, Community Answers, Moderation
echo.
echo   [Parent Portal]   http://localhost:5173/login/parent
echo     - Account: parent@campusbuddy.edu / Parent@123
echo     - Ward Complaint Monitoring, Escalation Tracking
echo.
echo   [Admin Center]    http://localhost:5173/login/admin
echo     - Account: admin@campusbuddy.edu / Admin@123
echo     - SLA Overview, Analytics, Content Moderation Queue, Audit Logs
echo ----------------------------------------------------------------------
echo.
echo Opening CampusBuddy in default browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo Keep this launcher window open or press any key to close.
echo (Background service windows will remain active).
pause >nul
