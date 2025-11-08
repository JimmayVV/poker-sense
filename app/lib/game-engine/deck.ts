/**
 * Deck Management System
 *
 * Handles 52-card deck creation, shuffling, dealing, and tracking.
 * Supports both cryptographically secure RNG (production) and seeded RNG (testing).
 * All operations are immutable - return new deck instances.
 */

import type { Card } from "./types";
import { Rank, Suit } from "./constants";
import { createCard } from "./types";

/**
 * Random number generator interface
 * Supports both secure (crypto) and deterministic (seeded) implementations
 */
export interface RandomNumberGenerator {
  /**
   * Generate next random number between 0 (inclusive) and 1 (exclusive)
   */
  next(): number;

  /**
   * Shuffle array using Fisher-Yates algorithm
   * Returns new array (does not mutate original)
   */
  shuffle<T>(arr: readonly T[]): readonly T[];
}

/**
 * Deck state
 * Immutable - all operations return new deck
 */
export type Deck = {
  readonly cards: readonly Card[];
  readonly dealtIndex: number; // Index of next card to deal
};

/**
 * Create a standard 52-card deck
 * Cards are in deterministic order (not shuffled)
 */
export function createDeck(): Deck {
  const cards: Card[] = [];

  // Create all 52 cards (4 suits × 13 ranks)
  const suits = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];
  const ranks = [
    Rank.TWO,
    Rank.THREE,
    Rank.FOUR,
    Rank.FIVE,
    Rank.SIX,
    Rank.SEVEN,
    Rank.EIGHT,
    Rank.NINE,
    Rank.TEN,
    Rank.JACK,
    Rank.QUEEN,
    Rank.KING,
    Rank.ACE,
  ];

  for (const suit of suits) {
    for (const rank of ranks) {
      cards.push(createCard(rank, suit));
    }
  }

  return {
    cards,
    dealtIndex: 0,
  };
}

/**
 * Shuffle deck using Fisher-Yates algorithm
 * Returns new shuffled deck with dealt index reset to 0
 */
export function shuffleDeck(deck: Deck, rng: RandomNumberGenerator): Deck {
  const shuffled = rng.shuffle(deck.cards);

  return {
    cards: shuffled,
    dealtIndex: 0,
  };
}

/**
 * Deal a single card from the deck
 * Returns [new deck, card]
 * Throws error if no cards remaining
 */
export function dealCard(deck: Deck): [Deck, Card] {
  if (getRemainingCount(deck) === 0) {
    throw new Error("No cards remaining in deck");
  }

  const card = deck.cards[deck.dealtIndex];
  if (!card) {
    throw new Error("Card not found at dealt index");
  }

  const newDeck: Deck = {
    cards: deck.cards,
    dealtIndex: deck.dealtIndex + 1,
  };

  return [newDeck, card];
}

/**
 * Deal multiple cards from the deck
 * Returns [new deck, cards array]
 * Throws error if not enough cards remaining
 */
export function dealCards(deck: Deck, count: number): [Deck, readonly Card[]] {
  if (count < 0) {
    throw new Error("Cannot deal negative number of cards");
  }

  if (count === 0) {
    return [deck, []];
  }

  const remaining = getRemainingCount(deck);
  if (count > remaining) {
    throw new Error(
      `Not enough cards remaining (requested: ${count}, available: ${remaining})`
    );
  }

  const cards: Card[] = [];
  for (let i = 0; i < count; i++) {
    const card = deck.cards[deck.dealtIndex + i];
    if (!card) {
      throw new Error(`Card not found at index ${deck.dealtIndex + i}`);
    }
    cards.push(card);
  }

  const newDeck: Deck = {
    cards: deck.cards,
    dealtIndex: deck.dealtIndex + count,
  };

  return [newDeck, cards];
}

/**
 * Get number of cards remaining in deck
 */
export function getRemainingCount(deck: Deck): number {
  return deck.cards.length - deck.dealtIndex;
}

/**
 * Reset deck to initial state (all cards available)
 * Maintains current card order - use shuffleDeck() to randomize
 */
export function resetDeck(deck: Deck): Deck {
  return {
    cards: deck.cards,
    dealtIndex: 0,
  };
}

// ============================================================================
// Random Number Generators
// ============================================================================

/**
 * Create a seeded RNG for deterministic testing
 * Same seed = same sequence of random numbers
 */
export function createSeededRNG(seed: number): RandomNumberGenerator {
  let state = seed;

  return {
    next: () => {
      // Linear congruential generator (LCG)
      // Using values from Numerical Recipes
      state = (state * 1664525 + 1013904223) % 2 ** 32 >>> 0;
      return state / 2 ** 32;
    },

    shuffle: <T>(arr: readonly T[]): readonly T[] => {
      // Fisher-Yates shuffle
      const result = [...arr];

      for (let i = result.length - 1; i > 0; i--) {
        // Generate deterministic random index
        state = (state * 1664525 + 1013904223) % 2 ** 32 >>> 0;
        const j = Math.floor((state / 2 ** 32) * (i + 1));

        // Swap elements
        const temp = result[i];
        const other = result[j];
        if (temp !== undefined && other !== undefined) {
          result[i] = other;
          result[j] = temp;
        }
      }

      return result;
    },
  };
}

/**
 * Create a cryptographically secure RNG for production
 * Uses crypto.getRandomValues() for true randomness
 */
export function createSecureRNG(): RandomNumberGenerator {
  return {
    next: () => {
      // Use crypto.getRandomValues for secure random bytes
      const buffer = new Uint32Array(1);
      crypto.getRandomValues(buffer);
      const value = buffer[0];
      if (value === undefined) {
        throw new Error("Failed to generate random value");
      }
      return value / 2 ** 32;
    },

    shuffle: <T>(arr: readonly T[]): readonly T[] => {
      // Fisher-Yates shuffle with crypto random
      const result = [...arr];

      for (let i = result.length - 1; i > 0; i--) {
        // Generate cryptographically secure random index
        const buffer = new Uint32Array(1);
        crypto.getRandomValues(buffer);
        const randomValue = buffer[0];
        if (randomValue === undefined) {
          throw new Error("Failed to generate random value");
        }
        const j = Math.floor((randomValue / 2 ** 32) * (i + 1));

        // Swap elements
        const temp = result[i];
        const other = result[j];
        if (temp !== undefined && other !== undefined) {
          result[i] = other;
          result[j] = temp;
        }
      }

      return result;
    },
  };
}
