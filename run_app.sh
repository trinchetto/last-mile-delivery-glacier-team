#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting DeliveryIQ Application...${NC}"

# Navigate to the script's directory to ensure relative paths work
cd "$(dirname "$0")"

# Check if frontend directory exists
if [ -d "frontend" ]; then
    echo -e "${BLUE}📁 Found frontend directory...${NC}"
    cd frontend
else
    echo "❌ Error: frontend directory not found!"
    exit 1
fi

# Check for node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Dependencies not found. Installing...${NC}"
    npm install
fi

# Start the development server
echo -e "${GREEN}✅ Starting Development Server...${NC}"
npm run dev
