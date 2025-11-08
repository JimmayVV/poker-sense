# 003. State Management Approach

**Date:** 2025-11-08
**Status:** Accepted
**Deciders:** Jimmy VV, Claude Code
**Technical Story:** [Issue #4](https://github.com/JimmayVV/poker-sense/issues/4)

## Context

Poker-Sense requires managing multiple state categories across different layers of the application. The game engine runs server-side (for security), while the client displays derived state and handles user interactions. The application is mobile-first, making bundle size critical. Real-time multiplayer is not required for MVP (AI opponents only).

**State Categories:**

1. **Game State:** Current hand, players, pot, dealer button, community cards, player actions, chip counts
2. **Training State:** Active scenario, user decisions, feedback, performance metrics, progress tracking
3. **User State:** Authentication session, user profile, settings, preferences, theme
4. **UI State:** Modals, toasts, form inputs, loading states, navigation state, animations

**Key Constraints:**

- Mobile-first (bundle size is critical)
- Server-side game logic (client state is derived, not authoritative)
- React Router v7 loaders/actions handle server data
- 100% test coverage on game engine
- Persistence required (localStorage + Supabase sync)
- Solo developer (simple mental model preferred)
- No real-time multiplayer for MVP

## Decision Drivers

- **Bundle Size:** Mobile-first means every KB matters
- **Server-First Architecture:** Game state is authoritative on server, client is view layer
- **Developer Experience:** Solo developer needs simple, debuggable state management
- **Persistence:** User progress and settings must persist across sessions
- **Type Safety:** Full TypeScript support with inference
- **DevTools:** Debugging state changes is critical for game logic
- **Testing:** Easy to test state transitions (game engine requires 100% coverage)
- **Performance:** Fast updates for smooth animations (card dealing, chip movements)
- **React Router Integration:** Work well with loaders/actions pattern

## Considered Options

### Option 1: Zustand + React Context

**Description:** Zustand for game/training state, React Context for UI state. React Router loaders/actions handle server communication. No separate server state library.

**Zustand Bundle Size:** 1.2kb gzipped

**State Allocation:**
```typescript
// Zustand stores
- Game state (derived from server responses)
- Training state (scenario progress, metrics)
- User preferences (theme, sound settings)

// React Context
- UI state (modals, toasts, loading)
- Form state (inputs, validation)

// React Router
- Server data fetching (loaders)
- Mutations (actions)
```

**Pros:**
- Smallest bundle size (1.2kb for Zustand + 0kb for Context)
- Simple mental model (stores are just hooks)
- No provider hell (Zustand works outside React)
- Excellent TypeScript inference
- Built-in DevTools (zustand/devtools middleware)
- Easy to persist (zustand/persist middleware)
- Fast rendering (selector-based subscriptions)
- Minimal boilerplate (no reducers, actions, or types needed)
- React Router loaders already handle server state (may not need React Query)
- Easy to test (stores are plain objects with functions)
- Can use selectors to prevent unnecessary re-renders

**Cons:**
- No built-in normalized cache like RTK Query
- Must manually handle optimistic updates
- Less opinionated than Redux (need to establish patterns)
- Smaller ecosystem than Redux

### Option 2: Redux Toolkit + RTK Query

**Description:** Redux Toolkit for client state, RTK Query for server state caching. Full-featured state management with normalized cache.

**RTK Bundle Size:** 12kb (Redux core) + 9kb (RTK Query) = 21kb gzipped

**Pros:**
- Battle-tested in production
- Built-in normalized cache (RTK Query)
- Excellent DevTools (Redux DevTools)
- Opinionated patterns (less decision fatigue)
- Automatic optimistic updates (RTK Query)
- Large ecosystem and community
- Good TypeScript support (with some boilerplate)

**Cons:**
- 17x larger bundle than Zustand (21kb vs 1.2kb)
- Significant boilerplate (slices, reducers, actions)
- Steeper learning curve
- Provider required (can't use outside React)
- RTK Query duplicates React Router loaders (unnecessary layer)
- More complex testing (need mock store)
- Overkill for AI-only opponents (RTK Query shines with real-time data)

### Option 3: Jotai

**Description:** Atomic state management. Each piece of state is an atom, composed into molecules.

**Jotai Bundle Size:** 3.2kb gzipped

**Pros:**
- Small bundle size (3.2kb)
- Bottom-up composition (atoms → molecules)
- Minimal boilerplate
- Good TypeScript support
- No provider needed (for base atoms)
- Easy to test

**Cons:**
- Less mature than Zustand/Redux
- Steeper learning curve (atomic mental model)
- Smaller ecosystem
- More complex for global state (game state is inherently global)
- Less obvious patterns for large state trees
- DevTools less mature

### Option 4: React Context Only

**Description:** Use React Context API for all state management. No external library.

**Bundle Size:** 0kb (built-in)

**Pros:**
- Zero bundle cost
- Built into React
- Simple for small apps
- No external dependencies

**Cons:**
- Poor performance (all consumers re-render on any change)
- Provider hell (need multiple contexts)
- No DevTools integration
- No built-in persistence
- Difficult to test (need to wrap with providers)
- Hard to split state without creating many contexts
- Not suitable for frequently-changing state (game state updates often)

### Option 5: React Query (TanStack Query) + Context

**Description:** React Query for server state, React Context for client state.

**React Query Bundle Size:** 12kb gzipped

**Pros:**
- Excellent server state caching
- Automatic background refetching
- Optimistic updates built-in
- Great DevTools
- Normalized cache with tanstack-query/v5

**Cons:**
- 10x larger than Zustand (12kb vs 1.2kb)
- Duplicates React Router loaders (loaders already handle server data fetching)
- React Router actions already handle mutations
- Overkill for AI opponents (no real-time data)
- Still need Context for client state (provider hell)
- More complex mental model (cache invalidation, stale-while-revalidate)

## Decision Outcome

**Chosen:** Zustand + React Context (no React Query)

### Justification

Zustand provides the best balance for this project:

**Bundle Size:** 1.2kb is critical for mobile-first. Redux Toolkit (21kb) and React Query (12kb) are too heavy for an application where bundle size directly impacts mobile performance. Zustand is 17x smaller than RTK.

**React Router Integration:** React Router v7 loaders/actions already handle server data fetching and mutations. Adding React Query would duplicate this functionality. The game engine responds via actions; loaders refetch on revalidation. This covers our server state needs without extra libraries.

**Server-Side Game Logic:** Since the game engine is authoritative on the server, the client only holds derived/view state. We don't need RTK Query's normalized cache or React Query's background refetching. The server sends complete game state snapshots; client displays them.

**AI Opponents:** With no real-time multiplayer, we don't need React Query's polling or RTK Query's subscriptions. Game state updates happen via user actions → server response → Zustand update.

**DevTools:** Zustand middleware provides Redux-like DevTools integration for debugging game state transitions. Critical for testing poker hand logic.

**Persistence:** Zustand's persist middleware + localStorage handles settings/preferences. Training progress syncs to Supabase via React Router actions.

**Testing:** Zustand stores are plain objects with functions. Easy to test (no mock store required). Critical for 100% game engine coverage.

**Developer Experience:** Solo developer benefits from Zustand's simplicity. No reducers, action creators, or type boilerplate. Just hooks.

**Performance:** Selector-based subscriptions prevent unnecessary re-renders. Important for smooth card/chip animations.

### State Allocation Strategy

**Zustand Stores:**

1. **Game Store** (`useGameStore`)
   - Derived from server responses
   - Current hand state, players, pot, community cards
   - Player actions history
   - Dealer button position
   - Not persisted (server is source of truth)

2. **Training Store** (`useTrainingStore`)
   - Active scenario
   - User decisions and feedback
   - Performance metrics (accuracy, speed)
   - Partially persisted (in-progress scenario to localStorage)
   - Synced to Supabase via actions

3. **User Store** (`useUserStore`)
   - User preferences (theme, sound, animations)
   - Settings (difficulty, game speed)
   - Persisted to localStorage
   - Synced to Supabase via actions

**React Context:**

4. **UI Context** (`useUI`)
   - Modal state (open/closed, content)
   - Toast notifications
   - Loading states
   - Navigation state
   - Not persisted (ephemeral UI state)

**React Router:**

5. **Server Data** (via loaders)
   - User profile (loader)
   - Training scenarios (loader)
   - Historical stats (loader)

6. **Mutations** (via actions)
   - Place bet
   - Fold/Call/Raise
   - Complete scenario
   - Update preferences

### Persistence Strategy

**localStorage (immediate, offline-first):**
```typescript
// Zustand persist middleware
const useUserStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      soundEnabled: true,
      // ...
    }),
    { name: 'poker-sense-user' }
  )
);
```

**Supabase (background sync):**
- Debounced sync on preference changes (5 second delay)
- Immediate sync on scenario completion
- Conflict resolution: server wins (user can override)

**No Persistence:**
- Game state (server is source of truth)
- UI state (ephemeral)

### Consequences

**Positive:**
- Smallest possible bundle (1.2kb vs 12-21kb alternatives)
- Simple mental model (stores are hooks)
- No duplicate server state logic (React Router loaders sufficient)
- Excellent TypeScript inference (minimal boilerplate)
- Easy to test (plain objects and functions)
- Fast rendering (selector-based subscriptions)
- Built-in DevTools for debugging
- Built-in persistence middleware
- Works outside React (can use in vanilla JS utilities)
- No provider hell (Zustand doesn't need providers)

**Negative:**
- Less opinionated than Redux (need to establish patterns)
- No built-in normalized cache (not needed for our use case)
- Must manually implement optimistic updates (rare in poker trainer)
- Smaller ecosystem than Redux (less third-party middleware)

**Neutral:**
- Need to establish Zustand conventions (slice pattern, naming, selectors)
- Must decide when to use Zustand vs Context (clear guideline: frequent updates = Zustand, UI state = Context)

## Implementation Notes

### Store Structure

**Game Store (useGameStore):**
```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Player {
  id: string;
  name: string;
  chips: number;
  cards: [Card, Card] | null;
  position: number;
  isDealer: boolean;
  hasFolded: boolean;
}

interface GameState {
  // State
  players: Player[];
  communityCards: Card[];
  pot: number;
  currentBet: number;
  dealerPosition: number;
  activePlayerIndex: number;
  phase: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

  // Actions
  updateGameState: (serverState: ServerGameState) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(
  devtools(
    (set) => ({
      players: [],
      communityCards: [],
      pot: 0,
      currentBet: 0,
      dealerPosition: 0,
      activePlayerIndex: 0,
      phase: 'preflop',

      updateGameState: (serverState) => set({ ...serverState }),
      resetGame: () => set({
        players: [],
        communityCards: [],
        pot: 0,
        currentBet: 0,
      }),
    }),
    { name: 'GameStore' }
  )
);
```

**Training Store (useTrainingStore):**
```typescript
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

interface TrainingState {
  // State
  activeScenario: Scenario | null;
  userDecisions: Decision[];
  feedback: Feedback | null;
  metrics: {
    accuracy: number;
    averageDecisionTime: number;
    completedScenarios: number;
  };

  // Actions
  startScenario: (scenario: Scenario) => void;
  recordDecision: (decision: Decision) => void;
  setFeedback: (feedback: Feedback) => void;
  completeScenario: () => void;
  updateMetrics: (metrics: Partial<TrainingState['metrics']>) => void;
}

export const useTrainingStore = create<TrainingState>()(
  devtools(
    persist(
      (set) => ({
        activeScenario: null,
        userDecisions: [],
        feedback: null,
        metrics: {
          accuracy: 0,
          averageDecisionTime: 0,
          completedScenarios: 0,
        },

        startScenario: (scenario) => set({
          activeScenario: scenario,
          userDecisions: [],
          feedback: null,
        }),

        recordDecision: (decision) => set((state) => ({
          userDecisions: [...state.userDecisions, decision],
        })),

        setFeedback: (feedback) => set({ feedback }),

        completeScenario: () => set({
          activeScenario: null,
          userDecisions: [],
          feedback: null,
        }),

        updateMetrics: (metrics) => set((state) => ({
          metrics: { ...state.metrics, ...metrics },
        })),
      }),
      {
        name: 'poker-sense-training',
        // Only persist active scenario (for resume on refresh)
        partialize: (state) => ({
          activeScenario: state.activeScenario,
        }),
      }
    ),
    { name: 'TrainingStore' }
  )
);
```

**User Store (useUserStore):**
```typescript
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

interface UserState {
  // State
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  animationsEnabled: boolean;
  gameSpeed: 'slow' | 'normal' | 'fast';

  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSound: () => void;
  toggleAnimations: () => void;
  setGameSpeed: (speed: 'slow' | 'normal' | 'fast') => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'dark',
        soundEnabled: true,
        animationsEnabled: true,
        gameSpeed: 'normal',

        setTheme: (theme) => set({ theme }),
        toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
        toggleAnimations: () => set((state) => ({ animationsEnabled: !state.animationsEnabled })),
        setGameSpeed: (speed) => set({ gameSpeed: speed }),
      }),
      { name: 'poker-sense-user' }
    ),
    { name: 'UserStore' }
  )
);
```

**UI Context:**
```typescript
import { createContext, useContext, useState, type ReactNode } from 'react';

interface UIContextValue {
  // Modals
  isModalOpen: boolean;
  modalContent: ReactNode | null;
  openModal: (content: ReactNode) => void;
  closeModal: () => void;

  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  // Loading
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const openModal = (content: ReactNode) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <UIContext.Provider value={{
      isModalOpen,
      modalContent,
      openModal,
      closeModal,
      toasts,
      addToast,
      removeToast,
      isLoading,
      setIsLoading,
    }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within UIProvider');
  }
  return context;
}
```

### Selector Pattern (Performance Optimization)

Avoid unnecessary re-renders with fine-grained selectors:

```typescript
// ❌ Bad: Re-renders on any game state change
function PlayerChips({ playerId }: { playerId: string }) {
  const gameState = useGameStore(); // Subscribes to entire store
  const player = gameState.players.find(p => p.id === playerId);
  return <div>{player?.chips}</div>;
}

// ✅ Good: Only re-renders when specific player's chips change
function PlayerChips({ playerId }: { playerId: string }) {
  const playerChips = useGameStore(
    (state) => state.players.find(p => p.id === playerId)?.chips
  );
  return <div>{playerChips}</div>;
}

// ✅ Better: Shallow equality for objects
import { shallow } from 'zustand/shallow';

function PlayerCard({ playerId }: { playerId: string }) {
  const player = useGameStore(
    (state) => state.players.find(p => p.id === playerId),
    shallow // Shallow compare player object
  );
  return <div>{player?.name}: {player?.chips}</div>;
}
```

### React Router Integration

**Data Flow: User Action → Server → Zustand**

```typescript
// app/routes/game.tsx
import { type ActionFunctionArgs } from 'react-router';
import { useGameStore } from '@/lib/stores/game';

// Server action handles game logic
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get('action'); // 'fold' | 'call' | 'raise'
  const amount = formData.get('amount');

  // Server-side game engine processes action
  const updatedGameState = await processGameAction({
    action,
    amount: Number(amount),
  });

  // Return updated state to client
  return { gameState: updatedGameState };
}

// Client component updates Zustand on server response
function GameTable() {
  const fetcher = useFetcher<typeof action>();
  const updateGameState = useGameStore((state) => state.updateGameState);

  // Update Zustand when server responds
  useEffect(() => {
    if (fetcher.data?.gameState) {
      updateGameState(fetcher.data.gameState);
    }
  }, [fetcher.data, updateGameState]);

  const handleRaise = (amount: number) => {
    fetcher.submit(
      { action: 'raise', amount: String(amount) },
      { method: 'post' }
    );
  };

  return <div>...</div>;
}
```

### Supabase Sync Pattern

**Debounced Background Sync:**

```typescript
import { useEffect, useRef } from 'react';
import { useUserStore } from '@/lib/stores/user';
import { useFetcher } from 'react-router';

export function useSyncPreferences() {
  const fetcher = useFetcher();
  const preferences = useUserStore();
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Debounce: Only sync 5 seconds after last change
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetcher.submit(
        { preferences: JSON.stringify(preferences) },
        { method: 'post', action: '/api/sync-preferences' }
      );
    }, 5000);

    return () => clearTimeout(timeoutRef.current);
  }, [preferences]);
}
```

### DevTools Setup

**Install Zustand DevTools:**

```bash
npm install -D @redux-devtools/extension
```

**Browser Extension:**
- Install Redux DevTools extension (works with Zustand)
- Middleware already configured (`devtools()` wrapper)
- View state changes in real-time during development

### Testing Strategy

**Testing Zustand Stores:**

```typescript
// tests/stores/game.test.ts
import { renderHook, act } from '@testing-library/react';
import { useGameStore } from '@/lib/stores/game';

describe('GameStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useGameStore.setState({
      players: [],
      communityCards: [],
      pot: 0,
    });
  });

  it('updates game state from server response', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.updateGameState({
        players: [{ id: '1', chips: 1000 }],
        pot: 100,
        communityCards: [/* ... */],
      });
    });

    expect(result.current.pot).toBe(100);
    expect(result.current.players).toHaveLength(1);
  });
});
```

### Migration Path

**Phase 2 (Foundation):**
- Set up Zustand stores (game, training, user)
- Create UI Context
- Configure DevTools middleware
- Set up persistence middleware

**Phase 3 (Game Engine):**
- Integrate game store with server actions
- Test state synchronization
- Implement optimistic updates for UI responsiveness

**Phase 4 (Training):**
- Implement training store logic
- Background sync to Supabase
- Metrics calculations

**Phase 5 (Polish):**
- Performance optimization with selectors
- Audit re-render counts
- Final persistence strategy tuning

## Related Decisions

- [ADR 001: Tech Stack](./001-tech-stack.md) - React Router v7 loaders/actions integration
- [ADR 002: Deployment Platform](./002-deployment-platform.md) - Supabase for state persistence
- [ADR 005: Testing Strategy](./005-testing-strategy.md) - Testing Zustand stores
- [ADR 006: Game Engine Architecture](./006-game-engine.md) - Server-side state authority

## Links

- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Zustand DevTools](https://docs.pmnd.rs/zustand/integrations/persisting-store-data#devtools)
- [Zustand Persist Middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)
- [React Router Actions](https://reactrouter.com/en/main/route/action)
- [React Router Loaders](https://reactrouter.com/en/main/route/loader)
