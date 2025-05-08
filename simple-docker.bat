@echo off
echo ================================================
echo Simple Docker Build - Fix Prisma OpenSSL Issue
echo ================================================

REM Stop and remove existing container
echo Cleaning up existing Docker resources...
docker stop lms-app 2>nul
docker rm lms-app 2>nul
docker rmi lms-app 2>nul
docker builder prune -f

REM Create dummy env file for build
echo Creating dummy environment for build...
echo OPENAI_API_KEY=sk-dummy > .env.docker
echo NEXT_SKIP_VALIDATION=1 >> .env.docker
echo NEXT_TELEMETRY_DISABLED=1 >> .env.docker
echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dummy >> .env.docker

REM Build a simplified Docker image with no-cache to ensure fresh build
echo Building simple Docker image (this may take a few minutes)...
docker build --no-cache -t lms-app -f Dockerfile.simple .

REM Check if build was successful
if %ERRORLEVEL% EQU 0 (
    echo Build successful! Starting container...
    
    REM Run the container with real env vars
    echo Starting container...
    docker run -d --name lms-app -p 3000:3000 ^
      -e DATABASE_URL="%DATABASE_URL%" ^
      -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="%NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY%" ^
      -e CLERK_SECRET_KEY="%CLERK_SECRET_KEY%" ^
      -e OPEN_AI_KEY="%OPEN_AI_KEY%" ^
      -e OPENAI_API_KEY="%OPEN_AI_KEY%" ^
      -e NEXT_PUBLIC_VOICE_FLOW_KEY="%NEXT_PUBLIC_VOICE_FLOW_KEY%" ^
      -e VOICEFLOW_API_KEY="%VOICEFLOW_API_KEY%" ^
      -e NEXT_PUBLIC_HOST_URL="http://localhost:3000" ^
      -e NEXT_PUBLIC_CLOUD_FRONT_STREAM_URL="%NEXT_PUBLIC_CLOUD_FRONT_STREAM_URL%" ^
      -e CLOUDINARY_CLOUD_NAME="%CLOUDINARY_CLOUD_NAME%" ^
      -e CLOUDINARY_API_KEY="%CLOUDINARY_API_KEY%" ^
      -e CLOUDINARY_API_SECRET="%CLOUDINARY_API_SECRET%" ^
      lms-app
      
    echo Container started at http://localhost:3000
) else (
    echo Build failed. Please check the error messages above.
) 