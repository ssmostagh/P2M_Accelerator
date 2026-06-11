#!/bin/bash

# Trap Ctrl+C and kill both background processes on exit
trap "kill \$BACKEND_PID \$FRONTEND_PID; exit" INT

echo "🚀 Starting Backend (Python FastAPI) on port 8080..."
cd "$(dirname "$0")/backend"
echo "📦 Installing backend dependencies..."
python3 -m pip install -r requirements.txt
python3 -m uvicorn main:app --reload --port 8080 &
BACKEND_PID=$!

echo "🚀 Starting Frontend (Vite) on port 5173..."
cd "../frontend"
echo "📦 Installing frontend dependencies..."
npm install
npm run dev &
FRONTEND_PID=$!

echo "✅ Both servers are running in the background!"
echo "   - Backend: http://localhost:8080"
echo "   - Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers."

wait
