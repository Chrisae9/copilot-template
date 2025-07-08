# TypeScript React Vite Template

A production-ready template for building modern web applications. Optimized for AI-assisted development with GitHub Copilot and Claude Sonnet.

## What You Get

- **Modern Stack**: React 19, TypeScript 5.8, Vite 7, Tailwind CSS v4
- **Zero Setup**: Docker handles everything - no Node.js installation needed
- **AI-Ready**: Works seamlessly with GitHub Copilot and Claude Sonnet 4
- **Production Ready**: Nginx deployment, security audits, health checks
- **Test-Driven**: Vitest + React Testing Library with comprehensive coverage

## Why This Template?

**For AI Development**: Built-in instructions eliminate common AI coding mistakes and enforce best practices automatically.

**For Developers**: One-click development with VS Code tasks. No configuration, no setup headaches.

## 📋 Prerequisites

- **Docker and Docker Compose** (recommended)
- Node.js 24.3+ (if running locally without Docker)

## 🏁 Quick Start

### Using VS Code Tasks (Recommended)

1. **Clone this template**
2. **Open in VS Code**
3. **Start development:**
   - Press `Ctrl+Shift+P` / `Cmd+Shift+P`
   - Run `Tasks: Run Task` → `Dev: Start Development Server`
   - App available at `http://localhost:5173`

### Using Docker Commands

```bash
# Development server
docker compose --profile dev up app-dev

# Run tests
docker compose --profile test up app-test

# Build for production
docker compose --profile build up app-build

# Stop containers
docker compose down
```

### Local Development (Without Docker)

```bash
npm install
npm run dev
```

## 📁 Project Structure

```
├── src/
│   ├── __tests__/          # Test files
│   ├── test/               # Test utilities and setup
│   ├── components/         # Reusable React components
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions and helpers
│   ├── assets/             # Static assets (images, fonts, etc.)
│   ├── types.ts            # Global TypeScript type definitions
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Application entry point
│   ├── index.css           # Global styles with Tailwind
│   └── vite-env.d.ts       # Vite type definitions
├── .github/
│   └── copilot-instructions.md # AI development guidelines and workflows
├── .vscode/
│   ├── tasks.json          # VS Code tasks for development
│   ├── settings.json       # Project-specific VS Code settings
│   └── extensions.json     # Recommended VS Code extensions
├── public/                 # Static assets served directly
│   ├── site.webmanifest    # PWA manifest configuration
│   ├── robots.txt          # Search engine directives
│   └── vite.svg            # Default favicon (replace with your own)
├── docker-compose.yaml     # Multi-profile Docker setup
├── Dockerfile              # Production build with nginx
├── nginx.conf              # Production server configuration
├── .prettierrc             # Prettier formatting configuration
├── .gitignore              # Git ignore patterns
└── package.json            # Dependencies and scripts
```

## 🛠️ Available VS Code Tasks

**Development:**
- `Dev: Start Development Server` - Hot reload development server
- `Dev: Stop Development Server` - Stop development containers
- `Test: Run All Tests` - Run test suite with verbose output
- `Build: Staging Build` - Create production build

**Deployment:**
- `Staging: Deploy Staging Server` - Deploy with health checks
- `Prod: Deploy Production Server` - Production deployment
- `Deploy: Full Staging Pipeline` - Complete staging workflow
- `Deploy: Full Production Pipeline` - Complete production workflow

**Security:**
- `Security: Audit Dependencies` - Check for vulnerabilities
- `Security: Fix Audit Issues` - Auto-fix security issues
- `Security: Force Fix Audit Issues` - Force fix with breaking changes

**Utilities:**
- `Docker: Clean All Containers` - Stop and remove containers
- `Docker: View Running Containers` - Show container status
- `Health: Check Production Server` - Verify deployment
- `Clean: Remove node_modules and dist` - Clean build artifacts

## 🎨 Customization

### Core Files to Modify
- **`src/App.tsx`** - Main application logic and routing
- **`src/index.css`** - Global styles and Tailwind customization
- **`src/types.ts`** - Global TypeScript type definitions
- **`package.json`** - Project name, description, and dependencies
- **`public/site.webmanifest`** - PWA configuration and app metadata
- **`index.html`** - HTML meta tags and favicon references
- **`.github/copilot-instructions.md`** - AI development guidelines and project-specific rules

### Adding New Features
- **Components** - Create in `src/components/` with proper TypeScript interfaces
- **Hooks** - Add custom hooks to `src/hooks/` for reusable state logic
- **Utils** - Add utility functions to `src/utils/` for common operations
- **Routes** - Add to `src/App.tsx` with proper error boundaries
- **Tests** - Add to `src/__tests__/` with comprehensive coverage
- **Styles** - Use Tailwind classes or add custom CSS to `index.css`
- **Assets** - Place in `src/assets/` and use `@assets` alias for imports

## 🧪 Testing

- **Vitest** for fast test execution
- **React Testing Library** for component testing
- **jsdom** environment for DOM testing
- Test utilities in `src/test/utils.tsx`
- Coverage reports with v8

## 🐳 Docker Profiles

- **`dev`** - Development with hot reload
- **`build`** - Production build to `dist/`
- **`test`** - Test runner with coverage
- **`staging`** - Staging deployment with health checks
- **`prod`** - Production deployment with nginx

## 🔧 Configuration

All configuration files are included and optimized:

- **TypeScript** - Strict mode with proper module resolution
- **Vite** - Optimized build with path aliases (`@/` → `src/`)
- **Tailwind CSS** - V4 with Vite plugin integration
- **ESLint** - React and TypeScript rules
- **Vitest** - jsdom environment with coverage

## 🚀 Production Deployment

The template includes a production-ready setup:

1. **Multi-stage Dockerfile** with nginx
2. **Optimized nginx configuration** with compression and caching
3. **Health check endpoints** for container monitoring
4. **Security headers** and best practices
5. **Docker Compose profiles** for different environments

Deploy to production:
```bash
# Build and deploy with health check
./build-and-run.sh prod --health-check
```

## 📈 Development Workflow

1. **Start with tests** - Write tests first (TDD approach)
2. **Use VS Code tasks** - Streamlined development commands
3. **Follow AI guidelines** - Check `.github/copilot-instructions.md` for best practices
4. **Leverage AI tools** - Use Claude Sonnet 4 and GitHub Copilot for optimal development
5. **Run security audits** - Regular dependency checks
6. **Deploy to staging** - Test before production
7. **Monitor health** - Use built-in health checks

---

**This template provides everything needed for modern React development with TypeScript, Docker, AI assistance, and production deployment. Perfect for AI-powered development workflows! 🤖🎉**
