@echo off
echo ================================================
echo Fix Prisma OpenSSL Issues in Docker Container
echo ================================================

REM Check if container exists
docker inspect lms-app >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Container lms-app does not exist. Please run simple-docker.bat first.
    exit /b 1
)

echo Fixing Prisma OpenSSL issues in the container...

REM Install OpenSSL in the running container
docker exec lms-app apk add --no-cache openssl openssl-dev postgresql-client

REM Clean Prisma cache and regenerate
docker exec lms-app rm -rf node_modules/.prisma
docker exec lms-app npx prisma generate --schema=./prisma/schema.prisma

echo Prisma OpenSSL fix complete!
echo You may need to restart the container for changes to take effect:
echo docker restart lms-app 