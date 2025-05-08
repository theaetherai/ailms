# Simple fix script for Docker container
# Run this with: powershell.exe -ExecutionPolicy Bypass -File simple-fix.ps1

# Step 1: Create Dockerfile.fix
$dockerFileContent = @"
FROM lms-app:latest
USER root
RUN npm install --no-save sharp
ENV PRISMA_CLIENT_ENGINE_TYPE=library
USER nextjs
"@

# Write the content to a file
$dockerFileContent | Out-File -FilePath "Dockerfile.fix" -Encoding ascii

Write-Host "Created Dockerfile.fix" -ForegroundColor Green

# Step 2: Build the image
Write-Host "Building image..." -ForegroundColor Yellow
docker build -t lms-app:fixed -f Dockerfile.fix .

# Step 3: Stop existing container
Write-Host "Stopping existing container..." -ForegroundColor Yellow
docker stop lms-app 2>$null
docker rm lms-app 2>$null

# Step 4: Run new container
Write-Host "Starting new container..." -ForegroundColor Green
docker run -d --name lms-app -p 3000:3000 `
    -e PRISMA_CLIENT_ENGINE_TYPE=library `
    -e DATABASE_URL="postgresql://opal_owner:zBwb6eIZgx0y@ep-flat-base-a5xtcuot.us-east-2.aws.neon.tech/opal?sslmode=require" `
    -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_YnJpZWYtY2FsZi0xOS5jbGVyay5hY2NvdW50cy5kZXYk" `
    -e CLERK_SECRET_KEY="sk_test_3T86uKwpJiKeMv6EBdZi5vkLSzpPdpVktz7fMVY67H" `
    -e OPENAI_API_KEY="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" `
    -e NEXT_DISABLE_MIDDLEWARE=1 `
    lms-app:fixed

Write-Host "Container should be running at http://localhost:3000" -ForegroundColor Cyan
Write-Host "Check logs with: docker logs lms-app" -ForegroundColor Cyan

# Wait for user to press a key
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 