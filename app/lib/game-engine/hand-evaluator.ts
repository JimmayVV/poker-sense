/**
 * Poker Hand Evaluator
 *
 * Evaluates poker hands and determines winners.
 * Uses classification-based approach for correctness and maintainability.
 */

import type { Card, HandEvaluation } from "./types";
import { HandRank } from "./constants";

/**
 * Evaluate a 5-card poker hand
 */
export function evaluateHand(
  cards: readonly [Card, Card, Card, Card, Card]
): HandEvaluation {
  const ranks = cards.map((c) => c.rank).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);

  const isFlush = suits.every((s) => s === suits[0]);
  const isStraight = checkStraight(ranks);
  const rankCounts = countRanks(ranks);

  // Royal Flush: A-K-Q-J-T of same suit
  if (isFlush && isStraight && ranks[0] === 14) {
    return {
      rank: HandRank.ROYAL_FLUSH,
      value: 10000000,
      description: "Royal Flush",
      cards: [...cards],
    };
  }

  // Straight Flush
  if (isFlush && isStraight) {
    return {
      rank: HandRank.STRAIGHT_FLUSH,
      value: 9000000 + (ranks[0] ?? 0),
      description: `Straight Flush, ${rankName(ranks[0] ?? 0)} high`,
      cards: [...cards],
    };
  }

  // Four of a Kind
  const quads = rankCounts.find((c) => c.count === 4);
  if (quads) {
    const kicker = ranks.find((r) => r !== quads.rank) ?? 0;
    return {
      rank: HandRank.FOUR_OF_KIND,
      value: 8000000 + quads.rank * 100 + kicker,
      description: `Four of a Kind, ${rankName(quads.rank)}s`,
      cards: [...cards],
    };
  }

  // Full House
  const trips = rankCounts.find((c) => c.count === 3);
  const pair = rankCounts.find((c) => c.count === 2);
  if (trips && pair) {
    return {
      rank: HandRank.FULL_HOUSE,
      value: 7000000 + trips.rank * 100 + pair.rank,
      description: `Full House, ${rankName(trips.rank)}s over ${rankName(pair.rank)}s`,
      cards: [...cards],
    };
  }

  // Flush
  if (isFlush) {
    const value =
      6000000 + ranks.reduce((sum, r, i) => sum + r * Math.pow(15, 4 - i), 0);
    return {
      rank: HandRank.FLUSH,
      description: `Flush, ${rankName(ranks[0] ?? 0)} high`,
      value,
      cards: [...cards],
    };
  }

  // Straight
  if (isStraight) {
    return {
      rank: HandRank.STRAIGHT,
      value: 5000000 + (ranks[0] ?? 0),
      description: `Straight, ${rankName(ranks[0] ?? 0)} high`,
      cards: [...cards],
    };
  }

  // Three of a Kind
  if (trips) {
    const kickers = ranks.filter((r) => r !== trips.rank).sort((a, b) => b - a);
    const value =
      4000000 + trips.rank * 10000 + (kickers[0] ?? 0) * 100 + (kickers[1] ?? 0);
    return {
      rank: HandRank.THREE_OF_KIND,
      value,
      description: `Three of a Kind, ${rankName(trips.rank)}s`,
      cards: [...cards],
    };
  }

  // Two Pair
  const pairs = rankCounts.filter((c) => c.count === 2).sort((a, b) => b.rank - a.rank);
  if (pairs.length === 2) {
    const kicker = ranks.find((r) => r !== pairs[0]?.rank && r !== pairs[1]?.rank) ?? 0;
    const value =
      3000000 + (pairs[0]?.rank ?? 0) * 10000 + (pairs[1]?.rank ?? 0) * 100 + kicker;
    return {
      rank: HandRank.TWO_PAIR,
      value,
      description: `Two Pair, ${rankName(pairs[0]?.rank ?? 0)}s and ${rankName(pairs[1]?.rank ?? 0)}s`,
      cards: [...cards],
    };
  }

  // One Pair
  if (pair) {
    const kickers = ranks.filter((r) => r !== pair.rank).sort((a, b) => b - a);
    const value =
      2000000 +
      pair.rank * 10000 +
      (kickers[0] ?? 0) * 1000 +
      (kickers[1] ?? 0) * 10 +
      (kickers[2] ?? 0);
    return {
      rank: HandRank.PAIR,
      value,
      description: `Pair of ${rankName(pair.rank)}s`,
      cards: [...cards],
    };
  }

  // High Card
  const value = 1000000 + ranks.reduce((sum, r, i) => sum + r * Math.pow(15, 4 - i), 0);
  return {
    rank: HandRank.HIGH_CARD,
    value,
    description: `${rankName(ranks[0] ?? 0)} high`,
    cards: [...cards],
  };
}

