# TypeScript React Vite Template

My personal development template that I use for new React projects. Sharing in case it's useful for others.

## Why I Built This

I got tired of the same setup problems every time I wanted to prototype something:

- **Paid platforms** work but cost money and have limitations
- **Setting up from scratch** takes forever and something always breaks  
- **Configuration issues** with TypeScript, Docker, AI tools, etc.

So I made this template that has all the pieces working together. Clone it, and you can start coding immediately.

## What's Included

- **Modern Stack**: React 19, TypeScript 5.8, Vite 7, Tailwind CSS v4
- **Docker Setup**: No Node.js installation needed, everything containerized
- **AI Integration**: Configured for GitHub Copilot and Claude Sonnet 4
- **Production Config**: Nginx deployment, security audits, health checks
- **Testing Setup**: Vitest + React Testing Library

## How I Use It

**For New Projects**: Clone this when I have an idea and want to start coding immediately.

**For AI Development**: The configuration is already done so Copilot and Claude work without TypeScript errors or Docker issues.

**For Deployment**: I have my own Cloudflare + Docker setup, but you can deploy this anywhere.

## Getting Started

**You'll need**: Docker and VS Code with GitHub Copilot

1. **Clone this repository**
2. **Open in VS Code** 
3. **Chat with Copilot**: "Start the development server"

Your app will be at `http://localhost:5173` with hot reload.

## Development Workflow

Work naturally through the Copilot chat window:

- **"Start the development server"** - Begin coding with hot reload
- **"Run the tests"** - Execute your test suite  
- **"Build for production"** - Create production build
- **"Check for security issues"** - Audit dependencies

The template includes VS Code tasks that Copilot automatically uses when you make these requests.

## Project Structure

Everything follows standard conventions:
```
src/
├── components/     # React components
├── hooks/          # Custom hooks  
├── utils/          # Helper functions
├── __tests__/      # Test files
└── App.tsx         # Main app
```

## AI Development

This template is designed for chat-driven development:

- **GitHub Copilot** - Just ask for what you need: "add a new component", "run tests", "deploy to staging"
- **Claude Sonnet 4** - Handles complex architectural decisions and code reviews
- **Playwright MCP Server** - Automates browser testing when requested

The AI automatically uses the right VS Code tasks and follows the coding standards in `.github/copilot-instructions.md`.

## Visual Debugging with Playwright

When Playwright is installed, you get powerful visual debugging:

1. **"Start the dev server and open it in Playwright"** - AI launches your app in a controlled browser
2. **"Take a screenshot of the current page"** - AI captures what you're seeing for analysis
3. **"Navigate to the login form"** - You guide the AI to problem areas through chat
4. **"I see the button is misaligned, can you confirm?"** - AI takes screenshots and validates issues
5. **"Click through the user flow and test it"** - AI interacts with your app while you watch

This creates a collaborative debugging session where you and the AI can both see the same browser state, identify visual issues together, and create targeted tests for the problems you find.

## Deployment

I use chat commands for deployment:
- **"Deploy to staging"** - Runs staging deployment with health checks
- **"Deploy to production"** - Production deployment with nginx

**Note**: The deployment tasks are configured for my personal Cloudflare + Docker setup. You'll need to modify them for your own hosting.

---

**Feel free to use this template for your own projects. It's just my personal workflow that I'm sharing.**
