/**
 * Tests for game utility functions
 * Unit tests for core game logic utilities
 */

import { describe, expect, it } from 'vitest';
import type {
    GameState,
    PlayerState
} from '../../../src/types/catan';
import {
    generatePlayerId,
    generateRoomCode,
    hexDistance,
    rollDice,
    sanitizeInput,
    validateDiceRoll,
    validatePlayerCount,
    validateRoomCode,
    validateUsername
} from '../utils/gameUtils.js';
import './setup.js';
describe('Catan Type Definitions', () => {
    it('should allow construction of a minimal valid GameState', () => {
        const state: GameState = {
            board: {
                hexes: [],
                ports: [],
                size: 'standard',
            },
            players: [],
            currentTurn: {
                currentPlayerId: 'p1',
                phase: 'setup',
                rolledSeven: false,
                waitingForDiscard: [],
                waitingForRobberMove: false,
            },
            bank: {
                resources: { brick: 0, lumber: 0, wool: 0, grain: 0, ore: 0 },
                devCards: [],
            },
            robberPosition: { q: 0, r: 0 },
            longestRoad: null,
            largestArmy: null,
            chatLog: [],
            gameSettings: {
                maxPlayers: 4,
                victoryPointsToWin: 10,
                enableFiveToSixPlayerExpansion: false,
                usePairedPlayerSystem: false,
                enforceTimeLimit: false,
            },
        };
        expect(state.board.size).toBe('standard');
        expect(state.bank.resources.brick).toBe(0);
    });

    it('should allow construction of a PlayerState with all required fields', () => {
        const player: PlayerState = {
            userId: 'u1',
            username: 'Alice',
            color: 'red',
            resources: { brick: 1, lumber: 2, wool: 3, grain: 4, ore: 5 },
            devCards: { hidden: [], playedKnights: 0 },
            pieces: { roads: [], settlements: [], cities: [] },
            victoryPoints: 2,
            ports: [],
            isConnected: true,
        };
        expect(player.username).toBe('Alice');
        expect(player.resources.lumber).toBe(2);
    });
});

