# TypeScript React Vite Template

A clean, modern template for building web applications with React, TypeScript, and Vite. Docker-first development with comprehensive VS Code integration.

## 🚀 Features

- **React 19** with TypeScript for type-safe development
- **Vite 7** for fast development and optimized builds
- **Tailwind CSS v4** for modern utility-first styling
- **React Router** for client-side routing
- **Vitest** with React Testing Library for testing
- **Docker** setup for containerized development
- **ESLint** for code quality and consistency
- **VS Code Tasks** for streamlined development workflow
- **AI-Optimized Development** with GitHub Copilot instructions and Claude Sonnet integration
- **Security audit tasks** with automated fixes
- **Production-ready** Dockerfile with nginx

## 🤖 AI-Powered Development

This template is optimized for AI-assisted development with comprehensive instructions and tooling:

### GitHub Copilot Integration

The template includes `.github/copilot-instructions.md` with detailed coding standards that:

- **Enforce Test-Driven Development (TDD)** - Write tests first, implement second
- **Maintain Code Quality** - TypeScript strict mode, ESLint rules, and documentation standards
- **Streamline Workflows** - Docker-first development with VS Code task integration
- **Prevent Common Issues** - Specific patterns for React, TypeScript, and Vite development
- **Enable Consistent Architecture** - Hook-based state management and component patterns

### Recommended AI Tools

For optimal development experience, use this template with:

- **Claude Sonnet 4** - Superior code reasoning and architectural decisions
- **GitHub Copilot** - Code completion with project-specific context
- **Playwright MCP Server** (by Microsoft) - Automated browser testing and interaction

### Why These Instructions Matter

The Copilot instructions eliminate common AI hallucinations by:

1. **Defining exact workflows** - TDD cycle, Docker commands, VS Code tasks
2. **Specifying project structure** - Where components, hooks, and tests belong
3. **Enforcing standards** - TypeScript interfaces, documentation, and testing patterns
4. **Providing context** - Understanding of Vite, Tailwind CSS v4, and React 19 patterns
5. **Preventing errors** - Known issues with configurations and dependency management

### Getting Started with AI Development

1. **Read the instructions**: Check `.github/copilot-instructions.md` for complete guidelines
2. **Use VS Code tasks**: AI agents understand the predefined development workflows
3. **Follow TDD**: Write tests first, let AI implement the minimum code to pass
4. **Leverage context**: The template structure provides clear patterns for AI to follow

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
