# =============================================================================
# Multi-stage Dockerfile for Catan-Inspired Game (Full-Stack MERN)
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Client Build (React/Vite)
# -----------------------------------------------------------------------------
FROM node:24.3.0-alpine AS client-builder

WORKDIR /app

# Copy root workspace files
COPY package.json ./
COPY package-lock.json ./

# Copy client package files
COPY client/package.json ./client/

# Install all dependencies using workspaces
RUN npm ci

# Copy client source code
COPY client/ ./client/

# Build client for production
WORKDIR /app/client
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Server Build (Node.js/Express)
# -----------------------------------------------------------------------------
FROM node:24.3.0-alpine AS server-builder

WORKDIR /app

# Copy root workspace files
COPY package.json ./
COPY package-lock.json ./

# Copy server package files
COPY server/package.json ./server/

# Install all dependencies using workspaces
RUN npm ci

# Copy server source code
COPY server/ ./server/

# Build server (TypeScript compilation)
WORKDIR /app/server
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Production Runtime (Full-Stack)
# -----------------------------------------------------------------------------
FROM node:24.3.0-alpine AS production

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app



# Copy root workspace files
COPY package.json ./
COPY package-lock.json ./

# Copy server package files
COPY server/package.json ./server/

# Install production server dependencies only using workspaces
RUN npm ci --omit=dev
RUN npm cache clean --force

# Copy built server from server-builder
COPY --from=server-builder --chown=nodejs:nodejs /app/server/dist ./dist
COPY --from=server-builder --chown=nodejs:nodejs /app/server/package.json ./

# Copy built client from client-builder to serve as static files
COPY --from=client-builder --chown=nodejs:nodejs /app/client/dist ./public

# Create necessary directories
RUN mkdir -p /app/logs && chown nodejs:nodejs /app/logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start the server (it will serve both API and static client files)
CMD ["node", "dist/index.js"]

# -----------------------------------------------------------------------------
# Stage 4: Development Runtime (for local development)
# -----------------------------------------------------------------------------
FROM node:24.3.0-alpine AS development

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Switch to app user
USER nodejs

# This stage is used for development mounting
CMD ["npm", "run", "dev"]

# -----------------------------------------------------------------------------
# Stage 5: Client-Only Production (for CDN deployment)
# -----------------------------------------------------------------------------
FROM nginx:alpine AS client-only

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built client application
COPY --from=client-builder /app/client/dist /usr/share/nginx/html

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
