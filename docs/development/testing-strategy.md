# Testing Strategy

> **Status:** Accepted (ADR 004)
> **Last Updated:** 2025-11-08

## Overview

Comprehensive testing strategy for poker-sense. 100% game engine coverage (non-negotiable), 95%+ overall coverage (enforced in CI). TDD workflow mandatory for game engine. Vitest for unit/integration, Playwright for E2E, React Testing Library for components.

## Table of Contents

- [Philosophy](#philosophy)
- [Coverage Requirements](#coverage-requirements)
- [Test-Driven Development (TDD)](#test-driven-development-tdd)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [Component Testing](#component-testing)
- [E2E Testing](#e2e-testing)
- [Mock Strategies](#mock-strategies)
- [Performance Testing](#performance-testing)
- [CI/CD Integration](#cicd-integration)
- [Debugging Tests](#debugging-tests)

---

## Philosophy

**Test behavior, not implementation.** Write tests that verify what the code does, not how it does it. Tests should survive refactoring.

**TDD for game engine.** Write failing tests first (Red), implement to pass (Green), refactor (Refactor). 100% coverage is achieved through test-first development.

**Mobile-first testing.** Test on iOS Safari + Android Chrome emulation. Performance testing for mobile devices.

**Fail fast, fail loud.** Builds fail if coverage < 95%. No exceptions. Tests are the quality gate.

---

## Coverage Requirements

### Global Thresholds (Enforced in CI)

| Area | Statements | Branches | Functions | Lines |
|------|-----------|----------|-----------|-------|
| **Game Engine** | 100% | 100% | 100% | 100% |
| **Training Logic** | 90% | 90% | 90% | 90% |
| **UI Components** | 70% | 70% | 70% | 70% |
| **Integration Paths** | 80% | 80% | 80% | 80% |
| **Overall** | 95% | 95% | 95% | 95% |

### Why 100% Game Engine Coverage?

Poker rules are complex and unforgiving. A single bug in hand evaluation, pot calculation, or action validation can ruin user experience. 100% coverage ensures every edge case is tested:

- All poker hand rankings (royal flush → high card)
- Split pots, side pots, all-in scenarios
- Blinds, antes, antes
- Betting round validation (pre-flop, flop, turn, river)
- Position calculations (dealer, small blind, big blind, UTG, etc.)
- Tournament progression (blind increases, eliminations, final table)

**No exceptions.** If it's in the game engine, it's 100% tested.

### Enforcement

```typescript
// config/vitest.config.ts
coverage: {
  thresholds: {
    // Global (fail build if below)
    statements: 95,
    branches: 95,
    functions: 95,
    lines: 95,
    // Per-directory thresholds
    'app/lib/game-engine/**/*.ts': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
    'app/lib/training/**/*.ts': {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
    },
  },
}
```

**Build fails if below thresholds.** No PRs merged without tests.

---

## Test-Driven Development (TDD)

### The Red-Green-Refactor Cycle

TDD is **mandatory** for game engine. Optional but recommended for other code.

#### Step 1: RED - Write Failing Test

Write a test for the functionality you want to implement. Run it. It should fail (no implementation yet).

```typescript
// app/lib/game-engine/__tests__/hand-evaluator.test.ts
import { describe, it, expect } from 'vitest';
import { evaluateHand } from '../hand-evaluator';

describe('evaluateHand', () => {
  it('should identify royal flush', () => {
    const cards = [
      { rank: 'A', suit: 'hearts' },
      { rank: 'K', suit: 'hearts' },
      { rank: 'Q', suit: 'hearts' },
      { rank: 'J', suit: 'hearts' },
      { rank: '10', suit: 'hearts' },
    ];

    const result = evaluateHand(cards);

    expect(result.handType).toBe('royal-flush');
    expect(result.strength).toBe(10);
  });
});
```

**Run test:** `npm test`
**Expected:** ❌ Test fails (function doesn't exist yet)

#### Step 2: GREEN - Write Minimal Implementation

Write the **minimum** code to make the test pass. Don't worry about perfection yet.

```typescript
// app/lib/game-engine/hand-evaluator.ts
export function evaluateHand(cards: Card[]) {
  // Minimal implementation - just make it pass
  const isRoyalFlush =
    cards.every(c => c.suit === 'hearts') &&
    cards.some(c => c.rank === 'A') &&
    cards.some(c => c.rank === 'K') &&
    cards.some(c => c.rank === 'Q') &&
    cards.some(c => c.rank === 'J') &&
    cards.some(c => c.rank === '10');

  if (isRoyalFlush) {
    return { handType: 'royal-flush', strength: 10 };
  }

  return { handType: 'high-card', strength: 0 };
}
```

**Run test:** `npm test`
**Expected:** ✅ Test passes

#### Step 3: REFACTOR - Improve Code

Now that the test passes, refactor for quality. Tests ensure you don't break anything.

```typescript
// app/lib/game-engine/hand-evaluator.ts
export function evaluateHand(cards: Card[]): HandResult {
  const sorted = sortCards(cards);
  const isFlush = checkFlush(sorted);
  const isStraight = checkStraight(sorted);

  if (isFlush && isStraight && sorted[0].rank === 'A') {
    return { handType: 'royal-flush', strength: 10 };
  }

  // ... handle other hand types

  return { handType: 'high-card', strength: 0 };
}
```

**Run test:** `npm test`
**Expected:** ✅ Test still passes (refactoring didn't break it)

#### Repeat

Add more tests (straight flush, four of a kind, etc.). Each time: Red → Green → Refactor.

### TDD Workflow Tips

**Write tests first, always.** Don't implement before testing. Discipline matters.

**Test one thing at a time.** Each test should verify a single behavior.

**Run tests frequently.** Vitest watch mode gives instant feedback: `npm test`

**Commit on green.** Only commit when tests pass. Never commit broken tests.

**Refactor fearlessly.** Tests are your safety net. Refactor with confidence.

---

## Unit Testing

### What to Unit Test

**Pure functions** (no side effects, deterministic):
- Game logic (hand evaluation, pot calculation)
- Utilities (formatCurrency, shuffleDeck)
- Validation functions (isValidAction, canRaise)

**Stores** (Zustand state management):
- Actions (addPlayer, dealCards, processBet)
- Selectors (getCurrentPlayer, getPotSize)
- State transitions (fold → next player's turn)

### Test Structure (AAA Pattern)

**Arrange, Act, Assert** - every test follows this pattern:

```typescript
it('should calculate side pot correctly', () => {
  // ARRANGE - Set up test data
  const players = [
    { id: '1', chips: 100, bet: 50, isAllIn: true },
    { id: '2', chips: 200, bet: 100, isAllIn: false },
    { id: '3', chips: 300, bet: 100, isAllIn: false },
  ];

  // ACT - Execute the function
  const pots = calculatePots(players);

  // ASSERT - Verify the result
  expect(pots).toHaveLength(2);
  expect(pots[0]).toEqual({ amount: 150, eligiblePlayers: ['1', '2', '3'] });
  expect(pots[1]).toEqual({ amount: 100, eligiblePlayers: ['2', '3'] });
});
```

### Example: Game Engine Unit Test

```typescript
// app/lib/game-engine/__tests__/pot-calculator.test.ts
import { describe, it, expect } from 'vitest';
import { calculatePots } from '../pot-calculator';

describe('calculatePots', () => {
  it('should create main pot when all players bet same amount', () => {
    const players = [
      { id: '1', bet: 100 },
      { id: '2', bet: 100 },
      { id: '3', bet: 100 },
    ];

    const pots = calculatePots(players);

    expect(pots).toHaveLength(1);
    expect(pots[0].amount).toBe(300);
    expect(pots[0].eligiblePlayers).toEqual(['1', '2', '3']);
  });

  it('should create side pots when player goes all-in', () => {
    const players = [
      { id: '1', chips: 50, bet: 50, isAllIn: true },
      { id: '2', chips: 100, bet: 100, isAllIn: false },
      { id: '3', chips: 100, bet: 100, isAllIn: false },
    ];

    const pots = calculatePots(players);

    expect(pots).toHaveLength(2);
    expect(pots[0]).toEqual({
      amount: 150, // 50 * 3 players
      eligiblePlayers: ['1', '2', '3'],
    });
    expect(pots[1]).toEqual({
      amount: 100, // (100 - 50) * 2 players
      eligiblePlayers: ['2', '3'],
    });
  });

  it('should handle multiple all-ins', () => {
    const players = [
      { id: '1', chips: 20, bet: 20, isAllIn: true },
      { id: '2', chips: 50, bet: 50, isAllIn: true },
      { id: '3', chips: 100, bet: 100, isAllIn: false },
    ];

    const pots = calculatePots(players);

    expect(pots).toHaveLength(3);
    expect(pots[0].amount).toBe(60); // 20 * 3
    expect(pots[1].amount).toBe(60); // 30 * 2
    expect(pots[2].amount).toBe(50); // 50 * 1
  });
});
```

### Example: Zustand Store Test

```typescript
// app/lib/stores/__tests__/game-store.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../game-store';

describe('useGameStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useGameStore.setState(useGameStore.getInitialState());
  });

  it('should add player to game', () => {
    const { addPlayer, players } = useGameStore.getState();

    addPlayer({ id: '1', name: 'Alice', chips: 1000 });

    expect(players).toHaveLength(1);
    expect(players[0].name).toBe('Alice');
    expect(players[0].chips).toBe(1000);
  });

  it('should process bet and update pot', () => {
    const { addPlayer, placeBet, pot } = useGameStore.getState();

    addPlayer({ id: '1', name: 'Alice', chips: 1000 });
    placeBet('1', 100);

    const state = useGameStore.getState();
    expect(state.pot).toBe(100);
    expect(state.players[0].chips).toBe(900);
  });

  it('should move to next player after action', () => {
    const { addPlayer, fold, currentPlayerIndex } = useGameStore.getState();

    addPlayer({ id: '1', name: 'Alice', chips: 1000 });
    addPlayer({ id: '2', name: 'Bob', chips: 1000 });

    expect(currentPlayerIndex).toBe(0);

    fold('1');

    expect(useGameStore.getState().currentPlayerIndex).toBe(1);
  });
});
```

---

## Integration Testing

### What to Integration Test

**React Router loaders/actions** (server-side API routes):
- Game state API (`/api/game/:id`)
- Training scenario generation (`/api/training/scenario`)
- User progress tracking (`/api/progress`)

**Multi-module interactions**:
- Game engine + UI state sync
- Training AI + scenario system
- Supabase + game state persistence

### Example: React Router Loader Test

```typescript
// app/routes/api/game.$gameId/__tests__/loader.test.ts
import { describe, it, expect, vi } from 'vitest';
import { loader } from '../route';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'game-123',
              state: 'active',
              players: [],
              pot: 0,
            },
            error: null,
          })),
        })),
      })),
    })),
  },
}));

describe('GET /api/game/:gameId', () => {
  it('should load game state from database', async () => {
    const request = new Request('http://localhost/api/game/game-123');
    const params = { gameId: 'game-123' };

    const response = await loader({ request, params });
    const data = await response.json();

    expect(data.id).toBe('game-123');
    expect(data.state).toBe('active');
    expect(data.pot).toBe(0);
  });

  it('should return 404 for non-existent game', async () => {
    // Mock error response
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Not found' },
          })),
        })),
      })),
    });

    const request = new Request('http://localhost/api/game/invalid');
    const params = { gameId: 'invalid' };

    const response = await loader({ request, params });

    expect(response.status).toBe(404);
  });
});
```

### Example: Game Engine + Store Integration Test

```typescript
// app/lib/__tests__/game-integration.test.ts
import { describe, it, expect } from 'vitest';
import { useGameStore } from '@/lib/stores/game-store';
import { processAction } from '@/lib/game-engine/action-processor';

describe('Game Engine + Store Integration', () => {
  it('should process bet action and update store', () => {
    const store = useGameStore.getState();

    // Set up game
    store.addPlayer({ id: '1', name: 'Alice', chips: 1000 });
    store.addPlayer({ id: '2', name: 'Bob', chips: 1000 });
    store.startGame();

    // Process bet through game engine
    const action = { type: 'bet', playerId: '1', amount: 100 };
    const result = processAction(store.getState(), action);

    // Update store
    store.setState(result.newState);

    // Verify integration
    const state = useGameStore.getState();
    expect(state.pot).toBe(100);
    expect(state.players[0].chips).toBe(900);
    expect(state.currentPlayerIndex).toBe(1);
  });
});
```

---

## Component Testing

### What to Component Test

**UI Components** (React Testing Library):
- User interactions (button clicks, form inputs)
- Accessibility (ARIA labels, keyboard navigation)
- Conditional rendering (loading states, error states)
- Props handling (correct display of data)

### Testing Principles

**Test like a user.** Use accessible selectors (role, label, text). Don't test implementation details.

**Avoid testing internals.** Don't test state, class names, or internal functions. Test behavior.

**Use user-event.** Simulate real user interactions (click, type, hover).

### Example: Button Component Test

```typescript
// app/components/__tests__/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click Me</Button>);

    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click Me</Button>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click Me</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should show loading state', () => {
    render(<Button isLoading>Submit</Button>);

    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

### Example: Game Table Component Test

```typescript
// app/components/__tests__/GameTable.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameTable } from '../GameTable';

describe('GameTable', () => {
  it('should display all players', () => {
    const players = [
      { id: '1', name: 'Alice', chips: 1000 },
      { id: '2', name: 'Bob', chips: 800 },
      { id: '3', name: 'Charlie', chips: 1200 },
    ];

    render(<GameTable players={players} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('should highlight current player', () => {
    const players = [
      { id: '1', name: 'Alice', chips: 1000 },
      { id: '2', name: 'Bob', chips: 800 },
    ];

    render(<GameTable players={players} currentPlayerId="2" />);

    const bobElement = screen.getByText('Bob').closest('[data-player]');
    expect(bobElement).toHaveAttribute('data-current', 'true');
  });

  it('should display pot size', () => {
    render(<GameTable pot={350} />);

    expect(screen.getByText(/pot: \$350/i)).toBeInTheDocument();
  });

  it('should show community cards', () => {
    const communityCards = [
      { rank: 'A', suit: 'hearts' },
      { rank: 'K', suit: 'spades' },
      { rank: 'Q', suit: 'diamonds' },
    ];

    render(<GameTable communityCards={communityCards} />);

    expect(screen.getByLabelText(/ace of hearts/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/king of spades/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/queen of diamonds/i)).toBeInTheDocument();
  });
});
```

### Accessible Selectors

**Prefer:**
```typescript
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email address/i)
screen.getByText(/welcome/i)
screen.getByPlaceholderText(/search/i)
```

**Avoid:**
```typescript
screen.getByTestId('submit-button') // Last resort only
container.querySelector('.btn-primary') // Never
```

---

## E2E Testing

### What to E2E Test

**Critical user flows** (Playwright):
- Signup → training mode selection → complete scenario → view results
- Login → continue game → make decisions → finish hand
- Settings → change preferences → verify persistence
- Mobile responsiveness (iOS Safari, Android Chrome)

### E2E vs Integration vs Unit

**Unit:** Test functions in isolation
**Integration:** Test modules working together
**E2E:** Test entire user flow, browser → server → database

### Example: Training Flow E2E Test

```typescript
// tests/e2e/training-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Training Flow', () => {
  test('should complete hand strength training scenario', async ({ page }) => {
    // Navigate to training
    await page.goto('/training');
    await expect(page.getByRole('heading', { name: /training/i })).toBeVisible();

    // Select hand strength mode
    await page.getByRole('button', { name: /hand strength/i }).click();

    // Start scenario
    await page.getByRole('button', { name: /start training/i }).click();

    // Verify scenario loaded
    await expect(page.getByText(/what is the strength of this hand/i)).toBeVisible();

    // Make decision
    await page.getByRole('button', { name: /strong/i }).click();

    // Verify feedback
    await expect(page.getByText(/correct/i)).toBeVisible();

    // Complete scenario
    await page.getByRole('button', { name: /next/i }).click();

    // Verify progress saved
    await expect(page.getByText(/scenario complete/i)).toBeVisible();
  });

  test('should persist progress across sessions', async ({ page }) => {
    // Complete scenario
    await page.goto('/training');
    await page.getByRole('button', { name: /hand strength/i }).click();
    await page.getByRole('button', { name: /start training/i }).click();
    await page.getByRole('button', { name: /strong/i }).click();

    // Navigate away
    await page.goto('/dashboard');

    // Return to training
    await page.goto('/training');

    // Verify progress persisted
    await expect(page.getByText(/1 scenario completed/i)).toBeVisible();
  });
});
```

### Mobile E2E Testing

```typescript
// tests/e2e/mobile.spec.ts
import { test, expect, devices } from '@playwright/test';

test.use(devices['iPhone 13']);

test.describe('Mobile Experience', () => {
  test('should display game table responsively', async ({ page }) => {
    await page.goto('/game/123');

    // Verify mobile layout
    const table = page.getByRole('main');
    const box = await table.boundingBox();

    expect(box.width).toBeLessThanOrEqual(428); // iPhone 13 width

    // Verify touch-friendly buttons
    const foldButton = page.getByRole('button', { name: /fold/i });
    const buttonBox = await foldButton.boundingBox();

    expect(buttonBox.height).toBeGreaterThanOrEqual(44); // iOS minimum touch target
  });

  test('should handle landscape orientation', async ({ page }) => {
    await page.goto('/game/123');

    // Rotate to landscape
    await page.setViewportSize({ width: 844, height: 390 });

    // Verify layout adapts
    await expect(page.getByRole('main')).toBeVisible();
  });
});
```

### E2E Best Practices

**Test happy path first.** Core user flow must work. Then test error cases.

**Use auto-wait.** Playwright waits automatically. Don't add manual waits unless necessary.

**Test by role/label.** Accessible selectors are more stable than test IDs.

**Mobile emulation.** Always test on iOS Safari + Android Chrome.

**Run in CI.** E2E tests must run on every PR.

---

## Mock Strategies

### When to Mock

**External dependencies:**
- Supabase (database calls)
- APIs (external services)
- Date.now() (for deterministic tests)

**Don't mock:**
- Game engine logic (test the real thing)
- Pure functions (no side effects to mock)
- React components (use real components, not mocks)

### Mocking Supabase

```typescript
// app/lib/__tests__/game-service.test.ts
import { vi } from 'vitest';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: '123', state: 'active' },
            error: null,
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'new-game' },
            error: null,
          })),
        })),
      })),
    })),
  },
}));
```

### Mocking Zustand Store

```typescript
// app/components/__tests__/GameActions.test.tsx
import { vi } from 'vitest';
import { useGameStore } from '@/lib/stores/game-store';

