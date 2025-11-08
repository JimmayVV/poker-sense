/**
 * Pot Calculator
 *
 * Handles main pot and side pot calculations for complex all-in scenarios.
 * Supports multiple all-ins at different amounts and correct chip distribution.
 */

import type { Pot, SidePot } from "./types";

/**
 * Player contribution to the pot
 */
export type PlayerContribution = {
  readonly playerId: string;
  readonly amount: number;
  readonly isAllIn?: boolean;
};

/**
 * Winner of a specific pot
 */
export type Winner = {
  readonly playerId: string;
  readonly potIndex: number; // 0 = main pot, 1+ = side pots
};

/**
 * Distribution of chips to a player
 */
export type Distribution = {
  readonly playerId: string;
  readonly amount: number;
};

/**
 * Create an empty pot
 */
export function createEmptyPot(): Pot {
  return {
    main: 0,
    side: [],
  };
}

/**
 * Calculate pot structure from player contributions
 * Handles main pot and side pots for all-in scenarios
 */
export function calculatePot(contributions: readonly PlayerContribution[]): Pot {
  if (contributions.length === 0) {
    return createEmptyPot();
  }

  // Filter out players with zero contributions
  const activePlayers = contributions.filter((c) => c.amount > 0);

  if (activePlayers.length === 0) {
    return createEmptyPot();
  }

  // Check if there are any all-ins
  const hasAllIns = activePlayers.some((c) => c.isAllIn);

  // If no all-ins, simple case: main pot = sum of all contributions
  if (!hasAllIns) {
    const totalPot = activePlayers.reduce((sum, c) => sum + c.amount, 0);
    return {
      main: totalPot,
      side: [],
    };
  }

  // Sort players by contribution amount (ascending)
  const sorted = [...activePlayers].sort((a, b) => a.amount - b.amount);

  // Calculate pots level by level
  const sidePots: SidePot[] = [];
  let previousLevel = 0;
  let mainPot = 0;

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    if (!current) continue;

    const currentLevel = current.amount;

    // Skip if same as previous level
    if (currentLevel === previousLevel) continue;

    // Players who contributed at this level or higher
    const eligibleCount = sorted.length - i;
    const potAmount = (currentLevel - previousLevel) * eligibleCount;
    const eligiblePlayers = sorted.slice(i).map((c) => c.playerId);

    // First pot is the main pot
    if (i === 0) {
      mainPot = potAmount;
    } else {
      sidePots.push({
        amount: potAmount,
        eligiblePlayers,
      });
    }

    previousLevel = currentLevel;
  }

  return {
    main: mainPot,
    side: sidePots,
  };
}

/**
 * Distribute pot to winners
 * Handles split pots when multiple players tie
 */
export function distributePot(
  pot: Pot,
  winners: readonly Winner[]
): readonly Distribution[] {
  if (winners.length === 0) {
    return [];
  }

  // Group winners by pot index
  const winnersByPot = new Map<number, string[]>();

  for (const winner of winners) {
    const existing = winnersByPot.get(winner.potIndex) ?? [];
    winnersByPot.set(winner.potIndex, [...existing, winner.playerId]);
  }

  // Calculate distribution for each pot
  const distributions = new Map<string, number>();

  // Distribute main pot (index 0)
  const mainWinners = winnersByPot.get(0);
  if (mainWinners && mainWinners.length > 0) {
    const mainSplit = splitPot(pot.main, mainWinners);
    for (const [playerId, amount] of mainSplit) {
      distributions.set(playerId, (distributions.get(playerId) ?? 0) + amount);
    }
  }

  // Distribute side pots (index 1+)
  for (let i = 0; i < pot.side.length; i++) {
    const sidePot = pot.side[i];
    if (!sidePot) continue;

    const sideWinners = winnersByPot.get(i + 1);
    if (sideWinners && sideWinners.length > 0) {
      const sideSplit = splitPot(sidePot.amount, sideWinners);
      for (const [playerId, amount] of sideSplit) {
        distributions.set(playerId, (distributions.get(playerId) ?? 0) + amount);
      }
    } else {
      // No winners specified for this side pot
      throw new Error(`No winner specified for side pot ${i + 1}`);
    }
  }

  // Validate all pot indices are valid
  for (const winner of winners) {
    const maxIndex = pot.side.length;
    if (winner.potIndex > maxIndex) {
      throw new Error(`Invalid pot index ${winner.potIndex} (max: ${maxIndex})`);
    }
  }

  // Convert to array
  return Array.from(distributions.entries()).map(([playerId, amount]) => ({
    playerId,
    amount,
  }));
}

/**
 * Split pot amount among multiple winners
 * Handles uneven splits by distributing remainder
 */
function splitPot(amount: number, winners: readonly string[]): Map<string, number> {
  const result = new Map<string, number>();

  if (winners.length === 0) {
    return result;
  }

  const baseAmount = Math.floor(amount / winners.length);
  const remainder = amount % winners.length;

  // Distribute base amount to all winners
  for (const playerId of winners) {
    result.set(playerId, baseAmount);
  }

  // Distribute remainder to first N players (deterministic)
  for (let i = 0; i < remainder; i++) {
    const playerId = winners[i];
    if (playerId) {
      result.set(playerId, baseAmount + 1);
    }
  }

  return result;
}
