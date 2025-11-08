import { describe, it, expect } from "vitest";
import {
  calculatePot,
  distributePot,
  createEmptyPot,
  type PlayerContribution,
  type Winner,
} from "./pot";

describe("Pot Calculator", () => {
  describe("createEmptyPot", () => {
    it("should create empty pot with no side pots", () => {
      const pot = createEmptyPot();
      expect(pot.main).toBe(0);
      expect(pot.side).toEqual([]);
    });
  });

  describe("calculatePot - Simple scenarios", () => {
    it("should calculate main pot with equal contributions", () => {
      const contributions: PlayerContribution[] = [
        { playerId: "p1", amount: 100 },
        { playerId: "p2", amount: 100 },
        { playerId: "p3", amount: 100 },
      ];

      const pot = calculatePot(contributions);

      expect(pot.main).toBe(300);
      expect(pot.side).toEqual([]);
    });

    it("should handle zero contributions", () => {
      const contributions: PlayerContribution[] = [
        { playerId: "p1", amount: 0 },
        { playerId: "p2", amount: 0 },
      ];

      const pot = calculatePot(contributions);

      expect(pot.main).toBe(0);
      expect(pot.side).toEqual([]);
    });

    it("should handle single player", () => {
      const contributions: PlayerContribution[] = [{ playerId: "p1", amount: 100 }];

      const pot = calculatePot(contributions);

      expect(pot.main).toBe(100);
      expect(pot.side).toEqual([]);
    });

    it("should handle unequal contributions without all-ins", () => {
      const contributions: PlayerContribution[] = [
        { playerId: "p1", amount: 100 },
        { playerId: "p2", amount: 50 },
        { playerId: "p3", amount: 75 },
      ];

      const pot = calculatePot(contributions);

      expect(pot.main).toBe(225);
      expect(pot.side).toEqual([]);
    });
  });

  describe("calculatePot - Single all-in", () => {
    it("should create side pot when one player is all-in", () => {
      const contributions: PlayerContribution[] = [
        { playerId: "p1", amount: 50, isAllIn: true }, // all-in for 50
        { playerId: "p2", amount: 100 },
        { playerId: "p3", amount: 100 },
      ];

      const pot = calculatePot(contributions);

      // Main pot: 3 × 50 = 150 (all 3 players eligible)
      expect(pot.main).toBe(150);

      // Side pot: 2 × 50 = 100 (p2 and p3 only)
      expect(pot.side).toHaveLength(1);
      expect(pot.side[0]?.amount).toBe(100);
      expect(pot.side[0]?.eligiblePlayers).toEqual(["p2", "p3"]);
    });

    it("should handle all-in player with smallest stack", () => {
      const contributions: PlayerContribution[] = [
        { playerId: "p1", amount: 25, isAllIn: true },
        { playerId: "p2", amount: 100 },
        { playerId: "p3", amount: 75 },
      ];

      const pot = calculatePot(contributions);

      // Main pot: 3 × 25 = 75
      expect(pot.main).toBe(75);

      // Side pot 1: 2 × 50 (75-25) = 100 (p3, p2)
      // Side pot 2: 1 × 25 (100-75) = 25 (p2)
      expect(pot.side).toHaveLength(2);
      expect(pot.side[0]?.amount).toBe(100);
      expect(pot.side[0]?.eligiblePlayers).toContain("p2");
      expect(pot.side[0]?.eligiblePlayers).toContain("p3");
      expect(pot.side[1]?.amount).toBe(25);
      expect(pot.side[1]?.eligiblePlayers).toEqual(["p2"]);
    });
  });

  describe("calculatePot - Multiple all-ins", () => {
    it("should create multiple side pots with two all-ins", () => {
      const contributions: PlayerContribution[] = [
        { playerId: "p1", amount: 30, isAllIn: true },
        { playerId: "p2", amount: 60, isAllIn: true },
        { playerId: "p3", amount: 100 },
        { playerId: "p4", amount: 100 },
      ];

      const pot = calculatePot(contributions);

      // Main pot: 4 × 30 = 120 (all 4 eligible)
      expect(pot.main).toBe(120);

      // First side pot: 3 × 30 (60-30) = 90 (p2, p3, p4)
      // Second side pot: 2 × 40 (100-60) = 80 (p3, p4)
      expect(pot.side).toHaveLength(2);
      expect(pot.side[0]?.amount).toBe(90);
      expect(pot.side[0]?.eligiblePlayers).toEqual(["p2", "p3", "p4"]);
      expect(pot.side[1]?.amount).toBe(80);
      expect(pot.side[1]?.eligiblePlayers).toEqual(["p3", "p4"]);
    });

    it("should handle three all-ins at different amounts", () => {
      const contributions: PlayerContribution[] = [
        { playerId: "p1", amount: 10, isAllIn: true },
        { playerId: "p2", amount: 20, isAllIn: true },
        { playerId: "p3", amount: 30, isAllIn: true },
        { playerId: "p4", amount: 100 },
      ];

      const pot = calculatePot(contributions);

      // Main pot: 4 × 10 = 40
      expect(pot.main).toBe(40);

      // Side pot 1: 3 × 10 = 30 (p2, p3, p4)
      // Side pot 2: 2 × 10 = 20 (p3, p4)
      // Side pot 3: 1 × 70 = 70 (p4)
      expect(pot.side).toHaveLength(3);
      expect(pot.side[0]?.amount).toBe(30);
      expect(pot.side[0]?.eligiblePlayers).toEqual(["p2", "p3", "p4"]);
      expect(pot.side[1]?.amount).toBe(20);
      expect(pot.side[1]?.eligiblePlayers).toEqual(["p3", "p4"]);
      expect(pot.side[2]?.amount).toBe(70);
      expect(pot.side[2]?.eligiblePlayers).toEqual(["p4"]);
    });

    it("should handle all players all-in at different amounts", () => {
      const contributions: PlayerContribution[] = [
        { playerId: "p1", amount: 10, isAllIn: true },
        { playerId: "p2", amount: 20, isAllIn: true },
        { playerId: "p3", amount: 30, isAllIn: true },
      ];

      const pot = calculatePot(contributions);

      expect(pot.main).toBe(30); // 3 × 10
      expect(pot.side).toHaveLength(2);
      expect(pot.side[0]?.amount).toBe(20); // 2 × 10
      expect(pot.side[1]?.amount).toBe(10); // 1 × 10
    });

    it("should handle multiple players all-in at same amount", () => {
      const contributions: PlayerContribution[] = [
        { playerId: "p1", amount: 50, isAllIn: true },
        { playerId: "p2", amount: 50, isAllIn: true },
        { playerId: "p3", amount: 100 },
      ];

      const pot = calculatePot(contributions);

      // Main pot: 3 × 50 = 150
      expect(pot.main).toBe(150);

      // Side pot: 1 × 50 = 50 (only p3)
      expect(pot.side).toHaveLength(1);
      expect(pot.side[0]?.amount).toBe(50);
      expect(pot.side[0]?.eligiblePlayers.length).toBe(1);
      expect(pot.side[0]?.eligiblePlayers).toContain("p3");
    });
  });

  describe("calculatePot - Complex scenarios", () => {
    it("should handle 6-player all-in scenario", () => {
      const contributions: PlayerContribution[] = [
        { playerId: "p1", amount: 100, isAllIn: true },
        { playerId: "p2", amount: 200, isAllIn: true },
        { playerId: "p3", amount: 300, isAllIn: true },
        { playerId: "p4", amount: 400 },
        { playerId: "p5", amount: 400 },
        { playerId: "p6", amount: 400 },
      ];

      const pot = calculatePot(contributions);

      // Main pot: 6 × 100 = 600
      expect(pot.main).toBe(600);

      // Side pot 1: 5 × 100 = 500
      // Side pot 2: 4 × 100 = 400
      // Side pot 3: 3 × 100 = 300
      expect(pot.side).toHaveLength(3);
      expect(pot.side[0]?.amount).toBe(500);
      expect(pot.side[1]?.amount).toBe(400);
      expect(pot.side[2]?.amount).toBe(300);
    });

    it("should handle players with zero contributions", () => {
      const contributions: PlayerContribution[] = [
        { playerId: "p1", amount: 0 }, // folded
        { playerId: "p2", amount: 50, isAllIn: true },
        { playerId: "p3", amount: 100 },
      ];

      const pot = calculatePot(contributions);

      // Main pot: 2 × 50 = 100 (p1 doesn't contribute)
      expect(pot.main).toBe(100);

      // Side pot: 1 × 50 = 50 (only p3)
      expect(pot.side).toHaveLength(1);
      expect(pot.side[0]?.amount).toBe(50);
      expect(pot.side[0]?.eligiblePlayers.length).toBe(1);
    });
  });

  describe("distributePot - Single winner", () => {
    it("should award main pot to single winner", () => {
      const pot = {
        main: 300,
        side: [],
      };

      const winners: Winner[] = [{ playerId: "p1", potIndex: 0 }];

      const distribution = distributePot(pot, winners);

      expect(distribution).toHaveLength(1);
      expect(distribution[0]?.playerId).toBe("p1");
      expect(distribution[0]?.amount).toBe(300);
    });

    it("should award main pot and side pots to winner", () => {
      const pot = {
        main: 150,
        side: [
          { amount: 100, eligiblePlayers: ["p2", "p3"] },
          { amount: 50, eligiblePlayers: ["p3"] },
        ],
      };

      const winners: Winner[] = [
        { playerId: "p3", potIndex: 0 },
        { playerId: "p3", potIndex: 1 },
        { playerId: "p3", potIndex: 2 },
      ];

      const distribution = distributePot(pot, winners);

      // p3 wins everything: 150 + 100 + 50 = 300
      expect(distribution).toHaveLength(1);
      expect(distribution[0]?.playerId).toBe("p3");
      expect(distribution[0]?.amount).toBe(300);
    });

    it("should award only eligible pots to all-in winner", () => {
      const pot = {
        main: 150,
        side: [
          { amount: 100, eligiblePlayers: ["p2", "p3"] },
          { amount: 50, eligiblePlayers: ["p3"] },
        ],
      };

      const winners: Winner[] = [
        { playerId: "p1", potIndex: 0 }, // wins main pot
        { playerId: "p3", potIndex: 1 }, // wins first side pot
        { playerId: "p3", potIndex: 2 }, // wins second side pot
      ];

      const distribution = distributePot(pot, winners);

      expect(distribution).toHaveLength(2);
      const p1Dist = distribution.find((d) => d.playerId === "p1");
      const p3Dist = distribution.find((d) => d.playerId === "p3");

      expect(p1Dist?.amount).toBe(150);
      expect(p3Dist?.amount).toBe(150); // 100 + 50
    });
  });

  describe("distributePot - Split pots", () => {
    it("should split main pot between two winners", () => {
      const pot = {
        main: 300,
        side: [],
      };

      const winners: Winner[] = [
        { playerId: "p1", potIndex: 0 },
        { playerId: "p2", potIndex: 0 },
      ];

      const distribution = distributePot(pot, winners);

      expect(distribution).toHaveLength(2);
      expect(distribution.find((d) => d.playerId === "p1")?.amount).toBe(150);
      expect(distribution.find((d) => d.playerId === "p2")?.amount).toBe(150);
    });

    it("should split main pot between three winners", () => {
      const pot = {
        main: 300,
        side: [],
      };

      const winners: Winner[] = [
        { playerId: "p1", potIndex: 0 },
        { playerId: "p2", potIndex: 0 },
        { playerId: "p3", potIndex: 0 },
      ];

      const distribution = distributePot(pot, winners);

      expect(distribution).toHaveLength(3);
      // 300 / 3 = 100 each
      expect(distribution.find((d) => d.playerId === "p1")?.amount).toBe(100);
      expect(distribution.find((d) => d.playerId === "p2")?.amount).toBe(100);
      expect(distribution.find((d) => d.playerId === "p3")?.amount).toBe(100);
    });

    it("should handle uneven split with remainder", () => {
      const pot = {
        main: 100,
        side: [],
      };

      const winners: Winner[] = [
        { playerId: "p1", potIndex: 0 },
        { playerId: "p2", potIndex: 0 },
        { playerId: "p3", potIndex: 0 },
      ];

      const distribution = distributePot(pot, winners);

      // 100 / 3 = 33.33... → distribute as 34, 33, 33
      const amounts = distribution.map((d) => d.amount).sort((a, b) => b - a);
      expect(amounts[0]).toBe(34);
      expect(amounts[1]).toBe(33);
      expect(amounts[2]).toBe(33);
      expect(amounts.reduce((sum, a) => sum + a, 0)).toBe(100);
    });

    it("should split side pot separately from main pot", () => {
      const pot = {
        main: 150,
        side: [{ amount: 100, eligiblePlayers: ["p2", "p3"] }],
      };

      const winners: Winner[] = [
        { playerId: "p1", potIndex: 0 }, // wins main
        { playerId: "p2", potIndex: 0 }, // ties main
        { playerId: "p2", potIndex: 1 }, // wins side
        { playerId: "p3", potIndex: 1 }, // ties side
      ];

      const distribution = distributePot(pot, winners);

      const p1Dist = distribution.find((d) => d.playerId === "p1");
      const p2Dist = distribution.find((d) => d.playerId === "p2");
      const p3Dist = distribution.find((d) => d.playerId === "p3");

      expect(p1Dist?.amount).toBe(75); // half of main pot
      expect(p2Dist?.amount).toBe(125); // half of main (75) + half of side (50)
      expect(p3Dist?.amount).toBe(50); // half of side pot
    });
  });

  describe("distributePot - Edge cases", () => {
    it("should handle empty pot", () => {
      const pot = createEmptyPot();
      const winners: Winner[] = [{ playerId: "p1", potIndex: 0 }];

      const distribution = distributePot(pot, winners);

      expect(distribution).toHaveLength(1);
      expect(distribution[0]?.amount).toBe(0);
    });

    it("should handle no winners", () => {
      const pot = { main: 300, side: [] };
      const winners: Winner[] = [];

      const distribution = distributePot(pot, winners);

      expect(distribution).toEqual([]);
    });

    it("should handle invalid pot index", () => {
      const pot = { main: 300, side: [] };
      const winners: Winner[] = [{ playerId: "p1", potIndex: 5 }]; // invalid index

      expect(() => distributePot(pot, winners)).toThrow();
    });
  });

  describe("Integration scenarios", () => {
    it("should handle realistic 3-way all-in scenario", () => {
      // Player 1: all-in for 500
      // Player 2: all-in for 1000
      // Player 3: calls 1500
      const contributions: PlayerContribution[] = [
        { playerId: "p1", amount: 500, isAllIn: true },
        { playerId: "p2", amount: 1000, isAllIn: true },
        { playerId: "p3", amount: 1500 },
      ];

      const pot = calculatePot(contributions);

      // Main pot: 3 × 500 = 1500
      expect(pot.main).toBe(1500);

      // Side pot 1: 2 × 500 = 1000 (p2, p3)
      expect(pot.side[0]?.amount).toBe(1000);
      expect(pot.side[0]?.eligiblePlayers).toEqual(["p2", "p3"]);

      // Side pot 2: 1 × 500 = 500 (p3)
      expect(pot.side[1]?.amount).toBe(500);
      expect(pot.side[1]?.eligiblePlayers).toEqual(["p3"]);

      // Scenario: p1 wins main, p2 wins side1, p3 wins side2
      const winners: Winner[] = [
        { playerId: "p1", potIndex: 0 },
        { playerId: "p2", potIndex: 1 },
        { playerId: "p3", potIndex: 2 },
      ];

      const distribution = distributePot(pot, winners);

      expect(distribution.find((d) => d.playerId === "p1")?.amount).toBe(1500);
      expect(distribution.find((d) => d.playerId === "p2")?.amount).toBe(1000);
      expect(distribution.find((d) => d.playerId === "p3")?.amount).toBe(500);
    });

    it("should handle tournament final table scenario", () => {
      // 6 players with varying stack sizes
      const contributions: PlayerContribution[] = [
        { playerId: "p1", amount: 50, isAllIn: true }, // short stack
        { playerId: "p2", amount: 150, isAllIn: true },
        { playerId: "p3", amount: 300 }, // folded
        { playerId: "p4", amount: 300 },
        { playerId: "p5", amount: 300 },
        { playerId: "p6", amount: 0 }, // folded pre
      ];

      const pot = calculatePot(contributions);

      // Verify total pot = sum of contributions
      const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
      const totalPot = pot.main + pot.side.reduce((sum, s) => sum + s.amount, 0);
      expect(totalPot).toBe(totalContributions);
    });
  });
});
