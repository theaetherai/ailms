# PowerShell script to troubleshoot Docker network connectivity issues
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Docker Network Connectivity Troubleshooter" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if Docker is running
Write-Host "`nVerifying Docker is running..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info
    Write-Host "✓ Docker is running." -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if the container exists and is running
Write-Host "`nChecking container status..." -ForegroundColor Yellow
$containerRunning = docker ps -q -f "name=lms-app"
if (-not [string]::IsNullOrEmpty($containerRunning)) {
    Write-Host "✓ Container is running." -ForegroundColor Green
    $containerIP = docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' lms-app
    Write-Host "  Container IP: $containerIP" -ForegroundColor Green
    
    # Check port mapping
    $portMapping = docker port lms-app
    Write-Host "  Port mapping: $portMapping" -ForegroundColor Green
} else {
    Write-Host "✗ Container is not running." -ForegroundColor Red
    $containerExists = docker ps -a -q -f "name=lms-app"
    if (-not [string]::IsNullOrEmpty($containerExists)) {
        Write-Host "  Container exists but is not running. Starting it..." -ForegroundColor Yellow
        docker start lms-app
        Start-Sleep -Seconds 5
    } else {
        Write-Host "  Container does not exist. Please run the setup script first." -ForegroundColor Red
        exit 1
    }
}

# Test network connectivity
Write-Host "`nTesting network connectivity..." -ForegroundColor Yellow
try {
    $testConnection = Test-NetConnection -ComputerName localhost -Port 3000
    if ($testConnection.TcpTestSucceeded) {
        Write-Host "✓ Port 3000 is open on localhost." -ForegroundColor Green
    } else {
        Write-Host "✗ Port 3000 is not accessible on localhost." -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Could not test network connectivity: $_" -ForegroundColor Red
}

# Try to connect to the container directly
Write-Host "`nAttempting to connect to container directly..." -ForegroundColor Yellow
try {
    $testConnection = Test-NetConnection -ComputerName $containerIP -Port 3000
    if ($testConnection.TcpTestSucceeded) {
        Write-Host "✓ Port 3000 is open on container IP." -ForegroundColor Green
    } else {
        Write-Host "✗ Port 3000 is not accessible on container IP." -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Could not test container connectivity: $_" -ForegroundColor Red
}

# Update hosts file
Write-Host "`nAttempting to add container to hosts file..." -ForegroundColor Yellow
try {
    $hostPath = "$env:windir\System32\drivers\etc\hosts"
    $hostContent = Get-Content -Path $hostPath -Raw
    if ($hostContent -notlike "*$containerIP*lms-app-container*") {
        Add-Content -Path $hostPath -Value "`n$containerIP lms-app-container" -ErrorAction Stop
        Write-Host "✓ Added '$containerIP lms-app-container' to hosts file." -ForegroundColor Green
    } else {
        Write-Host "✓ Host entry already exists." -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Could not update hosts file (requires admin rights): $_" -ForegroundColor Red
    Write-Host "  Please add the following line to your hosts file manually:" -ForegroundColor Yellow
    Write-Host "  $containerIP lms-app-container" -ForegroundColor Yellow
}

# Fix network if needed
Write-Host "`nTrying to fix connectivity issues..." -ForegroundColor Yellow
Write-Host "Restarting the container with port mapping..." -ForegroundColor Yellow
docker restart lms-app
Start-Sleep -Seconds 5

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "Please try accessing your application at:" -ForegroundColor Cyan
Write-Host "http://localhost:3000" -ForegroundColor White
Write-Host "http://$containerIP`:3000" -ForegroundColor White
Write-Host "http://lms-app-container:3000 (if hosts file was updated)" -ForegroundColor White
Write-Host "================================================" -ForegroundColor Cyan

# Display Docker logs
Write-Host "`nContainer logs (last 10 lines):" -ForegroundColor Yellow
docker logs --tail 10 lms-app 