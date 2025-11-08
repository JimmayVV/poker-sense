/**
 * Core TypeScript types for the poker game engine
 *
 * All types are strictly typed with readonly properties for immutability.
 * Branded types are used where appropriate for compile-time safety.
 * All types support JSON serialization.
 */

import type { GameStatus, HandRank, Rank, Suit } from "./constants";

/**
 * Card representation
 * Uses numeric rank (2-14) and single-character suit
 */
export type Card = {
  readonly rank: Rank;
  readonly suit: Suit;
};

/**
 * Player's hole cards (exactly 2 cards)
 */
export type Hand = {
  readonly cards: readonly [Card, Card];
};

/**
 * Pot structure with main pot and side pots
 */
export type Pot = {
  readonly main: number;
  readonly side: readonly SidePot[];
};

/**
 * Side pot for all-in scenarios
 */
export type SidePot = {
  readonly amount: number;
  readonly eligiblePlayers: readonly string[];
};

/**
 * Player state
 */
export type Player = {
  readonly id: string;
  readonly name: string;
  readonly chips: number;
  readonly betThisRound: number;
  readonly totalBet: number;
  readonly hand: Hand | null;
  readonly isActive: boolean;
  readonly hasFolded: boolean;
  readonly isAllIn: boolean;
  readonly position: number;
};

/**
 * Player actions (discriminated union for type safety)
 */
export type PlayerAction =
  | { readonly type: "FOLD" }
  | { readonly type: "CHECK" }
  | { readonly type: "CALL" }
  | { readonly type: "BET"; readonly amount: number }
  | { readonly type: "RAISE"; readonly amount: number }
  | { readonly type: "ALL_IN" };

/**
 * Game state (immutable)
 */
export type GameState = {
  readonly status: GameStatus;
  readonly players: readonly Player[];
  readonly pot: Pot;
  readonly communityCards: readonly Card[];
  readonly currentBet: number;
  readonly dealer: number;
  readonly currentActor: number;
  readonly handNumber: number;
  readonly blinds: {
    readonly small: number;
    readonly big: number;
  };
};

/**
 * Hand evaluation result
 */
export type HandEvaluation = {
  readonly rank: HandRank;
  readonly value: number; // Unique value for comparison (includes kickers)
  readonly description: string;
  readonly cards: readonly Card[]; // Best 5 cards
};

// ============================================================================
// Type Guards (100% test coverage required)
// ============================================================================

/**
 * Type guard for Card
 */
export function isCard(value: unknown): value is Card {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const card = value as Record<string, unknown>;

  // Check rank is number between 2-14
  if (typeof card["rank"] !== "number") {
    return false;
  }
  if (card["rank"] < 2 || card["rank"] > 14) {
    return false;
  }

  // Check suit is one of the valid suits
  if (typeof card["suit"] !== "string") {
    return false;
  }
  if (!["h", "d", "c", "s"].includes(card["suit"])) {
    return false;
  }

  return true;
}

/**
 * Type guard for Hand
 */
export function isValidHand(value: unknown): value is Hand {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const hand = value as Record<string, unknown>;

  if (!Array.isArray(hand["cards"])) {
    return false;
  }

  // Must have exactly 2 cards
  if (hand["cards"].length !== 2) {
    return false;
  }

  // Both must be valid cards
  if (!hand["cards"].every(isCard)) {
    return false;
  }

  // Cannot have duplicate cards
  const cards = hand["cards"] as Card[];
  const card1 = cards[0];
  const card2 = cards[1];
  if (!card1 || !card2) {
    return false;
  }
  if (card1.rank === card2.rank && card1.suit === card2.suit) {
    return false;
  }

  return true;
}

/**
 * Type guard for GameState
 */
export function isValidGameState(value: unknown): value is GameState {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Record<string, unknown>;

  // Check required fields exist
  if (
    typeof state["status"] !== "string" ||
    !Array.isArray(state["players"]) ||
    typeof state["pot"] !== "object" ||
    !Array.isArray(state["communityCards"]) ||
    typeof state["currentBet"] !== "number" ||
    typeof state["dealer"] !== "number" ||
    typeof state["currentActor"] !== "number" ||
    typeof state["handNumber"] !== "number" ||
    typeof state["blinds"] !== "object"
  ) {
    return false;
  }

  // Validate status is a valid GameStatus
  const validStatuses = [
    "WAITING",
    "DEALING",
    "PREFLOP",
    "FLOP",
    "TURN",
    "RIVER",
    "SHOWDOWN",
    "COMPLETE",
  ];
  if (!validStatuses.includes(state["status"])) {
    return false;
  }

  // Validate pot is non-negative
  const pot = state["pot"] as Record<string, unknown>;
  if (typeof pot["main"] !== "number" || pot["main"] < 0) {
    return false;
  }

  // Validate currentBet is non-negative
  if (state["currentBet"] < 0) {
    return false;
  }

  // Validate blinds
  const blinds = state["blinds"] as Record<string, unknown>;
  if (
    typeof blinds["small"] !== "number" ||
    typeof blinds["big"] !== "number" ||
    blinds["small"] < 0 ||
    blinds["big"] < 0
  ) {
    return false;
  }

  return true;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a card
 */
export function createCard(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

/**
 * Serialize card to compact string format (e.g., "As", "Kh", "Td")
 */
export function serializeCard(card: Card): string {
  const rankStr = rankToString(card.rank);
  return `${rankStr}${card.suit}`;
}

/**
 * Deserialize card from string format
 */
export function deserializeCard(str: string): Card {
  if (str.length !== 2) {
    throw new Error(`Invalid card string: ${str}`);
  }

  const rankStr = str[0];
  const suitStr = str[1];

  if (!rankStr || !suitStr) {
    throw new Error(`Invalid card string: ${str}`);
  }

  const rank = stringToRank(rankStr);
  const suit = suitStr as Suit;

  if (!["h", "d", "c", "s"].includes(suit)) {
    throw new Error(`Invalid suit: ${suitStr}`);
  }

  return createCard(rank, suit);
}

/**
 * Compare two cards for equality
 */
export function cardsEqual(card1: Card, card2: Card): boolean {
  return card1.rank === card2.rank && card1.suit === card2.suit;
}

/**
 * Convert rank to string (for serialization)
 */
function rankToString(rank: Rank): string {
  switch (rank) {
    case 14:
      return "A";
    case 13:
      return "K";
    case 12:
      return "Q";
    case 11:
      return "J";
    case 10:
      return "T";
    default:
      return rank.toString();
  }
}

/**
 * Convert string to rank (for deserialization)
 */
function stringToRank(str: string): Rank {
  switch (str) {
    case "A":
      return 14;
    case "K":
      return 13;
    case "Q":
      return 12;
    case "J":
      return 11;
    case "T":
      return 10;
    case "9":
      return 9;
    case "8":
      return 8;
    case "7":
      return 7;
    case "6":
      return 6;
    case "5":
      return 5;
    case "4":
      return 4;
    case "3":
      return 3;
    case "2":
      return 2;
    default:
      throw new Error(`Invalid rank string: ${str}`);
  }
}
