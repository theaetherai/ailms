# PowerShell script for running Docker on Windows
Write-Host "================================================" -ForegroundColor Green
Write-Host "Windows-Specific Docker Setup for LMS" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Stop and remove existing container
Write-Host "Cleaning up existing resources..." -ForegroundColor Yellow
docker stop lms-app 2>$null
docker rm lms-app 2>$null

# Check if the image exists
$imageExists = docker images lms-app:latest --format "{{.Repository}}:{{.Tag}}" | Select-String -Pattern "lms-app:latest" -Quiet
if (-not $imageExists) {
    Write-Host "Error: The lms-app:latest image does not exist." -ForegroundColor Red
    Write-Host "Please run build-docker.bat first to create the image." -ForegroundColor Red
    exit 1
}

# Create environment variable parameters with direct values
$envParams = @(
    "-e", "DATABASE_URL=postgresql://opal_owner:zBwb6eIZgx0y@ep-flat-base-a5xtcuot.us-east-2.aws.neon.tech/opal?sslmode=require",
    "-e", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YnJpZWYtY2FsZi0xOS5jbGVyay5hY2NvdW50cy5kZXYk",
    "-e", "CLERK_SECRET_KEY=sk_test_3T86uKwpJiKeMv6EBdZi5vkLSzpPdpVktz7fMVY67H",
     "-e", "OPEN_AI_KEY=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",
    "-e", "OPENAI_API_KEY=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",
    "-e", "NEXT_PUBLIC_HOST_URL=http://localhost:3000",
    "-e", "NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/auth/callback",
    "-e", "NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/auth/callback",
    "-e", "NEXT_DISABLE_MIDDLEWARE=1",
    "-e", "PRISMA_CLIENT_ENGINE_TYPE=library",
    "-e", "CLERK_ALLOW_CLOCK_SKEW=true"
)

# Run container with explicit network settings for Windows
Write-Host "Starting container with Windows-optimized network settings..." -ForegroundColor Green

# Use direct Docker command to ensure proper execution
$command = "docker run -d --name lms-app --restart always -p 3000:3000 "
foreach ($param in $envParams) {
    $command += "$param "
}
$command += "lms-app:latest"

Write-Host "Executing: $command" -ForegroundColor Cyan
Invoke-Expression $command

# Verify the container is running
$containerRunning = docker ps -q -f "name=lms-app"
if (-not [string]::IsNullOrEmpty($containerRunning)) {
    $containerIP = docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' lms-app
    Write-Host "`nContainer started successfully!" -ForegroundColor Green
    Write-Host "Container IP: $containerIP" -ForegroundColor Cyan
    Write-Host "Web app is available at: http://localhost:3000" -ForegroundColor Cyan
    
    # Add host entry to help with connectivity
    Write-Host "`nAttempting to add host entry to hosts file..." -ForegroundColor Yellow
    try {
        Add-Content -Path $env:windir\System32\drivers\etc\hosts -Value "`n$containerIP lms-app-container" -ErrorAction Stop
        Write-Host "Added '$containerIP lms-app-container' to hosts file." -ForegroundColor Green
        Write-Host "You can also try accessing: http://lms-app-container:3000" -ForegroundColor Cyan
    } catch {
        Write-Host "Could not update hosts file (requires admin rights): $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "Failed to start container." -ForegroundColor Red
    Write-Host "Docker logs:" -ForegroundColor Red
    docker logs lms-app
} 