# Catan Game Server

Node.js backend with Express and Socket.IO for the Catan-inspired multiplayer game.

## Structure

```
src/
├── models/            # MongoDB schemas
│   ├── User.ts        # User account model
│   └── Game.ts        # Game state model
├── game/              # Core game logic
│   ├── gameState.ts   # Game state management
│   ├── boardGenerator.ts # Board generation logic
│   ├── rules/         # Game rule validation
│   └── ai/            # Bot AI implementation
├── services/          # Business logic
│   ├── gameService.ts # Game operations
│   ├── userService.ts # User management
│   └── authService.ts # Authentication
├── routes/            # Express API routes
│   ├── auth.ts        # Authentication endpoints
│   ├── games.ts       # Game management
│   └── users.ts       # User management
├── socket/            # Socket.IO handlers
│   ├── gameEvents.ts  # Game action handlers
│   ├── roomEvents.ts  # Room management
│   └── tradeEvents.ts # Trading system
└── utils/             # Utility functions
    ├── validation.ts  # Input validation
    └── helpers.ts     # Common utilities
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

```bash
PORT=3001
MONGODB_URI=mongodb://localhost:27017/catan-game
CLIENT_URL=http://localhost:5173
JWT_SECRET=your-secret-key
```

## Key Features

- **Server-Authoritative Architecture**: All game logic runs on server to prevent cheating
- **Real-Time Communication**: Socket.IO for instant multiplayer updates
- **Comprehensive Rule Validation**: Faithful implementation of all Catan rules
- **5-6 Player Support**: Modern "Paired Player" turn system
- **MongoDB Integration**: Flexible storage for user accounts and game states
- **JWT Authentication**: Secure user authentication and session management
