@echo off
echo ========================================
echo Uma Racing Web - Starting Application
echo ========================================
echo.

echo Starting Backend Server (Port 5000)...
echo Backend will run in this window.
echo.
echo Starting Frontend in a new window...
start cmd /k "cd frontend && npm start"
echo.

echo ========================================
echo Application Starting...
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:5000/docs
echo.
echo Press Ctrl+C to stop the backend server
echo Close the other window to stop the frontend
echo ========================================
echo.

cd backend
python main.py
