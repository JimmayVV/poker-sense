# 004. Testing Strategy

**Date:** 2025-11-08
**Status:** Accepted
**Deciders:** Jimmy VV, Claude Code
**Technical Story:** [Issue #5](https://github.com/JimmayVV/poker-sense/issues/5)

## Context

Building a Texas Hold'em training application with strict testing requirements. The game engine must have 100% test coverage to ensure correctness (poker rules are complex and unforgiving). Solo developer with no manual QA team means automated testing is the primary quality gate. TDD workflow (Red-Green-Refactor) is mandatory for game engine development.

Critical constraints:
- **100% coverage on game engine** (non-negotiable - poker logic must be bulletproof)
- **95%+ overall coverage** (fail builds below this threshold)
- **TDD workflow** (write tests first, implement to pass, refactor)
- **Mobile-first testing** (Chrome + Safari emulation, performance testing)
- **Server-side game logic** (must test React Router loaders/actions)
- **Solo developer** (no manual QA, tests are the safety net)
- **Fast feedback loops** (Vite + Vitest for rapid test cycles)

Testing must cover:
- Pure game engine logic (hand evaluation, pot calculation, action validation)
- Training scenario system (AI decisions, scenario generation)
- React Router loaders/actions (server-side API routes)
- UI components (accessible, mobile-responsive)
- Integration flows (game state → UI → server → game state)
- E2E critical paths (signup → training → game completion)

## Decision Drivers

- **Coverage Enforcement:** Build must fail if coverage < 95% (prevent regression)
- **TDD Compatibility:** Framework must support test-first development
- **Vite Integration:** Native Vite support for fast test runs (critical for TDD velocity)
- **Mobile Testing:** Emulate iOS Safari + Android Chrome (primary platforms)
- **Server-Side Testing:** Test React Router loaders/actions (game engine API)
- **Component Testing:** Test React components in isolation (React Testing Library)
- **E2E Stability:** Reliable E2E tests (no flakiness, mobile emulation)
- **Solo Developer DX:** Simple setup, great error messages, fast debugging
- **CI/CD Integration:** Run tests on every PR (GitHub Actions)

## Considered Options

### Decision 1: Unit/Integration Testing Framework

#### Option 1.1: Vitest

**Description:** Vite-native test framework. ESM-first, compatible with Jest API, extremely fast.

**Pros:**
- **Vite-native** (zero config, uses existing Vite config)
- **Fastest test runs** (HMR for tests, only re-runs changed tests)
- **ESM-first** (no transpilation overhead, matches production)
- **Jest-compatible API** (easy migration, familiar API)
- **Built-in coverage** (c8/istanbul, no extra setup)
- **TypeScript native** (no ts-jest needed)
- **Watch mode excellence** (instant feedback for TDD)
- **Parallel execution** (fast CI runs)
- **UI mode** (visual test debugging)

**Cons:**
- Newer than Jest (smaller ecosystem, fewer Stack Overflow answers)
- Some Jest plugins may not work (rare)

#### Option 1.2: Jest

**Description:** Industry standard test framework, most widely used.

**Pros:**
- Most mature (huge ecosystem, every problem solved)
- Largest community (Stack Overflow answers for everything)
- Excellent snapshot testing
- Many plugins available

**Cons:**
- **Slow with Vite** (requires transformation, no native integration)
- Requires ts-jest for TypeScript (extra build step)
- Slower feedback loops (bad for TDD)
- Heavier configuration (jest.config.js, transform, moduleNameMapper)
- CommonJS-focused (ESM support still maturing)

### Decision 2: E2E Testing Framework

#### Option 2.1: Playwright

**Description:** Modern E2E framework by Microsoft. Multi-browser, mobile emulation, stable.

**Pros:**
- **Mobile emulation built-in** (iOS Safari, Android Chrome)
- **Multi-browser** (Chromium, Firefox, WebKit)
- **Stable selectors** (test by role, label, text - accessible)
- **Auto-wait** (no manual waits, no flakiness)
- **Parallel execution** (fast CI)
- **Trace viewer** (debug failures visually)
- **TypeScript-first** (excellent DX)
- **Network interception** (mock APIs, test offline)

**Cons:**
- Larger binary size (downloads browsers)
- Slower than Vitest (E2E is inherently slower)

#### Option 2.2: Cypress

**Description:** Popular E2E framework, developer-friendly.

**Pros:**
- Mature ecosystem
- Time-travel debugging
- Good documentation
- Real-time reloading

**Cons:**
- **No WebKit support** (can't test iOS Safari, dealbreaker for mobile-first)
- Runs in browser (architectural limitation)
- Slower than Playwright
- Flakier (manual waits often needed)
- Worse mobile emulation

### Decision 3: Component Testing Library

#### Option 3.1: React Testing Library

**Description:** Test components by behavior, not implementation. Encourages accessible selectors.

**Pros:**
- **Best practice approach** (test like a user)
- **Accessible by default** (queries by role, label, text)
- **Implementation-agnostic** (refactor internals, tests still pass)
- **Small API surface** (easy to learn)
- **Great error messages** (tells you what went wrong)
- **Works with Vitest** (seamless integration)

**Cons:**
- Can't test implementation details (by design, but frustrates some)
- Learning curve for "user-centric" mindset

#### Option 3.2: Enzyme

**Description:** Airbnb's testing library, implementation-focused.

**Pros:**
- Full control over implementation testing
- Shallow rendering for isolation

**Cons:**
- **Deprecated** (no longer maintained)
- React 18 support incomplete
- Encourages testing implementation (brittle tests)
- Dealbreaker: unmaintained

### Decision 4: Test Organization

#### Option 4.1: Co-located `__tests__` directories

**Description:** Place tests next to source code in `__tests__` folders.

**Structure:**
```
app/
├── lib/
│   ├── game-engine/
│   │   ├── __tests__/
│   │   │   ├── hand-evaluator.test.ts
│   │   │   └── pot-calculator.test.ts
│   │   ├── hand-evaluator.ts
│   │   └── pot-calculator.ts
```

**Pros:**
- **Easy to find tests** (always next to source)
- **Import simplicity** (relative imports short)
- **Refactoring-friendly** (move folder, tests move too)
- **Clear ownership** (test matches file structure)

**Cons:**
- More directories in source tree
- Test files in production build (mitigated by build config)

#### Option 4.2: Separate `tests/` directory

**Description:** Mirror source structure in separate `tests/` directory.

**Structure:**
```
tests/
├── lib/
│   └── game-engine/
│       ├── hand-evaluator.test.ts
│       └── pot-calculator.test.ts
app/
├── lib/
    └── game-engine/
        ├── hand-evaluator.ts
        └── pot-calculator.ts
```

**Pros:**
- Cleaner source tree
- Test files never in production

**Cons:**
- **Harder to find tests** (navigate to separate directory)
- **Longer import paths** (../../app/lib/...)
- **Refactoring pain** (move source, must update test path)
- **Stale tests** (easier to forget to update)

### Decision 5: Coverage Enforcement

#### Option 5.1: Fail build if coverage < thresholds

**Description:** Vitest config enforces coverage thresholds, CI fails if below.

**Thresholds:**
- Game engine: 100% (statements, branches, functions, lines)
- Training logic: 90%
- UI components: 70%
- Overall: 95%

**Pros:**
- **Prevents regression** (can't merge code without tests)
- **Quality gate** (automated enforcement)
- **Visibility** (coverage reports in PR)

**Cons:**
- Can block urgent fixes (mitigated by emergency bypass)
- Initial effort to reach 95% (worth it)

#### Option 5.2: Track coverage, don't enforce

**Description:** Generate reports, but don't fail builds.

**Pros:**
- Flexible (can merge without 100% coverage)

**Cons:**
- **Coverage will decay** (guaranteed without enforcement)
- No accountability (who fixes it?)
- Defeats purpose of 100% game engine coverage

## Decision Outcome

### Unit/Integration Testing
**Chosen:** Vitest + React Testing Library

**Justification:**
Vitest is the obvious choice for a Vite-based project. Native integration means zero configuration and instant test runs (critical for TDD). Jest API compatibility means familiar testing patterns, but with Vite speed. For a solo developer doing TDD, fast feedback loops are non-negotiable - Vitest's watch mode with HMR gives instant test results, enabling rapid Red-Green-Refactor cycles.

React Testing Library enforces best practices (test behavior, not implementation) and ensures accessibility (queries by role/label). For a poker trainer, accessible selectors are important (mobile users, potential screen readers).

### E2E Testing
**Chosen:** Playwright

**Justification:**
Playwright is the only E2E framework that properly supports iOS Safari emulation (WebKit). For a mobile-first app, testing on both Chrome (Android) and Safari (iOS) is mandatory. Playwright's auto-wait and stable selectors eliminate flakiness. Trace viewer makes debugging E2E failures trivial.

Cypress's lack of WebKit support is a dealbreaker. Can't ship mobile-first app without testing iOS Safari behavior.

### Component Testing
**Chosen:** React Testing Library

**Justification:**
React Testing Library's user-centric approach produces more maintainable tests. Testing by accessible selectors (role, label, text) means tests survive refactoring and ensure accessibility. Enzyme is deprecated, so not an option.

### Test Organization
**Chosen:** Co-located `__tests__` directories

**Justification:**
Co-located tests are easier to maintain. When refactoring game engine code, tests move with the source. Solo developer benefits from simplicity - always know where tests live (next to source). Import paths stay short. Build config excludes `__tests__` from production bundle.

### Coverage Enforcement
**Chosen:** Fail build if coverage < thresholds

**Justification:**
**Non-negotiable.** Without enforcement, coverage will decay. Game engine must have 100% coverage - poker rules are complex, and untested edge cases will cause bugs. CI failing on low coverage prevents regressions. Solo developer needs automated quality gates (no manual QA team).

### Consequences

**Positive:**
- **Instant feedback** (Vitest watch mode enables rapid TDD)
- **100% game engine coverage** (enforced, prevents bugs)
- **Mobile testing** (Playwright emulates iOS Safari + Android Chrome)
- **Accessible tests** (React Testing Library encourages good selectors)
- **Zero config** (Vitest uses Vite config, Playwright auto-configures)
- **Fast CI** (parallel test execution, only run changed tests)
- **Quality gate** (builds fail if coverage < 95%)
- **Great DX** (Vitest UI mode, Playwright trace viewer)

**Negative:**
- **Learning curve** (if unfamiliar with Vitest/Playwright)
- **Initial effort** (reaching 95% coverage takes time)
- **E2E slower** (inherent, but Playwright is fastest option)
- **Coverage can block urgent fixes** (mitigated by emergency --no-coverage flag)

**Neutral:**
- **More test files** (co-located `__tests__` adds directories)
- **CI time** (full test suite takes time, but parallelizes well)

## Implementation Notes

### Vitest Configuration

**File:** `/config/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./config/vitest-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'config/',
        '**/*.config.ts',
        '**/*.d.ts',
        '**/types/',
      ],
      thresholds: {
        // Global thresholds (fail build if below)
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
        // Per-file thresholds for critical paths
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
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../app'),
    },
  },
});
```

**Setup File:** `/config/vitest-setup.ts`

```typescript
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock matchMedia (for responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver (for lazy loading)
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

### Playwright Configuration

**File:** `/config/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

### GitHub Actions CI

**File:** `.github/workflows/test.yml`

```yaml
name: Test

on:
  pull_request:
  push:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Dependencies to Install

```bash
# Vitest + React Testing Library
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D jsdom

# Playwright
npm install -D @playwright/test

# Type definitions
npm install -D @types/node
```

### Test Structure Example

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

## Related Decisions

- [ADR 001: Tech Stack](./001-tech-stack.md) - Vite enables Vitest integration
- [ADR 002: Deployment Platform](./002-deployment-platform.md) - Vercel CI integration
- [ADR 003: State Management](./003-state-management.md) - Zustand testing patterns
- [ADR 006: Game Engine Architecture](./006-game-engine.md) - 100% coverage requirement

## Links

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Vitest Coverage](https://vitest.dev/guide/coverage.html)
