# Component Architecture

**Date:** 2025-11-08
**Status:** Complete
**Related ADRs:** [001](../decisions/001-tech-stack.md), [005](../decisions/005-game-engine-architecture.md)

## Overview

Component architecture organized into three main systems: Game Engine, Training System, and UI Layer. Each system has clear boundaries and responsibilities.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        UI LAYER                             │
│                  (app/components + routes)                  │
├─────────────────────────────────────────────────────────────┤
│  React Components (Presentation)                            │
│  - PokerTable, Card, Chip, Avatar                           │
│  - TrainingScenario, FeedbackModal, ProgressBar             │
│  - HandHistory, Analytics, Dashboard                        │
│                                                              │
│  Routes (Pages)                                              │
│  - /game/:id (gameplay UI)                                  │
│  - /training/:mode (training UI)                            │
│  - /dashboard (analytics)                                   │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ consumes
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│                 (React Router Actions/Loaders)               │
├─────────────────────────────────────────────────────────────┤
│  API Routes                                                  │
│  - /api/game/:id/action.ts (player actions)                 │
│  - /api/training/scenarios.ts (fetch scenarios)             │
│  - /api/training/submit.ts (evaluate decisions)             │
│                                                              │
│  Middleware                                                  │
│  - Authentication (Better Auth)                             │
│  - Validation (Zod schemas)                                 │
│  - Error handling                                           │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ uses
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                            │
│                    (app/lib/*)                               │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────┐  ┌───────────────────┐              │
│  │  Game Engine      │  │  Training System   │              │
│  │  (Pure Functions) │  │  (Pure Functions)  │              │
│  └───────────────────┘  └───────────────────┘              │
│                                                              │
│  ┌───────────────────────────────────────────┐              │
│  │  Shared Utilities                         │              │
│  │  - Card utilities, RNG, validators        │              │
│  └───────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ persists to
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                             │
│                   (Supabase PostgreSQL)                      │
├─────────────────────────────────────────────────────────────┤
│  Tables: games, game_events, players, training_scenarios,   │
│          user_progress, hand_history                         │
└─────────────────────────────────────────────────────────────┘
```

## Game Engine Components

### Core Reducer (`app/lib/game-engine/reducer.ts`)

**Responsibility:** Apply player actions to game state (pure function).

**Interface:**
```typescript
export function applyAction(
  state: GameState,
  playerId: string,
  action: PlayerAction,
  rng: RandomNumberGenerator
): GameState;
```

**Dependencies:**
- `validator.ts` (validate action legality)
- `pot.ts` (calculate pot distribution)
- `dealer.ts` (deal cards, advance streets)
- `hand-evaluator.ts` (evaluate showdown)

**Outputs:** New immutable `GameState`

### Action Validator (`app/lib/game-engine/validator.ts`)

**Responsibility:** Validate if player action is legal given current state.

**Interface:**
```typescript
export function validateAction(
  state: GameState,
  playerId: string,
  action: PlayerAction
): ValidationResult;

export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string };
```

**Validation Rules:**
- Is it player's turn?
- Does player have enough chips?
- Is action legal given current bet?
- Is bet/raise amount valid?

**Dependencies:** None (pure validation logic)

### Hand Evaluator (`app/lib/game-engine/hand-evaluator.ts`)

**Responsibility:** Evaluate poker hand strength (7-card best hand).

**Interface:**
```typescript
export function evaluateHand(
  cards: readonly [Card, Card, Card, Card, Card, Card, Card]
): HandEvaluation;

export function findBestHand(
  holeCards: readonly [Card, Card],
  communityCards: readonly Card[]
): HandEvaluation;

export type HandEvaluation = {
  rank: HandRank;
  value: number; // Unique value for comparison
  description: string;
};
```

**Algorithm:** Perfect hash lookup table
- ~130k pre-computed entries
- O(1) hand evaluation
- Generated at build time

**Dependencies:**
- `lookup-table.generated.ts` (build-time generated)
- `card-utils.ts` (card hashing)

### Pot Calculator (`app/lib/game-engine/pot.ts`)

**Responsibility:** Calculate pot distribution (main pot + side pots).

**Interface:**
```typescript
export function calculatePots(
  players: ReadonlyArray<Player>,
  currentPot: Pot
): Pot;

export function distributePot(
  pot: Pot,
  winners: ReadonlyArray<Winner>
): ReadonlyArray<PotDistribution>;

export type Pot = {
  readonly main: number;
  readonly side: ReadonlyArray<SidePot>;
};

export type SidePot = {
  readonly amount: number;
  readonly eligiblePlayers: ReadonlyArray<string>;
};
```

**Complexity Handled:**
- Multiple all-ins at different amounts
- Side pot eligibility
- Split pots (multiple winners)

**Dependencies:** None

### Dealer (`app/lib/game-engine/dealer.ts`)

**Responsibility:** Deal cards, advance streets, determine next actor.

**Interface:**
```typescript
export function dealHoleCards(
  deck: Deck,
  players: ReadonlyArray<Player>,
  rng: RandomNumberGenerator
): { holeCards: Map<string, [Card, Card]>; deck: Deck };

export function dealCommunityCards(
  deck: Deck,
  street: 'FLOP' | 'TURN' | 'RIVER',
  rng: RandomNumberGenerator
): { cards: ReadonlyArray<Card>; deck: Deck };

export function nextActor(
  state: GameState
): number; // Index of next player to act

export function advanceDealer(
  players: ReadonlyArray<Player>,
  currentDealer: number
): number;
```

**Dependencies:**
- `card-utils.ts` (deck creation, shuffling)
- `rng.ts` (random number generator)

### Random Number Generator (`app/lib/game-engine/rng.ts`)

**Responsibility:** Provide deterministic (testing) and secure (production) RNG.

**Interface:**
```typescript
export interface RandomNumberGenerator {
  next(): number; // Returns 0-1
  shuffle<T>(arr: readonly T[]): readonly T[];
}

export function createSecureRNG(): RandomNumberGenerator;
export function createSeededRNG(seed: number): RandomNumberGenerator;
```

**Implementations:**
- **Production:** `crypto.getRandomValues()` (cryptographically secure)
- **Testing:** Linear congruential generator (deterministic, seeded)

**Dependencies:** Node.js `crypto` module

## Training System Components

### Scenario Engine (`app/lib/training/scenario-engine.ts`)

**Responsibility:** Generate training scenarios for each training mode.

**Interface:**
```typescript
export function generateScenario(
  mode: TrainingMode,
  difficulty: Difficulty,
  rng: RandomNumberGenerator
): Scenario;

export type TrainingMode =
  | 'hand-strength'
  | 'odds-calculation'
  | 'position-strategy'
  | 'opponent-modeling';

export type Scenario = {
  id: string;
  mode: TrainingMode;
  difficulty: Difficulty;
  position: Position;
  holeCards: [Card, Card];
  communityCards: ReadonlyArray<Card>;
  pot: number;
  toCall: number;
  stackSize: number;
  opponents: ReadonlyArray<OpponentInfo>;
  correctAction: PlayerAction;
  explanation: string;
};
```

**Scenario Types:**

1. **Hand Strength Recognition**
   - Recognize hand strength relative to board
   - Practice reading made hands vs draws
   - Understand equity against ranges

2. **Odds Calculation**
   - Calculate pot odds
   - Compare to hand equity
   - Decide fold/call/raise based on math

3. **Position Strategy**
   - Early position (tight range)
   - Middle position (balanced)
   - Late position (wider range)
   - Blind defense

4. **Opponent Modeling**
   - Read opponent tendencies
   - Adjust to tight/loose/aggressive players
   - Exploit patterns

**Dependencies:**
- `game-engine/hand-evaluator.ts` (calculate hand strength)
- `game-engine/rng.ts` (random scenarios)

### Feedback Analyzer (`app/lib/training/feedback-analyzer.ts`)

**Responsibility:** Evaluate user decisions and provide feedback.

**Interface:**
```typescript
export function analyzeDecision(
  scenario: Scenario,
  userAction: PlayerAction
): Feedback;

export type Feedback = {
  correct: boolean;
  rating: 'perfect' | 'good' | 'acceptable' | 'suboptimal' | 'mistake';
  explanation: string;
  correctAction: PlayerAction;
  alternativeActions: ReadonlyArray<{
    action: PlayerAction;
    rating: string;
    explanation: string;
  }>;
  stats: {
    handStrength: number; // Percentile
    potOdds: number | null;
    equity: number | null;
  };
};
```

**Evaluation Criteria:**
- Did user choose optimal action?
- Was action defensible (e.g., raise vs call both okay)?
- Math-based feedback (pot odds, equity)
- Conceptual feedback (position, opponent tendencies)

**Dependencies:**
- `game-engine/hand-evaluator.ts` (hand strength)
- `odds-calculator.ts` (pot odds, equity)

### Progress Tracker (`app/lib/training/progress-tracker.ts`)

**Responsibility:** Track user progress across training modes.

**Interface:**
```typescript
export function recordAttempt(
  userId: string,
  scenario: Scenario,
  feedback: Feedback
): Promise<void>;

export function getProgress(
  userId: string,
  mode?: TrainingMode
): Promise<ProgressStats>;

export type ProgressStats = {
  scenariosCompleted: number;
  accuracy: number; // Percentage
  averageRating: number; // 1-5 scale
  breakdownByMode: Record<TrainingMode, ModeStats>;
  breakdownByDifficulty: Record<Difficulty, DifficultyStats>;
  recentAttempts: ReadonlyArray<AttemptHistory>;
};
```

**Tracked Metrics:**
- Overall accuracy (% correct decisions)
- Accuracy by training mode
- Accuracy by difficulty level
- Accuracy by position
- Time spent training
- Improvement over time

**Dependencies:**
- Database (persist progress)

### Odds Calculator (`app/lib/training/odds-calculator.ts`)

**Responsibility:** Calculate pot odds and hand equity.

**Interface:**
```typescript
export function calculatePotOdds(
  pot: number,
  toCall: number
): { ratio: string; percentage: number };

export function calculateEquity(
  holeCards: [Card, Card],
  communityCards: ReadonlyArray<Card>,
  opponentRange: Range
): number; // 0-100 percentage

export function calculateOuts(
  holeCards: [Card, Card],
  communityCards: ReadonlyArray<Card>,
  targetHand: HandRank
): number;
```

**Calculations:**
- **Pot Odds:** `toCall / (pot + toCall)`
- **Equity:** Monte Carlo simulation (run 10k hands)
- **Outs:** Count cards that improve hand to target

**Dependencies:**
- `game-engine/hand-evaluator.ts` (evaluate hands in simulation)
- `game-engine/rng.ts` (Monte Carlo randomness)

## Shared Utilities

### Card Utilities (`app/lib/shared/card-utils.ts`)

**Responsibility:** Card representation, deck creation, shuffling.

**Interface:**
```typescript
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';
export type Suit = 'h' | 'd' | 'c' | 's'; // hearts, diamonds, clubs, spades

export type Card = `${Rank}${Suit}`; // e.g., 'Ah', 'Kd', '7s'

export function createDeck(): ReadonlyArray<Card>;
export function shuffleDeck(deck: ReadonlyArray<Card>, rng: RandomNumberGenerator): ReadonlyArray<Card>;
export function hashCards(cards: ReadonlyArray<Card>): number;
export function parseCard(str: string): Card;
export function cardToString(card: Card): string; // "Ace of Hearts"
```

**Card Encoding:**
- Rank: 2=0, 3=1, ..., A=12 (13 values)
- Suit: h=0, d=1, c=2, s=3 (4 values)
- Index: `rank * 4 + suit` (0-51)

**Dependencies:** None

### Type Definitions (`app/lib/shared/types.ts`)

**Responsibility:** Central type definitions used across systems.

**Core Types:**
```typescript
export type GameState = {
  readonly id: string;
  readonly status: GameStatus;
  readonly players: ReadonlyArray<Player>;
  readonly pot: Pot;
  readonly communityCards: ReadonlyArray<Card>;
  readonly currentBet: number;
  readonly dealer: number;
  readonly currentActor: number;
  readonly handNumber: number;
  readonly blinds: { small: number; big: number };
  readonly deck: ReadonlyArray<Card>;
};

export type GameStatus =
  | 'WAITING'
  | 'DEALING'
  | 'PREFLOP'
  | 'FLOP'
  | 'TURN'
  | 'RIVER'
  | 'SHOWDOWN'
  | 'COMPLETE';

export type Player = {
  readonly id: string;
  readonly name: string;
  readonly chips: number;
  readonly betThisRound: number;
  readonly holeCards: readonly [Card, Card] | null;
  readonly position: Position;
  readonly hasFolded: boolean;
  readonly isAllIn: boolean;
};

export type PlayerAction =
  | { type: 'FOLD' }
  | { type: 'CHECK' }
  | { type: 'CALL' }
  | { type: 'BET'; amount: number }
  | { type: 'RAISE'; amount: number }
  | { type: 'ALL_IN' };

export type Position = 'UTG' | 'MP' | 'CO' | 'BTN' | 'SB' | 'BB';

export const enum HandRank {
  HIGH_CARD = 0,
  PAIR = 1,
  TWO_PAIR = 2,
  THREE_OF_KIND = 3,
  STRAIGHT = 4,
  FLUSH = 5,
  FULL_HOUSE = 6,
  FOUR_OF_KIND = 7,
  STRAIGHT_FLUSH = 8,
  ROYAL_FLUSH = 9,
}
```

### Validation Schemas (`app/lib/shared/schemas.ts`)

**Responsibility:** Zod schemas for runtime validation.

**Schemas:**
```typescript
import { z } from 'zod';

export const CardSchema = z.custom<Card>((val) => {
  return typeof val === 'string' && /^[2-9TJQKA][hdcs]$/.test(val);
});

export const PlayerActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('FOLD') }),
  z.object({ type: z.literal('CHECK') }),
  z.object({ type: z.literal('CALL') }),
  z.object({ type: z.literal('BET'), amount: z.number().positive() }),
  z.object({ type: z.literal('RAISE'), amount: z.number().positive() }),
  z.object({ type: z.literal('ALL_IN') }),
]);

export const GameStateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['WAITING', 'DEALING', 'PREFLOP', 'FLOP', 'TURN', 'RIVER', 'SHOWDOWN', 'COMPLETE']),
  players: z.array(PlayerSchema),
  pot: PotSchema,
  communityCards: z.array(CardSchema),
  currentBet: z.number().nonnegative(),
  dealer: z.number().int().nonnegative(),
  currentActor: z.number().int().nonnegative(),
  handNumber: z.number().int().positive(),
  blinds: z.object({
    small: z.number().positive(),
    big: z.number().positive(),
  }),
  deck: z.array(CardSchema),
});
```

**Usage:** Validate API inputs, database outputs

## UI Components

### Poker Table (`app/components/PokerTable.tsx`)

**Responsibility:** Render poker table layout with players, pot, community cards.

**Props:**
```typescript
type PokerTableProps = {
  gameState: GameState;
  currentUserId: string;
  onAction: (action: PlayerAction) => void;
};
```

**Children:**
- `PlayerSeat` (6 seats around table)
- `CommunityCards` (flop, turn, river)
- `PotDisplay` (main pot, side pots)
- `ActionButtons` (fold, check, call, raise)

**State:** UI animations (chip movement, card dealing)

### Card Component (`app/components/Card.tsx`)

**Responsibility:** Render single playing card.

**Props:**
```typescript
type CardProps = {
  card: Card | 'back'; // 'back' for face-down cards
  size?: 'small' | 'medium' | 'large';
  className?: string;
};
```

**Rendering:**
- SVG-based card graphics (no external images)
- Responsive sizing
- Animations (flip, slide)

### Action Buttons (`app/components/ActionButtons.tsx`)

**Responsibility:** Render action buttons (fold, check, call, raise).

**Props:**
```typescript
type ActionButtonsProps = {
  legalActions: ReadonlyArray<PlayerAction>;
  currentBet: number;
  playerChips: number;
  onAction: (action: PlayerAction) => void;
};
```

**Features:**
- Disable illegal actions
- Raise slider (bet sizing)
- Keyboard shortcuts (F=fold, C=call, R=raise)

### Training Scenario Display (`app/components/TrainingScenario.tsx`)

**Responsibility:** Display training scenario with decision prompt.

**Props:**
```typescript
type TrainingScenarioProps = {
  scenario: Scenario;
  onSubmit: (action: PlayerAction) => void;
};
```

**Layout:**
- Simplified poker table (fewer players)
- Highlighted decision prompt
- Timer (optional, for timed challenges)

### Feedback Modal (`app/components/FeedbackModal.tsx`)

**Responsibility:** Show feedback after training decision.

**Props:**
```typescript
type FeedbackModalProps = {
  feedback: Feedback;
  onNext: () => void;
};
```

**Sections:**
- Correctness indicator (✓ or ✗)
- Explanation text
- Stats (pot odds, equity, hand strength)
- Alternative actions
- Next button

### Progress Dashboard (`app/components/ProgressDashboard.tsx`)

**Responsibility:** Display training progress and analytics.

**Props:**
```typescript
type ProgressDashboardProps = {
  stats: ProgressStats;
};
```

**Widgets:**
- Overall accuracy (pie chart)
- Scenarios completed (bar chart)
- Accuracy by mode (radar chart)
- Recent attempts (table)

## Module Boundaries

### Game Engine Module
**Location:** `app/lib/game-engine/`

**Public API:**
- `applyAction()` - Apply player action
- `validateAction()` - Validate action
- `evaluateHand()` - Evaluate hand strength
- `calculatePots()` - Calculate pot distribution

**Internal (Private):**
- Hand evaluation lookup table
- Card dealing logic
- State transition logic

**Dependencies:** None (pure functions, no external dependencies)

### Training System Module
**Location:** `app/lib/training/`

**Public API:**
- `generateScenario()` - Generate training scenario
- `analyzeDecision()` - Evaluate user decision
- `getProgress()` - Fetch user progress

**Internal (Private):**
- Scenario templates
- Feedback templates
- Difficulty algorithms

**Dependencies:**
- Game engine (hand evaluation, odds)
- Database (persist progress)

### UI Module
**Location:** `app/components/` and `app/routes/`

**Public API:**
- React components (exported)
- Route loaders/actions

**Internal (Private):**
- Component state
- Animations
- Event handlers

**Dependencies:**
- Training system (via API routes)
- Zustand stores (UI state)

## Component Communication

### UI → API Routes (HTTP)
```typescript
// Client-side
async function makeAction(gameId: string, action: PlayerAction) {
  const response = await fetch(`/api/game/${gameId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  return response.json();
}
```

### API Routes → Game Engine (Function Call)
```typescript
// Server-side (React Router action)
export async function action({ request, params }: ActionFunctionArgs) {
  const { action } = await request.json();
  const gameState = await loadGameState(params.gameId);

  // Call game engine
  const newState = applyAction(gameState, userId, action, createSecureRNG());

  await saveGameState(params.gameId, newState);
  return json(newState);
}
```

### Training System → Game Engine (Function Call)
```typescript
// Training system uses game engine
export function generateScenario(mode: TrainingMode, difficulty: Difficulty) {
  const scenario = createBaseScenario(difficulty);

  // Use game engine to evaluate hand
  const handStrength = evaluateHand([
    ...scenario.holeCards,
    ...scenario.communityCards,
  ]);

  return { ...scenario, handStrength };
}
```

## Testing Strategy

### Game Engine Tests
- **Unit Tests:** Every pure function (100% coverage)
- **Property Tests:** State invariants (pot = sum of bets, etc.)
- **Integration Tests:** Full hand flows (deal → showdown)

### Training System Tests
- **Unit Tests:** Scenario generation, feedback logic
- **Integration Tests:** Full training flow (scenario → decision → feedback)

### UI Tests
- **Component Tests:** Vitest + React Testing Library
- **E2E Tests:** Playwright (full user flows)

## Related Documentation

- [System Overview](./system-overview.md) - High-level architecture
- [Database Schema](./database-schema.md) - Database design
- [ADR 005: Game Engine](../decisions/005-game-engine-architecture.md)
