#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting DeliveryIQ Application...${NC}"

# Navigate to the script's directory to ensure relative paths work
cd "$(dirname "$0")"

# Function to cleanup background processes on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Backend stopped${NC}"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Frontend stopped${NC}"
    fi
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Install Backend Dependencies if needed
echo -e "${BLUE}📦 Checking backend dependencies...${NC}"
cd backend

# Check if langchain_core is installed (key dependency)
if ! python3 -c "import langchain_core" 2>/dev/null; then
    echo -e "${BLUE}📦 Installing backend dependencies (this may take a few minutes)...${NC}"
    pip3 install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Failed to install dependencies. Trying with --user flag...${NC}"
        pip3 install --user -r requirements.txt
    fi
fi

# Start Backend
echo -e "${BLUE}🔧 Starting Backend Server...${NC}"
python3 server.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Check if backend started successfully
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${GREEN}✅ Backend running on http://localhost:2024 (PID: $BACKEND_PID)${NC}"
else
    echo -e "${YELLOW}⚠️  Backend may have failed to start. Check for errors above.${NC}"
fi

# Start Frontend
echo -e "${BLUE}🌐 Starting Frontend Server...${NC}"

# Check if frontend directory exists
if [ -d "frontend" ]; then
    cd frontend
else
    echo "❌ Error: frontend directory not found!"
    cleanup
fi

# Check for node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Dependencies not found. Installing...${NC}"
    npm install
fi

# Start the development server
echo -e "${GREEN}✅ Frontend starting on http://localhost:5173${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
npm run dev &
FRONTEND_PID=$!

# Wait for frontend process
wait $FRONTEND_PID

# Cleanup when frontend exits
cleanup
