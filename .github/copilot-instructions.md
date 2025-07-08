# GitHub Copilot Instructions for TypeScript React Vite Project

This document outlines the rules, protocols, and best practices you must follow as an AI assistant on this project. Adherence to these instructions is mandatory.

## Comprehensive Testing Mandate

Every feature, component, and utility function—no matter how small—must be covered by automated tests. Tests must cover all possible states, user interactions, and edge cases. If all tests pass, running the app in dev mode must not show any errors or broken flows.

## Core Development Instructions

### 1. Strict Test-Driven Development (TDD) Workflow
- For every new feature, bug fix, or change, always write the test(s) first. Do not write any implementation code until the test(s) are complete and saved.
- Only after the test(s) are written and saved, write the minimum code needed to make the test(s) pass.
- After each code change, always run the full test suite using the VS Code task `Test: Run All Tests` or `docker compose --profile test up app-test`.
- Repeat the cycle of writing code and running tests until all tests pass. Never stop this cycle unless you need clarifying answers from the user, or the user explicitly stops you.
- Never write tests and implementation in the same step. Tests must always come first.
- If a bug or missing feature is found, add a test for it before fixing.

### 2. User Communication Shortcuts
- If the user types 'y', it means 'yes, go, or do what you think is best.' Continue with the task or workflow without stopping for further confirmation, unless the system or user instructions explicitly require otherwise.
- **ALWAYS read `.vscode/tasks.json` first** before running any commands to check available VS Code tasks
- **PRIORITIZE VS Code tasks** for all development workflow: `Tasks: Run Task` → appropriate task from `.vscode/tasks.json`
- **Update `.vscode/tasks.json`** whenever adding new repeatable commands or workflows requested by the user
- For direct terminal commands, use `docker compose --profile dev up app-dev` to start the dev server
- For direct terminal commands, use `docker compose --profile test up app-test` to run the test suite
- When working with Vite, always reference the official Vite documentation at https://vite.dev/guide/ to ensure correct setup and usage.

### 3. Core Persona and Coding Standards
- You are an expert-level senior software engineer specializing in React, TypeScript, and modern web development.
- Produce clean, efficient, and professional-grade code.
- Use modular, component-based architecture following React best practices.
- Decouple business logic from UI components whenever feasible using custom hooks.
- Prefer composition over inheritance and use React patterns like render props and compound components.
- Use the entire workspace context, especially `src/types/`, `src/components/`, `src/hooks/`, and other core directories.
- Reference files or code selections in your responses as `#file:actual/file/path.ts` or `#selection`.

### 4. Socratic Questioning Protocol
- Never make assumptions about ambiguous requirements. If a prompt is unclear, incomplete, or contradicts existing functionality, ask clarifying questions before proceeding.
- For UI changes, ask about responsive design, accessibility, and theme compatibility.
- For new features, ask about data structures, user interactions, and edge cases.
- For API integrations, ask about error handling, loading states, and data validation.

### 5. Documentation Protocol
- All code must be thoroughly documented using the JSDoc standard.
- Use @param, @returns, @throws, @type, and @property to describe code's function, inputs, outputs, and potential errors.
- For all public methods and complex functions, include an @example block demonstrating its usage.
- For React components, document props using TypeScript interfaces and JSDoc comments.
- For hooks, document the returned state and functions with clear descriptions.
- Explain "how" in code comments, and keep "why" in the component/hook documentation.

### 6. React and TypeScript Standards
- All React components must be functional components using hooks.
- Use TypeScript interfaces for all props, state, and data structures.
- Follow the existing file structure: components in `src/components/`, hooks in `src/hooks/`, services in `src/services/`, utils in `src/utils/`.
- Ensure all new components are responsive and work with both light and dark themes (if applicable).
- Use the existing utility functions and configuration files when possible.
- Always export components and hooks with proper TypeScript types.

### 7. Instructions Maintenance
- Always keep this Copilot instructions file up to date with user requests and project conventions.
- Any time the user asks to 'remember' a workflow, rule, or best practice, add it here immediately.
- If the user says 'remember' or 'remember this', you must immediately add the instruction, workflow, or rule to this file without exception.
- When adding new terminal commands to the project workflow, also add them to `.vscode/settings.json` in the `github.copilot.chat.agent.terminal.allowList` object for VS Code integration.

### 8. Tailwind CSS Configuration (Critical)