vi.mock('@/lib/stores/game-store', () => ({
  useGameStore: vi.fn(() => ({
    players: [
      { id: '1', name: 'Alice', chips: 1000 },
      { id: '2', name: 'Bob', chips: 800 },
    ],
    currentPlayerId: '1',
    fold: vi.fn(),
    call: vi.fn(),
    raise: vi.fn(),
  })),
}));
```

### Mocking Date/Time

```typescript
import { vi } from 'vitest';

// Mock Date.now() for deterministic tests
const mockDate = new Date('2025-11-08T12:00:00Z');
vi.setSystemTime(mockDate);

// Test code that uses Date.now()
expect(getTimestamp()).toBe(mockDate.getTime());

// Restore real time
vi.useRealTimers();
```

---

## Performance Testing

### Bundle Size Monitoring

```typescript
// config/vitest.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'game-engine': ['./app/lib/game-engine'],
          'ui': ['./app/components'],
        },
      },
    },
  },
});
```

**Target:** Total bundle < 200kb gzipped (mobile-first requirement)

### Mobile Performance Testing

```typescript
// tests/e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.use({ deviceScaleFactor: 2 }); // Retina display

test('should load game table within 3 seconds on 3G', async ({ page }) => {
  // Simulate 3G network
  await page.route('**/*', (route) =>
    route.continue({ delay: 100 }) // 100ms latency
  );

  const start = Date.now();
  await page.goto('/game/123');
  await page.waitForLoadState('networkidle');
  const duration = Date.now() - start;

  expect(duration).toBeLessThan(3000);
});

