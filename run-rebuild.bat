@echo off
echo Running full-rebuild script with execution policy bypass...
powershell -ExecutionPolicy Bypass -File "%~dp0full-rebuild.ps1"
pause 