#### Setup and Usage
- Uses `@import "tailwindcss"` import syntax in `src/index.css`
- All styling should use Tailwind utility classes for consistency
- Create custom utility classes in `src/index.css` when needed
- Follow mobile-first responsive design principles

#### Dark Mode (if implemented)
- Use `darkMode: 'class'` in `tailwind.config.js` for class-based dark mode
- Theme toggle should add/remove `.dark` class on `document.documentElement`
- Test all components in both light and dark modes

### 9. Development Workflow Essentials

#### Task Management Protocol (Critical)
- **ALWAYS check `.vscode/tasks.json` first** before suggesting any commands or workflows
- **Use VS Code tasks as the primary method** for all development operations via `Tasks: Run Task` menu
- **Update `.vscode/tasks.json` immediately** when user requests new repeatable commands or workflows
- When user asks to "remember" a command or workflow, add it as a VS Code task with proper configuration
- Include appropriate `group`, `detail`, `presentation`, and `problemMatcher` properties for new tasks
- Test all new tasks to ensure they work correctly in the containerized environment

#### Required Commands and Workflow (Memorize These)
- **VS Code Tasks (Preferred)**: Use `Tasks: Run Task` menu for all development operations
  - `Dev: Start Development Server` - Starts dev server on port 5173
  - `Test: Run All Tests` - Runs test suite with verbose output  
  - `Build: Staging Build` - Creates production build
  - `Dev: Stop Development Server` - Stops development containers
- **Direct Docker Commands** (when VS Code tasks are unavailable):
  - `docker compose --profile dev up app-dev` (port 5173)
  - `docker compose --profile test up app-test` (verbose output)
  - `docker compose --profile build up app-build`
- **Never use `npm run` commands directly** - always use VS Code tasks or Docker profiles

#### State Management Best Practices
- Use custom hooks for complex state logic
- Prefer React's built-in state management (useState, useReducer, useContext)
- Keep state as local as possible, lift up only when necessary
- Use TypeScript interfaces for all state shapes
- Consider using React Query/TanStack Query for server state management

#### File Organization
- Group related components in folders with index.ts exports
- Keep components small and focused on single responsibilities
- Use barrel exports for clean imports
- Separate concerns: UI components, business logic hooks, and utility functions

### 10. Testing Architecture

#### Test Utilities in `src/test/utils.tsx`
- `renderWithProviders()`: Wraps components with necessary providers (Router, etc.)
- Create mock factories for consistent test data
- Use React Testing Library best practices for user-centric testing
- Test behavior, not implementation details

#### Testing Focus Areas
- Component rendering with various props and states
- User interactions (clicks, form submissions, navigation)
- Responsive behavior and accessibility
- Integration between components and hooks
- Error boundaries and edge cases
- API integrations with mocked responses

#### Vitest Configuration Details
- Uses jsdom environment with globals enabled
- `src/test/setup.ts` provides necessary mocks and polyfills
- Coverage excludes test files, configs, and dist directory
- Reporter set to 'verbose' for detailed test output
- Use `describe`, `it`, `expect` for test structure

### 11. Docker Multi-Profile Setup
- **dev**: Development server with hot reload and file watching
- **test**: Test runner with coverage and verbose output
- **build**: Production build with optimized assets
- All profiles use Node 24.3-alpine with user 1000:1000 for permission consistency

### 12. Vite Build Configuration
- Path aliases: `@` maps to `/src`, `@assets` maps to `/src/assets`
- Asset handling for images, with automatic optimization
- Source maps enabled for debugging production issues
- Modern ES modules and tree-shaking for optimal bundles
- Hot Module Replacement (HMR) for fast development

### 13. Error Handling and Debugging

#### Build Issues
1. Check TypeScript compilation errors in terminal output
2. Verify all imports are correctly typed and paths exist
3. Validate Vite configuration and plugins
4. Ensure all dependencies are properly installed
5. Clear node_modules and reinstall if needed

#### Styling Issues
1. Verify Tailwind CSS import in `src/index.css`
2. Check class names for typos and validate they exist
3. Validate responsive classes work across breakpoints
4. Ensure custom utility classes aren't conflicting
5. Use browser dev tools to inspect applied styles

#### Runtime Issues
1. Check browser console for JavaScript errors
2. Verify component props and state are correct
3. Test user interactions and event handlers
4. Validate API calls and data flow
5. Use React Developer Tools for component debugging