test('should maintain 60fps during animations', async ({ page }) => {
  await page.goto('/game/123');

  // Start performance monitoring
  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const longTasks = entries.filter((e) => e.duration > 50);
        resolve(longTasks.length);
      });
      observer.observe({ entryTypes: ['longtask'] });

      // Trigger animation
      document.querySelector('[data-animate]').click();

      setTimeout(() => observer.disconnect(), 2000);
    });
  });

  expect(metrics).toBe(0); // No long tasks (> 50ms blocks 60fps)
});
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on:
  pull_request:
  push:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

      - name: Check coverage thresholds
        run: |
          if [ $(grep -c "ERROR" coverage/coverage-summary.json) -gt 0 ]; then
            echo "Coverage below threshold"
            exit 1
          fi

  e2e-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  typecheck:
    runs-on: ubuntu-latest
    timeout-minutes: 5

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck
```

### PR Status Checks

All checks must pass before merge:
- ✅ Unit tests (with coverage)
- ✅ E2E tests
- ✅ Type check
- ✅ Linting

**No exceptions.** Failed tests block PR merge.

---

## Debugging Tests

### Vitest UI Mode

```bash
npm run test:ui
```

Opens visual interface at `http://localhost:51204/__vitest__/`

**Features:**
- Run tests individually
- Filter by file/test name
- View coverage live
- Debug with breakpoints

