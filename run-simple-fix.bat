@echo off
echo Running simple fix script for Docker container...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0simple-fix.ps1"
if %ERRORLEVEL% neq 0 (
  echo Failed to run script. Error code: %ERRORLEVEL%
  echo Make sure Docker is running
)
pause 