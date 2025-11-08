import { describe, it, expect } from "vitest";
import {
  applyAction,
  isRoundComplete,
  getNextActor,
  type BettingRoundState,
} from "./betting";
import type { Player, PlayerAction } from "./types";

// Helper to create minimal betting round state
function createBettingState(overrides?: Partial<BettingRoundState>): BettingRoundState {
  return {
    players: [],
    currentBet: 0,
    currentActor: 0,
    dealer: 0,
    pot: { main: 0, side: [] },
    ...overrides,
  };
}

// Helper to create minimal player
function createPlayer(overrides?: Partial<Player>): Player {
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

describe("Betting Engine", () => {
  describe("applyAction - FOLD", () => {
    it("marks player as folded and removes from active play", () => {
      const player = createPlayer({ position: 0 });
      const state = createBettingState({
        players: [player],
        currentActor: 0,
      });
      const action: PlayerAction = { type: "FOLD" };

      const result = applyAction(state, action);

      expect(result.players[0]?.hasFolded).toBe(true);
      expect(result.players[0]?.isActive).toBe(false);
    });

    it("moves to next player after fold", () => {
      const players = [
        createPlayer({ position: 0 }),
        createPlayer({ id: "player2", position: 1 }),
      ];
      const state = createBettingState({
        players,
        currentActor: 0,
      });
      const action: PlayerAction = { type: "FOLD" };

      const result = applyAction(state, action);

      expect(result.currentActor).toBe(1);
    });
  });

  describe("applyAction - CHECK", () => {
    it("allows check when no bet to call", () => {
      const player = createPlayer({ position: 0, betThisRound: 0 });
      const state = createBettingState({
        players: [player],
        currentBet: 0,
        currentActor: 0,
      });
      const action: PlayerAction = { type: "CHECK" };

      const result = applyAction(state, action);

      expect(result.players[0]?.betThisRound).toBe(0);
      expect(result.currentBet).toBe(0);
    });

    it("moves to next player after check", () => {
      const players = [
        createPlayer({ position: 0 }),
        createPlayer({ id: "player2", position: 1 }),
      ];
      const state = createBettingState({
        players,
        currentActor: 0,
      });
      const action: PlayerAction = { type: "CHECK" };

      const result = applyAction(state, action);

      expect(result.currentActor).toBe(1);
    });
  });

  describe("applyAction - CALL", () => {
    it("matches current bet", () => {
      const player = createPlayer({ position: 0, chips: 1000, betThisRound: 0 });
      const state = createBettingState({
        players: [player],
        currentBet: 200,
        currentActor: 0,
      });
      const action: PlayerAction = { type: "CALL" };

      const result = applyAction(state, action);

      expect(result.players[0]?.betThisRound).toBe(200);
      expect(result.players[0]?.chips).toBe(800);
    });

    it("handles partial call (less chips than bet)", () => {
      const player = createPlayer({ position: 0, chips: 100, betThisRound: 0 });
      const state = createBettingState({
        players: [player],
        currentBet: 200,
        currentActor: 0,
      });
      const action: PlayerAction = { type: "CALL" };

      const result = applyAction(state, action);

      expect(result.players[0]?.betThisRound).toBe(100);
      expect(result.players[0]?.chips).toBe(0);
      expect(result.players[0]?.isAllIn).toBe(true);
    });

    it("updates total bet correctly", () => {
      const player = createPlayer({
        position: 0,
        chips: 1000,
        betThisRound: 50,
        totalBet: 50,
      });
      const state = createBettingState({
        players: [player],
        currentBet: 200,
        currentActor: 0,
      });
      const action: PlayerAction = { type: "CALL" };

      const result = applyAction(state, action);

      expect(result.players[0]?.betThisRound).toBe(200);
      expect(result.players[0]?.totalBet).toBe(200);
      expect(result.players[0]?.chips).toBe(850);
    });
  });

  describe("applyAction - BET", () => {
    it("places initial bet", () => {
      const player = createPlayer({ position: 0, chips: 1000 });
      const state = createBettingState({
        players: [player],
        currentBet: 0,
        currentActor: 0,
      });
      const action: PlayerAction = { type: "BET", amount: 200 };

      const result = applyAction(state, action);

      expect(result.players[0]?.betThisRound).toBe(200);
      expect(result.players[0]?.chips).toBe(800);
      expect(result.currentBet).toBe(200);
    });

    it("updates total bet correctly", () => {
      const player = createPlayer({
        position: 0,
        chips: 1000,
        totalBet: 0,
      });
      const state = createBettingState({
        players: [player],
        currentBet: 0,
        currentActor: 0,
      });
      const action: PlayerAction = { type: "BET", amount: 200 };

      const result = applyAction(state, action);

      expect(result.players[0]?.totalBet).toBe(200);
    });
  });

  describe("applyAction - RAISE", () => {
    it("raises the current bet", () => {
      const player = createPlayer({ position: 0, chips: 1000, betThisRound: 0 });
      const state = createBettingState({
        players: [player],
        currentBet: 200,
        currentActor: 0,
      });
      const action: PlayerAction = { type: "RAISE", amount: 400 };

      const result = applyAction(state, action);

      expect(result.players[0]?.betThisRound).toBe(400);
      expect(result.players[0]?.chips).toBe(600);
      expect(result.currentBet).toBe(400);
    });

    it("handles raise with existing bet this round", () => {
      const player = createPlayer({
        position: 0,
        chips: 1000,
        betThisRound: 100,
        totalBet: 100,
      });
      const state = createBettingState({
        players: [player],
        currentBet: 200,
        currentActor: 0,
      });
      const action: PlayerAction = { type: "RAISE", amount: 400 };

      const result = applyAction(state, action);

      expect(result.players[0]?.betThisRound).toBe(400);
      expect(result.players[0]?.totalBet).toBe(400);
      expect(result.players[0]?.chips).toBe(700);
    });
  });

  describe("applyAction - ALL_IN", () => {
    it("bets all remaining chips", () => {
      const player = createPlayer({ position: 0, chips: 500, betThisRound: 0 });
      const state = createBettingState({
        players: [player],
        currentBet: 0,
        currentActor: 0,
      });
      const action: PlayerAction = { type: "ALL_IN" };

      const result = applyAction(state, action);

      expect(result.players[0]?.betThisRound).toBe(500);
      expect(result.players[0]?.chips).toBe(0);
      expect(result.players[0]?.isAllIn).toBe(true);
    });

    it("handles all-in as call when less than current bet", () => {
      const player = createPlayer({ position: 0, chips: 100, betThisRound: 0 });
      const state = createBettingState({
        players: [player],
        currentBet: 200,
        currentActor: 0,
      });
      const action: PlayerAction = { type: "ALL_IN" };

      const result = applyAction(state, action);

      expect(result.players[0]?.betThisRound).toBe(100);
      expect(result.players[0]?.chips).toBe(0);
      expect(result.players[0]?.isAllIn).toBe(true);
      expect(result.currentBet).toBe(200); // Current bet unchanged
    });

    it("handles all-in as raise when more than current bet", () => {
      const player = createPlayer({ position: 0, chips: 500, betThisRound: 0 });
      const state = createBettingState({
        players: [player],
        currentBet: 200,
        currentActor: 0,
      });
      const action: PlayerAction = { type: "ALL_IN" };

      const result = applyAction(state, action);

      expect(result.players[0]?.betThisRound).toBe(500);
      expect(result.players[0]?.chips).toBe(0);
      expect(result.players[0]?.isAllIn).toBe(true);
      expect(result.currentBet).toBe(500);
    });
  });

  describe("isRoundComplete", () => {
    it("returns false when not all players have acted", () => {
      const players = [
        createPlayer({ position: 0, betThisRound: 100 }),
        createPlayer({ id: "player2", position: 1, betThisRound: 0 }),
      ];
      const state = createBettingState({
        players,
        currentBet: 100,
      });

      expect(isRoundComplete(state)).toBe(false);
    });

    it("returns true when all players have matched the bet", () => {
      const players = [
        createPlayer({ position: 0, betThisRound: 100 }),
        createPlayer({ id: "player2", position: 1, betThisRound: 100 }),
      ];
      const state = createBettingState({
        players,
        currentBet: 100,
      });

      expect(isRoundComplete(state)).toBe(true);
    });

    it("returns true when all but one player have folded", () => {
      const players = [
        createPlayer({ position: 0, betThisRound: 100 }),
        createPlayer({
          id: "player2",
          position: 1,
          hasFolded: true,
          isActive: false,
        }),
      ];
      const state = createBettingState({
        players,
        currentBet: 100,
      });

      expect(isRoundComplete(state)).toBe(true);
    });

    it("returns true when remaining players are all-in", () => {
      const players = [
        createPlayer({ position: 0, betThisRound: 500, isAllIn: true, chips: 0 }),
        createPlayer({
          id: "player2",
          position: 1,
          betThisRound: 500,
          isAllIn: true,
          chips: 0,
        }),
      ];
      const state = createBettingState({
        players,
        currentBet: 500,
      });

      expect(isRoundComplete(state)).toBe(true);
    });

    it("returns false when player needs to call", () => {
      const players = [
        createPlayer({ position: 0, betThisRound: 200 }),
        createPlayer({ id: "player2", position: 1, betThisRound: 100 }),
      ];
      const state = createBettingState({
        players,
        currentBet: 200,
      });

      expect(isRoundComplete(state)).toBe(false);
    });
  });

  describe("getNextActor", () => {
    it("returns next active player position", () => {
      const players = [
        createPlayer({ position: 0 }),
        createPlayer({ id: "player2", position: 1 }),
        createPlayer({ id: "player3", position: 2 }),
      ];
      const state = createBettingState({
        players,
        currentActor: 0,
      });

      expect(getNextActor(state)).toBe(1);
    });

    it("skips folded players", () => {
      const players = [
        createPlayer({ position: 0 }),
        createPlayer({
          id: "player2",
          position: 1,
          hasFolded: true,
          isActive: false,
        }),
        createPlayer({ id: "player3", position: 2 }),
      ];
      const state = createBettingState({
        players,
        currentActor: 0,
      });

      expect(getNextActor(state)).toBe(2);
    });

    it("skips all-in players", () => {
      const players = [
        createPlayer({ position: 0 }),
        createPlayer({
          id: "player2",
          position: 1,
          isAllIn: true,
          chips: 0,
        }),
        createPlayer({ id: "player3", position: 2 }),
      ];
      const state = createBettingState({
        players,
        currentActor: 0,
      });

      expect(getNextActor(state)).toBe(2);
    });

    it("wraps around to beginning", () => {
      const players = [
        createPlayer({ position: 0 }),
        createPlayer({ id: "player2", position: 1 }),
        createPlayer({ id: "player3", position: 2 }),
      ];
      const state = createBettingState({
        players,
        currentActor: 2,
      });

      expect(getNextActor(state)).toBe(0);
    });

    it("returns -1 when no active players remain", () => {
      const players = [
        createPlayer({ position: 0, hasFolded: true, isActive: false }),
        createPlayer({
          id: "player2",
          position: 1,
          hasFolded: true,
          isActive: false,
        }),
      ];
      const state = createBettingState({
        players,
        currentActor: 0,
      });

      expect(getNextActor(state)).toBe(-1);
    });
  });

  describe("Complex scenarios", () => {
    it("handles multi-way all-in correctly", () => {
      const players = [
        createPlayer({ position: 0, chips: 1000, betThisRound: 0 }),
        createPlayer({ id: "player2", position: 1, chips: 500, betThisRound: 0 }),
        createPlayer({ id: "player3", position: 2, chips: 300, betThisRound: 0 }),
      ];
      const state = createBettingState({
        players,
        currentActor: 0,
      });

      // Player 1 bets 1000
      const result1 = applyAction(state, { type: "BET", amount: 1000 });
      expect(result1.currentBet).toBe(1000);

      // Player 2 goes all-in with 500
      const result2 = applyAction(result1, { type: "ALL_IN" });
      expect(result2.players[1]?.betThisRound).toBe(500);
      expect(result2.players[1]?.isAllIn).toBe(true);

      // Player 3 goes all-in with 300
      const result3 = applyAction(result2, { type: "ALL_IN" });
      expect(result3.players[2]?.betThisRound).toBe(300);
      expect(result3.players[2]?.isAllIn).toBe(true);
    });

    it("handles betting round with raises", () => {
      const players = [
        createPlayer({ position: 0, chips: 1000, betThisRound: 0 }),
        createPlayer({ id: "player2", position: 1, chips: 1000, betThisRound: 0 }),
      ];
      const state = createBettingState({
        players,
        currentActor: 0,
      });

      // Player 1 bets 100
      const result1 = applyAction(state, { type: "BET", amount: 100 });
      expect(result1.currentBet).toBe(100);
      expect(result1.currentActor).toBe(1);

      // Player 2 raises to 300
      const result2 = applyAction(result1, { type: "RAISE", amount: 300 });
      expect(result2.currentBet).toBe(300);
      expect(result2.currentActor).toBe(0);

      // Player 1 calls
      const result3 = applyAction(result2, { type: "CALL" });
      expect(result3.players[0]?.betThisRound).toBe(300);

      // Round should be complete
      expect(isRoundComplete(result3)).toBe(true);
    });
  });
});
