#!/bin/bash

# Build and Run Script for TypeScript React Vite Template
# This script builds and deploys the app using Docker with self-contained images
# Usage: ./build-and-run.sh [staging|prod] [--health-check]

set -e  # Exit on any error

# Default to production if no argument provided
ENVIRONMENT=${1:-prod}
HEALTH_CHECK=${2:-""}

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "prod" ]]; then
    echo "❌ Invalid environment. Use 'staging' or 'prod'"
    echo "Usage: ./build-and-run.sh [staging|prod] [--health-check]"
    exit 1
fi

# Set environment-specific variables
if [[ "$ENVIRONMENT" == "staging" ]]; then
    SERVICE_NAME="app-staging"
    CONTAINER_NAME="website-template-staging"
    URL="https://test.ts.chis.dev"
    echo "🎯 Deploying to STAGING environment"
else
    SERVICE_NAME="app"
    CONTAINER_NAME="website-template-prod"
    URL="https://test.chis.dev"
    echo "🎯 Deploying to PRODUCTION environment"
fi

echo "🏗️  Starting deployment process..."

# Clean up any existing containers
echo "🛑 Taking down any existing containers..."
docker compose down

# Build and deploy
echo "📦 Building and deploying $ENVIRONMENT server..."
docker compose --profile $ENVIRONMENT up -d --build $SERVICE_NAME

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo "✅ Deployment completed successfully!"
    
    # Wait a moment for the container to be ready
    echo "⏳ Waiting for container to be ready..."
    sleep 3
    
    # Health check if requested
    if [[ "$HEALTH_CHECK" == "--health-check" ]]; then
        echo "🩺 Running health check..."
        if docker exec $CONTAINER_NAME curl -s localhost/health > /dev/null 2>&1; then
            echo "✅ Health check passed!"
        else
            echo "⚠️  Health check failed - container may still be starting"
        fi
    fi
    
    echo "🎉 Application is now running!"
    echo "📍 Access at: $URL"
    echo "� Check status: docker ps | grep $CONTAINER_NAME"
    echo "📊 View logs: docker compose --profile $ENVIRONMENT logs $SERVICE_NAME -f"
    echo "🛑 Stop server: docker compose --profile $ENVIRONMENT down"
    
    if [[ "$HEALTH_CHECK" != "--health-check" ]]; then
        echo "💡 Tip: Add --health-check to verify deployment"
    fi
else
    echo "❌ Deployment failed!"
    echo "� Check logs: docker compose --profile $ENVIRONMENT logs $SERVICE_NAME"
    exit 1
fi
