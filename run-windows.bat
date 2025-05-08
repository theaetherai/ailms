@echo off
echo ================================================
echo Windows Docker Setup Helper with Direct Environment Variables
echo ================================================

:: Set environment variables directly
set DATABASE_URL=postgresql://opal_owner:zBwb6eIZgx0y@ep-flat-base-a5xtcuot.us-east-2.aws.neon.tech/opal?sslmode=require
set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YnJpZWYtY2FsZi0xOS5jbGVyay5hY2NvdW50cy5kZXYk
set CLERK_SECRET_KEY=sk_test_3T86uKwpJiKeMv6EBdZi5vkLSzpPdpVktz7fMVY67H
set OPEN_AI_KEY=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
set OPENAI_API_KEY=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
set NEXT_PUBLIC_HOST_URL=http://localhost:3000
set NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/auth/callback
set NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/auth/callback
set NEXT_DISABLE_MIDDLEWARE=1
set PRISMA_CLIENT_ENGINE_TYPE=library
set CLERK_ALLOW_CLOCK_SKEW=true

:: Run the PowerShell script with execution policy bypass
powershell -ExecutionPolicy Bypass -File run-docker-windows.ps1

echo.
echo If the container is still not accessible:
echo 1. Try visiting http://localhost:3000 in your browser
echo 2. Check Docker Settings to ensure port 3000 is properly forwarded
echo 3. Try running Docker Desktop as Administrator
echo.
pause 