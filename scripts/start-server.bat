@echo off
REM Start or install server dependencies and run server (Windows)
cd /d "%~dp0\server"
if not exist node_modules (
  echo Installing server dependencies...
  npm.cmd install || (
    echo npm install failed; press any key to exit & pause > nul & exit /b 1
  )
)
echo Starting backend server (port 5000)...
npm.cmd start || (
  echo Failed to start server; press any key to exit & pause > nul & exit /b 1
)
pause
