#!/bin/bash

#############################################
#   GeoRanker - One-Click macOS Installer   #
#############################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                              ║${NC}"
echo -e "${BLUE}║     ${GREEN}🌍 GeoRanker - Local SEO Intelligence Grid${BLUE}              ║${NC}"
echo -e "${BLUE}║                                                              ║${NC}"
echo -e "${BLUE}║     ${NC}One-Click macOS Installer${BLUE}                               ║${NC}"
echo -e "${BLUE}║                                                              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running from the correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the GeoRanker project directory.${NC}"
    exit 1
fi

# Step 1: Check for Node.js
echo -e "${YELLOW}[1/6]${NC} Checking for Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "       ${GREEN}✓ Node.js found: ${NODE_VERSION}${NC}"
else
    echo -e "${RED}❌ Node.js is not installed.${NC}"
    echo ""
    echo "Please install Node.js first:"
    echo "  Option 1: brew install node"
    echo "  Option 2: Download from https://nodejs.org/"
    echo ""
    exit 1
fi

# Step 2: Check Node.js version (minimum v18)
NODE_MAJOR=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_MAJOR" -lt 18 ]; then
    echo -e "${RED}❌ Node.js v18 or higher is required. You have v${NODE_MAJOR}.${NC}"
    echo "   Please upgrade Node.js: brew upgrade node"
    exit 1
fi

# Step 3: Install dependencies
echo ""
echo -e "${YELLOW}[2/6]${NC} Installing dependencies..."
npm install --silent
echo -e "       ${GREEN}✓ Dependencies installed${NC}"

# Step 4: Install Playwright browsers
echo ""
echo -e "${YELLOW}[3/6]${NC} Installing Playwright browsers (for web scraping)..."
npx playwright install chromium --with-deps 2>/dev/null || npx playwright install chromium
echo -e "       ${GREEN}✓ Playwright Chromium installed${NC}"

# Step 5: Setup database
echo ""
echo -e "${YELLOW}[4/6]${NC} Setting up SQLite database..."
npx prisma generate --quiet
npx prisma db push --quiet
echo -e "       ${GREEN}✓ Database initialized${NC}"

# Step 6: Build the application
echo ""
echo -e "${YELLOW}[5/6]${NC} Building the application..."
npm run build --silent 2>/dev/null || npm run build
echo -e "       ${GREEN}✓ Application built${NC}"

# Step 7: Create launch script
echo ""
echo -e "${YELLOW}[6/6]${NC} Creating launch script..."
cat > start.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "🚀 Starting GeoRanker..."
echo "   Open http://localhost:3000 in your browser"
echo ""
npm run dev
EOF
chmod +x start.sh
echo -e "       ${GREEN}✓ Launch script created (./start.sh)${NC}"

# Success message
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║   ✅ Installation Complete!                                  ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║   To start GeoRanker:                                        ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║     ./start.sh                                               ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║   Then open: ${BLUE}http://localhost:3000${GREEN}                         ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Ask if user wants to start now
read -p "Would you like to start GeoRanker now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ./start.sh
fi