### Playwright Trace Viewer

```bash
npm run test:e2e -- --trace on
npx playwright show-report
```

**Features:**
- Visual timeline of test execution
- Screenshots at each step
- Network requests
- Console logs
- DOM snapshots

### VS Code Debugging

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Vitest Tests",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "test", "--", "--run", "--no-coverage"],
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Playwright Tests",
      "program": "${workspaceFolder}/node_modules/.bin/playwright",
      "args": ["test", "--debug"],
      "console": "integratedTerminal"
    }
  ]
}
```

Set breakpoints in VS Code, run "Debug Vitest Tests" or "Debug Playwright Tests".

### Common Debugging Commands

```bash
# Run single test file
npm test -- hand-evaluator.test.ts

# Run tests matching pattern
npm test -- --grep "royal flush"

# Debug failed tests only
npm test -- --only-failed

# Update snapshots
npm test -- -u

# Run E2E in headed mode (see browser)
npm run test:e2e -- --headed

# Debug E2E test
npm run test:e2e -- --debug
```

---

## Quick Reference

### Commands

```bash
# Unit/Integration Tests
npm test                     # Watch mode
npm run test:ui              # UI mode
npm run test:coverage        # Coverage report

# E2E Tests
npm run test:e2e             # Headless
npm run test:e2e:ui          # UI mode
npm run test:e2e:debug       # Debug mode
npm run test:e2e -- --headed # See browser

# Coverage
npm run test:coverage        # Generate report
open coverage/index.html     # View HTML report
```

### Coverage Thresholds

| Area | Required |
|------|----------|
| Game Engine | 100% |
| Training Logic | 90% |
| UI Components | 70% |
| Overall | 95% |

### Test Organization

```
app/
├── lib/
│   ├── game-engine/
│   │   ├── __tests__/
│   │   │   ├── hand-evaluator.test.ts
│   │   │   └── pot-calculator.test.ts
│   │   ├── hand-evaluator.ts
│   │   └── pot-calculator.ts
│   └── training/
│       ├── __tests__/
│       └── ...
tests/
├── e2e/
│   ├── training-flow.spec.ts
│   └── mobile.spec.ts
└── integration/
    └── game-flow.test.ts
```

### Key Principles

1. **TDD for game engine** (Red-Green-Refactor)
2. **Test behavior, not implementation**
3. **100% coverage on game logic** (enforced)
4. **Mobile-first testing** (iOS Safari + Android Chrome)
5. **Fail builds on low coverage** (no exceptions)

---

**Questions? See:**
- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Docs](https://playwright.dev/)
- [ADR 004: Testing Strategy](../decisions/004-testing-strategy.md)
