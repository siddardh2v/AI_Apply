@echo off
setlocal enabledelayedexpansion
title Jobward - Launcher
cd /d "%~dp0"

echo ============================================
echo            JOBWARD  -  Launcher
echo ============================================
echo.

REM ---- 1. Check that Node.js is installed --------------------------------
where node >nul 2>nul
if errorlevel 1 (
  echo [ X ]  Node.js is not installed on this computer.
  echo.
  echo        AI Apply needs Node.js to run.
  echo        I'll open the download page now.
  echo        - Download the button that says "LTS"
  echo        - Install it using all the default options
  echo        - Then double-click this file again.
  echo.
  start "" https://nodejs.org/en/download
  echo.
  pause
  exit /b
)

for /f "delims=" %%v in ('node --version') do set NODEV=%%v
echo [ OK ]  Node.js found (!NODEV!)
echo.

REM ---- 2. Install dependencies (first run only) --------------------------
if not exist "node_modules\next" (
  echo Installing app dependencies. This is a ONE-TIME step and can take
  echo a few minutes. Please wait...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo [ X ]  Install failed - see the messages above.
    pause
    exit /b
  )
  echo.
)

REM ---- 3. Create the .env file and ask for the API key ------------------
if not exist ".env" (
  echo.
  echo --------------------------------------------------------------
  echo  AI features need an Anthropic API key.
  echo  Get one here:  https://console.anthropic.com/settings/keys
  echo.
  echo  Tip: copy the key, then RIGHT-CLICK in this window to paste it.
  echo  You can also press Enter to skip for now (AI steps will be off).
  echo --------------------------------------------------------------
  echo.
  set /p APIKEY="Paste your Anthropic API key: "
  (
    echo ANTHROPIC_API_KEY=!APIKEY!
    echo ANTHROPIC_MODEL=claude-sonnet-4-6
    echo DATABASE_URL="file:./dev.db"
  ) > .env
  echo.
  echo [ OK ]  Saved your settings to .env
  echo.
)

REM ---- 4. Set up the local database (first run only) --------------------
if not exist "prisma\dev.db" (
  echo Setting up the local database...
  call npm run db:push
  call npm run db:seed
  echo.
)

REM ---- 5. Start the app and open the browser ----------------------------
echo ============================================
echo  Starting Jobward...
echo.
echo  Your browser will open at  http://localhost:3000
echo  (if the page looks blank for a few seconds, just refresh it)
echo.
echo  KEEP THIS WINDOW OPEN while you use the app.
echo  To stop the app: close this window.
echo ============================================
echo.

start "" /b powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 12; Start-Process 'http://localhost:3000'"
call npm run dev

echo.
echo The app has stopped. You can close this window.
pause
