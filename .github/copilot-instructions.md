### Code Patch Placeholder Policy
- Never insert `// ...existing code...` or similar placeholder comments into user files. These are only for patch/diff clarity and must not appear in any actual code, config, or documentation files.
### Test Task Reporting Protocol
- When running the test task ("Test: Run All Tests"), always wait for the terminal to exit and report the test status and results to the user. Never leave the user without a summary of whether all tests passed or if there were any failures.
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

**Primary Goal**: Build a Catan-inspired multiplayer web application - a real-time strategy board game that supports 3-6 players with a focus on enabling the crucial 5-6 player experience that commercial platforms often lack.

This project is a modern full-stack React/TypeScript application with the following key characteristics:

- **Tech Stack**: MERN Stack (MongoDB, Express.js, React, Node.js) + Socket.IO for real-time communication
- **Frontend**: React 19, TypeScript 5.8, Vite 7.0, Tailwind CSS 4.1
- **Backend**: Node.js + Express.js + TypeScript for RESTful API and game logic
- **Database**: MongoDB for flexible document storage of user profiles and game states
- **Real-Time**: Socket.IO for bidirectional event-based communication
- **Architecture**: Server-authoritative multiplayer game with client as "dumb terminal"
- **Development**: Docker-first workflow with containerized development, testing, and building
- **Testing**: Vitest + React Testing Library with comprehensive coverage
- **Styling**: Tailwind CSS with responsive design and game-optimized UI

### Game-Specific Architecture Requirements

#### Server-Authoritative Model (Critical)
- **Master Game State**: Complete game state resides exclusively on the server
- **Client Responsibilities**: Render game state, capture user input, transmit "intents" to server
- **Server-Side Validation**: All game logic and rule enforcement happens server-side
- **State Broadcast**: Server broadcasts validated state updates to all clients in real-time
- **Cheat Prevention**: Impossible for malicious clients to perform invalid actions

#### Real-Time Communication Protocol
- **Socket.IO Events**: Well-defined protocol for client-server communication
- **Event Categories**: Room management, game actions, state updates, trade proposals
- **Connection Management**: Automatic reconnection, fallbacks for older browsers
- **Event Broadcasting**: Efficient distribution of state changes to multiple players

#### Game Logic Implementation
- **Core Catan Rules**: Faithful implementation of official Catan base game mechanics
- **5-6 Player Expansion**: Modern "Paired Player" turn system for optimal gameplay flow
- **Resource Management**: Strict bank limits and scarcity rules enforcement
- **Building Validation**: Distance rules, connectivity requirements, resource costs
- **Trading System**: Both maritime (bank) and domestic (player-to-player) trading
- **Victory Conditions**: Multiple paths to victory with dynamic card tracking

### Critical Architectural Patterns

### Critical Architectural Patterns

#### Multiplayer Game Architecture
- **Monorepo Structure**: Separate `server/` and `client/` directories for backend and frontend
- **Server Directory**: Express.js API, Socket.IO handlers, game logic, MongoDB models
- **Client Directory**: React SPA with Socket.IO client for real-time communication
- **Game State Management**: Centralized state on server, reactive updates to all connected clients
- **User Authentication**: JWT-based auth with bcrypt password hashing
- **Room Management**: Lobby system with unique room codes for multiplayer sessions

#### Component Architecture for Games
- **Board Component**: SVG/CSS hexagonal grid rendering with interactive elements
- **Player HUD**: Resource cards, development cards, victory points, and building pieces
- **Trade Modal**: Complex UI for maritime and domestic trading with validation
- **Build Menu**: Context-sensitive building options with resource requirement validation
- **Game Log**: Chat system and event history for multiplayer communication
- **Real-time Updates**: Socket.IO integration for seamless multiplayer experience

#### Game-Specific Data Models
- **User Schema**: `username`, `email`, `passwordHash`, `stats` (wins/losses/karma)
- **Game Schema**: `roomCode`, `host`, `players[]`, `status`, `gameSettings`, `gameState`
- **Game State**: Complex nested object containing board layout, player states, turn info, bank resources
- **Board Data**: Hexagonal coordinate system (q,r), terrain types, number tokens, ports
- **Player State**: Resources, development cards, pieces (roads/settlements/cities), victory points

#### Docker-First Development for Full-Stack Applications
- **Always use VS Code tasks or Docker commands**: Use `Tasks: Run Task` menu or direct Docker compose commands
- **Multi-Container Setup**: Separate containers for client dev server, server API, database, and testing
- Container setup ensures Node 24.3 environment with proper user permissions (1000:1000)
- **Client Dev Server**: Runs on port 5173 with hot reload and Socket.IO connection
- **Server API**: Express.js with Socket.IO on configurable port (typically 3001)
- **Database**: MongoDB container for persistent game and user data
- Consistent environment across development, testing, and production

