@echo off
echo =====================================================
echo Docker Build Script with Direct Environment Variables
echo =====================================================

REM Stop and remove any existing containers
echo Stopping any existing containers...
docker compose -p lms down

REM Clean up any existing images
echo Cleaning up images...
docker rmi lms-app:latest -f 2>nul

REM Prepare the environment
echo Setting up build environment...
node docker-build.js

REM Build Docker image directly to avoid docker-compose errors
echo Building Docker image with workarounds...
docker build -t lms-app:latest --build-arg NEXT_TELEMETRY_DISABLED=1 --build-arg NEXT_SKIP_DATA_COLLECTION=1 --build-arg NEXT_DISABLE_MIDDLEWARE=1 --build-arg PRISMA_CLIENT_ENGINE_TYPE=library .

REM Check if build was successful
if %ERRORLEVEL% EQU 0 (
    echo Build successful! Starting container...
    
    REM Start the container with directly specified environment variables
    docker run -d --name lms-app -p 3000:3000 ^
    -e DATABASE_URL="postgresql://opal_owner:zBwb6eIZgx0y@ep-flat-base-a5xtcuot.us-east-2.aws.neon.tech/opal?sslmode=require" ^
    -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_YnJpZWYtY2FsZi0xOS5jbGVyay5hY2NvdW50cy5kZXYk" ^
    -e CLERK_SECRET_KEY="sk_test_3T86uKwpJiKeMv6EBdZi5vkLSzpPdpVktz7fMVY67H" ^
    -e WIX_OAUTH_KEY="WX21.fdbbbcc5-7512-4e97-8e7a-c45b38f19a65_ef8f9a2c-70db-4bd4-8ce2-fbd74d2874d9" ^
    -e NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL="/auth/callback" ^
    -e NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL="/auth/callback" ^
    -e OPEN_AI_KEY="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" ^
    -e OPENAI_API_KEY="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" ^
    -e NEXT_PUBLIC_VOICE_FLOW_KEY="VF.DM.65157c21506ac700075c9aec.dShxnJZzptRWGKrp" ^
    -e VOICEFLOW_API_KEY="VF.DM.65157c21506ac700075c9aec.dShxnJZzptRWGKrp" ^
    -e VOICEFLOW_KNOWLEDGE_BASE_API="VF.KBM.651581ec4e26c40007d5c74b.wPWxTFhQFJFq3Ywv" ^
    -e NEXT_PUBLIC_HOST_URL="http://localhost:3000" ^
    -e NEXT_PUBLIC_CLOUD_FRONT_STREAM_URL="https://d2muiep6jcv3p2.cloudfront.net" ^
    -e MAILER_PASSWORD="Thisisthepassword3" ^
    -e MAILER_EMAIL="customercare@mail.aetherai.app" ^
    -e CLOUD_WAYS_POST="db1eadf3a23a48b28834b11ca88b46ec" ^
    -e CLERK_ALLOW_CLOCK_SKEW="true" ^
    -e NEXT_PUBLIC_EXPRESS_SERVER_URL="http://localhost:5000" ^
    -e EXPRESS_SERVER_URL="http://localhost:5000" ^
    -e CLOUDINARY_CLOUD_NAME="dtsypgtx6" ^
    -e CLOUDINARY_API_KEY="566695274985369" ^
    -e CLOUDINARY_API_SECRET="S_Pg3q0oYP1a-g-L-JiRYGh4o10" ^
    -e NEXT_DISABLE_MIDDLEWARE=1 ^
    -e PRISMA_CLIENT_ENGINE_TYPE=library ^
    lms-app:latest
    
    echo Container started and available at http://localhost:3000
) else (
    echo Build failed. Please check the error messages above.
) 