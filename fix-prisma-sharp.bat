@echo off
echo ===============================================
echo LMS Docker - Fix Prisma and Sharp Issues
echo ===============================================

REM Stop any running container
echo Stopping any existing containers...
docker stop lms-app
docker rm lms-app

REM Create .env.local file with correct Prisma engine type
echo Creating .env.local with correct Prisma engine type...
echo DATABASE_URL=postgresql://opal_owner:zBwb6eIZgx0y@ep-flat-base-a5xtcuot.us-east-2.aws.neon.tech/opal?sslmode=require > .env.local
echo PRISMA_CLIENT_ENGINE_TYPE=library >> .env.local
echo NEXT_DISABLE_MIDDLEWARE=1 >> .env.local

REM Create a custom Dockerfile for this fix
echo Creating temporary Dockerfile.fix...
echo FROM lms-app:latest > Dockerfile.fix
echo USER root >> Dockerfile.fix
echo RUN npm install --no-save sharp >> Dockerfile.fix
echo ENV PRISMA_CLIENT_ENGINE_TYPE=library >> Dockerfile.fix
echo USER nextjs >> Dockerfile.fix

REM Build fixed Docker image
echo Building fixed Docker image...
docker build -t lms-app:fixed -f Dockerfile.fix .

REM Run container with fixed image
echo Running container with fixed image...
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
  lms-app:fixed

echo.
echo Container started. Check logs with: docker logs lms-app
echo.

REM Clean up temporary Dockerfile
del Dockerfile.fix

pause 