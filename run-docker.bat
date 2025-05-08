@echo off
REM Stop and remove any existing containers
echo Stopping and removing existing containers...
docker compose -p lms down

REM Clean up any existing images
echo Cleaning up images...
docker rmi lms-app:latest -f 2>nul

REM Rebuild and start with explicit project name to avoid naming issues
echo Building and starting containers...
docker compose -p lms build --no-cache --progress=plain

REM If build successful, start the containers
if %ERRORLEVEL% EQU 0 (
    echo Build successful! Starting containers...
    docker compose -p lms up -d
    echo Docker containers started with project name "lms"
) else (
    echo Build failed. Please check the error messages above.
) 