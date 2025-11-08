# 005. Game Engine Architecture

**Date:** 2025-11-08
**Status:** Accepted
**Deciders:** Jimmy VV, Claude Code
**Technical Story:** [Issue #6](https://github.com/JimmayVV/poker-sense/issues/6)

## Context

Building server-side game engine for No-Limit Texas Hold'em 6-max sit-n-go tournaments. The engine must:

- **100% Server-Side:** Prevent reverse engineering by keeping all game logic server-side
- **100% Test Coverage:** Non-negotiable requirement for game engine reliability
- **Deterministic:** Same inputs always produce same outputs (critical for testing)
- **Pure Functions:** No side effects, fully testable, easy to reason about
- **Immutable State:** Never mutate state, always return new state objects
- **Type-Safe:** Leverage TypeScript strict mode for compile-time guarantees
- **Serverless-Compatible:** Work within React Router v7 loaders/actions (stateless functions)
- **Auditable:** Ability to replay games from action logs

The game engine is the most critical component. Bugs in game logic destroy user trust. Test coverage must be 100% (no exceptions).

## Decision Drivers

- **Security:** Server-side only to prevent client-side tampering/reverse engineering
- **Testability:** 100% coverage requires pure functions, determinism, no external dependencies
- **Reliability:** Poker rules are complex (side pots, all-ins, split pots). Must be bug-free.
- **Performance:** Must handle game state updates in <100ms (serverless function limits)
- **Auditability:** Need to replay games for debugging, dispute resolution
- **Maintainability:** Solo developer needs simple, clear architecture
- **Serverless Constraints:** Must work in stateless React Router actions (no in-memory state)
- **Type Safety:** Catch edge cases at compile time, not runtime

## Considered Options

### Option 1: State Machine + Event Log Hybrid (RECOMMENDED)

**Description:** Game state as immutable state machine. All state transitions via pure reducer functions. Actions logged for auditability. Hand evaluation via custom lookup table algorithm.

**Architecture:**
```typescript
// Core types
type GameState = {
  readonly status: GameStatus;
  readonly players: ReadonlyArray<Player>;
  readonly pot: Pot;
  readonly communityCards: ReadonlyArray<Card>;
  readonly currentBet: number;
  readonly dealer: number;
  readonly currentActor: number;
  readonly handNumber: number;
  readonly blinds: { small: number; big: number };
};

type GameStatus =
  | 'WAITING'
  | 'DEALING'
  | 'PREFLOP'
  | 'FLOP'
  | 'TURN'
  | 'RIVER'
  | 'SHOWDOWN'
  | 'COMPLETE';

type PlayerAction =
  | { type: 'FOLD' }
  | { type: 'CHECK' }
  | { type: 'CALL' }
  | { type: 'BET'; amount: number }
  | { type: 'RAISE'; amount: number }
  | { type: 'ALL_IN' };

// Pure state reducer
function applyAction(
  state: GameState,
  playerId: string,
  action: PlayerAction
): GameState {
  // Validate action is legal
  validateAction(state, playerId, action);

  // Return new state (never mutate)
  return {
    ...state,
    players: updatePlayers(state.players, playerId, action),
    pot: updatePot(state.pot, action),
    currentActor: nextActor(state),
    status: deriveNextStatus(state, action),
  };
}

// Hand evaluator (7-card best hand)
function evaluateHand(cards: ReadonlyArray<Card>): HandRank {
  // Use perfect hash lookup table
  // ~130k entries for 7-card evaluation
  const hash = hashCards(cards);
  return LOOKUP_TABLE[hash];
}
```

**State Transitions:**
```
WAITING
  → [6 players seated] → DEALING

DEALING
  → [deal hole cards] → PREFLOP

PREFLOP
  → [all actions complete] → FLOP
  → [only 1 player remaining] → SHOWDOWN

FLOP
  → [deal 3 community cards] → [betting round] → TURN
  → [only 1 player remaining] → SHOWDOWN

TURN
  → [deal 1 community card] → [betting round] → RIVER
  → [only 1 player remaining] → SHOWDOWN

RIVER
  → [deal 1 community card] → [betting round] → SHOWDOWN
  → [only 1 player remaining] → SHOWDOWN

SHOWDOWN
  → [evaluate hands, award pot] → COMPLETE

COMPLETE
  → [next hand] → DEALING
  → [tournament over] → WAITING
```

**Event Log:**
```typescript
type GameEvent = {
  readonly handId: string;
  readonly sequence: number;
  readonly timestamp: Date;
  readonly playerId: string;
  readonly action: PlayerAction;
  readonly resultingState: GameState;
};

// Events persisted to database
// Can replay entire game from events
function replayGame(events: ReadonlyArray<GameEvent>): GameState {
  return events.reduce(
    (state, event) => applyAction(state, event.playerId, event.action),
    INITIAL_STATE
  );
}
```

**Pros:**
- **100% Testable:** Pure functions, deterministic, no side effects
- **Type-Safe:** TypeScript discriminated unions catch illegal state transitions
- **Simple Mental Model:** State machine → action → new state
- **Auditable:** Event log allows perfect game replay
- **Serverless-Compatible:** No in-memory state, stateless functions
- **Performant:** Lookup table makes hand evaluation O(1)
- **Debuggable:** Can inspect state at any point in game
- **Immutable:** No mutation bugs, safe concurrent access
- **Extensible:** Easy to add new game variants (Omaha, etc.)

**Cons:**
- Must build custom hand evaluator (can't use libraries)
- Lookup table requires ~130k entries (~1MB data)
- More upfront design work than OOP approach

### Option 2: Event Sourcing

**Description:** Store only events, derive state by replaying events. No explicit state storage.

**Pros:**
- Perfect audit trail (events are source of truth)
- Easy to add new derived state
- Time-travel debugging

**Cons:**
- Performance: Must replay entire game to get current state
- Complexity: Too sophisticated for this use case
- Harder to query current state efficiently
- Overkill for poker trainer

### Option 3: Redux-Style Reducers

**Description:** Similar to Option 1 but using Redux patterns (actions, reducers, selectors).

**Pros:**
- Familiar pattern if using Redux elsewhere
- Good dev tools (Redux DevTools)
- Clear action types

**Cons:**
- Boilerplate (action creators, action types)
- Redux is client-side library (doesn't fit server-only requirement)
- More complex than needed
- Not optimized for serverless

### Option 4: OOP Classes

**Description:** Game, Player, Deck, Pot as classes with methods.

```typescript
class Game {
  private state: GameState;

  applyAction(playerId: string, action: PlayerAction): void {
    this.state = this.validateAndUpdate(playerId, action);
  }

  getCurrentState(): GameState {
    return { ...this.state };
  }
}
```

**Pros:**
- Familiar OOP patterns
- Encapsulation
- Easy to understand for beginners

**Cons:**
- **Mutable State:** Classes encourage mutation, harder to test
- **Side Effects:** Methods can have hidden side effects
- **Not Serverless-Friendly:** Classes require instantiation, state management
- **Harder to Test:** Need to mock dependencies, test methods in isolation
- **Less Type-Safe:** TypeScript classes don't enforce state machine transitions
- **Not Pure:** Methods can access/modify `this`, breaking purity

## Decision Outcome

**Chosen:** Option 1 - State Machine + Event Log Hybrid

### Justification

State machine + event log provides the perfect architecture for a server-side poker engine:

1. **100% Test Coverage:** Pure functions with deterministic outputs are trivially testable. No mocking, no side effects, just input → output assertions. Every state transition can be unit tested.

2. **Type Safety:** TypeScript discriminated unions enforce legal state transitions at compile time. Impossible states are unrepresentable.

3. **Serverless-Compatible:** Stateless pure functions work perfectly in React Router actions. No need to manage class instances across requests.

4. **Debuggable:** Event log allows replaying any hand to see exactly what happened. Critical for debugging user-reported issues.

5. **Performance:** Lookup table for hand evaluation is O(1) and fast enough for serverless functions.

6. **Simple:** Reducer pattern is simple to understand and maintain. Solo developer can reason about entire engine.

7. **Security:** Server-side only, no client-side logic exposure. Event log prevents tampering.

The custom hand evaluator requirement is acceptable. Using existing poker libraries would make 100% test coverage impossible (we don't control their code). Building our own ensures complete understanding and testability.

### Consequences

**Positive:**
- 100% test coverage achievable (pure functions, deterministic)
- Type system prevents illegal state transitions
- Event log provides perfect audit trail
- Stateless functions work in serverless environment
- Immutability prevents entire class of bugs
- Easy to reason about state transitions
- Hand evaluator fully understood and tested
- Can replay games for debugging
- Performance is excellent (O(1) hand evaluation)
- Extensible to other poker variants

**Negative:**
- Must implement custom hand evaluator (~1-2 days work)
- Lookup table is ~1MB (acceptable for server-side)
- Cannot use existing poker libraries
- More upfront architecture work

**Neutral:**
- TypeScript strict mode required (already decided)
- Immutability requires spread operators (standard pattern)
- Event log requires database storage (already using Supabase)

## Implementation Notes

### Core Modules

**1. Game State Reducer** (`app/lib/game-engine/reducer.ts`)
```typescript
export function applyAction(
  state: GameState,
  playerId: string,
  action: PlayerAction,
  rng: RandomNumberGenerator
): GameState {
  // 1. Validate action is legal
  const validation = validateAction(state, playerId, action);
  if (!validation.valid) {
    throw new IllegalActionError(validation.reason);
  }

  // 2. Apply action to state
  const updatedPlayers = applyActionToPlayers(state.players, playerId, action);
  const updatedPot = applyActionToPot(state.pot, action);

  // 3. Determine next status
  const nextStatus = deriveNextStatus(state, updatedPlayers);

  // 4. Deal cards if transitioning to new street
  const communityCards = shouldDealCommunityCards(nextStatus)
    ? dealCommunityCards(state.communityCards, nextStatus, rng)
    : state.communityCards;

  // 5. Return new state (immutable)
  return {
    ...state,
    players: updatedPlayers,
    pot: updatedPot,
    communityCards,
    currentBet: deriveCurrentBet(updatedPlayers),
    currentActor: deriveNextActor(state, updatedPlayers),
    status: nextStatus,
  };
}
```

**2. Action Validator** (`app/lib/game-engine/validator.ts`)
```typescript
export function validateAction(
  state: GameState,
  playerId: string,
  action: PlayerAction
): ValidationResult {
  // Check if it's player's turn
  if (state.players[state.currentActor]?.id !== playerId) {
    return { valid: false, reason: 'Not your turn' };
  }

  // Validate action type is legal
  switch (action.type) {
    case 'FOLD':
      return { valid: true };

    case 'CHECK':
      return state.currentBet === 0
        ? { valid: true }
        : { valid: false, reason: 'Cannot check with active bet' };

    case 'CALL':
      return state.currentBet > 0
        ? { valid: true }
        : { valid: false, reason: 'No bet to call' };

    case 'BET':
      return validateBetAmount(state, action.amount);

    case 'RAISE':
      return validateRaiseAmount(state, action.amount);

    case 'ALL_IN':
      return { valid: true };
  }
}
```

**3. Hand Evaluator** (`app/lib/game-engine/hand-evaluator.ts`)
```typescript
// Hand rankings (higher is better)
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

export type HandEvaluation = {
  rank: HandRank;
  value: number; // Unique value for comparison (includes kickers)
  description: string;
};

// Perfect hash lookup table
// Generated at build time via codegen script
const LOOKUP_TABLE: ReadonlyArray<HandEvaluation> = generateLookupTable();

export function evaluateHand(
  cards: readonly [Card, Card, Card, Card, Card, Card, Card]
): HandEvaluation {
  const hash = hashCards(cards);
  return LOOKUP_TABLE[hash];
}

export function findBestHand(
  holeCards: readonly [Card, Card],
  communityCards: readonly Card[]
): HandEvaluation {
  const allCards = [...holeCards, ...communityCards];
  const combinations = generateCombinations(allCards, 7);

  return combinations
    .map(evaluateHand)
    .reduce((best, current) =>
      current.value > best.value ? current : best
    );
}
```

**4. Pot Calculator** (`app/lib/game-engine/pot.ts`)
```typescript
export type Pot = {
  readonly main: number;
  readonly side: ReadonlyArray<SidePot>;
};

export type SidePot = {
  readonly amount: number;
  readonly eligiblePlayers: ReadonlyArray<string>;
};

export function calculatePots(
  players: ReadonlyArray<Player>,
  currentPot: Pot
): Pot {
  // Handle all-in side pot calculation
  // Complex logic for multiple all-ins at different amounts

  const contributions = players.map(p => p.betThisRound);
  const allIns = players.filter(p => p.isAllIn).map(p => p.betThisRound);

  if (allIns.length === 0) {
    // Simple case: no all-ins
    return {
      main: currentPot.main + sum(contributions),
      side: currentPot.side,
    };
  }

  // Complex case: calculate side pots
  return calculateSidePots(players, contributions, allIns);
}

export function distributePot(
  pot: Pot,
  winners: ReadonlyArray<Winner>
): ReadonlyArray<PotDistribution> {
  // Award main pot
  // Award side pots to eligible players
  // Handle split pots (multiple winners with same hand)
  // Return array of { playerId, amount }
}
```

**5. Random Number Generator** (`app/lib/game-engine/rng.ts`)
```typescript
// Deterministic RNG for testing
export interface RandomNumberGenerator {
  next(): number; // Returns 0-1
  shuffle<T>(arr: readonly T[]): readonly T[];
}

// Production: Cryptographically secure RNG
export function createSecureRNG(): RandomNumberGenerator {
  return {
    next: () => crypto.getRandomValues(new Uint32Array(1))[0] / 2**32,
    shuffle: <T>(arr: readonly T[]) => fisherYatesShuffle([...arr]),
  };
}

// Testing: Seeded deterministic RNG
export function createSeededRNG(seed: number): RandomNumberGenerator {
  let state = seed;
  return {
    next: () => {
      // Linear congruential generator
      state = (state * 1103515245 + 12345) % 2**31;
      return state / 2**31;
    },
    shuffle: <T>(arr: readonly T[]) =>
      fisherYatesShuffle([...arr], () => state),
  };
}
```

### State Machine Transitions

**Status Transition Logic:**
```typescript
function deriveNextStatus(
  state: GameState,
  updatedPlayers: ReadonlyArray<Player>
): GameStatus {
  const activePlayers = updatedPlayers.filter(p => !p.hasFolded && p.chips > 0);

  // Only 1 player remaining → showdown
  if (activePlayers.length === 1) {
    return 'SHOWDOWN';
  }

  // Betting round complete?
  const bettingComplete = activePlayers.every(p =>
    p.betThisRound === state.currentBet || p.isAllIn
  );

  if (!bettingComplete) {
    return state.status; // Stay in current status
  }

  // Advance to next street
  switch (state.status) {
    case 'PREFLOP': return 'FLOP';
    case 'FLOP': return 'TURN';
    case 'TURN': return 'RIVER';
    case 'RIVER': return 'SHOWDOWN';
    default: return state.status;
  }
}
```

### Serialization & Persistence

**JSON Serialization:**
```typescript
// GameState is already JSON-serializable (no Date objects, no functions)
export function serializeGameState(state: GameState): string {
  return JSON.stringify(state);
}

export function deserializeGameState(json: string): GameState {
  return JSON.parse(json); // Type-safe with Zod schema validation
}

// Validate with Zod schema
const GameStateSchema = z.object({
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
});

export function parseGameState(json: string): GameState {
  return GameStateSchema.parse(JSON.parse(json));
}
```

**Database Storage:**
- `games` table: Current game state (JSON column)
- `game_events` table: Event log (one row per action)
- Query current state: Read `games.state`
- Replay game: Read all `game_events` for game ID, reduce to final state

### Testing Strategy

**100% Coverage Requirements:**

1. **Unit Tests** - Test every pure function
   - Action validation (all legal/illegal actions)
   - State transitions (all status transitions)
   - Pot calculation (main pot, side pots, split pots)
   - Hand evaluation (all hand ranks, kickers, ties)
   - RNG (deterministic behavior)

2. **Integration Tests** - Test full hand flows
   - Complete hand from deal to showdown
   - All-in scenarios (multiple all-ins, side pots)
   - Edge cases (3-way all-in, 4-way split pot)
   - Tournament progression (blind increases, eliminations)

3. **Property-Based Tests** - Use fast-check
   - State is always valid after any action
   - Pot amount always equals sum of player bets
   - Winners always have best hand
   - Blinds always post correctly

4. **Snapshot Tests** - Regression prevention
   - Known hand outcomes (royal flush beats straight)
   - Complex pot distributions
   - Edge case resolutions

**Example Test:**
```typescript
describe('applyAction', () => {
  it('should transition from PREFLOP to FLOP when betting complete', () => {
    const state: GameState = {
      status: 'PREFLOP',
      players: [
        { id: '1', chips: 100, betThisRound: 2, hasFolded: false },
        { id: '2', chips: 98, betThisRound: 2, hasFolded: false },
      ],
      currentBet: 2,
      communityCards: [],
      // ...
    };

    const rng = createSeededRNG(12345);
    const nextState = applyAction(state, '2', { type: 'CALL' }, rng);

    expect(nextState.status).toBe('FLOP');
    expect(nextState.communityCards).toHaveLength(3);
    expect(nextState.currentBet).toBe(0);
  });
});
```

### React Router Integration

**Server Action (POST):**
```typescript
// app/routes/api/game/$gameId/action.ts
export async function action({ request, params }: ActionFunctionArgs) {
  const gameId = params.gameId;
  const { playerId, action } = await request.json();

  // 1. Load current game state from database
  const game = await db.games.findUnique({ where: { id: gameId } });
  const currentState = parseGameState(game.state);

  // 2. Apply action (pure function)
  const rng = createSecureRNG();
  const nextState = applyAction(currentState, playerId, action, rng);

  // 3. Persist new state + event
  await db.$transaction([
    db.games.update({
      where: { id: gameId },
      data: { state: serializeGameState(nextState) },
    }),
    db.gameEvents.create({
      data: {
        gameId,
        playerId,
        action: JSON.stringify(action),
        resultingState: serializeGameState(nextState),
        sequence: game.eventCount + 1,
      },
    }),
  ]);

  // 4. Return new state
  return json(nextState);
}
```

### Performance Characteristics

- **State Update:** <10ms (pure function, no I/O)
- **Hand Evaluation:** <1ms (O(1) lookup table)
- **Pot Calculation:** <5ms (even with multiple side pots)
- **Database Write:** <50ms (Supabase transaction)
- **Total Action Latency:** <100ms (well within serverless limits)

### Lookup Table Generation

**Build-Time Codegen:**
```typescript
// scripts/generate-lookup-table.ts
// Run during build to generate hand evaluation lookup table
// ~130k entries, ~1MB file size

import { generateAllHands } from './hand-generator';
import { evaluateHandNaive } from './naive-evaluator';

function generateLookupTable() {
  const allHands = generateAllHands(); // All 7-card combinations
  const table: Record<number, HandEvaluation> = {};

  for (const hand of allHands) {
    const hash = hashCards(hand);
    const evaluation = evaluateHandNaive(hand);
    table[hash] = evaluation;
  }

  return table;
}

// Write to file: app/lib/game-engine/lookup-table.generated.ts
```

## Related Decisions

- [ADR 001: Tech Stack](./001-tech-stack.md) - React Router v7 loaders/actions
- [ADR 003: State Management](./003-state-management.md) - Zustand for client state (not game state)
- [ADR 004: Testing Strategy](./004-testing-strategy.md) - Vitest, 100% coverage requirement
- [ADR 007: Database Schema](./007-database-schema.md) - Games, events, players tables

## Links

- [React Router Actions](https://reactrouter.com/en/main/route/action)
- [TypeScript Discriminated Unions](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html)
- [Poker Hand Evaluator Algorithms](https://www.codingthewheel.com/archives/poker-hand-evaluator-roundup/)
- [Perfect Hash Functions for Poker](https://en.wikipedia.org/wiki/Perfect_hash_function)
