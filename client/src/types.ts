/**
 * TypeScript type definitions for the Catan-inspired multiplayer game
 * These types are shared between client and server for Socket.IO communication
 */

// =============================================================================
// Core Game Types
// =============================================================================

export interface Coordinates {
    q: number; // Hexagonal coordinate system
    r: number;
}

export type TerrainType = 'hills' | 'forest' | 'fields' | 'mountains' | 'pasture' | 'desert';
export type PlayerColor = 'red' | 'blue' | 'white' | 'orange' | 'green' | 'brown';
export type BuildingType = 'road' | 'settlement' | 'city';
export type DevCardType = 'knight' | 'victory_point' | 'monopoly' | 'year_of_plenty' | 'road_building';
export type TurnPhase = 'setup' | 'roll' | 'trade_build' | 'game_over';
export type GameStatus = 'lobby' | 'in_progress' | 'finished';

export interface Resources {
    brick: number;
    lumber: number;
    wool: number;
    grain: number;
    ore: number;
}

export interface Hex {
    coordinates: Coordinates;
    terrain: TerrainType;
    numberToken: number | null;
    hasRobber: boolean;
}

export interface Port {
    coordinates: Coordinates;
    ratio: number; // 2, 3, or 4
    resource: keyof Resources | 'any'; // specific resource or 'any' for generic ports
}

export interface Board {
    hexes: Hex[];
    ports: Port[];
    size: 'standard' | 'extended'; // standard for 3-4 players, extended for 5-6
}

// =============================================================================
// Player and Game State Types
// =============================================================================

export interface Road {
    coordinates: [Coordinates, Coordinates]; // Two connected hex corners
    playerId: string;
}

export interface Settlement {
    coordinates: Coordinates;
    playerId: string;
}

export interface City {
    coordinates: Coordinates;
    playerId: string;
}

export interface DevCard {
    type: DevCardType;
    canPlay: boolean; // false if bought this turn
}

export interface PlayerState {
    userId: string;
    username: string;
    color: PlayerColor;
    resources: Resources;
    devCards: {
        hidden: DevCard[];
        playedKnights: number;
    };
    pieces: {
        roads: Road[];
        settlements: Settlement[];
        cities: City[];
    };
    victoryPoints: number;
    ports: Port[]; // Ports this player has access to
    isConnected: boolean;
}

export interface TurnInfo {
    currentPlayerId: string;
    phase: TurnPhase;
    diceRoll?: [number, number];
    rolledSeven: boolean;
    waitingForDiscard: string[]; // Player IDs who need to discard
    waitingForRobberMove: boolean;
    pairPlayerId?: string; // For 5-6 player "Paired Player" system
}

export interface BankState {
    resources: Resources;
    devCards: DevCard[];
}

export interface GameState {
    board: Board;
    players: PlayerState[];
    currentTurn: TurnInfo;
    bank: BankState;
    robberPosition: Coordinates;
    longestRoad: { playerId: string; length: number } | null;
    largestArmy: { playerId: string; count: number } | null;
    chatLog: ChatMessage[];
    gameSettings: GameSettings;
}

// =============================================================================
// Game Management Types
// =============================================================================

export interface GameSettings {
    maxPlayers: number; // 3-6
    victoryPointsToWin: number; // typically 10
    enableFiveToSixPlayerExpansion: boolean;
    usePairedPlayerSystem: boolean; // for 5-6 players
    enforceTimeLimit: boolean;
    turnTimeLimitSeconds?: number;
}

export interface User {
    id: string;
    username: string;
    email: string;
    stats: {
        wins: number;
        losses: number;
        gamesPlayed: number;
        karma: number;
    };
}

export interface Game {
    id: string;
    roomCode: string;
    host: string; // User ID
    players: string[]; // User IDs
    status: GameStatus;
    gameSettings: GameSettings;
    gameState?: GameState;
    createdAt: Date;
    finishedAt?: Date;
}

export interface ChatMessage {
    id: string;
    playerId: string;
    playerName: string;
    message: string;
    timestamp: Date;
    type: 'chat' | 'system' | 'trade' | 'game_event';
}

// =============================================================================
// Socket.IO Event Types
// =============================================================================

export interface TradeOffer {
    id: string;
    fromPlayerId: string;
    toPlayerIds?: string[]; // If undefined, offer to all players
    offer: Resources;
    request: Resources;
    timestamp: Date;
}

export interface TradeTransaction {
    fromPlayerId: string;
    toPlayerId: string;
    resourcesGiven: Resources;
    resourcesReceived: Resources;
}

// Client to Server Events
export interface ClientToServerEvents {
    // Room Management
    'client:create_room': (data: { gameSettings: GameSettings }) => void;
    'client:join_room': (data: { roomCode: string }) => void;
    'client:leave_room': () => void;

