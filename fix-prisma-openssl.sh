#!/bin/bash
echo "================================================"
echo "Fix Prisma OpenSSL Issues in Docker Container"
echo "================================================"

# Check if container exists
if ! docker inspect lms-app >/dev/null 2>&1; then
    echo "Container lms-app does not exist. Please run simple-docker.bat first."
    exit 1
fi

echo "Fixing Prisma OpenSSL issues in the container..."

# Install OpenSSL in the running container
docker exec lms-app apk add --no-cache openssl openssl-dev postgresql-client

# Clean Prisma cache and regenerate
docker exec lms-app rm -rf node_modules/.prisma
docker exec lms-app npx prisma generate --schema=./prisma/schema.prisma

echo "Prisma OpenSSL fix complete!"
echo "You may need to restart the container for changes to take effect:"
echo "docker restart lms-app" 