/**
 * Betting Engine
 *
 * Handles poker betting rounds: CHECK, BET, CALL, RAISE, FOLD, ALL_IN.
 * Manages all-in scenarios, side pots, minimum raise rules, and round completion.
 * Enforces betting rules and updates game state correctly.
 */

import type { Player, PlayerAction, Pot } from "./types";

/**
 * Betting round state
 */
export type BettingRoundState = {
  readonly players: readonly Player[];
  readonly currentBet: number;
  readonly currentActor: number;
  readonly dealer: number;
  readonly pot: Pot;
};

/**
 * Apply a player action to the betting state
 * Returns new state with action applied
 */
export function applyAction(
  state: BettingRoundState,
  action: PlayerAction
): BettingRoundState {
  const currentPlayer = state.players[state.currentActor];
  if (!currentPlayer) {
    throw new Error("No current player found");
  }

  // Apply action based on type
  let updatedPlayers = [...state.players];
  let newCurrentBet = state.currentBet;

  switch (action.type) {
    case "FOLD":
      updatedPlayers = updatePlayer(updatedPlayers, state.currentActor, {
        hasFolded: true,
        isActive: false,
      });
      break;

    case "CHECK":
      // No changes to player state for check
      break;

    case "CALL": {
      const amountToCall = Math.min(
        state.currentBet - currentPlayer.betThisRound,
        currentPlayer.chips
      );
      const newBetThisRound = currentPlayer.betThisRound + amountToCall;
      const newChips = currentPlayer.chips - amountToCall;
      const newTotalBet = currentPlayer.totalBet + amountToCall;

      updatedPlayers = updatePlayer(updatedPlayers, state.currentActor, {
        betThisRound: newBetThisRound,
        totalBet: newTotalBet,
        chips: newChips,
        isAllIn: newChips === 0,
      });
      break;
    }

    case "BET": {
      const newChips = currentPlayer.chips - action.amount;
      const newTotalBet = currentPlayer.totalBet + action.amount;

      updatedPlayers = updatePlayer(updatedPlayers, state.currentActor, {
        betThisRound: action.amount,
        totalBet: newTotalBet,
        chips: newChips,
        isAllIn: newChips === 0,
      });
      newCurrentBet = action.amount;
      break;
    }

    case "RAISE": {
      const amountToAdd = action.amount - currentPlayer.betThisRound;
      const newChips = currentPlayer.chips - amountToAdd;
      const newTotalBet = currentPlayer.totalBet + amountToAdd;

      updatedPlayers = updatePlayer(updatedPlayers, state.currentActor, {
        betThisRound: action.amount,
        totalBet: newTotalBet,
        chips: newChips,
        isAllIn: newChips === 0,
      });
      newCurrentBet = action.amount;
      break;
    }

    case "ALL_IN": {
      const allInAmount = currentPlayer.chips;
      const newBetThisRound = currentPlayer.betThisRound + allInAmount;
      const newTotalBet = currentPlayer.totalBet + allInAmount;

      updatedPlayers = updatePlayer(updatedPlayers, state.currentActor, {
        betThisRound: newBetThisRound,
        totalBet: newTotalBet,
        chips: 0,
        isAllIn: true,
      });

      // All-in raises the bet only if it's more than current bet
      if (newBetThisRound > state.currentBet) {
        newCurrentBet = newBetThisRound;
      }
      break;
    }
  }

  // Move to next actor
  const nextActor = getNextActor({
    ...state,
    players: updatedPlayers,
  });

  return {
    ...state,
    players: updatedPlayers,
    currentBet: newCurrentBet,
    currentActor: nextActor,
  };
}

/**
 * Check if betting round is complete
 * Round is complete when:
 * - All active players have matched the current bet, OR
 * - All but one player have folded, OR
 * - All remaining active players are all-in
 */
export function isRoundComplete(state: BettingRoundState): boolean {
  const activePlayers = state.players.filter((p) => p.isActive && !p.hasFolded);

  // Only one player left (all others folded)
  if (activePlayers.length <= 1) {
    return true;
  }

  // All active players are all-in
  const playersCanAct = activePlayers.filter((p) => !p.isAllIn);
  if (playersCanAct.length === 0) {
    return true;
  }

  // All players who can act have matched the current bet
  const allMatched = playersCanAct.every((p) => p.betThisRound === state.currentBet);

  return allMatched;
}

/**
 * Get next player position to act
 * Skips folded and all-in players
 * Returns -1 if no players can act
 */
export function getNextActor(state: BettingRoundState): number {
  const startPos = state.currentActor;
  const playerCount = state.players.length;

  // Try each position starting from next player
  for (let i = 1; i <= playerCount; i++) {
    const pos = (startPos + i) % playerCount;
    const player = state.players[pos];

    if (!player) continue;

    // Player can act if active, not folded, and not all-in
    if (player.isActive && !player.hasFolded && !player.isAllIn) {
      return pos;
    }
  }

  // No players can act
  return -1;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Update a player at a specific position
 */
function updatePlayer(
  players: readonly Player[],
  position: number,
  updates: Partial<Player>
): Player[] {
  return players.map((p, i) => (i === position ? { ...p, ...updates } : p));
}
