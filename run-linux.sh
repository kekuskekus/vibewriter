#!/bin/bash

# FocusWriter - Local Linux Launcher
# This script starts the FocusWriter application locally on Linux

echo "FocusWriter - Starting application..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "ERROR: Node.js 18+ is required"
    exit 1
fi

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
fi

# Check if build is needed
if [ ! -d "apps/web/dist" ]; then
    echo "Building application..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "ERROR: Build failed"
        exit 1
    fi
fi

# Start the application
echo ""
echo "Starting server on http://localhost:3000"
echo "Press Ctrl+C to stop the application"
echo ""

npm start -w apps/server
