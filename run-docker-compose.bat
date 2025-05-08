@echo off
echo =============================================
echo STARTING LMS APP WITH DOCKER COMPOSE
echo =============================================

echo [1/3] Stopping any existing containers...
docker-compose down 2>nul

echo [2/3] Building and starting containers...
docker-compose up -d --build

echo [3/3] Displaying container logs...
echo Container should be accessible at http://localhost:3000
echo (Press Ctrl+C to exit logs, container will continue running)
timeout /t 5
docker-compose logs -f

echo =============================================
echo To stop the container, run: docker-compose down
echo ============================================= 