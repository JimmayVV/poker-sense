import { describe, it, expect } from "vitest";
import { validateAction } from "./action-validator";
import type { GameState, Player, PlayerAction } from "./types";
import { GameStatus } from "./constants";

// Helper to create minimal game state for testing
function createTestGameState(overrides?: Partial<GameState>): GameState {
  return {
    status: GameStatus.PREFLOP,
    players: [],
    pot: { main: 0, side: [] },
    communityCards: [],
    currentBet: 0,
    dealer: 0,
    currentActor: 0,
    handNumber: 1,
    blinds: { small: 50, big: 100 },
    ...overrides,
  };
}

// Helper to create minimal player for testing
function createTestPlayer(overrides?: Partial<Player>): Player {
  return {
    id: "player1",
    name: "Player 1",
    chips: 1000,
    betThisRound: 0,
    totalBet: 0,
    hand: null,
    isActive: true,
    hasFolded: false,
    isAllIn: false,
    position: 0,
    ...overrides,
  };
}

describe("Action Validator", () => {
  describe("General validation rules", () => {
    it("rejects action when player is not current actor", () => {
      const player = createTestPlayer({ position: 0 });
      const state = createTestGameState({
        currentActor: 1, // Different from player position
        players: [player],
      });
      const action: PlayerAction = { type: "FOLD" };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("not your turn");
    });

    it("rejects action when player is not active", () => {
      const player = createTestPlayer({ position: 0, isActive: false });
      const state = createTestGameState({
        currentActor: 0,
        players: [player],
      });
      const action: PlayerAction = { type: "FOLD" };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("not active");
    });

    it("rejects action when player has already folded", () => {
      const player = createTestPlayer({ position: 0, hasFolded: true });
      const state = createTestGameState({
        currentActor: 0,
        players: [player],
      });
      const action: PlayerAction = { type: "CHECK" };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("already folded");
    });

    it("rejects action when player is all-in (except for special cases)", () => {
      const player = createTestPlayer({ position: 0, isAllIn: true, chips: 0 });
      const state = createTestGameState({
        currentActor: 0,
        players: [player],
      });
      const action: PlayerAction = { type: "CHECK" };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("all-in");
    });
  });

  describe("FOLD validation", () => {
    it("allows fold when it's player's turn", () => {
      const player = createTestPlayer({ position: 0 });
      const state = createTestGameState({
        currentActor: 0,
        players: [player],
      });
      const action: PlayerAction = { type: "FOLD" };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(true);
    });

    it("allows fold even when there's a bet to call", () => {
      const player = createTestPlayer({ position: 0, betThisRound: 0 });
      const state = createTestGameState({
        currentActor: 0,
        currentBet: 200,
        players: [player],
      });
      const action: PlayerAction = { type: "FOLD" };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(true);
    });
  });

  describe("CHECK validation", () => {
    it("allows check when no bet to call", () => {
      const player = createTestPlayer({ position: 0, betThisRound: 0 });
      const state = createTestGameState({
        currentActor: 0,
        currentBet: 0,
        players: [player],
      });
      const action: PlayerAction = { type: "CHECK" };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(true);
    });

    it("allows check when player has matched current bet", () => {
      const player = createTestPlayer({ position: 0, betThisRound: 100 });
      const state = createTestGameState({
        currentActor: 0,
        currentBet: 100,
        players: [player],
      });
      const action: PlayerAction = { type: "CHECK" };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(true);
    });

    it("rejects check when there's a bet to call", () => {
      const player = createTestPlayer({ position: 0, betThisRound: 0 });
      const state = createTestGameState({
        currentActor: 0,
        currentBet: 200,
        players: [player],
      });
      const action: PlayerAction = { type: "CHECK" };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("bet to call");
    });
  });

  describe("CALL validation", () => {
    it("allows call when there's a bet to call", () => {
      const player = createTestPlayer({
        position: 0,
        betThisRound: 0,
        chips: 1000,
      });
      const state = createTestGameState({
        currentActor: 0,
        currentBet: 200,
        players: [player],
      });
      const action: PlayerAction = { type: "CALL" };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(true);
    });

    it("rejects call when no bet to call", () => {
      const player = createTestPlayer({ position: 0, betThisRound: 0 });
      const state = createTestGameState({
        currentActor: 0,
        currentBet: 0,
        players: [player],
      });
      const action: PlayerAction = { type: "CALL" };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("nothing to call");
    });

    it("rejects call when player already matched bet", () => {
      const player = createTestPlayer({ position: 0, betThisRound: 200 });
      const state = createTestGameState({
        currentActor: 0,
        currentBet: 200,
        players: [player],
      });
      const action: PlayerAction = { type: "CALL" };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("already matched");
    });

    it("rejects call when player has insufficient chips (should use ALL_IN)", () => {
      const player = createTestPlayer({
        position: 0,
        betThisRound: 0,
        chips: 50,
      });
      const state = createTestGameState({
        currentActor: 0,
        currentBet: 200,
        players: [player],
      });
      const action: PlayerAction = { type: "CALL" };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("insufficient chips");
    });
  });

  describe("BET validation", () => {
    it("allows bet when no current bet", () => {
      const player = createTestPlayer({ position: 0, chips: 1000 });
      const state = createTestGameState({
        currentActor: 0,
        currentBet: 0,
        players: [player],
        blinds: { small: 50, big: 100 },
      });
      const action: PlayerAction = { type: "BET", amount: 200 };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(true);
    });

    it("rejects bet when there's already a bet", () => {
      const player = createTestPlayer({ position: 0, chips: 1000 });
      const state = createTestGameState({
        currentActor: 0,
        currentBet: 200,
        players: [player],
      });
      const action: PlayerAction = { type: "BET", amount: 300 };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("already a bet");
    });

    it("rejects bet less than big blind", () => {
      const player = createTestPlayer({ position: 0, chips: 1000 });
      const state = createTestGameState({
        currentActor: 0,
        currentBet: 0,
        players: [player],
        blinds: { small: 50, big: 100 },
      });
      const action: PlayerAction = { type: "BET", amount: 50 };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("minimum bet");
    });

    it("rejects bet greater than player chips", () => {
      const player = createTestPlayer({ position: 0, chips: 500 });
      const state = createTestGameState({
        currentActor: 0,
        currentBet: 0,
        players: [player],
      });
      const action: PlayerAction = { type: "BET", amount: 600 };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("insufficient chips");
    });

    it("allows bet equal to player chips (effectively all-in)", () => {
      const player = createTestPlayer({ position: 0, chips: 500 });
      const state = createTestGameState({
        currentActor: 0,
        currentBet: 0,
        players: [player],
        blinds: { small: 50, big: 100 },
      });
      const action: PlayerAction = { type: "BET", amount: 500 };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(true);
    });
  });

  describe("RAISE validation", () => {
    it("allows valid raise", () => {
      const player = createTestPlayer({
        position: 0,
        chips: 1000,
        betThisRound: 0,
      });
      const state = createTestGameState({
        currentActor: 0,
        currentBet: 200,
        players: [player],
        blinds: { small: 50, big: 100 },
      });
      const action: PlayerAction = { type: "RAISE", amount: 400 };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(true);
    });

    it("rejects raise when no current bet (should use BET)", () => {
      const player = createTestPlayer({ position: 0, chips: 1000 });
      const state = createTestGameState({
        currentActor: 0,
        currentBet: 0,
        players: [player],
      });
      const action: PlayerAction = { type: "RAISE", amount: 200 };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("nothing to raise");
    });

    it("rejects raise less than minimum raise", () => {
      const player = createTestPlayer({
        position: 0,
        chips: 1000,
        betThisRound: 0,
      });
      const state = createTestGameState({
        currentActor: 0,
        currentBet: 200,
        players: [player],
        blinds: { small: 50, big: 100 },
      });
      const action: PlayerAction = { type: "RAISE", amount: 250 }; // Less than min raise

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("minimum raise");
    });

    it("rejects raise greater than player chips", () => {
      const player = createTestPlayer({
        position: 0,
        chips: 300,
        betThisRound: 0,
      });
      const state = createTestGameState({
        currentActor: 0,
        currentBet: 200,
        players: [player],
      });
      const action: PlayerAction = { type: "RAISE", amount: 500 };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("insufficient chips");
    });

    it("allows raise equal to player chips (all-in raise)", () => {
      const player = createTestPlayer({
        position: 0,
        chips: 400,
        betThisRound: 0,
      });
      const state = createTestGameState({
        currentActor: 0,
        currentBet: 200,
        players: [player],
        blinds: { small: 50, big: 100 },
      });
      const action: PlayerAction = { type: "RAISE", amount: 400 };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(true);
    });
  });

  describe("ALL_IN validation", () => {
    it("allows all-in when player has chips", () => {
      const player = createTestPlayer({ position: 0, chips: 500 });
      const state = createTestGameState({
        currentActor: 0,
        currentBet: 0,
        players: [player],
      });
      const action: PlayerAction = { type: "ALL_IN" };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(true);
    });

    it("allows all-in when calling with insufficient chips", () => {
      const player = createTestPlayer({ position: 0, chips: 50 });
      const state = createTestGameState({
        currentActor: 0,
        currentBet: 200,
        players: [player],
      });
      const action: PlayerAction = { type: "ALL_IN" };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(true);
    });

    it("rejects all-in when player has no chips", () => {
      const player = createTestPlayer({ position: 0, chips: 0 });
      const state = createTestGameState({
        currentActor: 0,
        players: [player],
      });
      const action: PlayerAction = { type: "ALL_IN" };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("no chips");
    });
  });

  describe("Edge cases", () => {
    it("handles player with partial bet this round", () => {
      const player = createTestPlayer({
        position: 0,
        chips: 800,
        betThisRound: 100,
      });
      const state = createTestGameState({
        currentActor: 0,
        currentBet: 200,
        players: [player],
      });
      const action: PlayerAction = { type: "CALL" };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(true);
    });

    it("validates minimum raise is at least big blind", () => {
      const player = createTestPlayer({
        position: 0,
        chips: 1000,
        betThisRound: 0,
      });
      const state = createTestGameState({
        currentActor: 0,
        currentBet: 100, // Big blind
        players: [player],
        blinds: { small: 50, big: 100 },
      });
      const action: PlayerAction = { type: "RAISE", amount: 200 };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(true);
    });
  });

  describe("Return values", () => {
    it("returns valid result with no error", () => {
      const player = createTestPlayer({ position: 0 });
      const state = createTestGameState({
        currentActor: 0,
        players: [player],
      });
      const action: PlayerAction = { type: "FOLD" };

      const result = validateAction(state, player, action);

      expect(result).toEqual({
        valid: true,
        error: undefined,
      });
    });

    it("returns invalid result with error message", () => {
      const player = createTestPlayer({ position: 0, isActive: false });
      const state = createTestGameState({
        currentActor: 0,
        players: [player],
      });
      const action: PlayerAction = { type: "FOLD" };

      const result = validateAction(state, player, action);

      expect(result.valid).toBe(false);
      expect(typeof result.error).toBe("string");
      expect(result.error).toBeTruthy();
    });
  });
});
