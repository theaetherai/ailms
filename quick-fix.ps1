# PowerShell script to fix Docker issues
Write-Host "================================================" -ForegroundColor Green
Write-Host "Quick Fix for Prisma and Sharp Issues" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Create Docker fix file
Write-Host "Creating fix Dockerfile..." -ForegroundColor Yellow
@"
FROM lms-app:latest
USER root
RUN npm install --no-save sharp
ENV PRISMA_CLIENT_ENGINE_TYPE=library
"@ | Out-File -FilePath "Dockerfile.fix" -Encoding ascii

# Build image
Write-Host "Building fixed image..." -ForegroundColor Yellow 
docker build -t lms-app:fixed -f Dockerfile.fix .

# Run container
Write-Host "Running fixed container..." -ForegroundColor Green
docker run -d --name lms-app-fixed -p 3000:3000 `
  -e PRISMA_CLIENT_ENGINE_TYPE=library `
  -e DATABASE_URL="postgresql://opal_owner:zBwb6eIZgx0y@ep-flat-base-a5xtcuot.us-east-2.aws.neon.tech/opal?sslmode=require" `
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_YnJpZWYtY2FsZi0xOS5jbGVyay5hY2NvdW50cy5kZXYk" `
  -e CLERK_SECRET_KEY="sk_test_3T86uKwpJiKeMv6EBdZi5vkLSzpPdpVktz7fMVY67H" `
  lms-app:fixed

Write-Host "Container started at http://localhost:3000" -ForegroundColor Cyan
Write-Host "Check logs: docker logs lms-app-fixed" -ForegroundColor Cyan 