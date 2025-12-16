#!/bin/bash

# Define colors for output
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping DeliveryIQ Application...${NC}"

# Kill backend server
BACKEND_PIDS=$(pgrep -f "python.*server.py")
if [ ! -z "$BACKEND_PIDS" ]; then
    echo -e "${YELLOW}Stopping backend server(s)...${NC}"
    kill $BACKEND_PIDS 2>/dev/null
    sleep 1
    # Force kill if still running
    pkill -9 -f "python.*server.py" 2>/dev/null
    echo -e "${GREEN}✅ Backend stopped${NC}"
else
    echo "Backend not running"
fi

# Kill frontend (Vite) server
FRONTEND_PIDS=$(pgrep -f "vite")
if [ ! -z "$FRONTEND_PIDS" ]; then
    echo -e "${YELLOW}Stopping frontend server(s)...${NC}"
    kill $FRONTEND_PIDS 2>/dev/null
    sleep 1
    # Force kill if still running
    pkill -9 -f "vite" 2>/dev/null
    echo -e "${GREEN}✅ Frontend stopped${NC}"
else
    echo "Frontend not running"
fi

# Kill any node processes from the frontend directory
NODE_PIDS=$(pgrep -f "node.*frontend")
if [ ! -z "$NODE_PIDS" ]; then
    echo -e "${YELLOW}Stopping Node processes...${NC}"
    kill $NODE_PIDS 2>/dev/null
    echo -e "${GREEN}✅ Node processes stopped${NC}"
fi

echo -e "${GREEN}✅ All servers stopped${NC}"
