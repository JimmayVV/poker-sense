import { describe, it, expect } from "vitest";
import {
  createDeck,
  shuffleDeck,
  dealCard,
  dealCards,
  getRemainingCount,
  resetDeck,
  createSeededRNG,
  createSecureRNG,
} from "./deck";
import { Suit, Rank } from "./constants";
import { cardsEqual } from "./types";

describe("Deck Management System", () => {
  describe("createDeck", () => {
    it("should create a deck with 52 cards", () => {
      const deck = createDeck();
      expect(getRemainingCount(deck)).toBe(52);
    });

    it("should create deck with all 13 ranks", () => {
      const deck = createDeck();
      const ranks = new Set(deck.cards.map((c) => c.rank));
      expect(ranks.size).toBe(13);
      expect(ranks.has(Rank.TWO)).toBe(true);
      expect(ranks.has(Rank.ACE)).toBe(true);
    });

    it("should create deck with all 4 suits", () => {
      const deck = createDeck();
      const suits = new Set(deck.cards.map((c) => c.suit));
      expect(suits.size).toBe(4);
      expect(suits.has(Suit.HEARTS)).toBe(true);
      expect(suits.has(Suit.DIAMONDS)).toBe(true);
      expect(suits.has(Suit.CLUBS)).toBe(true);
      expect(suits.has(Suit.SPADES)).toBe(true);
    });

    it("should have no duplicate cards", () => {
      const deck = createDeck();
      const seen = new Set<string>();

      for (const card of deck.cards) {
        const key = `${card.rank}-${card.suit}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }

      expect(seen.size).toBe(52);
    });

    it("should have exactly 13 cards per suit", () => {
      const deck = createDeck();
      const hearts = deck.cards.filter((c) => c.suit === Suit.HEARTS);
      const diamonds = deck.cards.filter((c) => c.suit === Suit.DIAMONDS);
      const clubs = deck.cards.filter((c) => c.suit === Suit.CLUBS);
      const spades = deck.cards.filter((c) => c.suit === Suit.SPADES);

      expect(hearts.length).toBe(13);
      expect(diamonds.length).toBe(13);
      expect(clubs.length).toBe(13);
      expect(spades.length).toBe(13);
    });

    it("should have exactly 4 cards per rank", () => {
      const deck = createDeck();

      for (let rank = Rank.TWO; rank <= Rank.ACE; rank++) {
        const cardsOfRank = deck.cards.filter((c) => c.rank === rank);
        expect(cardsOfRank.length).toBe(4);
      }
    });

    it("should start with dealt index at 0", () => {
      const deck = createDeck();
      expect(deck.dealtIndex).toBe(0);
    });
  });

  describe("shuffleDeck", () => {
    it("should shuffle deck with deterministic RNG", () => {
      const rng = createSeededRNG(12345);
      const deck1 = createDeck();
      const shuffled1 = shuffleDeck(deck1, rng);

      const rng2 = createSeededRNG(12345);
      const deck2 = createDeck();
      const shuffled2 = shuffleDeck(deck2, rng2);

      // Same seed = same shuffle order
      for (let i = 0; i < 52; i++) {
        const card1 = shuffled1.cards[i];
        const card2 = shuffled2.cards[i];
        expect(card1).toBeDefined();
        expect(card2).toBeDefined();
        if (card1 && card2) {
          expect(cardsEqual(card1, card2)).toBe(true);
        }
      }
    });

    it("should produce different order with different seed", () => {
      const rng1 = createSeededRNG(12345);
      const deck1 = createDeck();
      const shuffled1 = shuffleDeck(deck1, rng1);

      const rng2 = createSeededRNG(54321);
      const deck2 = createDeck();
      const shuffled2 = shuffleDeck(deck2, rng2);

      // Different seeds should produce different orders
      let hasDifference = false;
      for (let i = 0; i < 52; i++) {
        const card1 = shuffled1.cards[i];
        const card2 = shuffled2.cards[i];
        if (card1 && card2 && !cardsEqual(card1, card2)) {
          hasDifference = true;
          break;
        }
      }
      expect(hasDifference).toBe(true);
    });

    it("should maintain 52 cards after shuffle", () => {
      const rng = createSeededRNG(12345);
      const deck = createDeck();
      const shuffled = shuffleDeck(deck, rng);

      expect(shuffled.cards.length).toBe(52);
      expect(getRemainingCount(shuffled)).toBe(52);
    });

    it("should not create duplicate cards during shuffle", () => {
      const rng = createSeededRNG(12345);
      const deck = createDeck();
      const shuffled = shuffleDeck(deck, rng);

      const seen = new Set<string>();
      for (const card of shuffled.cards) {
        const key = `${card.rank}-${card.suit}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }

      expect(seen.size).toBe(52);
    });

    it("should reset dealt index to 0", () => {
      const rng = createSeededRNG(12345);
      const deck = createDeck();
      // Deal some cards first
      const [afterDeal] = dealCards(deck, 5);

      expect(afterDeal.dealtIndex).toBe(5);

      const shuffled = shuffleDeck(afterDeal, rng);
      expect(shuffled.dealtIndex).toBe(0);
    });

    it("should be immutable (return new deck)", () => {
      const rng = createSeededRNG(12345);
      const original = createDeck();
      const shuffled = shuffleDeck(original, rng);

      expect(shuffled).not.toBe(original);
      expect(original.dealtIndex).toBe(0);
    });
  });

  describe("dealCard", () => {
    it("should deal the top card", () => {
      const deck = createDeck();
      const firstCard = deck.cards[0];
      expect(firstCard).toBeDefined();

      const [, card] = dealCard(deck);
      expect(card).toBeDefined();
      if (firstCard && card) {
        expect(cardsEqual(card, firstCard)).toBe(true);
      }
    });

    it("should increment dealt index", () => {
      const deck = createDeck();
      const [newDeck] = dealCard(deck);
      expect(newDeck.dealtIndex).toBe(1);
    });

    it("should reduce remaining count", () => {
      const deck = createDeck();
      expect(getRemainingCount(deck)).toBe(52);

      const [newDeck] = dealCard(deck);
      expect(getRemainingCount(newDeck)).toBe(51);
    });

    it("should deal cards in sequence", () => {
      const deck = createDeck();
      const expected1 = deck.cards[0];
      const expected2 = deck.cards[1];
      const expected3 = deck.cards[2];

      const [deck1, card1] = dealCard(deck);
      const [deck2, card2] = dealCard(deck1);
      const [, card3] = dealCard(deck2);

      expect(expected1 && card1 && cardsEqual(card1, expected1)).toBe(true);
      expect(expected2 && card2 && cardsEqual(card2, expected2)).toBe(true);
      expect(expected3 && card3 && cardsEqual(card3, expected3)).toBe(true);
    });

    it("should throw error when deck is empty", () => {
      let deck = createDeck();

      // Deal all 52 cards
      for (let i = 0; i < 52; i++) {
        [deck] = dealCard(deck);
      }

      expect(getRemainingCount(deck)).toBe(0);
      expect(() => dealCard(deck)).toThrow("No cards remaining in deck");
    });

    it("should be immutable (return new deck)", () => {
      const original = createDeck();
      const [newDeck] = dealCard(original);

      expect(newDeck).not.toBe(original);
      expect(original.dealtIndex).toBe(0);
      expect(newDeck.dealtIndex).toBe(1);
    });
  });

  describe("dealCards", () => {
    it("should deal multiple cards", () => {
      const deck = createDeck();
      const [newDeck, cards] = dealCards(deck, 5);

      expect(cards.length).toBe(5);
      expect(newDeck.dealtIndex).toBe(5);
      expect(getRemainingCount(newDeck)).toBe(47);
    });

    it("should deal cards in correct order", () => {
      const deck = createDeck();
      const [, cards] = dealCards(deck, 3);

      const expected1 = deck.cards[0];
      const expected2 = deck.cards[1];
      const expected3 = deck.cards[2];

      expect(expected1 && cards[0] && cardsEqual(cards[0], expected1)).toBe(true);
      expect(expected2 && cards[1] && cardsEqual(cards[1], expected2)).toBe(true);
      expect(expected3 && cards[2] && cardsEqual(cards[2], expected3)).toBe(true);
    });

    it("should deal 0 cards", () => {
      const deck = createDeck();
      const [newDeck, cards] = dealCards(deck, 0);

      expect(cards.length).toBe(0);
      expect(newDeck.dealtIndex).toBe(0);
      expect(getRemainingCount(newDeck)).toBe(52);
    });

    it("should throw error when requesting more cards than available", () => {
      const deck = createDeck();
      expect(() => dealCards(deck, 53)).toThrow("Not enough cards remaining");
    });

    it("should throw error for negative count", () => {
      const deck = createDeck();
      expect(() => dealCards(deck, -1)).toThrow("Cannot deal negative number of cards");
    });

    it("should be immutable (return new deck)", () => {
      const original = createDeck();
      const [newDeck] = dealCards(original, 5);

      expect(newDeck).not.toBe(original);
      expect(original.dealtIndex).toBe(0);
      expect(newDeck.dealtIndex).toBe(5);
    });
  });

  describe("getRemainingCount", () => {
    it("should return 52 for new deck", () => {
      const deck = createDeck();
      expect(getRemainingCount(deck)).toBe(52);
    });

    it("should return correct count after dealing", () => {
      let deck = createDeck();
      [deck] = dealCards(deck, 10);
      expect(getRemainingCount(deck)).toBe(42);

      [deck] = dealCards(deck, 20);
      expect(getRemainingCount(deck)).toBe(22);
    });

    it("should return 0 when all cards dealt", () => {
      let deck = createDeck();
      [deck] = dealCards(deck, 52);
      expect(getRemainingCount(deck)).toBe(0);
    });
  });

  describe("resetDeck", () => {
    it("should reset dealt index to 0", () => {
      let deck = createDeck();
      [deck] = dealCards(deck, 20);
      expect(deck.dealtIndex).toBe(20);

      const reset = resetDeck(deck);
      expect(reset.dealtIndex).toBe(0);
    });

    it("should maintain card order", () => {
      let deck = createDeck();
      [deck] = dealCards(deck, 20);

      const reset = resetDeck(deck);

      for (let i = 0; i < 52; i++) {
        const original = deck.cards[i];
        const resetCard = reset.cards[i];
        expect(original && resetCard && cardsEqual(original, resetCard)).toBe(true);
      }
    });

    it("should restore remaining count to 52", () => {
      let deck = createDeck();
      [deck] = dealCards(deck, 30);
      expect(getRemainingCount(deck)).toBe(22);

      const reset = resetDeck(deck);
      expect(getRemainingCount(reset)).toBe(52);
    });

    it("should be immutable (return new deck)", () => {
      let original = createDeck();
      [original] = dealCards(original, 10);

      const reset = resetDeck(original);

      expect(reset).not.toBe(original);
      expect(original.dealtIndex).toBe(10);
      expect(reset.dealtIndex).toBe(0);
    });
  });

  describe("RandomNumberGenerator", () => {
    describe("createSeededRNG", () => {
      it("should produce deterministic sequence", () => {
        const rng1 = createSeededRNG(12345);
        const rng2 = createSeededRNG(12345);

        const values1 = Array.from({ length: 10 }, () => rng1.next());
        const values2 = Array.from({ length: 10 }, () => rng2.next());

        for (let i = 0; i < 10; i++) {
          expect(values1[i]).toBe(values2[i]);
        }
      });

      it("should produce different sequence for different seeds", () => {
        const rng1 = createSeededRNG(12345);
        const rng2 = createSeededRNG(54321);

        const value1 = rng1.next();
        const value2 = rng2.next();

        expect(value1).not.toBe(value2);
      });

      it("should produce values between 0 and 1", () => {
        const rng = createSeededRNG(12345);

        for (let i = 0; i < 100; i++) {
          const value = rng.next();
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThan(1);
        }
      });

      it("should shuffle arrays deterministically", () => {
        const rng1 = createSeededRNG(12345);
        const rng2 = createSeededRNG(12345);

        const arr1 = [1, 2, 3, 4, 5];
        const arr2 = [1, 2, 3, 4, 5];

        const shuffled1 = rng1.shuffle(arr1);
        const shuffled2 = rng2.shuffle(arr2);

        expect(shuffled1).toEqual(shuffled2);
      });

      it("should not mutate original array during shuffle", () => {
        const rng = createSeededRNG(12345);
        const original = [1, 2, 3, 4, 5];
        const copy = [...original];

        rng.shuffle(original);

        expect(original).toEqual(copy);
      });
    });

    describe("createSecureRNG", () => {
      it("should produce values between 0 and 1", () => {
        const rng = createSecureRNG();

        for (let i = 0; i < 100; i++) {
          const value = rng.next();
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThan(1);
        }
      });

      it("should shuffle arrays", () => {
        const rng = createSecureRNG();
        const arr = [1, 2, 3, 4, 5];
        const shuffled = rng.shuffle(arr);

        expect(shuffled.length).toBe(5);
        expect(shuffled).toContain(1);
        expect(shuffled).toContain(2);
        expect(shuffled).toContain(3);
        expect(shuffled).toContain(4);
        expect(shuffled).toContain(5);
      });

      it("should not mutate original array during shuffle", () => {
        const rng = createSecureRNG();
        const original = [1, 2, 3, 4, 5];
        const copy = [...original];

        rng.shuffle(original);

        expect(original).toEqual(copy);
      });

      it("should produce different sequences on each call", () => {
        const rng1 = createSecureRNG();
        const rng2 = createSecureRNG();

        const values1 = Array.from({ length: 10 }, () => rng1.next());
        const values2 = Array.from({ length: 10 }, () => rng2.next());

        // Highly unlikely to be all equal with crypto random
        const allEqual = values1.every((v, i) => v === values2[i]);
        expect(allEqual).toBe(false);
      });
    });
  });

  describe("Integration tests", () => {
    it("should shuffle and deal cards correctly", () => {
      const rng = createSeededRNG(12345);
      const deck = createDeck();
      const shuffled = shuffleDeck(deck, rng);
      const [afterDeal, cards] = dealCards(shuffled, 10);

      expect(cards.length).toBe(10);
      expect(getRemainingCount(afterDeal)).toBe(42);
      expect(afterDeal.dealtIndex).toBe(10);
    });

    it("should handle complete poker hand deal", () => {
      const rng = createSeededRNG(12345);
      let deck = createDeck();
      deck = shuffleDeck(deck, rng);

      // Deal 2 hole cards to 6 players (12 cards)
      const [deck1, holeCards] = dealCards(deck, 12);
      expect(holeCards.length).toBe(12);
      expect(getRemainingCount(deck1)).toBe(40);

      // Burn 1, deal flop (3 cards)
      const [deck2] = dealCards(deck1, 1); // burn
      const [deck3, flop] = dealCards(deck2, 3);
      expect(flop.length).toBe(3);
      expect(getRemainingCount(deck3)).toBe(36);

      // Burn 1, deal turn (1 card)
      const [deck4] = dealCards(deck3, 1); // burn
      const [deck5, turn] = dealCards(deck4, 1);
      expect(turn.length).toBe(1);
      expect(getRemainingCount(deck5)).toBe(34);

      // Burn 1, deal river (1 card)
      const [deck6] = dealCards(deck5, 1); // burn
      const [deck7, river] = dealCards(deck6, 1);
      expect(river.length).toBe(1);
      expect(getRemainingCount(deck7)).toBe(32);

      // Total dealt: 12 + 4 (burn+flop) + 2 (burn+turn) + 2 (burn+river) = 20 cards
      expect(deck7.dealtIndex).toBe(20);
    });

    it("should reset and reshuffle for new hand", () => {
      const rng = createSeededRNG(12345);
      let deck = createDeck();
      deck = shuffleDeck(deck, rng);

      // Deal some cards
      const [used] = dealCards(deck, 20);
      expect(getRemainingCount(used)).toBe(32);

      // Reset for new hand
      const reset = resetDeck(used);
      expect(getRemainingCount(reset)).toBe(52);

      // Reshuffle with new seed
      const rng2 = createSeededRNG(54321);
      const reshuffled = shuffleDeck(reset, rng2);
      expect(getRemainingCount(reshuffled)).toBe(52);
    });
  });
});
