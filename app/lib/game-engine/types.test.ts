import { describe, it, expect } from "vitest";
import {
  type Hand,
  type Player,
  type GameState,
  type PlayerAction,
  isCard,
  isValidHand,
  isValidGameState,
  createCard,
  serializeCard,
  deserializeCard,
  cardsEqual,
} from "./types";
import { GameStatus, Suit, Rank } from "./constants";

describe("Card & Hand Types", () => {
  describe("Card type", () => {
    it("should create a valid card", () => {
      const card = createCard(Rank.ACE, Suit.SPADES);
      expect(card.rank).toBe(14);
      expect(card.suit).toBe("s");
    });

    it("should create cards for all ranks and suits", () => {
      const card1 = createCard(Rank.TWO, Suit.HEARTS);
      const card2 = createCard(Rank.KING, Suit.DIAMONDS);
      const card3 = createCard(Rank.TEN, Suit.CLUBS);

      expect(card1.rank).toBe(2);
      expect(card1.suit).toBe("h");
      expect(card2.rank).toBe(13);
      expect(card2.suit).toBe("d");
      expect(card3.rank).toBe(10);
      expect(card3.suit).toBe("c");
    });

    it("should serialize card to compact string format", () => {
      const card = createCard(Rank.ACE, Suit.SPADES);
      const serialized = serializeCard(card);
      expect(serialized).toBe("As");
    });

    it("should serialize all cards correctly", () => {
      expect(serializeCard(createCard(Rank.TWO, Suit.HEARTS))).toBe("2h");
      expect(serializeCard(createCard(Rank.TEN, Suit.DIAMONDS))).toBe("Td");
      expect(serializeCard(createCard(Rank.JACK, Suit.CLUBS))).toBe("Jc");
      expect(serializeCard(createCard(Rank.QUEEN, Suit.SPADES))).toBe("Qs");
      expect(serializeCard(createCard(Rank.KING, Suit.HEARTS))).toBe("Kh");
    });

    it("should deserialize card from string format", () => {
      const card = deserializeCard("As");
      expect(card.rank).toBe(14);
      expect(card.suit).toBe("s");
    });

    it("should deserialize all card formats", () => {
      const cards = ["2h", "Td", "Jc", "Qs", "Kh", "Ad"];
      const deserialized = cards.map(deserializeCard);

      expect(deserialized[0]).toEqual(createCard(Rank.TWO, Suit.HEARTS));
      expect(deserialized[1]).toEqual(createCard(Rank.TEN, Suit.DIAMONDS));
      expect(deserialized[2]).toEqual(createCard(Rank.JACK, Suit.CLUBS));
      expect(deserialized[3]).toEqual(createCard(Rank.QUEEN, Suit.SPADES));
      expect(deserialized[4]).toEqual(createCard(Rank.KING, Suit.HEARTS));
      expect(deserialized[5]).toEqual(createCard(Rank.ACE, Suit.DIAMONDS));
    });

    it("should throw error for invalid card string", () => {
      expect(() => deserializeCard("Zz")).toThrow();
      expect(() => deserializeCard("1h")).toThrow();
      expect(() => deserializeCard("Ax")).toThrow();
      expect(() => deserializeCard("")).toThrow();
    });

    it("should compare cards for equality", () => {
      const card1 = createCard(Rank.ACE, Suit.SPADES);
      const card2 = createCard(Rank.ACE, Suit.SPADES);
      const card3 = createCard(Rank.KING, Suit.SPADES);

      expect(cardsEqual(card1, card2)).toBe(true);
      expect(cardsEqual(card1, card3)).toBe(false);
    });
  });

  describe("Type guards", () => {
    it("should validate valid card", () => {
      const card = createCard(Rank.ACE, Suit.HEARTS);
      expect(isCard(card)).toBe(true);
    });

    it("should reject invalid cards", () => {
      expect(isCard({ rank: 1, suit: "h" })).toBe(false); // rank too low
      expect(isCard({ rank: 15, suit: "h" })).toBe(false); // rank too high
      expect(isCard({ rank: 14, suit: "x" })).toBe(false); // invalid suit
      expect(isCard({ rank: 14 })).toBe(false); // missing suit
      expect(isCard({ suit: "h" })).toBe(false); // missing rank
      expect(isCard(null)).toBe(false);
      expect(isCard(undefined)).toBe(false);
      expect(isCard({})).toBe(false);
      expect(isCard("As")).toBe(false); // string, not object
    });

    it("should validate a hand (2 hole cards)", () => {
      const hand: Hand = {
        cards: [createCard(Rank.ACE, Suit.HEARTS), createCard(Rank.KING, Suit.HEARTS)],
      };
      expect(isValidHand(hand)).toBe(true);
    });

    it("should reject invalid hands", () => {
      expect(isValidHand({ cards: [] })).toBe(false); // empty
      expect(isValidHand({ cards: [createCard(Rank.ACE, Suit.HEARTS)] })).toBe(false); // only 1 card
      expect(
        isValidHand({
          cards: [
            createCard(Rank.ACE, Suit.HEARTS),
            createCard(Rank.KING, Suit.HEARTS),
            createCard(Rank.QUEEN, Suit.HEARTS),
          ],
        })
      ).toBe(false); // too many cards
    });

    it("should reject hands with duplicate cards", () => {
      const hand: Hand = {
        cards: [createCard(Rank.ACE, Suit.HEARTS), createCard(Rank.ACE, Suit.HEARTS)],
      };
      expect(isValidHand(hand)).toBe(false);
    });
  });

  describe("Player type", () => {
    it("should have all required player fields", () => {
      const player: Player = {
        id: "player-1",
        name: "Alice",
        chips: 1500,
        betThisRound: 0,
        totalBet: 0,
        hand: null,
        isActive: true,
        hasFolded: false,
        isAllIn: false,
        position: 0,
      };

      expect(player.id).toBe("player-1");
      expect(player.chips).toBe(1500);
      expect(player.hand).toBeNull();
    });

    it("should support player with hand", () => {
      const player: Player = {
        id: "player-1",
        name: "Alice",
        chips: 1500,
        betThisRound: 50,
        totalBet: 50,
        hand: {
          cards: [
            createCard(Rank.ACE, Suit.HEARTS),
            createCard(Rank.KING, Suit.HEARTS),
          ],
        },
        isActive: true,
        hasFolded: false,
        isAllIn: false,
        position: 0,
      };

      expect(player.hand?.cards).toHaveLength(2);
    });
  });

  describe("GameState type", () => {
    it("should create a valid initial game state", () => {
      const state: GameState = {
        status: GameStatus.WAITING,
        players: [],
        pot: {
          main: 0,
          side: [],
        },
        communityCards: [],
        currentBet: 0,
        dealer: 0,
        currentActor: 0,
        handNumber: 1,
        blinds: {
          small: 25,
          big: 50,
        },
      };

      expect(isValidGameState(state)).toBe(true);
    });

    it("should validate game state with players", () => {
      const state: GameState = {
        status: GameStatus.PREFLOP,
        players: [
          {
            id: "player-1",
            name: "Alice",
            chips: 1500,
            betThisRound: 50,
            totalBet: 50,
            hand: {
              cards: [
                createCard(Rank.ACE, Suit.HEARTS),
                createCard(Rank.KING, Suit.HEARTS),
              ],
            },
            isActive: true,
            hasFolded: false,
            isAllIn: false,
            position: 0,
          },
          {
            id: "player-2",
            name: "Bob",
            chips: 1450,
            betThisRound: 50,
            totalBet: 50,
            hand: {
              cards: [
                createCard(Rank.QUEEN, Suit.SPADES),
                createCard(Rank.JACK, Suit.SPADES),
              ],
            },
            isActive: true,
            hasFolded: false,
            isAllIn: false,
            position: 1,
          },
        ],
        pot: {
          main: 100,
          side: [],
        },
        communityCards: [],
        currentBet: 50,
        dealer: 0,
        currentActor: 0,
        handNumber: 1,
        blinds: {
          small: 25,
          big: 50,
        },
      };

      expect(isValidGameState(state)).toBe(true);
    });

    it("should reject invalid game states", () => {
      expect(isValidGameState({} as GameState)).toBe(false);
      expect(
        isValidGameState({
          status: "INVALID",
          players: [],
          pot: { main: 0, side: [] },
          communityCards: [],
          currentBet: 0,
          dealer: 0,
          currentActor: 0,
          handNumber: 1,
          blinds: { small: 25, big: 50 },
        } as unknown as GameState)
      ).toBe(false);
    });

    it("should reject game state with negative values", () => {
      const state: GameState = {
        status: GameStatus.WAITING,
        players: [],
        pot: {
          main: -100, // invalid
          side: [],
        },
        communityCards: [],
        currentBet: 0,
        dealer: 0,
        currentActor: 0,
        handNumber: 1,
        blinds: {
          small: 25,
          big: 50,
        },
      };

      expect(isValidGameState(state)).toBe(false);
    });
  });

  describe("PlayerAction type", () => {
    it("should support fold action", () => {
      const action: PlayerAction = { type: "FOLD" };
      expect(action.type).toBe("FOLD");
    });

    it("should support check action", () => {
      const action: PlayerAction = { type: "CHECK" };
      expect(action.type).toBe("CHECK");
    });

    it("should support call action", () => {
      const action: PlayerAction = { type: "CALL" };
      expect(action.type).toBe("CALL");
    });

    it("should support bet action with amount", () => {
      const action: PlayerAction = { type: "BET", amount: 100 };
      expect(action.type).toBe("BET");
      expect(action.amount).toBe(100);
    });

    it("should support raise action with amount", () => {
      const action: PlayerAction = { type: "RAISE", amount: 200 };
      expect(action.type).toBe("RAISE");
      expect(action.amount).toBe(200);
    });

    it("should support all-in action", () => {
      const action: PlayerAction = { type: "ALL_IN" };
      expect(action.type).toBe("ALL_IN");
    });

    it("should use discriminated unions for type safety", () => {
      const action: PlayerAction = { type: "BET", amount: 100 };

      if (action.type === "BET") {
        // TypeScript should know action.amount exists
        expect(action.amount).toBeDefined();
      }
    });
  });

  describe("JSON serialization", () => {
    it("should serialize and deserialize GameState", () => {
      const state: GameState = {
        status: GameStatus.PREFLOP,
        players: [
          {
            id: "player-1",
            name: "Alice",
            chips: 1500,
            betThisRound: 50,
            totalBet: 50,
            hand: {
              cards: [
                createCard(Rank.ACE, Suit.HEARTS),
                createCard(Rank.KING, Suit.HEARTS),
              ],
            },
            isActive: true,
            hasFolded: false,
            isAllIn: false,
            position: 0,
          },
        ],
        pot: {
          main: 50,
          side: [],
        },
        communityCards: [],
        currentBet: 50,
        dealer: 0,
        currentActor: 0,
        handNumber: 1,
        blinds: {
          small: 25,
          big: 50,
        },
      };

      const json = JSON.stringify(state);
      const parsed = JSON.parse(json) as GameState;

      expect(parsed.status).toBe(state.status);
      expect(parsed.players).toHaveLength(1);
      expect(parsed.players[0]?.chips).toBe(1500);
      expect(isValidGameState(parsed)).toBe(true);
    });

    it("should serialize card to JSON", () => {
      const card = createCard(Rank.ACE, Suit.SPADES);
      const json = JSON.stringify(card);
      const parsed = JSON.parse(json);

      expect(parsed.rank).toBe(14);
      expect(parsed.suit).toBe("s");
    });
  });

  describe("Readonly enforcement", () => {
    it("should have readonly arrays for immutability", () => {
      const state: GameState = {
        status: GameStatus.WAITING,
        players: [],
        pot: {
          main: 0,
          side: [],
        },
        communityCards: [],
        currentBet: 0,
        dealer: 0,
        currentActor: 0,
        handNumber: 1,
        blinds: {
          small: 25,
          big: 50,
        },
      };

      // TypeScript should enforce readonly
      // @ts-expect-error - should not be able to mutate readonly array
      state.players.push({} as Player);
    });
  });
});
