#!/bin/bash

# Node Version Manager Script
# This script reads the .nvmrc file and exports NODE_VERSION for docker-compose

if [ -f ".nvmrc" ]; then
    export NODE_VERSION=$(cat .nvmrc | tr -d '[:space:]')
    echo "Using Node.js version: $NODE_VERSION"
else
    export NODE_VERSION="24.3"
    echo "No .nvmrc found, using default Node.js version: $NODE_VERSION"
fi

# Execute the passed command with the NODE_VERSION environment variable
exec "$@"
