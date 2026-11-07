@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Noesis needs Node.js 20.19 or newer.
  echo Why: the "node" command was not found.
  echo Fix: install Node.js from https://nodejs.org/ and double-click start.cmd again.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo Noesis needs npm, which normally ships with Node.js.
  echo Why: the "npm" command was not found.
  echo Fix: reinstall Node.js from https://nodejs.org/ and double-click start.cmd again.
  pause
  exit /b 1
)

call npm start -- %*
set "code=%ERRORLEVEL%"
if not "%code%"=="0" (
  echo.
  echo Noesis stopped. Press any key to close this window.
  pause >nul
)
