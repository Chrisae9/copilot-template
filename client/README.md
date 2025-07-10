# Catan Game Client

React frontend for the Catan-inspired multiplayer web application.

## Structure

```
src/
├── components/         # Game UI components
│   ├── Board/         # Game board rendering
│   ├── PlayerHUD/     # Player interface components
│   ├── TradeModal/    # Trading interface
│   ├── BuildMenu/     # Building interface
│   └── GameLog/       # Chat and game log
├── hooks/             # Custom React hooks
│   ├── useSocket.ts   # Socket.IO integration
│   ├── useGameState.ts # Game state management
│   └── useAuth.ts     # Authentication logic
├── services/          # Business logic
│   ├── socketService.ts # Socket.IO client
│   └── apiService.ts   # REST API calls
├── utils/             # Utility functions
│   ├── gameUtils.ts   # Game-specific utilities
│   └── validation.ts  # Form validation
├── assets/            # Game assets
│   ├── tiles/         # Hexagonal tile images
│   ├── icons/         # Resource and UI icons
│   └── cards/         # Development card designs
└── types.ts           # TypeScript definitions
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
```

## Key Features

- **Responsive Game Board**: SVG-based hexagonal grid that scales to different screen sizes
- **Real-Time Updates**: Socket.IO integration for live game state synchronization
- **Trading Interface**: Comprehensive UI for both maritime and domestic trading
- **Mobile Support**: Touch-friendly interface for mobile devices
- **Accessibility**: WCAG compliant with keyboard navigation support