/**
 * Find best 5-card hand from 7 cards
 */
export function findBestHand(cards: readonly Card[]): HandEvaluation {
  if (cards.length < 5) {
    throw new Error("Need at least 5 cards to evaluate");
  }

  if (cards.length === 5) {
    const fiveCards = cards as unknown as readonly [Card, Card, Card, Card, Card];
    return evaluateHand(fiveCards);
  }

  // Generate all 5-card combinations from 7 cards
  const combinations = generateCombinations([...cards], 5);
  let best: HandEvaluation | null = null;

  for (const combo of combinations) {
    if (combo.length === 5) {
      const fiveCards = combo as unknown as readonly [Card, Card, Card, Card, Card];
      const evaluation = evaluateHand(fiveCards);
      if (!best || evaluation.value > best.value) {
        best = evaluation;
      }
    }
  }

  if (!best) {
    throw new Error("Failed to evaluate hand");
  }

  return best;
}

/**
 * Compare two hands, return 1 if hand1 wins, -1 if hand2 wins, 0 if tie
 */
export function compareHands(hand1: HandEvaluation, hand2: HandEvaluation): number {
  if (hand1.value > hand2.value) return 1;
  if (hand1.value < hand2.value) return -1;
  return 0;
}

// Helper functions

function checkStraight(ranks: readonly number[]): boolean {
  const sorted = [...ranks].sort((a, b) => b - a);

  // Check regular straight
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (current === undefined || next === undefined) return false;
    if (current - next !== 1) {
      // Check for A-2-3-4-5 (wheel)
      if (
        sorted[0] === 14 &&
        sorted[1] === 5 &&
        sorted[2] === 4 &&
        sorted[3] === 3 &&
        sorted[4] === 2
      ) {
        return true;
      }
      return false;
    }
  }

  return true;
}

function countRanks(ranks: readonly number[]): { rank: number; count: number }[] {
  const counts = new Map<number, number>();
  for (const rank of ranks) {
    counts.set(rank, (counts.get(rank) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([rank, count]) => ({ rank, count }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank);
}

function generateCombinations<T>(arr: readonly T[], size: number): T[][] {
  const result: T[][] = [];

  function combine(start: number, combo: T[]) {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }

    for (let i = start; i < arr.length; i++) {
      const item = arr[i];
      if (item !== undefined) {
        combo.push(item);
        combine(i + 1, combo);
        combo.pop();
      }
    }
  }

  combine(0, []);
  return result;
}

function rankName(rank: number): string {
  switch (rank) {
    case 14:
      return "Ace";
    case 13:
      return "King";
    case 12:
      return "Queen";
    case 11:
      return "Jack";
    case 10:
      return "Ten";
    case 9:
      return "Nine";
    case 8:
      return "Eight";
    case 7:
      return "Seven";
    case 6:
      return "Six";
    case 5:
      return "Five";
    case 4:
      return "Four";
    case 3:
      return "Three";
    case 2:
      return "Two";
    default:
      return `${rank}`;
  }
}