### Key Files and Directories:

#### Frontend Structure
- `src/components/`: UI components with strict typing and responsive design
- `src/hooks/`: Custom React hooks for game state management and Socket.IO integration
- `src/services/`: Socket.IO service layer and API communication
- `src/utils/`: Game utility functions and helpers
- `src/types.ts`: Central type definitions for game entities and Socket.IO events
- `src/test/`: Test utilities with mock factories and provider wrappers
- `src/__tests__/`: Test files organized by component/feature
- `src/assets/`: Game assets (hexagonal tiles, resource icons, UI elements)

#### Backend Structure
- `server/src/models/`: MongoDB schemas for User and Game collections
- `server/src/game/`: Core game logic, board generation, and rule validation
- `server/src/services/`: Business logic services for game operations
- `server/src/routes/`: Express.js API routes for authentication and game management
- `server/src/socket/`: Socket.IO event handlers for real-time game communication
- `server/src/utils/`: Server-side utilities and helper functions

### Testing Requirements:

#### Frontend Testing
- All React components must have unit tests with various props and game states
- All custom hooks must have integration tests using `renderHook` from `@testing-library/react`
- Socket.IO integration tests with mock server responses
- Game UI interaction tests (clicking hexes, building pieces, trading)
- Responsive behavior and accessibility testing for game components

#### Backend Testing  
- All game logic services must have comprehensive unit tests
- Game rule validation tests (building rules, distance constraints, resource costs)
- Socket.IO event handler tests with mock client connections
- Database integration tests with test data fixtures
- API endpoint tests for authentication and game management

#### Integration Testing
- Full game flow tests from lobby creation to victory conditions
- Multi-player interaction scenarios with simulated Socket.IO clients
- Real-time state synchronization between multiple connected clients
- Edge case testing for network disconnections and reconnections

#### Test Coverage Goals
- Game logic functions: 100% coverage (critical for rule enforcement)
- React components: 90%+ coverage
- Socket.IO handlers: 95%+ coverage
- Overall project: 85%+ coverage

### Development Workflow:

#### TDD for Game Development
1. **Write game logic tests first**: Start with rule validation tests before implementing game mechanics
2. **Implement server-side logic**: Build game state management, rule enforcement, and Socket.IO handlers
3. **Test real-time communication**: Verify Socket.IO events and state synchronization
4. **Build React components**: Create UI components that render game state and capture user input
5. **Integration testing**: Test full game flows with multiple simulated players
6. **Refactor and optimize**: Improve performance while keeping all tests green
7. **Use Docker for consistency**: All development, testing, and deployment in containerized environment
8. **Follow TypeScript strict mode**: Ensure type safety across client-server boundaries

#### Game-Specific Workflow Patterns
- **Server-first development**: Implement and test game logic on server before building UI
- **State-driven UI**: React components should be pure functions of game state
- **Real-time testing**: Use Socket.IO test utilities to simulate multiplayer scenarios
- **Rule validation**: Every game action must have corresponding validation tests
- **Performance considerations**: Test with 6 concurrent players and complex game states

---

## Game Development Guidelines

### Core Catan Rules Implementation

#### Game Setup and Board Generation
- **Board Layout**: Hexagonal grid with terrain types (Forest, Hills, Fields, Mountains, Pasture, Desert)
- **Number Tokens**: Values 2-12 (excluding 7) distributed to avoid adjacent high-probability numbers (6,8)
- **Ports**: 2:1 specific resource ports and 3:1 generic ports around board edges
- **Initial Placement**: Two settlements and roads per player using reverse turn order for second placement

#### Resource Management
- **Production**: Dice roll triggers resource production from adjacent settlements/cities
- **Bank Limits**: Finite resource supply (19 each for 3-4 players, 24 each for 5-6 players)
- **Scarcity Rule**: If bank cannot pay all players, no one receives that resource type
- **Robber Mechanics**: Blocks production, triggered by rolling 7, forces discards for 7+ cards

#### Building and Development
- **Roads**: Cost 1 Brick + 1 Lumber, must connect to existing pieces
- **Settlements**: Cost 1 each of Brick/Lumber/Wool/Grain, must obey Distance Rule (2 intersections apart)
- **Cities**: Cost 2 Grain + 3 Ore, upgrade existing settlements for double production
- **Development Cards**: Cost 1 each of Grain/Wool/Ore, cannot be played same turn purchased

#### Trading System
- **Maritime Trade**: Trade with bank at 4:1 default, 3:1 with generic port, 2:1 with specific port
- **Domestic Trade**: Player-to-player negotiations, must involve current player
- **Trade Restrictions**: Cannot circumvent bank rates in player trades (colonist.io house rule)

