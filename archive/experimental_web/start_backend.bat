@echo off
REM Uma Racing Web - Quick Startup Script for Windows
REM Uses the Python virtual environment

echo.
echo ============================================================
echo  UMA RACING WEB - STARTUP SCRIPT
echo ============================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

echo Checking Python version...
python --version

REM Navigate to backend directory
cd /d "%~dp0backend"

echo.
echo ============================================================
echo Installing dependencies...
echo ============================================================
..\..\\.venv\Scripts\pip.exe install -r requirements.txt

echo.
echo ============================================================
echo Starting Uma Racing Web Backend Server...
echo ============================================================
echo.
echo Server will start on:
echo   API:  http://localhost:5000
echo   Docs: http://localhost:5000/docs
echo.
echo In another terminal, run: start_frontend.bat
echo.
echo Press Ctrl+C to stop the server
echo.

..\..\\.venv\Scripts\python.exe main.py

pause