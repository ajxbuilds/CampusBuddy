@echo off
title CampusBuddy Launcher
color 0B

echo ======================================================================
echo                 CAMPUSBUDDY - FULL-STACK PLATFORM
echo          Problem Solving, Complaints, Community & Gamification
echo ======================================================================
echo.

set ROOT_DIR=%~dp0
cd /d "%ROOT_DIR%"

echo [1/4] Checking Python Virtual Environment...
if not exist "backend\venv\Scripts\python.exe" (
    echo [ERROR] Python virtual environment not found in backend\venv!
    echo Please run setup first.
    pause
    exit /b 1
)

echo [2/4] Ensuring Database Schema and Seed Data...
backend\venv\Scripts\python.exe backend\seed.py
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Database seed reported an issue, continuing startup...
)

echo [3/4] Launching FastAPI Backend Server on http://localhost:8000...
start "CampusBuddy Backend (Port 8000)" cmd /k "cd /d "%ROOT_DIR%" && backend\venv\Scripts\python.exe -m uvicorn app.main:app --port 8000 --app-dir backend --reload"

echo [4/4] Launching Vite Frontend Dev Server on http://localhost:5173...
start "CampusBuddy Frontend (Port 5173)" cmd /k "cd /d "%ROOT_DIR%frontend" && npm run dev"

echo.
echo ======================================================================
echo           ALL SERVICES STARTED SUCCESSFULLY!
echo ======================================================================
echo.
echo   - Frontend Application : http://localhost:5173
echo   - FastAPI Backend API  : http://localhost:8000
echo   - Swagger API Docs     : http://localhost:8000/docs
echo.
echo Demo Accounts (1-Click Switcher available on page):
echo   - Student: student@campusbuddy.edu / Student@123
echo   - Teacher: teacher@campusbuddy.edu / Teacher@123
echo   - Parent : parent@campusbuddy.edu  / Parent@123
echo   - Admin  : admin@campusbuddy.edu   / Admin@123
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo Press any key to close this launcher window (services keep running).
pause >nul
