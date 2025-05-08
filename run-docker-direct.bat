@echo off
echo =============================================
echo STARTING LMS APP WITH DIRECT DOCKER COMMANDS
echo =============================================

echo [1/4] Stopping and removing any existing containers...
docker stop lms-app 2>nul
docker rm lms-app 2>nul

echo [2/4] Building the Docker image...
docker build -t lms-app:latest -f Dockerfile.custom .

echo [3/4] Starting the container...
docker run -d --name lms-app -p 3000:3000 ^
  -e DATABASE_URL="postgresql://opal_owner:zBwb6eIZgx0y@ep-flat-base-a5xtcuot.us-east-2.aws.neon.tech/opal?sslmode=require" ^
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_YnJpZWYtY2FsZi0xOS5jbGVyay5hY2NvdW50cy5kZXYk" ^
  -e CLERK_SECRET_KEY="sk_test_3T86uKwpJiKeMv6EBdZi5vkLSzpPdpVktz7fMVY67H" ^
  
  -e WIX_OAUTH_KEY="71497d85-463d-4083-bc76-bb201928b057" ^
  -e OPEN_AI_KEY="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" ^
  -e OPENAI_API_KEY="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" ^
  -e NEXT_PUBLIC_VOICE_FLOW_KEY="6812a8f79f132e62dd6e1996" ^
  -e VOICEFLOW_API_KEY="VF.DM.6812fd72faf415556f8932d0.56YzcQmHTefwPd21" ^
  -e VOICEFLOW_KNOWLEDGE_BASE_API="https://api.voiceflow.com/v1/knowledge-base/docs/upload/table?overwrite=false" ^
  -e NEXT_PUBLIC_HOST_URL="http://localhost:3000" ^
  -e NEXT_PUBLIC_CLOUD_FRONT_STREAM_URL="https://res.cloudinary.com/dehyychku/video/upload/v1746133637/opal" ^
  -e NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL="/auth/callback" ^
  -e NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL="/auth/callback" ^
  -e MAILER_PASSWORD="xtlt labq hcvx kqya" ^
  -e MAILER_EMAIL="ekfrimpong107@gmail.com" ^
  -e CLERK_ALLOW_CLOCK_SKEW="true" ^
  -e NEXT_PUBLIC_EXPRESS_SERVER_URL="http://localhost:5000" ^
  -e EXPRESS_SERVER_URL="http://localhost:5000" ^
  -e CLOUDINARY_CLOUD_NAME="dehyychku" ^
  -e CLOUDINARY_API_KEY="821864697235452" ^
  -e CLOUDINARY_API_SECRET="A5Irj5gktPK2OG67vqKzJ7bckdo" ^
  -e PRISMA_CLIENT_ENGINE_TYPE="library" ^
  -e NEXT_TELEMETRY_DISABLED="1" ^
  -e NODE_ENV="production" ^
  --restart unless-stopped ^
  lms-app:latest

echo [4/4] Displaying container logs...
echo Container should be accessible at http://localhost:3000
echo (Press Ctrl+C to exit logs, container will continue running)
timeout /t 5
docker logs -f lms-app

echo =============================================
echo To stop the container, run: docker stop lms-app
echo To remove the container, run: docker rm lms-app
echo ============================================= 