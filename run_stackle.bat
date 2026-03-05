@echo off
cd /d "%~dp0"

echo Starting Stackle...

start "Stackle Server" cmd /c "npm run dev --workspace=server"
start "Stackle Client" cmd /c "npm run dev --workspace=client"

echo Waiting for servers to start...
timeout /t 5 /nobreak >nul

start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" "http://localhost:3000"
