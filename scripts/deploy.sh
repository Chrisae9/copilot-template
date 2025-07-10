#!/bin/bash
# scripts/deploy.sh
# Build and deploy the app using Docker Compose for staging or production
# Usage: ./scripts/deploy.sh [staging|prod] [--health-check]


set -e

# Ensure required lock files exist
MISSING_LOCKS=()
for LOCKFILE in package-lock.json client/package-lock.json server/package-lock.json; do
    if [ ! -f "$LOCKFILE" ]; then
        MISSING_LOCKS+=("$LOCKFILE")
    fi
done
if [ ${#MISSING_LOCKS[@]} -ne 0 ]; then
    echo "❌ Missing lock files: ${MISSING_LOCKS[*]}"
    echo "Please run the install task (Utils: Install Node Modules (Docker)) before deploying."
    exit 1
fi

ENVIRONMENT=${1:-prod}
HEALTH_CHECK=${2:-""}

if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "prod" ]]; then
    echo "❌ Invalid environment. Use 'staging' or 'prod'"
    echo "Usage: ./scripts/deploy.sh [staging|prod] [--health-check]"
    exit 1
fi

if [[ "$ENVIRONMENT" == "staging" ]]; then
    SERVICE_NAME="app-staging"
    CONTAINER_NAME="website-template-staging"
    URL="https://test.ts.chis.dev"
    echo "🎯 Deploying to STAGING environment"
else
    SERVICE_NAME="app-prod"
    CONTAINER_NAME="website-template-prod"
    URL="https://catan.chis.dev"
    echo "🎯 Deploying to PRODUCTION environment"
fi

echo "🏗️  Starting deployment process..."
docker compose down
echo "📦 Building and deploying $ENVIRONMENT server..."
docker compose --profile $ENVIRONMENT up -d --build mongodb $SERVICE_NAME

if [ $? -eq 0 ]; then
    echo "✅ Deployment completed successfully!"
    sleep 3
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
    echo "📊 View logs: docker compose --profile $ENVIRONMENT logs $SERVICE_NAME -f"
    echo "🛑 Stop server: docker compose --profile $ENVIRONMENT down"
else
    echo "❌ Deployment failed!"
    echo "📊 Check logs: docker compose --profile $ENVIRONMENT logs $SERVICE_NAME"
    exit 1
fi