#### Victory Conditions (10+ Victory Points)
- **Settlements**: 1 VP each (max 5 per player)
- **Cities**: 2 VP each (max 4 per player)  
- **Longest Road**: 2 VP for longest continuous road (minimum 5 segments)
- **Largest Army**: 2 VP for most Knight cards played (minimum 3)
- **Victory Point Cards**: Hidden development cards worth 1 VP each

#### 5-6 Player Expansion Rules
- **Paired Player System**: Active player + player 3 seats clockwise take turns together
- **Player 2 Limitations**: Can only do maritime trade, cannot trade with other players
- **Extended Board**: Additional terrain hexes and frame pieces for larger island
- **Resource Scaling**: Increased bank supplies and development card deck

### Socket.IO Event Protocol

#### Connection Management
```typescript
// Client → Server
'client:create_room' { gameSettings: GameSettings }
'client:join_room' { roomCode: string }
'client:leave_room' {}

// Server → Client  
'server:room_update' { players: Player[], gameSettings: GameSettings }
'server:player_joined' { player: Player }
'server:player_left' { playerId: string }
```

#### Game Flow Events
```typescript
// Client → Server
'client:start_game' {}
'client:roll_dice' {}
'client:end_turn' {}

// Server → Client
'server:game_started' { gameState: GameState }
'server:dice_rolled' { player: string, result: [number, number] }
'server:turn_changed' { currentPlayer: string, phase: TurnPhase }
```

#### Game Actions
```typescript
// Client → Server
'client:build_item' { type: 'road'|'settlement'|'city', position: Coordinates }
'client:buy_dev_card' {}
'client:play_dev_card' { cardType: DevCardType, target?: any }
'client:move_robber' { position: Coordinates, stealFrom?: string }

// Server → Client
'server:game_state_update' { gameState: GameState }
'server:action_invalid' { reason: string }
```

#### Trading Events
```typescript
// Client → Server
'client:propose_trade' { offer: Resources, request: Resources, players?: string[] }
'client:respond_to_trade' { tradeId: string, response: 'accept'|'reject' }
'client:maritime_trade' { give: Resources, receive: Resources }

// Server → Client
'server:trade_proposed' { tradeId: string, fromPlayer: string, offer: Resources, request: Resources }
'server:trade_completed' { players: string[], resources: TradeTransaction }
'server:trade_cancelled' { tradeId: string, reason: string }
```

### Data Models and TypeScript Interfaces

#### Core Game Types
```typescript
interface GameState {
  board: Board;
  players: PlayerState[];
  currentTurn: TurnInfo;
  bank: BankState;
  robberPosition: Coordinates;
  longestRoad: { playerId: string; length: number } | null;
  largestArmy: { playerId: string; count: number } | null;
  chatLog: ChatMessage[];
}

interface PlayerState {
  userId: string;
  color: PlayerColor;
  resources: Resources;
  devCards: { hidden: DevCard[]; playedKnights: number };
  pieces: { roads: Road[]; settlements: Settlement[]; cities: City[] };
  victoryPoints: number;
  ports: Port[];
}

interface Board {
  hexes: Hex[];
  ports: Port[];
  size: 'standard' | 'extended';
}

interface Hex {
  coordinates: Coordinates; // { q: number, r: number }
  terrain: TerrainType;
  numberToken: number | null;
  hasRobber: boolean;
}
```

#### Resource and Building Types  
```typescript
interface Resources {
  brick: number;
  lumber: number;
  wool: number;
  grain: number;
  ore: number;
}

type BuildingType = 'road' | 'settlement' | 'city';
type DevCardType = 'knight' | 'victory_point' | 'monopoly' | 'year_of_plenty' | 'road_building';
type TerrainType = 'hills' | 'forest' | 'fields' | 'mountains' | 'pasture' | 'desert';
```

### Legal and Ethical Guidelines

#### Intellectual Property Compliance
- **Game Mechanics**: Implement Catan rules (not copyrightable as abstract game mechanics)
- **Visual Assets**: Create original artwork, use open-source/Creative Commons resources
- **Avoid Trademark Infringement**: Do not use "Catan" name or Kosmos/Catan Studio trademarks
- **Differentiate from colonist.io**: Original UI design while maintaining functional familiarity

#### Asset Sourcing Strategy
- **Hexagonal Tiles**: OpenGameArt.org, itch.io asset packs, Kenney asset packs
- **Resource Icons**: Game-icons.net (SVG icons), Flaticon (with attribution)
- **UI Components**: Kenney UI packs, custom Tailwind components
- **Card Designs**: Original designs using CSS/SVG, avoid copying existing card layouts

#### Project Branding
- **Name**: Avoid "Catan" trademark, use descriptive terms like "Hexagonal Strategy Game"
- **Description**: "Inspired by classic resource management board games"
- **Credits**: Acknowledge original game designers while establishing independent creation
