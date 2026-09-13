@echo off
echo ============================================================
echo  VisionLab -- Intelligent Image ^& Video Analysis Platform
echo  CSE3010 Computer Vision
echo ============================================================
echo.

:: Check Python
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python not found. Install Python 3.9+ and add to PATH.
    pause
    exit /b 1
)

cd /d "%~dp0backend"

:: Create venv if it doesn't exist
if not exist ".venv" (
    echo [*] Creating virtual environment...
    python -m venv .venv
)

:: Activate venv
call .venv\Scripts\activate.bat

:: Install dependencies
echo [*] Installing Python dependencies (first run may take a few minutes)...
pip install -r requirements.txt --quiet

echo.
echo [*] Starting VisionLab API on http://localhost:8000
echo [*] API Docs available at http://localhost:8000/api/docs
echo.
echo [*] Open the frontend by running in a separate terminal:
echo     cd frontend ^&^& python -m http.server 5500
echo     Then visit: http://localhost:5500
echo.
echo Press Ctrl+C to stop the server.
echo ============================================================

python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