#### Route Navigation Problems
1. Verify React Router setup in `main.tsx`
2. Check route definitions and component mappings
3. Test navigation links and programmatic navigation
4. Validate URL handling and redirects
5. Ensure proper handling of 404 cases

### 14. Performance Best Practices

#### Code Splitting and Lazy Loading
- Use React.lazy() for route-based code splitting
- Implement proper loading states and error boundaries
- Consider component-level lazy loading for large components

#### Bundle Optimization
- Use Vite's built-in tree-shaking
- Analyze bundle size with build reports
- Optimize images and assets
- Use proper caching strategies

#### React Performance
- Use React.memo() for expensive components
- Implement useMemo() and useCallback() when needed
- Avoid creating objects in render functions
- Profile components with React DevTools

### 15. Accessibility (a11y) Standards

#### WCAG Compliance
- Ensure proper heading hierarchy (h1, h2, h3, etc.)
- Provide alt text for all images
- Use semantic HTML elements
- Ensure sufficient color contrast ratios

#### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Implement proper focus management
- Use appropriate ARIA labels and roles
- Test with screen readers when possible

#### Testing Accessibility
- Use React Testing Library's accessibility queries
- Test keyboard navigation paths
- Validate ARIA attributes
- Check color contrast and text scaling

---

## Quick Reference Commands

### VS Code Tasks (Primary Method)
Use `Tasks: Run Task` in VS Code for all development operations:
- `Dev: Start Development Server` - Start development server
- `Test: Run All Tests` - Run test suite
- `Build: Staging Build` - Build for production
- `Dev: Stop Development Server` - Stop development containers

### Direct Docker Commands (Fallback)
```bash
docker compose --profile dev up app-dev      # Development server
docker compose --profile test up app-test    # Test runner
docker compose --profile build up app-build  # Production build
docker compose down                          # Stop all containers
```

---

**Always read and follow these instructions before and during every task.**

If the user says "run," always start the dev server. If the user says "run tests," always run the test suite. Never skip tests or leave features untested.

Always keep this Copilot instructions file up to date with user requests and project conventions. Any time the user asks to 'remember' a workflow, rule, or best practice, add it here immediately.

**These instructions represent best practices for building and maintaining modern React/TypeScript applications. They include battle-tested solutions for common issues like Tailwind CSS configuration, Docker development workflows, and testing patterns. Follow them to maintain consistency and quality across the codebase.**

## Project Context and Architecture

This is a modern React/TypeScript application template with the following key characteristics:

- **Tech Stack**: React 19, TypeScript 5.8, Vite 7.0, Tailwind CSS 4.1
- **Architecture**: Hook-based state management, component-based UI, service layer for data
- **Development**: Docker-first workflow with containerized development, testing, and building
- **Testing**: Vitest + React Testing Library with comprehensive coverage
- **Styling**: Tailwind CSS with responsive design and optional dark mode

### Critical Architectural Patterns

#### Component Architecture
- `App.tsx` is the main application component with routing logic
- All components are functional with TypeScript interfaces for props
- Responsive design with mobile-first approach
- Consistent styling with Tailwind CSS utility classes
- Clear separation of concerns between UI, logic, and data

#### Docker-First Development
- **Always use VS Code tasks or Docker commands**: Use `Tasks: Run Task` menu or direct Docker compose commands
- Container setup ensures Node 24.3 environment with proper user permissions (1000:1000)
- Dev server runs on port 5173 with host binding for container access
- Consistent environment across development, testing, and production

### Key Files and Directories:
- `src/components/`: UI components with strict typing and responsive design
- `src/hooks/`: Custom React hooks for state management and side effects  
- `src/services/`: Business logic and data handling
- `src/utils/`: Utility functions and helpers
- `src/types.ts`: Central type definitions
- `src/test/`: Test utilities with mock factories and provider wrappers
- `src/__tests__/`: Test files organized by component/feature

### Testing Requirements:
- All components must have unit tests
- All hooks must have integration tests using `renderHook` from `@testing-library/react`
- All services must have unit tests with mock data
- All utilities must have unit tests
- Integration tests validate component interactions and user flows
- Test coverage should be maintained above 80%

### Development Workflow:
1. Write tests first (TDD approach)
2. Implement minimum code to pass tests
3. Run test suite to verify
4. Refactor if needed while keeping tests green
5. Use Docker for consistent development environment
6. Follow TypeScript strict mode requirements
7. Maintain responsive design and accessibility standards
