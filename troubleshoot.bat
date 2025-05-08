@echo off
echo ================================================
echo Docker Network Troubleshooter (Admin Required)
echo ================================================
echo.
echo This script needs to be run as Administrator to fix network issues.
echo A PowerShell window will open with elevated privileges.
echo.
pause

:: Run PowerShell as admin
powershell -Command "Start-Process powershell -ArgumentList '-ExecutionPolicy', 'Bypass', '-File', '%~dp0docker-network-fix.ps1' -Verb RunAs"

echo.
echo After the network fix completes, try accessing:
echo.
echo 1. http://localhost:3000
echo 2. The container IP shown in the PowerShell window
echo.
pause 