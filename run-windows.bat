@echo off
REM FocusWriter - Local Windows Launcher
REM This script starts the FocusWriter application locally on Windows

echo FocusWriter - Starting application...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm dependencies are installed
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if build is needed
if not exist "apps\web\dist\" (
    echo Building application...
    call npm run build
    if errorlevel 1 (
        echo ERROR: Build failed
        pause
        exit /b 1
    )
)

REM Start the application
echo.
echo Starting server on http://localhost:3000
echo Press Ctrl+C to stop the application
echo.

call npm start -w apps/server

pause
