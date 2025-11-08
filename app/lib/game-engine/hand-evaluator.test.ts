import { describe, it, expect } from "vitest";
import { evaluateHand, findBestHand, compareHands } from "./hand-evaluator";
import { createCard } from "./types";
import { Rank, Suit, HandRank } from "./constants";

describe("Hand Evaluator", () => {
  it("evaluates royal flush", () => {
    const hand = [
      createCard(Rank.ACE, Suit.SPADES),
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.QUEEN, Suit.SPADES),
      createCard(Rank.JACK, Suit.SPADES),
      createCard(Rank.TEN, Suit.SPADES),
    ] as const;
    const result = evaluateHand(hand);
    expect(result.rank).toBe(HandRank.ROYAL_FLUSH);
  });

  it("evaluates straight flush", () => {
    const hand = [
      createCard(Rank.NINE, Suit.HEARTS),
      createCard(Rank.EIGHT, Suit.HEARTS),
      createCard(Rank.SEVEN, Suit.HEARTS),
      createCard(Rank.SIX, Suit.HEARTS),
      createCard(Rank.FIVE, Suit.HEARTS),
    ] as const;
    const result = evaluateHand(hand);
    expect(result.rank).toBe(HandRank.STRAIGHT_FLUSH);
  });

  it("evaluates four of a kind", () => {
    const hand = [
      createCard(Rank.KING, Suit.HEARTS),
      createCard(Rank.KING, Suit.DIAMONDS),
      createCard(Rank.KING, Suit.CLUBS),
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.TWO, Suit.HEARTS),
    ] as const;
    const result = evaluateHand(hand);
    expect(result.rank).toBe(HandRank.FOUR_OF_KIND);
  });

  it("evaluates full house", () => {
    const hand = [
      createCard(Rank.ACE, Suit.HEARTS),
      createCard(Rank.ACE, Suit.DIAMONDS),
      createCard(Rank.ACE, Suit.CLUBS),
      createCard(Rank.KING, Suit.HEARTS),
      createCard(Rank.KING, Suit.SPADES),
    ] as const;
    const result = evaluateHand(hand);
    expect(result.rank).toBe(HandRank.FULL_HOUSE);
  });

  it("evaluates flush", () => {
    const hand = [
      createCard(Rank.ACE, Suit.DIAMONDS),
      createCard(Rank.JACK, Suit.DIAMONDS),
      createCard(Rank.NINE, Suit.DIAMONDS),
      createCard(Rank.SEVEN, Suit.DIAMONDS),
      createCard(Rank.FOUR, Suit.DIAMONDS),
    ] as const;
    const result = evaluateHand(hand);
    expect(result.rank).toBe(HandRank.FLUSH);
  });

  it("evaluates straight", () => {
    const hand = [
      createCard(Rank.TEN, Suit.HEARTS),
      createCard(Rank.NINE, Suit.DIAMONDS),
      createCard(Rank.EIGHT, Suit.CLUBS),
      createCard(Rank.SEVEN, Suit.SPADES),
      createCard(Rank.SIX, Suit.HEARTS),
    ] as const;
    const result = evaluateHand(hand);
    expect(result.rank).toBe(HandRank.STRAIGHT);
  });

  it("evaluates three of a kind", () => {
    const hand = [
      createCard(Rank.QUEEN, Suit.HEARTS),
      createCard(Rank.QUEEN, Suit.DIAMONDS),
      createCard(Rank.QUEEN, Suit.CLUBS),
      createCard(Rank.FIVE, Suit.SPADES),
      createCard(Rank.THREE, Suit.HEARTS),
    ] as const;
    const result = evaluateHand(hand);
    expect(result.rank).toBe(HandRank.THREE_OF_KIND);
  });

  it("evaluates two pair", () => {
    const hand = [
      createCard(Rank.JACK, Suit.HEARTS),
      createCard(Rank.JACK, Suit.DIAMONDS),
      createCard(Rank.NINE, Suit.CLUBS),
      createCard(Rank.NINE, Suit.SPADES),
      createCard(Rank.FOUR, Suit.HEARTS),
    ] as const;
    const result = evaluateHand(hand);
    expect(result.rank).toBe(HandRank.TWO_PAIR);
  });

  it("evaluates one pair", () => {
    const hand = [
      createCard(Rank.TEN, Suit.HEARTS),
      createCard(Rank.TEN, Suit.DIAMONDS),
      createCard(Rank.SEVEN, Suit.CLUBS),
      createCard(Rank.FIVE, Suit.SPADES),
      createCard(Rank.TWO, Suit.HEARTS),
    ] as const;
    const result = evaluateHand(hand);
    expect(result.rank).toBe(HandRank.PAIR);
  });

  it("evaluates high card", () => {
    const hand = [
      createCard(Rank.ACE, Suit.HEARTS),
      createCard(Rank.KING, Suit.DIAMONDS),
      createCard(Rank.JACK, Suit.CLUBS),
      createCard(Rank.NINE, Suit.SPADES),
      createCard(Rank.SEVEN, Suit.HEARTS),
    ] as const;
    const result = evaluateHand(hand);
    expect(result.rank).toBe(HandRank.HIGH_CARD);
  });

  it("compares hands correctly", () => {
    const royalFlush = evaluateHand([
      createCard(Rank.ACE, Suit.SPADES),
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.QUEEN, Suit.SPADES),
      createCard(Rank.JACK, Suit.SPADES),
      createCard(Rank.TEN, Suit.SPADES),
    ] as const);

    const pair = evaluateHand([
      createCard(Rank.ACE, Suit.HEARTS),
      createCard(Rank.ACE, Suit.DIAMONDS),
      createCard(Rank.KING, Suit.CLUBS),
      createCard(Rank.QUEEN, Suit.SPADES),
      createCard(Rank.JACK, Suit.HEARTS),
    ] as const);

    expect(compareHands(royalFlush, pair)).toBe(1);
    expect(compareHands(pair, royalFlush)).toBe(-1);
    expect(compareHands(pair, pair)).toBe(0);
  });

  it("finds best 5 from 7 cards", () => {
    const cards = [
      createCard(Rank.ACE, Suit.SPADES),
      createCard(Rank.KING, Suit.SPADES),
      createCard(Rank.QUEEN, Suit.SPADES),
      createCard(Rank.JACK, Suit.SPADES),
      createCard(Rank.TEN, Suit.SPADES),
      createCard(Rank.TWO, Suit.HEARTS),
      createCard(Rank.THREE, Suit.DIAMONDS),
    ];

    const best = findBestHand(cards);
    expect(best.rank).toBe(HandRank.ROYAL_FLUSH);
  });
});
