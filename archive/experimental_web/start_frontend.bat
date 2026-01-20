@echo off
REM Uma Racing Web - Frontend Startup Script for Windows
REM Uses the Python virtual environment

echo.
echo ============================================================
echo  UMA RACING WEB - FRONTEND SERVER
echo ============================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Navigate to frontend directory
cd /d "%~dp0frontend"

echo.
echo ============================================================
echo Starting Frontend Server...
echo ============================================================
echo.
echo Frontend will be available at:
echo   http://localhost:5500
echo.
echo Make sure the backend is running at:
echo   http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.

..\..\\.venv\Scripts\python.exe -m http.server 5500

pause
