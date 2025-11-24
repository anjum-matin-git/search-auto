#!/bin/bash

# Start SearchAuto - Frontend + Backend

echo "🚀 Starting SearchAuto..."

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start Python FastAPI backend on port 3000
echo "📦 Starting Python backend on port 3000..."
(cd "$SCRIPT_DIR/backend" && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload) &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start Vite frontend on port 5000
echo "🎨 Starting Vite frontend on port 5000..."
(cd "$SCRIPT_DIR" && npm run dev) &
FRONTEND_PID=$!

echo "✅ Both servers started!"
echo "   - Frontend: http://localhost:5000"
echo "   - Backend API: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
