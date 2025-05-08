#!/bin/bash
# Run Docker Compose with explicit project name to avoid naming issues
docker compose -p lms up -d
echo "Docker containers started with project name \"lms\"" 