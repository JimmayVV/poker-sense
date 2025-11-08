/**
 * Game Engine Constants & Enums
 *
 * All game configuration values, enums, and constants.
 * No magic numbers - everything is defined here.
 */

/* eslint-disable no-redeclare */

/**
 * Game status representing the current phase of the poker hand
 */
export const GameStatus = {
  WAITING: "WAITING",
  DEALING: "DEALING",
  PREFLOP: "PREFLOP",
  FLOP: "FLOP",
  TURN: "TURN",
  RIVER: "RIVER",
  SHOWDOWN: "SHOWDOWN",
  COMPLETE: "COMPLETE",
} as const;

export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus];

/**
 * Poker hand rankings (0 = weakest, 9 = strongest)
 */
export const HandRank = {
  HIGH_CARD: 0,
  PAIR: 1,
  TWO_PAIR: 2,
  THREE_OF_KIND: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  FOUR_OF_KIND: 7,
  STRAIGHT_FLUSH: 8,
  ROYAL_FLUSH: 9,
} as const;

export type HandRank = (typeof HandRank)[keyof typeof HandRank];

/**
 * Card suits (using single-character notation for compact storage)
 */
export const Suit = {
  HEARTS: "h",
  DIAMONDS: "d",
  CLUBS: "c",
  SPADES: "s",
} as const;

export type Suit = (typeof Suit)[keyof typeof Suit];

/**
 * Card ranks (2-14, where 14 = Ace)
 */
export const Rank = {
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
  SIX: 6,
  SEVEN: 7,
  EIGHT: 8,
  NINE: 9,
  TEN: 10,
  JACK: 11,
  QUEEN: 12,
  KING: 13,
  ACE: 14,
} as const;

export type Rank = (typeof Rank)[keyof typeof Rank];

/**
 * Player action types
 */
export const PlayerActionType = {
  FOLD: "FOLD",
  CHECK: "CHECK",
  CALL: "CALL",
  BET: "BET",
  RAISE: "RAISE",
  ALL_IN: "ALL_IN",
} as const;

export type PlayerActionType = (typeof PlayerActionType)[keyof typeof PlayerActionType];

/**
 * Blind level configuration
 */
export type BlindLevel = {
  readonly level: number;
  readonly smallBlind: number;
  readonly bigBlind: number;
  readonly ante: number;
  readonly durationMinutes: number;
};

/**
 * Blind structures for different tournament types
 */
export const BLIND_STRUCTURES = {
  STANDARD: [
    { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, durationMinutes: 15 },
    { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, durationMinutes: 15 },
    { level: 3, smallBlind: 75, bigBlind: 150, ante: 0, durationMinutes: 15 },
    { level: 4, smallBlind: 100, bigBlind: 200, ante: 0, durationMinutes: 15 },
    { level: 5, smallBlind: 150, bigBlind: 300, ante: 25, durationMinutes: 15 },
    { level: 6, smallBlind: 200, bigBlind: 400, ante: 50, durationMinutes: 15 },
    { level: 7, smallBlind: 300, bigBlind: 600, ante: 75, durationMinutes: 15 },
    { level: 8, smallBlind: 400, bigBlind: 800, ante: 100, durationMinutes: 15 },
    { level: 9, smallBlind: 600, bigBlind: 1200, ante: 150, durationMinutes: 15 },
    {
      level: 10,
      smallBlind: 800,
      bigBlind: 1600,
      ante: 200,
      durationMinutes: 15,
    },
    {
      level: 11,
      smallBlind: 1000,
      bigBlind: 2000,
      ante: 300,
      durationMinutes: 15,
    },
    {
      level: 12,
      smallBlind: 1500,
      bigBlind: 3000,
      ante: 400,
      durationMinutes: 15,
    },
  ] as const satisfies readonly BlindLevel[],

  TURBO: [
    { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, durationMinutes: 6 },
    { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, durationMinutes: 6 },
    { level: 3, smallBlind: 75, bigBlind: 150, ante: 0, durationMinutes: 6 },
    { level: 4, smallBlind: 100, bigBlind: 200, ante: 0, durationMinutes: 6 },
    { level: 5, smallBlind: 150, bigBlind: 300, ante: 25, durationMinutes: 6 },
    { level: 6, smallBlind: 200, bigBlind: 400, ante: 50, durationMinutes: 6 },
    { level: 7, smallBlind: 300, bigBlind: 600, ante: 75, durationMinutes: 6 },
    { level: 8, smallBlind: 400, bigBlind: 800, ante: 100, durationMinutes: 6 },
    {
      level: 9,
      smallBlind: 600,
      bigBlind: 1200,
      ante: 150,
      durationMinutes: 6,
    },
    {
      level: 10,
      smallBlind: 800,
      bigBlind: 1600,
      ante: 200,
      durationMinutes: 6,
    },
    {
      level: 11,
      smallBlind: 1000,
      bigBlind: 2000,
      ante: 300,
      durationMinutes: 6,
    },
    {
      level: 12,
      smallBlind: 1500,
      bigBlind: 3000,
      ante: 400,
      durationMinutes: 6,
    },
  ] as const satisfies readonly BlindLevel[],
} as const;

/**
 * Table configuration (player limits)
 */
export const TABLE_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 9,
  RECOMMENDED_PLAYERS: 6, // 6-max is standard for training
} as const;

/**
 * Tournament payout structure
 */
export type PayoutStructure = {
  readonly position: number;
  readonly percentage: number;
};

/**
 * Tournament configuration
 */
export const TOURNAMENT_CONFIG = {
  STARTING_CHIPS: 3000,
  MIN_BUY_IN: 10,
  ANTE_START_LEVEL: 5, // Antes begin at level 5
  PAYOUT_STRUCTURE: [
    { position: 1, percentage: 50 },
    { position: 2, percentage: 30 },
    { position: 3, percentage: 20 },
  ] as const satisfies readonly PayoutStructure[],
} as const;

/**
 * Standard chip denominations
 */
export const CHIP_DENOMINATIONS = [25, 100, 500, 1000, 5000] as const;

/**
 * Timeouts for player actions and disconnections
 */
export const TIMEOUTS = {
  ACTION_TIMEOUT_SECONDS: 30,
  DISCONNECT_TIMEOUT_SECONDS: 60,
  TIME_BANK_SECONDS: 120, // Extra time bank for difficult decisions
} as const;
