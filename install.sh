#!/bin/bash

# GMB SERP Tracker - One-Command Installer/Updater
# This script automates the installation and environment setup.

set -e

echo "🚀 GMB SERP Tracker - Initializing Installation..."

# 1. Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install it from https://nodejs.org/"
    exit 1
fi

# 2. Update code if already in a git repo
if [ -d ".git" ]; then
    echo "🔄 Repository detected. Pulling latest updates..."
    git pull origin main || echo "⚠️ Warning: Git pull failed. Continuing with local files."
fi

# 3. Install Dependencies
echo "📦 Installing project dependencies..."
npm install

# 4. Install Playwright Browsers
echo "🌐 Installing browser engines..."
npx playwright install chromium

# 5. Database Setup
echo "🗄️ Synchronizing database schema..."
npx prisma db push
npx prisma generate

# 6. Final Check
echo "✅ Installation Complete!"
echo ""
echo "To start the application, run:"
echo "npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser."