    // Game Flow
    'client:start_game': () => void;
    'client:roll_dice': () => void;
    'client:end_turn': () => void;

    // Game Actions
    'client:build_item': (data: { type: BuildingType; position: Coordinates }) => void;
    'client:buy_dev_card': () => void;
    'client:play_dev_card': (data: { cardType: DevCardType; target?: any }) => void;
    'client:move_robber': (data: { position: Coordinates; stealFrom?: string }) => void;
    'client:discard_cards': (data: { resources: Resources }) => void;

    // Trading
    'client:propose_trade': (data: { offer: Resources; request: Resources; players?: string[] }) => void;
    'client:respond_to_trade': (data: { tradeId: string; response: 'accept' | 'reject' }) => void;
    'client:maritime_trade': (data: { give: Resources; receive: Resources }) => void;

    // Communication
    'client:send_chat': (data: { message: string }) => void;
}

// Server to Client Events  
export interface ServerToClientEvents {
    // Connection & Room Management
    'server:welcome': (data: { message: string; socketId: string }) => void;
    'server:room_update': (data: { players: User[]; gameSettings: GameSettings }) => void;
    'server:player_joined': (data: { player: User }) => void;
    'server:player_left': (data: { playerId: string }) => void;

    // Game Flow
    'server:game_started': (data: { gameState: GameState }) => void;
    'server:dice_rolled': (data: { player: string; result: [number, number] }) => void;
    'server:turn_changed': (data: { currentPlayer: string; phase: TurnPhase }) => void;
    'server:game_over': (data: { winner: string; finalState: GameState }) => void;

    // Game State Updates
    'server:game_state_update': (data: { gameState: GameState }) => void;
    'server:action_invalid': (data: { reason: string }) => void;

    // Trading
    'server:trade_proposed': (data: { trade: TradeOffer }) => void;
    'server:trade_completed': (data: { transaction: TradeTransaction }) => void;
    'server:trade_cancelled': (data: { tradeId: string; reason: string }) => void;

    // Communication
    'server:chat_message': (data: { message: ChatMessage }) => void;
    'server:system_message': (data: { message: string; type: 'info' | 'warning' | 'error' }) => void;
}

// =============================================================================
// Utility Types
// =============================================================================

export interface BuildCost {
    resources: Resources;
    description: string;
}

export const BUILDING_COSTS: Record<BuildingType, BuildCost> = {
    road: {
        resources: { brick: 1, lumber: 1, wool: 0, grain: 0, ore: 0 },
        description: '1 Brick + 1 Lumber'
    },
    settlement: {
        resources: { brick: 1, lumber: 1, wool: 1, grain: 1, ore: 0 },
        description: '1 Brick + 1 Lumber + 1 Wool + 1 Grain'
    },
    city: {
        resources: { brick: 0, lumber: 0, wool: 0, grain: 2, ore: 3 },
        description: '2 Grain + 3 Ore'
    }
};

export const DEV_CARD_COST: BuildCost = {
    resources: { brick: 0, lumber: 0, wool: 1, grain: 1, ore: 1 },
    description: '1 Wool + 1 Grain + 1 Ore'
};

export interface GameConstants {
    MAX_RESOURCE_CARDS_BEFORE_DISCARD: number;
    VICTORY_POINTS_TO_WIN: number;
    MIN_ROAD_LENGTH_FOR_LONGEST: number;
    MIN_KNIGHTS_FOR_LARGEST_ARMY: number;
    BANK_RESOURCE_LIMITS: {
        standard: number; // 3-4 players
        extended: number; // 5-6 players
    };
}

export const GAME_CONSTANTS: GameConstants = {
    MAX_RESOURCE_CARDS_BEFORE_DISCARD: 7,
    VICTORY_POINTS_TO_WIN: 10,
    MIN_ROAD_LENGTH_FOR_LONGEST: 5,
    MIN_KNIGHTS_FOR_LARGEST_ARMY: 3,
    BANK_RESOURCE_LIMITS: {
        standard: 19,
        extended: 24
    }
};

// =============================================================================
// Legacy Template Types (for backward compatibility)
// =============================================================================

export interface ApiResponse<T = unknown> {
    data: T;
    message: string;
    success: boolean;
    timestamp: string;
}

export interface ApiError {
    message: string;
    code: string;
    details?: Record<string, string[]>;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T, E = string> {
    data: T | null;
    loading: boolean;
    error: E | null;
    state: LoadingState;
}

export interface StyleProps {
    className?: string;
    style?: React.CSSProperties;
}

export interface ChildrenProps {
    children: React.ReactNode;
}
