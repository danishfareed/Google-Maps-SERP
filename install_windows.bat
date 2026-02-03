@echo off
setlocal enabledelayedexpansion

REM #############################################
REM   GeoRanker - One-Click Windows Installer   
REM #############################################

title GeoRanker Installer

echo.
echo ================================================================
echo.
echo     [32m  GeoRanker - Local SEO Intelligence Grid[0m
echo.
echo     One-Click Windows Installer
echo.
echo ================================================================
echo.

REM Check if running from correct directory
if not exist "package.json" (
    echo [31mError: Please run this script from the GeoRanker project directory.[0m
    pause
    exit /b 1
)

REM Step 1: Check for Node.js
echo [33m[1/6][0m Checking for Node.js...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [31mNode.js is not installed.[0m
    echo.
    echo Please install Node.js first:
    echo   Download from https://nodejs.org/
    echo.
    echo After installing, restart this installer.
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('node -v') do set NODE_VERSION=%%i
echo       [32mNode.js found: %NODE_VERSION%[0m

REM Step 2: Check Node.js version
for /f "tokens=1 delims=." %%a in ('node -v') do set NODE_MAJOR=%%a
set NODE_MAJOR=%NODE_MAJOR:v=%
if %NODE_MAJOR% LSS 18 (
    echo [31mNode.js v18 or higher is required. You have v%NODE_MAJOR%.[0m
    echo Please upgrade Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Step 3: Install dependencies
echo.
echo [33m[2/6][0m Installing dependencies...
call npm install --silent
if %ERRORLEVEL% neq 0 (
    echo [31mFailed to install dependencies.[0m
    pause
    exit /b 1
)
echo       [32mDependencies installed[0m

REM Step 4: Install Playwright browsers
echo.
echo [33m[3/6][0m Installing Playwright browsers (for web scraping)...
call npx playwright install chromium
echo       [32mPlaywright Chromium installed[0m

REM Step 5: Setup database
echo.
echo [33m[4/6][0m Setting up SQLite database...
call npx prisma generate
call npx prisma db push
echo       [32mDatabase initialized[0m

REM Step 6: Build the application
echo.
echo [33m[5/6][0m Building the application...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [31mFailed to build the application.[0m
    pause
    exit /b 1
)
echo       [32mApplication built[0m

REM Step 7: Create launch script
echo.
echo [33m[6/6][0m Creating launch script...
(
echo @echo off
echo cd /d "%%~dp0"
echo echo Starting GeoRanker...
echo echo Open http://localhost:3000 in your browser
echo echo.
echo npm run dev
echo pause
) > start.bat
echo       [32mLaunch script created (start.bat)[0m

REM Success message
echo.
echo ================================================================
echo.
echo   [32mInstallation Complete![0m
echo.
echo   To start GeoRanker:
echo.
echo     Double-click start.bat
echo.
echo   Then open: [36mhttp://localhost:3000[0m
echo.
echo ================================================================
echo.

set /p STARTAPP="Would you like to start GeoRanker now? (Y/N): "
if /i "%STARTAPP%"=="Y" (
    call start.bat
)

pause
