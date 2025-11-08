import { describe, it, expect } from 'vitest';
import {
  GameStatus,
  HandRank,
  Suit,
  Rank,
  PlayerActionType,
  BLIND_STRUCTURES,
  TABLE_CONFIG,
  TOURNAMENT_CONFIG,
  CHIP_DENOMINATIONS,
  TIMEOUTS,
} from './constants';

describe('Game Constants & Enums', () => {
  describe('GameStatus enum', () => {
    it('should have all required game statuses', () => {
      expect(GameStatus.WAITING).toBe('WAITING');
      expect(GameStatus.DEALING).toBe('DEALING');
      expect(GameStatus.PREFLOP).toBe('PREFLOP');
      expect(GameStatus.FLOP).toBe('FLOP');
      expect(GameStatus.TURN).toBe('TURN');
      expect(GameStatus.RIVER).toBe('RIVER');
      expect(GameStatus.SHOWDOWN).toBe('SHOWDOWN');
      expect(GameStatus.COMPLETE).toBe('COMPLETE');
    });

    it('should have exactly 8 statuses', () => {
      const statusCount = Object.keys(GameStatus).length;
      expect(statusCount).toBe(8);
    });
  });

  describe('HandRank enum', () => {
    it('should have all poker hand ranks in correct order', () => {
      expect(HandRank.HIGH_CARD).toBe(0);
      expect(HandRank.PAIR).toBe(1);
      expect(HandRank.TWO_PAIR).toBe(2);
      expect(HandRank.THREE_OF_KIND).toBe(3);
      expect(HandRank.STRAIGHT).toBe(4);
      expect(HandRank.FLUSH).toBe(5);
      expect(HandRank.FULL_HOUSE).toBe(6);
      expect(HandRank.FOUR_OF_KIND).toBe(7);
      expect(HandRank.STRAIGHT_FLUSH).toBe(8);
      expect(HandRank.ROYAL_FLUSH).toBe(9);
    });

    it('should rank hands correctly (higher value = better hand)', () => {
      expect(HandRank.ROYAL_FLUSH).toBeGreaterThan(HandRank.STRAIGHT_FLUSH);
      expect(HandRank.STRAIGHT_FLUSH).toBeGreaterThan(HandRank.FOUR_OF_KIND);
      expect(HandRank.FOUR_OF_KIND).toBeGreaterThan(HandRank.FULL_HOUSE);
      expect(HandRank.FULL_HOUSE).toBeGreaterThan(HandRank.FLUSH);
      expect(HandRank.FLUSH).toBeGreaterThan(HandRank.STRAIGHT);
      expect(HandRank.STRAIGHT).toBeGreaterThan(HandRank.THREE_OF_KIND);
      expect(HandRank.THREE_OF_KIND).toBeGreaterThan(HandRank.TWO_PAIR);
      expect(HandRank.TWO_PAIR).toBeGreaterThan(HandRank.PAIR);
      expect(HandRank.PAIR).toBeGreaterThan(HandRank.HIGH_CARD);
    });
  });

  describe('Suit enum', () => {
    it('should have all four suits', () => {
      expect(Suit.HEARTS).toBe('h');
      expect(Suit.DIAMONDS).toBe('d');
      expect(Suit.CLUBS).toBe('c');
      expect(Suit.SPADES).toBe('s');
    });

    it('should have exactly 4 suits', () => {
      const suitCount = Object.keys(Suit).length;
      expect(suitCount).toBe(4);
    });
  });

  describe('Rank enum', () => {
    it('should have ranks from 2 to 14 (Ace)', () => {
      expect(Rank.TWO).toBe(2);
      expect(Rank.THREE).toBe(3);
      expect(Rank.FOUR).toBe(4);
      expect(Rank.FIVE).toBe(5);
      expect(Rank.SIX).toBe(6);
      expect(Rank.SEVEN).toBe(7);
      expect(Rank.EIGHT).toBe(8);
      expect(Rank.NINE).toBe(9);
      expect(Rank.TEN).toBe(10);
      expect(Rank.JACK).toBe(11);
      expect(Rank.QUEEN).toBe(12);
      expect(Rank.KING).toBe(13);
      expect(Rank.ACE).toBe(14);
    });

    it('should have exactly 13 ranks', () => {
      const rankCount = Object.keys(Rank).length;
      expect(rankCount).toBe(13);
    });

    it('should order cards correctly', () => {
      expect(Rank.ACE).toBeGreaterThan(Rank.KING);
      expect(Rank.KING).toBeGreaterThan(Rank.QUEEN);
      expect(Rank.QUEEN).toBeGreaterThan(Rank.JACK);
      expect(Rank.JACK).toBeGreaterThan(Rank.TEN);
      expect(Rank.TEN).toBeGreaterThan(Rank.TWO);
    });
  });

  describe('PlayerActionType enum', () => {
    it('should have all player action types', () => {
      expect(PlayerActionType.FOLD).toBe('FOLD');
      expect(PlayerActionType.CHECK).toBe('CHECK');
      expect(PlayerActionType.CALL).toBe('CALL');
      expect(PlayerActionType.BET).toBe('BET');
      expect(PlayerActionType.RAISE).toBe('RAISE');
      expect(PlayerActionType.ALL_IN).toBe('ALL_IN');
    });

    it('should have exactly 6 action types', () => {
      const actionCount = Object.keys(PlayerActionType).length;
      expect(actionCount).toBe(6);
    });
  });

  describe('BLIND_STRUCTURES', () => {
    it('should define standard blind structure', () => {
      expect(BLIND_STRUCTURES.STANDARD).toBeDefined();
      expect(Array.isArray(BLIND_STRUCTURES.STANDARD)).toBe(true);
      expect(BLIND_STRUCTURES.STANDARD.length).toBeGreaterThan(0);
    });

    it('should have increasing blinds at each level', () => {
      const structure = BLIND_STRUCTURES.STANDARD;

      for (let i = 1; i < structure.length; i++) {
        expect(structure[i].smallBlind).toBeGreaterThan(structure[i - 1].smallBlind);
        expect(structure[i].bigBlind).toBeGreaterThan(structure[i - 1].bigBlind);
      }
    });

    it('should have big blind equal to 2x small blind', () => {
      const structure = BLIND_STRUCTURES.STANDARD;

      structure.forEach(level => {
        expect(level.bigBlind).toBe(level.smallBlind * 2);
      });
    });

    it('should include duration in minutes for each level', () => {
      const structure = BLIND_STRUCTURES.STANDARD;

      structure.forEach(level => {
        expect(level.durationMinutes).toBeGreaterThan(0);
        expect(Number.isInteger(level.durationMinutes)).toBe(true);
      });
    });

    it('should define turbo blind structure', () => {
      expect(BLIND_STRUCTURES.TURBO).toBeDefined();
      expect(Array.isArray(BLIND_STRUCTURES.TURBO)).toBe(true);
    });

    it('should have turbo structure with shorter durations than standard', () => {
      const standard = BLIND_STRUCTURES.STANDARD;
      const turbo = BLIND_STRUCTURES.TURBO;

      // Turbo should have shorter levels
      expect(turbo[0].durationMinutes).toBeLessThan(standard[0].durationMinutes);
    });
  });

  describe('TABLE_CONFIG', () => {
    it('should define minimum and maximum players', () => {
      expect(TABLE_CONFIG.MIN_PLAYERS).toBe(2);
      expect(TABLE_CONFIG.MAX_PLAYERS).toBe(9);
    });

    it('should have min players less than max players', () => {
      expect(TABLE_CONFIG.MIN_PLAYERS).toBeLessThan(TABLE_CONFIG.MAX_PLAYERS);
    });

    it('should define 6-max as recommended size', () => {
      expect(TABLE_CONFIG.RECOMMENDED_PLAYERS).toBe(6);
      expect(TABLE_CONFIG.RECOMMENDED_PLAYERS).toBeGreaterThanOrEqual(TABLE_CONFIG.MIN_PLAYERS);
      expect(TABLE_CONFIG.RECOMMENDED_PLAYERS).toBeLessThanOrEqual(TABLE_CONFIG.MAX_PLAYERS);
    });
  });

  describe('TOURNAMENT_CONFIG', () => {
    it('should define starting chip stack', () => {
      expect(TOURNAMENT_CONFIG.STARTING_CHIPS).toBeGreaterThan(0);
      expect(Number.isInteger(TOURNAMENT_CONFIG.STARTING_CHIPS)).toBe(true);
    });

    it('should define minimum buy-in', () => {
      expect(TOURNAMENT_CONFIG.MIN_BUY_IN).toBeGreaterThan(0);
      expect(Number.isInteger(TOURNAMENT_CONFIG.MIN_BUY_IN)).toBe(true);
    });

    it('should define payout structure', () => {
      expect(TOURNAMENT_CONFIG.PAYOUT_STRUCTURE).toBeDefined();
      expect(Array.isArray(TOURNAMENT_CONFIG.PAYOUT_STRUCTURE)).toBe(true);
    });

    it('should have payout percentages sum to 100%', () => {
      const sum = TOURNAMENT_CONFIG.PAYOUT_STRUCTURE.reduce((acc, payout) => acc + payout.percentage, 0);
      expect(sum).toBeCloseTo(100, 1);
    });

    it('should define ante start level', () => {
      expect(TOURNAMENT_CONFIG.ANTE_START_LEVEL).toBeGreaterThan(0);
      expect(Number.isInteger(TOURNAMENT_CONFIG.ANTE_START_LEVEL)).toBe(true);
    });
  });

  describe('CHIP_DENOMINATIONS', () => {
    it('should define standard chip values', () => {
      expect(Array.isArray(CHIP_DENOMINATIONS)).toBe(true);
      expect(CHIP_DENOMINATIONS.length).toBeGreaterThan(0);
    });

    it('should have increasing denominations', () => {
      for (let i = 1; i < CHIP_DENOMINATIONS.length; i++) {
        expect(CHIP_DENOMINATIONS[i]).toBeGreaterThan(CHIP_DENOMINATIONS[i - 1]);
      }
    });

    it('should include common denominations (25, 100, 500, 1000)', () => {
      expect(CHIP_DENOMINATIONS).toContain(25);
      expect(CHIP_DENOMINATIONS).toContain(100);
      expect(CHIP_DENOMINATIONS).toContain(500);
      expect(CHIP_DENOMINATIONS).toContain(1000);
    });
  });

  describe('TIMEOUTS', () => {
    it('should define action timeout in seconds', () => {
      expect(TIMEOUTS.ACTION_TIMEOUT_SECONDS).toBeGreaterThan(0);
      expect(Number.isInteger(TIMEOUTS.ACTION_TIMEOUT_SECONDS)).toBe(true);
    });

    it('should define disconnect timeout in seconds', () => {
      expect(TIMEOUTS.DISCONNECT_TIMEOUT_SECONDS).toBeGreaterThan(0);
      expect(Number.isInteger(TIMEOUTS.DISCONNECT_TIMEOUT_SECONDS)).toBe(true);
    });

    it('should have disconnect timeout longer than action timeout', () => {
      expect(TIMEOUTS.DISCONNECT_TIMEOUT_SECONDS).toBeGreaterThan(TIMEOUTS.ACTION_TIMEOUT_SECONDS);
    });

    it('should define time bank in seconds', () => {
      expect(TIMEOUTS.TIME_BANK_SECONDS).toBeGreaterThan(0);
      expect(Number.isInteger(TIMEOUTS.TIME_BANK_SECONDS)).toBe(true);
    });
  });

  describe('Type safety', () => {
    it('should enforce GameStatus type at compile time', () => {
      const status: GameStatus = GameStatus.PREFLOP;
      expect(status).toBe('PREFLOP');
    });

    it('should enforce HandRank type at compile time', () => {
      const rank: HandRank = HandRank.FLUSH;
      expect(rank).toBe(5);
    });

    it('should enforce Suit type at compile time', () => {
      const suit: Suit = Suit.HEARTS;
      expect(suit).toBe('h');
    });

    it('should enforce Rank type at compile time', () => {
      const rank: Rank = Rank.ACE;
      expect(rank).toBe(14);
    });
  });
});
