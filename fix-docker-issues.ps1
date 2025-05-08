# PowerShell script to fix Docker container issues
Write-Host "================================================" -ForegroundColor Green
Write-Host "Fixing Prisma Engine Type and Sharp Issues" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "Error: Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Stop and remove any existing container
Write-Host "Stopping any existing containers..." -ForegroundColor Yellow
docker stop lms-app 2>$null
docker rm lms-app 2>$null

# Create a temporary Dockerfile to fix the issues
Write-Host "Creating temporary fix Dockerfile..." -ForegroundColor Yellow
@"
FROM lms-app:latest
USER root
RUN npm install --no-save sharp
ENV PRISMA_CLIENT_ENGINE_TYPE=library
USER nextjs
"@ | Out-File -FilePath "Dockerfile.fix" -Encoding ascii

# Build the fixed image
Write-Host "Building fixed Docker image..." -ForegroundColor Yellow
docker build -t lms-app:fixed -f Dockerfile.fix .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build fixed image. Is the base image lms-app:latest available?" -ForegroundColor Red
    exit 1
}

# Run the fixed container
Write-Host "Running fixed container..." -ForegroundColor Green
docker run -d --name lms-app -p 3000:3000 `
    -e "DATABASE_URL=postgresql://opal_owner:zBwb6eIZgx0y@ep-flat-base-a5xtcuot.us-east-2.aws.neon.tech/opal?sslmode=require" `
    -e "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YnJpZWYtY2FsZi0xOS5jbGVyay5hY2NvdW50cy5kZXYk" `
    -e "CLERK_SECRET_KEY=sk_test_3T86uKwpJiKeMv6EBdZi5vkLSzpPdpVktz7fMVY67H" `
    -e "OPEN_AI_KEY=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" `
    -e "OPENAI_API_KEY=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" `
    -e "NEXT_PUBLIC_HOST_URL=http://localhost:3000" `
    -e "NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/auth/callback" `
    -e "NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/auth/callback" `
    -e "CLERK_ALLOW_CLOCK_SKEW=true" `
    -e "PRISMA_CLIENT_ENGINE_TYPE=library" `
    -e "NEXT_DISABLE_MIDDLEWARE=1" `
    lms-app:fixed

# Clean up temporary file
Remove-Item -Path "Dockerfile.fix" -Force

# Check if the container is running
$containerRunning = docker ps -q -f "name=lms-app"
if (-not [string]::IsNullOrEmpty($containerRunning)) {
    $containerIP = docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' lms-app
    Write-Host "`nContainer started successfully!" -ForegroundColor Green
    Write-Host "Container IP: $containerIP" -ForegroundColor Cyan
    Write-Host "Web app is available at: http://localhost:3000" -ForegroundColor Cyan

    Write-Host "`nWaiting for a few seconds for the container to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5

    Write-Host "`nContainer logs:" -ForegroundColor Yellow
    docker logs lms-app
} else {
    Write-Host "Failed to start container." -ForegroundColor Red
}

Write-Host "`nCompleted. If you still see issues, check the logs with:" -ForegroundColor Green
Write-Host "docker logs lms-app" -ForegroundColor Cyan 