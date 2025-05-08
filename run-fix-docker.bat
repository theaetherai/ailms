@echo off
echo Running Docker fix script...
powershell -ExecutionPolicy Bypass -File "%~dp0fix-docker-issues.ps1"
pause 