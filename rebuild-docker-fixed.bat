@echo off
echo =====================================================
echo Rebuilding Docker Container with Fixes
echo =====================================================

REM Stop and remove any existing containers
echo Stopping any existing containers...
docker stop lms-app 2>nul
docker rm lms-app 2>nul

REM Clean up any existing images
echo Cleaning up images...
docker rmi lms-app:latest -f 2>nul

REM Prepare the environment
echo Setting up build environment...
if not exist docker-build.js (
  echo Error: docker-build.js not found.
  exit /b 1
)

REM Update .env.local file with correct Prisma engine type
echo Creating .env.local with correct settings...
echo DATABASE_URL=postgresql://opal_owner:zBwb6eIZgx0y@ep-flat-base-a5xtcuot.us-east-2.aws.neon.tech/opal?sslmode=require > .env.local
echo NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YnJpZWYtY2FsZi0xOS5jbGVyay5hY2NvdW50cy5kZXYk >> .env.local
echo CLERK_SECRET_KEY=sk_test_3T86uKwpJiKeMv6EBdZi5vkLSzpPdpVktz7fMVY67H >> .env.local
echo OPEN_AI_KEY=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 >> .env.local
echo OPENAI_API_KEY=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 >> .env.local
echo NEXT_SKIP_VALIDATE_ROUTE=1 >> .env.local
echo NEXT_SKIP_DATA_COLLECTION=1 >> .env.local
echo NEXT_SKIP_API_VALIDATION=1 >> .env.local
echo NEXT_DISABLE_MIDDLEWARE=1 >> .env.local
echo PRISMA_CLIENT_ENGINE_TYPE=library >> .env.local
echo CLERK_ALLOW_CLOCK_SKEW=true >> .env.local

REM Create or update simplified middleware
echo Creating simplified middleware...
if exist "src\middleware.bak" (
  echo Backup already exists.
) else (
  copy "src\middleware.ts" "src\middleware.bak"
)
echo // Simple Docker-compatible middleware - minimal version > "src\middleware.ts"
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

REM Run docker-build.js preparation
echo Running build preparation...
node docker-build.js

REM Build Docker image with correct settings
echo Building Docker image...
docker build -t lms-app:latest --build-arg NEXT_TELEMETRY_DISABLED=1 --build-arg NEXT_SKIP_DATA_COLLECTION=1 --build-arg NEXT_DISABLE_MIDDLEWARE=1 --build-arg PRISMA_CLIENT_ENGINE_TYPE=library .

REM Check if build was successful
if %ERRORLEVEL% NEQ 0 (
  echo Docker build failed. Please check the error messages above.
  exit /b 1
)

REM Run the container
echo Starting container...
docker run -d --name lms-app -p 3000:3000 ^
  -e DATABASE_URL="postgresql://opal_owner:zBwb6eIZgx0y@ep-flat-base-a5xtcuot.us-east-2.aws.neon.tech/opal?sslmode=require" ^
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_YnJpZWYtY2FsZi0xOS5jbGVyay5hY2NvdW50cy5kZXYk" ^
  -e CLERK_SECRET_KEY="sk_test_3T86uKwpJiKeMv6EBdZi5vkLSzpPdpVktz7fMVY67H" ^
  -e OPEN_AI_KEY="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" ^
  -e OPENAI_API_KEY="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" ^
  -e NEXT_PUBLIC_HOST_URL="http://localhost:3000" ^
  -e NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL="/auth/callback" ^
  -e NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL="/auth/callback" ^
  -e PRISMA_CLIENT_ENGINE_TYPE="library" ^
  -e NEXT_DISABLE_MIDDLEWARE="1" ^
  -e CLERK_ALLOW_CLOCK_SKEW="true" ^
  lms-app:latest

REM Check if the container is running
docker ps -f name=lms-app
echo.
echo Container started. Check logs with: docker logs lms-app
echo.

echo =====================================================
echo Setup Complete! Try accessing your app at:
echo =====================================================
echo http://localhost:3000
echo.
pause 