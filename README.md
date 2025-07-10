# Catan-Inspired Multiplayer Game

A simplified, modern web-based implementation of a Catan-inspired strategy board game supporting real-time multiplayer gameplay.

## Quick Start

This project is designed to be simple and work right out of the box with three clear environments:

### 🛠️ Development (Local)
```bash
# Use VS Code: Tasks: Run Task → "Dev: Start Full Stack"
# Or manually:
docker compose --profile dev up mongodb client-dev server-dev
```
- **Client**: http://localhost:5173 (React/Vite with hot reload)
- **Server**: http://localhost:3001 (Express/Socket.IO API)
- **Database**: MongoDB running locally

### 🧪 Staging (Private Network - test.ts.chis.dev) 
```bash
# Set JWT_SECRET_STAGING in .env file first
# Use VS Code: Tasks: Run Task → "Staging: Deploy"
# Or manually:
docker compose --profile staging up -d --build mongodb app-staging
```
- Accessible via Tailscale private network at `test.ts.chis.dev`
- Connected to your private network through Traefik

### 🚀 Production (Public Network - catan.chis.dev)
```bash
# Set JWT_SECRET_PROD in .env file first  
# Use VS Code: Tasks: Run Task → "Prod: Deploy"
# Or manually:
docker compose --profile prod up -d --build mongodb app-prod
```
- Publicly accessible at `catan.chis.dev`
- Connected to your public network through Traefik

## Project Structure

```
├── client/                 # React frontend (TypeScript + Vite + Tailwind)
│   ├── src/components/     # Game UI components
│   ├── src/hooks/          # Custom React hooks for game state
│   └── src/services/       # Socket.IO integration
├── server/                 # Node.js backend (Express + Socket.IO + MongoDB)
│   ├── src/game/           # Core game logic
│   ├── src/socket/         # Real-time communication
│   └── src/models/         # Database schemas
├── docker-compose.yaml     # Simple container configuration
└── .vscode/tasks.json      # VS Code tasks for easy development
```

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Socket.IO + MongoDB  
- **Development**: Docker + VS Code tasks
- **Deployment**: Docker + Traefik (for staging/prod domains)

## Development Workflow

### Available VS Code Tasks
Open Command Palette (`Ctrl+Shift+P`) → "Tasks: Run Task":

- **Dev: Start Full Stack** - Start local development (MongoDB + Client + Server)
- **Dev: Stop All** - Stop all development containers
- **Test: Run All Tests** - Run client and server tests
- **Staging: Deploy** - Deploy to test.ts.chis.dev
- **Prod: Deploy** - Deploy to catan.chis.dev
- **Utils: View Containers** - See running Docker containers

### Simple Commands
```bash
# Development
docker compose --profile dev up -d          # Start development stack
docker compose --profile dev down           # Stop development stack

# Testing  
docker compose --profile test up            # Run tests

# Staging (Private Network)
docker compose --profile staging up -d --build app-staging

# Production (Public Network) 
docker compose --profile prod up -d --build app-prod
```

## Environment Setup

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Set secrets for staging/production:**
   ```bash
   # In .env file:
   JWT_SECRET_STAGING=your-staging-secret
   JWT_SECRET_PROD=your-production-secret
   ```

3. **Development works without any setup** - all defaults are configured

## Network Configuration

- **Local Development**: Uses Docker bridge network
- **Staging**: Uses `private` external network (Tailscale + Traefik)
- **Production**: Uses `public` external network (Traefik)

Your Traefik setup should have these external networks configured to route:
- `test.ts.chis.dev` → staging container (private network)
- `catan.chis.dev` → production container (public network)

## Game Features (Planned)

- 🎲 Classic Catan mechanics (resource production, building, trading)
- 👥 3-6 player support with real-time multiplayer
- 🔄 Socket.IO for synchronized game state
- 🛡️ Server-authoritative game logic
- 📱 Responsive design for mobile/desktop

---

**This is a simplified baseline setup. Focus is on getting a working full-stack development environment with clear staging and production deployment paths.**
