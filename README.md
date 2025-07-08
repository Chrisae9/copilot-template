# TypeScript React Vite Template

A production-ready React development template optimized for AI-assisted development workflows. This template eliminates common setup friction and enables immediate development through containerized environments and intelligent tooling integration.

## Overview

This template addresses recurring challenges in modern React development by providing a pre-configured environment that integrates seamlessly with AI development tools, containerized workflows, and production deployment pipelines.

### Key Features

- **Modern Stack**: React 19, TypeScript 5.8, Vite 7.0, Tailwind CSS v4
- **Containerized Development**: Docker-based environment requiring no local Node.js installation
- **AI-Optimized Configuration**: Pre-configured for GitHub Copilot and Claude integration
- **Production-Ready**: Nginx deployment configuration with security audits and health monitoring
- **Comprehensive Testing**: Vitest and React Testing Library with automated coverage
- **Visual Testing**: Playwright integration for browser automation and debugging

## Quick Start

### Prerequisites
- Docker
- VS Code with GitHub Copilot extension
- [Microsoft Playwright](https://github.com/microsoft/playwright) (for visual testing and browser automation)

### Development
1. **Clone and open the template:**
   ```bash
   git clone <repository-url>
   cd website-template
   code .
   ```

2. **Start developing with AI assistance:**
   Interact with GitHub Copilot through the chat interface:
   - "Start the development server" → Launches development environment on `http://localhost:5173`
   - "Run the tests" → Executes comprehensive test suite
   - "Build for production" → Creates optimized production build

## Architecture

### Project Structure
```
src/
├── components/          # React UI components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions and helpers
├── __tests__/          # Test files and mocks
└── types.ts            # TypeScript type definitions
```

### Development Workflow
The template leverages [VS Code tasks](.vscode/tasks.json) for standardized development operations and follows [comprehensive coding guidelines](.github/copilot-instructions.md) for AI-assisted development.

### Testing Strategy
- **Unit Testing**: Component and hook isolation testing
- **Integration Testing**: User interaction and workflow validation
- **Visual Testing**: Playwright-based browser automation
- **Coverage Requirements**: Minimum 80% coverage across all modules

## AI-Assisted Development

### GitHub Copilot Integration
The template includes optimized [Copilot instructions](.github/copilot-instructions.md) that enable:
- Automated task execution through VS Code integration
- Test-driven development workflows
- Code quality enforcement
- Deployment automation

### Visual Debugging Workflow
When Playwright MCP Server is available:
1. Launch development server in controlled browser environment
2. Capture screenshots for visual validation
3. Automate user interaction testing
4. Generate targeted test cases for identified issues

## Deployment

### Environment Management
- **Development**: Hot-reload development server with debugging tools
- **Staging**: Production-like environment for pre-deployment validation
- **Production**: Optimized nginx-served static assets with health monitoring

### Automation
Deployment operations are managed through [configured tasks](.vscode/tasks.json):
- Staging deployment with health checks
- Production deployment with nginx configuration
- Security audit and dependency management

## Configuration Files

- [`.vscode/tasks.json`](.vscode/tasks.json) - Development task automation
- [`.github/copilot-instructions.md`](.github/copilot-instructions.md) - AI development guidelines
- [`docker-compose.yaml`](docker-compose.yaml) - Multi-environment container configuration
- [`vite.config.ts`](vite.config.ts) - Build and development server configuration

---

This template represents a streamlined approach to modern React development, emphasizing developer productivity through intelligent automation and standardized workflows.
