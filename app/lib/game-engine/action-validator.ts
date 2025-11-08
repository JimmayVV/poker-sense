/**
 * Player Action Validator
 *
 * Validates player actions against current game state.
 * Enforces betting limits, turn order, and poker rules.
 * Server-side validation only - prevents cheating and invalid moves.
 */

import type { GameState, Player, PlayerAction } from "./types";

/**
 * Result of action validation
 */
export type ActionValidationResult = {
  readonly valid: boolean;
  readonly error?: string;
};

/**
 * Validate a player action against current game state
 */
export function validateAction(
  state: GameState,
  player: Player,
  action: PlayerAction
): ActionValidationResult {
  // General preconditions
  const generalCheck = validateGeneralPreconditions(state, player);
  if (!generalCheck.valid) {
    return generalCheck;
  }

  // Action-specific validation
  switch (action.type) {
    case "FOLD":
      return validateFold();
    case "CHECK":
      return validateCheck(state, player);
    case "CALL":
      return validateCall(state, player);
    case "BET":
      return validateBet(state, player, action.amount);
    case "RAISE":
      return validateRaise(state, player, action.amount);
    case "ALL_IN":
      return validateAllIn(player);
    default:
      return invalid("Unknown action type");
  }
}

// ============================================================================
// General Validation
// ============================================================================

function validateGeneralPreconditions(
  state: GameState,
  player: Player
): ActionValidationResult {
  // Check if it's player's turn
  if (player.position !== state.currentActor) {
    return invalid("It's not your turn");
  }

  // Check if player is active
  if (!player.isActive) {
    return invalid("Player is not active in this hand");
  }

  // Check if player has already folded
  if (player.hasFolded) {
    return invalid("Player has already folded");
  }

  // Check if player is all-in (can't take further actions)
  if (player.isAllIn) {
    return invalid("Player is already all-in");
  }

  return valid();
}

// ============================================================================
// Action-Specific Validation
// ============================================================================

function validateFold(): ActionValidationResult {
  // Fold is always valid when it's your turn
  return valid();
}

function validateCheck(state: GameState, player: Player): ActionValidationResult {
  // Can only check if there's no bet to call
  const amountToCall = state.currentBet - player.betThisRound;

  if (amountToCall > 0) {
    return invalid("Cannot check - there's a bet to call");
  }

  return valid();
}

function validateCall(state: GameState, player: Player): ActionValidationResult {
  // Can't call if there's no bet
  if (state.currentBet === 0) {
    return invalid("There is nothing to call");
  }

  // Check if player already matched the bet
  if (player.betThisRound === state.currentBet) {
    return invalid("Player has already matched the current bet");
  }

  // Calculate amount to call
  const amountToCall = state.currentBet - player.betThisRound;

  // Check if player has enough chips to call
  if (amountToCall > player.chips) {
    return invalid("Player has insufficient chips to call - use ALL_IN instead");
  }

  return valid();
}

function validateBet(
  state: GameState,
  player: Player,
  amount: number
): ActionValidationResult {
  // Can only bet if there's no current bet
  if (state.currentBet > 0) {
    return invalid("Cannot bet - there's already a bet (use RAISE instead)");
  }

  // Bet must be at least big blind
  const minBet = state.blinds.big;
  if (amount < minBet) {
    return invalid(`Bet must be at least the minimum bet (${minBet})`);
  }

  // Bet cannot exceed player's chips
  if (amount > player.chips) {
    return invalid("Player has insufficient chips for this bet");
  }

  return valid();
}

function validateRaise(
  state: GameState,
  player: Player,
  amount: number
): ActionValidationResult {
  // Can only raise if there's a bet to raise
  if (state.currentBet === 0) {
    return invalid("There is nothing to raise - use BET instead");
  }

  // Calculate minimum raise
  // Minimum raise = current bet + size of previous raise (at least big blind)
  const previousRaiseSize = Math.max(state.currentBet, state.blinds.big);
  const minRaise = state.currentBet + previousRaiseSize;

  if (amount < minRaise) {
    return invalid(`Raise must be at least the minimum raise (${minRaise})`);
  }

  // Raise cannot exceed player's chips
  if (amount > player.chips) {
    return invalid("Player has insufficient chips for this raise");
  }

  return valid();
}

function validateAllIn(player: Player): ActionValidationResult {
  // Player must have chips to go all-in
  if (player.chips <= 0) {
    return invalid("Cannot go all-in with no chips remaining");
  }

  return valid();
}

// ============================================================================
// Helper Functions
// ============================================================================

function valid(): ActionValidationResult {
  return { valid: true };
}

function invalid(error: string): ActionValidationResult {
  return { valid: false, error };
}
