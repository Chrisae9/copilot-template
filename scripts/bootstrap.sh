#!/bin/sh
# scripts/bootstrap.sh
# Cleans and installs node_modules for root, client, and server in a monorepo

set -e

# Clean all node_modules and lock files (ignore errors if not present)
rm -rf node_modules package-lock.json || true
if [ -d client ]; then
	rm -rf client/node_modules client/package-lock.json || true
fi
if [ -d server ]; then
	rm -rf server/node_modules server/package-lock.json || true
fi

# Always install dependencies and generate lock files in root, client, and server
npm install
if [ -d client ]; then
	cd client && npm install && cd ..
fi
if [ -d server ]; then
	cd server && npm install && cd ..
fi
