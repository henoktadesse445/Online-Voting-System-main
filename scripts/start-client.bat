@echo off
REM Install dependencies and start the React client (Windows)
cd /d "%~dp0"
if not exist node_modules (
  echo Installing client dependencies (this may take a few minutes)...
  npm.cmd install || (
    echo npm install failed; press any key to exit & pause > nul & exit /b 1
  )
)
echo Starting React development server (port 3000)...
npm.cmd start || (
  echo Failed to start client; press any key to exit & pause > nul & exit /b 1
)
pause
