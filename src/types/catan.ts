/**
 * Shared Catan game types for both client and server
 * Move all core types here for universal type safety
 */

export interface Coordinates {
    q: number;
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
    ratio: number;
    resource: keyof Resources | 'any';
}

export interface Board {
    hexes: Hex[];
    ports: Port[];
    size: 'standard' | 'extended';
}

export interface Road {
    coordinates: [Coordinates, Coordinates];
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
    canPlay: boolean;
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
    ports: Port[];
    isConnected: boolean;
}

export interface TurnInfo {
    currentPlayerId: string;
    phase: TurnPhase;
    diceRoll?: [number, number];
    rolledSeven: boolean;
    waitingForDiscard: string[];
    waitingForRobberMove: boolean;
    pairPlayerId?: string;
}

export interface BankState {
    resources: Resources;
    devCards: DevCard[];
}

export interface GameSettings {
    maxPlayers: number;
    victoryPointsToWin: number;
    enableFiveToSixPlayerExpansion: boolean;
    usePairedPlayerSystem: boolean;
    enforceTimeLimit: boolean;
    turnTimeLimitSeconds?: number;
}

export interface ChatMessage {
    id: string;
    playerId: string;
    playerName: string;
    message: string;
    timestamp: Date;
    type: 'chat' | 'system' | 'trade' | 'game_event';
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
