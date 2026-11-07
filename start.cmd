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

call npm start -- %*
if errorlevel 1 (
  echo.
  echo Noesis stopped with an error.
  pause
)
