#!/bin/bash
set -e

# Project Root
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "--------------------------------------------------------"
echo "🚀 P2M Accelerator Startup Script"
echo "--------------------------------------------------------"

# 1. Resolve GCP Project ID dynamically
if [ -z "$GOOGLE_CLOUD_PROJECT" ]; then
    if [ -f ".env" ]; then
        GOOGLE_CLOUD_PROJECT=$(grep "^GOOGLE_CLOUD_PROJECT=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    fi
fi

if [ -z "$GOOGLE_CLOUD_PROJECT" ] && command -v gcloud &> /dev/null; then
    GOOGLE_CLOUD_PROJECT=$(gcloud config get-value project 2>/dev/null || true)
fi

if [ -n "$GOOGLE_CLOUD_PROJECT" ]; then
    export GOOGLE_CLOUD_PROJECT
    export GOOGLE_CLOUD_QUOTA_PROJECT="$GOOGLE_CLOUD_PROJECT"
    echo "🔑 Active GCP Project: $GOOGLE_CLOUD_PROJECT"
else
    echo "⚠️ Warning: GOOGLE_CLOUD_PROJECT is not set and could not be detected from gcloud CLI or .env."
fi

# Cleanup on exit (Ctrl+C / kill)
cleanup() {
    echo ""
    echo "🛑 Shutting down server processes..."
    if [ -n "$BACKEND_PID" ]; then kill "$BACKEND_PID" 2>/dev/null || true; fi
    if [ -n "$FRONTEND_PID" ]; then kill "$FRONTEND_PID" 2>/dev/null || true; fi
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 2. Setup and run Python Backend (FastAPI) in virtualenv
cd "$PROJECT_DIR/backend"
if [ ! -d ".venv" ]; then
    echo "🐍 Creating Python virtual environment (.venv)..."
    python3 -m venv .venv
fi

echo "🐍 Activating Python virtual environment..."
source .venv/bin/activate

echo "📦 Checking Python backend dependencies..."
pip install -r requirements.txt --quiet --disable-pip-version-check

echo "⚡ Starting Python FastAPI backend on http://localhost:8080..."
uvicorn main:app --reload --host 0.0.0.0 --port 8080 &
BACKEND_PID=$!

# 3. Setup and run Frontend (Vite)
echo "📦 Checking Frontend dependencies..."
cd "$PROJECT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    npm install
fi

echo "⚡ Starting Vite Frontend on http://localhost:5173..."
npm run dev -- --host &
FRONTEND_PID=$!

echo ""
echo "========================================================"
echo "✅ P2M Accelerator is running!"
echo "   - Web App (Vite Dev): http://localhost:5173"
echo "   - Backend API:       http://localhost:8080"
echo "   - API Docs (Swagger):http://localhost:8080/docs"
echo "========================================================"
echo "Press Ctrl+C to stop all services."

# Wait for background processes
wait
