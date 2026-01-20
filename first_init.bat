@echo off
echo ========================================
echo Uma Racing Web - First Time Setup
echo ========================================
echo.

echo [1/4] Checking Python...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)
echo.

echo [2/4] Installing Backend Dependencies...
cd backend
echo Installing backend packages...
pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo ERROR: Failed to install backend dependencies
    echo ========================================
    echo.
    echo This might be due to missing build tools.
    echo.
    echo SOLUTION 1 - Install Microsoft C++ Build Tools
    echo   Download from visual studio website
    echo   Install Desktop development with C++ workload
    echo.
    echo SOLUTION 2 - Use Python 3.11 or 3.12
    echo   Python 3.14 may have compatibility issues
    echo   Download from python.org
    echo.
    echo SOLUTION 3 - Try manual installation
    echo   pip install --upgrade pip
    echo   pip install fastapi uvicorn pydantic
    echo.
    cd ..
    pause
    exit /b 1
)
cd ..
echo Backend dependencies installed successfully!
echo.

echo [3/4] Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 14+ from https://nodejs.org/
    cd ..
    pause
    exit /b 1
)
echo.

echo [4/4] Installing Frontend Dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo Frontend dependencies installed successfully!
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo To start the application, run: start.bat
echo.
pause
