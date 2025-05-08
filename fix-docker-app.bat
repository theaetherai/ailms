@echo off
echo ===============================================
echo LMS Docker App Fix - Comprehensive Approach
echo ===============================================
echo.

:: Stop and remove existing container
echo [1/7] Cleaning up Docker resources...
docker stop lms-app 2>nul
docker rm lms-app 2>nul
docker rmi lms-app:latest 2>nul
echo Done.

:: Create middleware override to avoid Prisma edge runtime issues
echo [2/7] Creating simplified middleware for Docker...
if exist "src\middleware.bak" (
  echo Backup already exists.
) else (
  copy "src\middleware.ts" "src\middleware.bak"
)

:: Create a simple middleware file that doesn't use Prisma
echo // Simple Docker-compatible middleware without Prisma or Edge Runtime issues > "src\middleware.ts"
echo import { NextResponse } from 'next/server'; >> "src\middleware.ts"
echo import type { NextRequest } from 'next/server'; >> "src\middleware.ts"
echo. >> "src\middleware.ts"
echo export function middleware(request: NextRequest) { >> "src\middleware.ts"
echo   return NextResponse.next(); >> "src\middleware.ts"
echo } >> "src\middleware.ts"
echo. >> "src\middleware.ts"
echo export const config = { >> "src\middleware.ts"
echo   matcher: ['/((?!_next/static^|_next/image^|favicon.ico).*)'], >> "src\middleware.ts"
echo }; >> "src\middleware.ts"
echo Done.

:: Create a temp .env file with essential variables
echo [3/7] Preparing environment variables...
echo DATABASE_URL=postgresql://opal_owner:zBwb6eIZgx0y@ep-flat-base-a5xtcuot.us-east-2.aws.neon.tech/opal?sslmode=require > .env.docker
echo NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YnJpZWYtY2FsZi0xOS5jbGVyay5hY2NvdW50cy5kZXYk >> .env.docker
echo CLERK_SECRET_KEY=sk_test_3T86uKwpJiKeMv6EBdZi5vkLSzpPdpVktz7fMVY67H >> .env.docker
echo OPEN_AI_KEY=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 >> .env.docker
echo OPENAI_API_KEY=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 >> .env.docker
echo NEXT_DISABLE_MIDDLEWARE=1 >> .env.docker
echo PRISMA_CLIENT_ENGINE_TYPE=library >> .env.docker
echo Done.

:: Build the Docker container
echo [4/7] Building Docker container...
docker build -t lms-app:latest --build-arg NEXT_DISABLE_MIDDLEWARE=1 --build-arg PRISMA_CLIENT_ENGINE_TYPE=library --no-cache .
if %ERRORLEVEL% NEQ 0 (
  echo Docker build failed. Exiting.
  exit /b 1
)
echo Done.

:: Run Docker container with environment variables
echo [5/7] Starting Docker container...
docker run -d --name lms-app -p 3000:3000 ^
  --env-file .env.docker ^
  -e NEXT_DISABLE_MIDDLEWARE=1 ^
  -e PRISMA_CLIENT_ENGINE_TYPE=library ^
  -e NEXT_PUBLIC_HOST_URL=http://localhost:3000 ^
  -e NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/auth/callback ^
  -e NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/auth/callback ^
  -e CLERK_ALLOW_CLOCK_SKEW=true ^
  lms-app:latest

:: Install sharp in the container
echo [6/7] Installing sharp in the container...
docker exec lms-app npm install --no-save sharp

:: Verify container is running
echo [7/7] Verifying container status...
docker ps -f name=lms-app
echo.

:: Get container IP and add to hosts
echo [8/7] Getting container network information...
for /f "tokens=*" %%a in ('docker inspect -f "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" lms-app') do (
  set CONTAINER_IP=%%a
)
echo Container IP: %CONTAINER_IP%

echo.
echo ===============================================
echo Setup Complete! Try accessing your app at:
echo ===============================================
echo 1. http://localhost:3000
echo 2. http://%CONTAINER_IP%:3000
echo.
echo If you still can't access the app:
echo - Check Docker logs: docker logs lms-app
echo - Try running: powershell -ExecutionPolicy Bypass -File docker-network-fix.ps1
echo - Or run as admin: troubleshoot.bat
echo ===============================================
echo.
pause 