describe('Game Utilities Tests', () => {
    describe('Room Code Generation and Validation', () => {
        it('should generate room codes of correct length', () => {
            const code4 = generateRoomCode(4);
            const code6 = generateRoomCode(6);

            expect(code4).toHaveLength(4);
            expect(code6).toHaveLength(6);
        });

        it('should generate default 4-character room codes', () => {
            const code = generateRoomCode();
            expect(code).toHaveLength(4);
        });

        it('should generate unique room codes', () => {
            const codes = new Set();

            // Generate 100 codes and check for uniqueness
            for (let i = 0; i < 100; i++) {
                codes.add(generateRoomCode());
            }

            // Should have close to 100 unique codes (allowing for very rare collisions)
            expect(codes.size).toBeGreaterThan(95);
        });

        it('should generate alphanumeric room codes', () => {
            const code = generateRoomCode();
            expect(code).toMatch(/^[A-Z0-9]+$/);
        });

        it('should validate correct room codes', () => {
            expect(validateRoomCode('ABCD')).toBe(true);
            expect(validateRoomCode('1234')).toBe(true);
            expect(validateRoomCode('AB12')).toBe(true);
            expect(validateRoomCode('ABCDEF')).toBe(true);
        });

        it('should reject invalid room codes', () => {
            expect(validateRoomCode('')).toBe(false);
            expect(validateRoomCode('ABC')).toBe(false); // Too short
            expect(validateRoomCode('ABCDEFG')).toBe(false); // Too long
            expect(validateRoomCode('ab12')).toBe(false); // Lowercase
            expect(validateRoomCode('AB-2')).toBe(false); // Invalid character
            expect(validateRoomCode(null as any)).toBe(false);
            expect(validateRoomCode(undefined as any)).toBe(false);
            expect(validateRoomCode(123 as any)).toBe(false);
        });

        it('should handle case insensitive validation', () => {
            expect(validateRoomCode('abcd')).toBe(false); // Should be uppercase
        });
    });

    describe('Dice Rolling and Validation', () => {
        it('should generate valid dice rolls', () => {
            for (let i = 0; i < 100; i++) {
                const roll = rollDice();

                expect(roll.die1).toBeGreaterThanOrEqual(1);
                expect(roll.die1).toBeLessThanOrEqual(6);
                expect(roll.die2).toBeGreaterThanOrEqual(1);
                expect(roll.die2).toBeLessThanOrEqual(6);
                expect(roll.total).toBe(roll.die1 + roll.die2);
                expect(roll.total).toBeGreaterThanOrEqual(2);
                expect(roll.total).toBeLessThanOrEqual(12);
            }
        });

        it('should validate correct dice rolls', () => {
            expect(validateDiceRoll({ die1: 1, die2: 1, total: 2 })).toBe(true);
            expect(validateDiceRoll({ die1: 6, die2: 6, total: 12 })).toBe(true);
            expect(validateDiceRoll({ die1: 3, die2: 4, total: 7 })).toBe(true);
        });

        it('should reject invalid dice rolls', () => {
            expect(validateDiceRoll({ die1: 0, die2: 1, total: 1 })).toBe(false); // Die too low
            expect(validateDiceRoll({ die1: 7, die2: 1, total: 8 })).toBe(false); // Die too high
            expect(validateDiceRoll({ die1: 3, die2: 4, total: 8 })).toBe(false); // Wrong total
            expect(validateDiceRoll(null as any)).toBe(false);
            expect(validateDiceRoll(undefined as any)).toBe(false);
            expect(validateDiceRoll({ die1: 1 } as any)).toBe(false); // Missing properties
        });

        it('should generate statistically reasonable dice distributions', () => {
            const totals: { [key: number]: number } = {};
            const iterations = 10000;

            // Roll dice many times
            for (let i = 0; i < iterations; i++) {
                const roll = rollDice();
                totals[roll.total] = (totals[roll.total] || 0) + 1;
            }

            // Check that 7 is most common (should be about 16.7% of rolls)
            const sevenCount = totals[7] || 0;
            const sevenPercentage = sevenCount / iterations;
            expect(sevenPercentage).toBeGreaterThan(0.14); // Allow some variance
            expect(sevenPercentage).toBeLessThan(0.20);

            // Check that 2 and 12 are least common (should be about 2.8% each)
            const twoCount = totals[2] || 0;
            const twelveCount = totals[12] || 0;
            expect(twoCount / iterations).toBeLessThan(0.05);
            expect(twelveCount / iterations).toBeLessThan(0.05);
        });
    });

    describe('Hexagonal Distance Calculation', () => {
        it('should calculate distance between same hex as 0', () => {
            const hex = { q: 0, r: 0 };
            expect(hexDistance(hex, hex)).toBe(0);
        });

        it('should calculate distance between adjacent hexes as 1', () => {
            const center = { q: 0, r: 0 };
            const adjacent = [
                { q: 1, r: 0 },   // Right
                { q: -1, r: 0 },  // Left
                { q: 0, r: 1 },   // Bottom right
                { q: 0, r: -1 },  // Top left
                { q: 1, r: -1 },  // Top right
                { q: -1, r: 1 }   // Bottom left
            ];

            adjacent.forEach(hex => {
                expect(hexDistance(center, hex)).toBe(1);
            });
        });

        it('should calculate correct distances for known positions', () => {
            expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: 0 })).toBe(2);
            expect(hexDistance({ q: 0, r: 0 }, { q: 1, r: 1 })).toBe(2);
            expect(hexDistance({ q: -1, r: -1 }, { q: 1, r: 1 })).toBe(4);
        });

        it('should be symmetric', () => {
            const hex1 = { q: -2, r: 3 };
            const hex2 = { q: 1, r: -1 };

            expect(hexDistance(hex1, hex2)).toBe(hexDistance(hex2, hex1));
        });
    });

    describe('Player Count Validation', () => {
        it('should accept valid player counts', () => {
            expect(validatePlayerCount(3)).toBe(true);
            expect(validatePlayerCount(4)).toBe(true);
            expect(validatePlayerCount(5)).toBe(true);
            expect(validatePlayerCount(6)).toBe(true);
        });

        it('should reject invalid player counts', () => {
            expect(validatePlayerCount(2)).toBe(false);
            expect(validatePlayerCount(7)).toBe(false);
            expect(validatePlayerCount(0)).toBe(false);
            expect(validatePlayerCount(-1)).toBe(false);
            expect(validatePlayerCount(3.5)).toBe(false);
            expect(validatePlayerCount(NaN)).toBe(false);
            expect(validatePlayerCount(Infinity)).toBe(false);
        });
    });

    describe('Player ID Generation', () => {
        it('should generate unique player IDs', () => {
            const ids = new Set();

            for (let i = 0; i < 100; i++) {
                ids.add(generatePlayerId());
            }

            expect(ids.size).toBe(100); // All should be unique
        });

        it('should generate player IDs with correct format', () => {
            const id = generatePlayerId();
            expect(id).toMatch(/^player_\d+_[a-z0-9]+$/);
        });

        it('should generate player IDs that include timestamp', () => {
            const beforeTime = Date.now();
            const id = generatePlayerId();
            const afterTime = Date.now();

            const timestampMatch = id.match(/^player_(\d+)_/);
            expect(timestampMatch).toBeTruthy();

            if (timestampMatch) {
                const timestamp = parseInt(timestampMatch[1]);
                expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
                expect(timestamp).toBeLessThanOrEqual(afterTime);
            }
        });
    });

    describe('Username Validation', () => {
        it('should accept valid usernames', () => {
            expect(validateUsername('player1')).toBe(true);
            expect(validateUsername('test_user')).toBe(true);
            expect(validateUsername('Player123')).toBe(true);
            expect(validateUsername('abc')).toBe(true); // Minimum length
            expect(validateUsername('a'.repeat(20))).toBe(true); // Maximum length
        });

        it('should reject invalid usernames', () => {
            expect(validateUsername('')).toBe(false);
            expect(validateUsername('ab')).toBe(false); // Too short
            expect(validateUsername('a'.repeat(21))).toBe(false); // Too long
            expect(validateUsername('player-1')).toBe(false); // Invalid character
            expect(validateUsername('player 1')).toBe(false); // Space
            expect(validateUsername('player.1')).toBe(false); // Dot
            expect(validateUsername(null as any)).toBe(false);
            expect(validateUsername(undefined as any)).toBe(false);
            expect(validateUsername(123 as any)).toBe(false);
        });
    });

    describe('Input Sanitization', () => {
        it('should remove HTML tags', () => {
            expect(sanitizeInput('<script>alert("xss")</script>hello')).toBe('hello');
            expect(sanitizeInput('<b>bold</b> text')).toBe('bold text');
            expect(sanitizeInput('<img src="x" onerror="alert(1)">')).toBe('');
        });

        it('should trim whitespace', () => {
            expect(sanitizeInput('  hello  ')).toBe('hello');
            expect(sanitizeInput('\t\ntest\r\n')).toBe('test');
        });

        it('should handle empty and invalid inputs', () => {
            expect(sanitizeInput('')).toBe('');
            expect(sanitizeInput(null as any)).toBe('');
            expect(sanitizeInput(undefined as any)).toBe('');
            expect(sanitizeInput(123 as any)).toBe('');
        });

        it('should preserve valid text content', () => {
            expect(sanitizeInput('Hello World!')).toBe('Hello World!');
            expect(sanitizeInput('123 test @#$%')).toBe('123 test @#$%');
        });
    });
});
