# Data Flow

> **Status:** Completed - Phase 1

## Overview

Poker-Sense uses a server-authoritative architecture where game logic executes server-side and clients display derived state. This document illustrates data flow through all layers: user interactions → React Router actions → server logic → Supabase → Zustand → UI updates.

## Architecture Principles

**Server-Authoritative:**
- Game engine runs exclusively on server (security, anti-cheat)
- Client holds derived/view state only
- Server validates all actions before state changes
- Client cannot manipulate game logic

**Unidirectional Data Flow:**
```
User Action → React Router Action → Server Logic → Database → Response → Zustand Store → UI Update
```

**State Categories:**
1. **Server State:** Game engine state, user profiles, training scenarios (source of truth)
2. **Client State:** Derived game state, training progress, user preferences (Zustand)
3. **UI State:** Modals, toasts, loading states, form inputs (React Context)
4. **Cache State:** React Router loaders cache server data

## State Management Stack

**Layer 1: Server (Authoritative)**
- Game engine (poker logic)
- Training scenarios
- User profiles
- Analytics/metrics
- Storage: Supabase PostgreSQL

**Layer 2: React Router (Data Layer)**
- Loaders: Fetch server data
- Actions: Mutate server state
- Revalidation: Auto-refetch on mutations
- Cache: In-memory loader results

**Layer 3: Zustand (Client State)**
- Game store: Derived game state for UI
- Training store: Scenario progress, metrics
- User store: Preferences, settings
- Persistence: localStorage + background Supabase sync

**Layer 4: React Context (UI State)**
- Modals, toasts, loading indicators
- Ephemeral UI state (not persisted)

**Layer 5: Components (View)**
- Subscribe to Zustand via selectors
- Read UI state from Context
- Trigger actions via React Router fetchers

## Data Flow Patterns

### Pattern 1: Game Action Flow

**Scenario:** User raises bet during poker hand

```
┌─────────────┐
│   User      │
│ Clicks      │
│ "Raise"     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Component: GameTable                        │
│ const fetcher = useFetcher()                │
│ fetcher.submit({                            │
│   action: 'raise',                          │
│   amount: 100                               │
│ }, { method: 'post' })                      │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ React Router Action                         │
│ Route: /game/play                           │
│ export async function action({ request }) { │
│   const formData = await request.formData()│
│   return await processGameAction(formData)  │
│ }                                           │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Server: Game Engine                         │
│ - Validate action (player turn, chips)      │
│ - Update game state machine                 │
│ - Process AI opponent responses             │
│ - Calculate pot, next player                │
│ - Log event to database                     │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Supabase: Persist Event                     │
│ INSERT INTO game_events (                   │
│   game_id, player_id,                       │
│   action_type, amount, timestamp            │
│ )                                           │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Response: Updated Game State                │
│ {                                           │
│   gameState: {                              │
│     pot: 250,                               │
│     currentBet: 100,                        │
│     activePlayerIndex: 2,                   │
│     players: [...],                         │
│     phase: 'preflop'                        │
│   }                                         │
│ }                                           │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Component: useEffect on fetcher.data        │
│ useEffect(() => {                           │
│   if (fetcher.data?.gameState) {            │
│     updateGameState(fetcher.data.gameState) │
│   }                                         │
│ }, [fetcher.data])                          │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Zustand: Game Store                         │
│ updateGameState({ pot: 250, ... })          │
│ - Updates store                             │
│ - Triggers component re-renders             │
│ - DevTools log state change                 │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ UI Update                                   │
│ - Pot display: $150 → $250                  │
│ - Chips animation (subtract from player)    │
│ - Active player indicator moves             │
│ - Action buttons update (AI thinking...)    │
└─────────────────────────────────────────────┘
```

**Code Example:**

```typescript
// app/routes/game.play.tsx
import { type ActionFunctionArgs } from 'react-router';
import { processGameAction } from '@/lib/game-engine/actions';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get('action') as 'fold' | 'call' | 'raise';
  const amount = Number(formData.get('amount'));
  const gameId = formData.get('gameId') as string;

  // Server-side game engine validates and processes
  const updatedGameState = await processGameAction({
    gameId,
    action,
    amount,
  });

  return { gameState: updatedGameState };
}

// app/components/GameTable.tsx
import { useFetcher } from 'react-router';
import { useGameStore } from '@/lib/stores/game';

export function GameTable() {
  const fetcher = useFetcher<typeof action>();
  const updateGameState = useGameStore(state => state.updateGameState);

  // Sync server response to Zustand
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

  return (
    <div>
      <RaiseButton onClick={() => handleRaise(100)} />
    </div>
  );
}
```

### Pattern 2: Training Scenario Flow

**Scenario:** User completes training scenario, system records performance

```
┌─────────────┐
│   User      │
│ Completes   │
│ Scenario    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Component: TrainingScenario                 │
│ const submitAnswer = () => {                │
│   recordDecision(userChoice)                │
│   calculateFeedback()                       │
│   fetcher.submit({ scenarioId, decision })  │
│ }                                           │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Zustand: Training Store                     │
│ - recordDecision(decision)                  │
│ - setFeedback(feedback)                     │
│ - updateMetrics({ accuracy: +1 })           │
│ - Persisted to localStorage (immediate)     │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ React Router Action                         │
│ Route: /training/scenario/:id               │
│ export async function action({ params }) {  │
│   return await recordScenarioCompletion()   │
│ }                                           │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Server: Training Analytics                  │
│ - Calculate performance metrics             │
│ - Update user progress                      │
│ - Generate next scenario recommendation     │
│ - Update difficulty curve                   │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Supabase: Persist Results                   │
│ INSERT INTO scenario_completions (          │
│   user_id, scenario_id,                     │
│   user_decision, correct_decision,          │
│   decision_time, accuracy                   │
│ )                                           │
│ UPDATE user_progress SET                    │
│   scenarios_completed += 1,                 │
│   total_accuracy = ...                      │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Response: Updated Progress                  │
│ {                                           │
│   success: true,                            │
│   nextScenario: {...},                      │
│   updatedMetrics: {                         │
│     totalCompleted: 15,                     │
│     overallAccuracy: 0.82                   │
│   }                                         │
│ }                                           │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Component: Update UI                        │
│ - Show feedback modal (correct/incorrect)   │
│ - Display accuracy: 82%                     │
│ - Animate progress bar                      │
│ - Suggest next scenario                     │
└─────────────────────────────────────────────┘
```

**Code Example:**

```typescript
// app/routes/training.scenario.$id.tsx
import { type ActionFunctionArgs } from 'react-router';
import { recordScenarioCompletion } from '@/lib/training/analytics';

export async function action({ params, request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const scenarioId = params.id!;
  const userDecision = formData.get('decision') as string;
  const decisionTime = Number(formData.get('decisionTime'));

  const result = await recordScenarioCompletion({
    scenarioId,
    userDecision,
    decisionTime,
  });

  return {
    success: true,
    nextScenario: result.nextScenario,
    updatedMetrics: result.metrics,
  };
}

// app/components/TrainingScenario.tsx
import { useFetcher } from 'react-router';
import { useTrainingStore } from '@/lib/stores/training';
import { useUI } from '@/lib/contexts/ui';

export function TrainingScenario() {
  const fetcher = useFetcher<typeof action>();
  const { recordDecision, setFeedback, completeScenario } = useTrainingStore();
  const { openModal } = useUI();

  const handleSubmitAnswer = (decision: string) => {
    const startTime = performance.now();
    const decisionTime = startTime - scenarioStartTime;

    // Update local state immediately (optimistic)
    recordDecision({ decision, timestamp: Date.now() });

    // Calculate and show feedback
    const feedback = calculateFeedback(decision);
    setFeedback(feedback);

    // Show feedback modal (UI state)
    openModal(<FeedbackModal feedback={feedback} />);

    // Persist to server (background)
    fetcher.submit(
      { decision, decisionTime: String(decisionTime) },
      { method: 'post' }
    );
  };

  // Handle server response
  useEffect(() => {
    if (fetcher.data?.success) {
      // Update metrics from server
      updateMetrics(fetcher.data.updatedMetrics);
    }
  }, [fetcher.data]);

  return <div>...</div>;
}
```

### Pattern 3: User Preferences Flow

**Scenario:** User changes theme from dark to light

```
┌─────────────┐
│   User      │
│ Toggles     │
│ Theme       │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Component: SettingsPage                     │
│ const { theme, setTheme } = useUserStore()  │
│ setTheme('light')                           │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Zustand: User Store                         │
│ - setTheme('light')                         │
│ - Triggers persist middleware               │
└──────┬──────────────────────────────────────┘
       │
       ├──────────────────┬─────────────────────┐
       ▼                  ▼                     ▼
┌─────────────┐  ┌─────────────┐  ┌────────────────────┐
│ localStorage│  │ UI Update   │  │ Debounced Sync     │
│ (immediate) │  │ (immediate) │  │ (5 seconds)        │
└─────────────┘  └─────────────┘  └──────┬─────────────┘
                                         │
                                         ▼
                              ┌─────────────────────────┐
                              │ React Router Action     │
                              │ Route: /api/sync-prefs  │
                              │ { theme: 'light', ... } │
                              └──────┬──────────────────┘
                                     │
                                     ▼
                              ┌─────────────────────────┐
                              │ Supabase: Update        │
                              │ UPDATE user_preferences │
                              │ SET theme = 'light'     │
                              │ WHERE user_id = $1      │
                              └─────────────────────────┘
```

**Code Example:**

```typescript
// app/lib/stores/user.ts
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        theme: 'dark',
        soundEnabled: true,

        setTheme: (theme) => set({ theme }),
        toggleSound: () => set(state => ({
          soundEnabled: !state.soundEnabled
        })),
      }),
      {
        name: 'poker-sense-user',
        // Saves to localStorage on every change
      }
    ),
    { name: 'UserStore' }
  )
);

// app/lib/hooks/useSyncPreferences.ts
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
  }, [preferences, fetcher]);
}

// app/routes/api.sync-preferences.tsx
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const preferences = JSON.parse(formData.get('preferences') as string);

  await updateUserPreferences(preferences);

  return { success: true };
}
```

### Pattern 4: Initial Page Load Flow

**Scenario:** User navigates to game page, loads existing game state

```
┌─────────────┐
│   User      │
│ Navigates   │
│ /game/123   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ React Router Loader                         │
│ Route: /game/:gameId                        │
│ export async function loader({ params }) {  │
│   return await getGameState(params.gameId)  │
│ }                                           │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Server: Fetch Game State                    │
│ SELECT * FROM games WHERE id = $1           │
│ SELECT * FROM game_events                   │
│   WHERE game_id = $1 ORDER BY timestamp     │
│ - Reconstruct game state from events        │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Supabase: Query Database                    │
│ Returns:                                    │
│ - Game metadata                             │
│ - Player states                             │
│ - Current pot, bets                         │
│ - Community cards                           │
│ - Event log                                 │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Response: Loader Data                       │
│ {                                           │
│   game: { id, pot, phase, ... },            │
│   players: [...],                           │
│   communityCards: [...],                    │
│   eventLog: [...]                           │
│ }                                           │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Component: useLoaderData()                  │
│ const data = useLoaderData<typeof loader>() │
│ - Initialize Zustand with loader data       │
│ - Set up subscriptions                      │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Zustand: Initialize Store                   │
│ useEffect(() => {                           │
│   updateGameState(data.game)                │
│ }, [data])                                  │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ UI Render                                   │
│ - Display poker table                       │
│ - Render players with chips                 │
│ - Show community cards                      │
│ - Enable action buttons                     │
└─────────────────────────────────────────────┘
```

**Code Example:**

```typescript
// app/routes/game.$gameId.tsx
import { type LoaderFunctionArgs } from 'react-router';
import { getGameState } from '@/lib/game-engine/queries';

export async function loader({ params }: LoaderFunctionArgs) {
  const gameId = params.gameId!;
  const gameState = await getGameState(gameId);

  if (!gameState) {
    throw new Response('Game not found', { status: 404 });
  }

  return { game: gameState };
}

export default function GamePage() {
  const { game } = useLoaderData<typeof loader>();
  const updateGameState = useGameStore(state => state.updateGameState);

  // Initialize Zustand from loader data
  useEffect(() => {
    updateGameState(game);
  }, [game, updateGameState]);

  return <GameTable />;
}
```

### Pattern 5: Optimistic UI Update Flow

**Scenario:** User folds hand, update UI immediately before server confirms

```
┌─────────────┐
│   User      │
│ Clicks      │
│ "Fold"      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│ Component: Optimistic Update                │
│ const handleFold = () => {                  │
│   // Update UI immediately (optimistic)     │
│   updateGameState({                         │
│     ...currentState,                        │
│     players: markPlayerFolded(playerId)     │
│   })                                        │
│                                             │
│   // Submit to server (background)          │
│   fetcher.submit({ action: 'fold' })        │
│ }                                           │
└──────┬──────────────────────────────────────┘
       │
       ├────────────────┬────────────────────┐
       ▼                ▼                    ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────────┐
│ UI Update   │  │ Zustand     │  │ Server Request  │
│ (immediate) │  │ (immediate) │  │ (background)    │
└─────────────┘  └─────────────┘  └──────┬──────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │ Server: Validate    │
                              │ - Check player turn │
                              │ - Process fold      │
                              │ - Advance game      │
                              └──────┬──────────────┘
                                     │
                  ┌──────────────────┴────────────────┐
                  ▼                                   ▼
       ┌─────────────────────┐         ┌──────────────────────┐
       │ Success: Confirm    │         │ Error: Rollback      │
       │ - Server state      │         │ - Invalid action     │
       │   matches optimistic│         │ - Revert Zustand     │
       │ - No update needed  │         │ - Show error toast   │
       └─────────────────────┘         └──────────────────────┘
```

**Code Example:**

```typescript
// app/components/ActionButtons.tsx
import { useFetcher } from 'react-router';
import { useGameStore } from '@/lib/stores/game';
import { useUI } from '@/lib/contexts/ui';

export function ActionButtons() {
  const fetcher = useFetcher<typeof action>();
  const { updateGameState, players } = useGameStore();
  const { addToast } = useUI();
  const currentPlayerId = 'player-1'; // from auth

  const handleFold = () => {
    // Optimistic update: Immediately mark player as folded
    const optimisticPlayers = players.map(p =>
      p.id === currentPlayerId ? { ...p, hasFolded: true } : p
    );

    updateGameState({ players: optimisticPlayers });

    // Submit to server
    fetcher.submit(
      { action: 'fold' },
      { method: 'post' }
    );
  };

  // Handle server response
  useEffect(() => {
    if (fetcher.data?.error) {
      // Rollback on error
      updateGameState(fetcher.data.previousState);
      addToast({
        type: 'error',
        message: fetcher.data.error,
      });
    } else if (fetcher.data?.gameState) {
      // Server confirmed, update with authoritative state
      updateGameState(fetcher.data.gameState);
    }
  }, [fetcher.data]);

  return (
    <button
      onClick={handleFold}
      disabled={fetcher.state === 'submitting'}
    >
      Fold
    </button>
  );
}
```

## State Normalization

**Denormalized (Chosen for Game State):**
```typescript
// Game state is naturally hierarchical
interface GameState {
  players: Player[];  // Embedded
  communityCards: Card[];  // Embedded
  pot: number;
  dealerPosition: number;
}
```

**Why denormalized:**
- Game state arrives as complete snapshot from server
- No partial updates (full state on each action)
- Simpler to reason about
- Matches poker game structure (table-centric)

**Normalized (If needed for relationships):**
```typescript
// If we had complex relationships
interface NormalizedState {
  players: Record<string, Player>;
  tables: Record<string, Table>;
  games: Record<string, Game>;
}

// Access via selectors
const getPlayer = (state, playerId) => state.players[playerId];
```

## Cache Invalidation

**React Router Auto-Revalidation:**
- Loaders re-run after actions on same route
- Manual revalidation: `useRevalidator()`

**Zustand State Updates:**
- Replace entire game state on server response (no cache)
- Training metrics merge (partial updates)

**localStorage Persistence:**
- Zustand persist middleware auto-syncs
- No manual cache invalidation needed

**Supabase:**
- Server is single source of truth
- No client-side cache beyond Zustand

## Error Handling

**Network Errors:**
```typescript
// React Router action
export async function action({ request }: ActionFunctionArgs) {
  try {
    const result = await processGameAction(data);
    return { success: true, gameState: result };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      previousState: currentState  // For rollback
    };
  }
}

// Component
useEffect(() => {
  if (fetcher.data?.error) {
    // Rollback optimistic update
    updateGameState(fetcher.data.previousState);

    // Show error toast
    addToast({ type: 'error', message: fetcher.data.error });
  }
}, [fetcher.data]);
```

**Validation Errors:**
```typescript
// Server validates action
if (!isPlayerTurn(playerId)) {
  return {
    success: false,
    error: 'Not your turn',
    code: 'INVALID_TURN',
  };
}
```

**Retry Strategy:**
- React Router handles network retries automatically
- Exponential backoff for background syncs
- Manual retry button for critical actions

## Performance Optimizations

**Selector Pattern (Fine-Grained Subscriptions):**
```typescript
// ❌ Bad: Re-renders on any game state change
function PlayerChips() {
  const gameState = useGameStore();
  return <div>{gameState.players[0].chips}</div>;
}

// ✅ Good: Only re-renders when specific data changes
function PlayerChips({ playerId }) {
  const chips = useGameStore(
    state => state.players.find(p => p.id === playerId)?.chips
  );
  return <div>{chips}</div>;
}
```

**Debounced Background Sync:**
```typescript
// Preferences sync after 5 seconds of inactivity
useEffect(() => {
  const timeout = setTimeout(() => {
    syncToSupabase(preferences);
  }, 5000);

  return () => clearTimeout(timeout);
}, [preferences]);
```

**React Router Loader Caching:**
- Loaders cache results in-memory
- Avoid redundant server requests
- Revalidate only when data changes

**Bundle Size:**
- Zustand: 1.2kb (vs Redux 21kb)
- Context: 0kb (built-in)
- Total state management overhead: ~1.2kb

## Testing Data Flow

**Unit Tests (Zustand Stores):**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useGameStore } from '@/lib/stores/game';

test('updates game state', () => {
  const { result } = renderHook(() => useGameStore());

  act(() => {
    result.current.updateGameState({ pot: 100 });
  });

  expect(result.current.pot).toBe(100);
});
```

**Integration Tests (Action → Store → UI):**
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('raise bet updates UI', async () => {
  render(<GameTable />);

  await userEvent.click(screen.getByRole('button', { name: /raise/i }));

  await waitFor(() => {
    expect(screen.getByText('Pot: $250')).toBeInTheDocument();
  });
});
```

**E2E Tests (Full Flow):**
```typescript
// tests/e2e/game-flow.spec.ts
test('complete poker hand', async ({ page }) => {
  await page.goto('/game/123');

  await page.click('button:has-text("Raise")');
  await expect(page.locator('.pot')).toHaveText('$250');

  await page.click('button:has-text("Call")');
  await expect(page.locator('.phase')).toHaveText('Flop');
});
```

## Diagrams Summary

**Overall Data Flow:**
```
User → Component → React Router Action → Server Logic → Supabase
  ↓                      ↑                              ↓
Zustand ←──── Response ──┘                    ← Persist ┘
  ↓
UI Update
```

**State Layer Hierarchy:**
```
┌─────────────────────────────────────┐
│ UI Components (React)               │
│ - Read: Zustand selectors, Context  │
│ - Write: Fetcher actions            │
└──────────────┬──────────────────────┘
               ↓
┌──────────────────────────────────────┐
│ Client State (Zustand + Context)     │
│ - Game: Derived from server          │
│ - Training: Local progress           │
│ - User: Preferences (persisted)      │
│ - UI: Ephemeral state                │
└──────────────┬───────────────────────┘
               ↓
┌──────────────────────────────────────┐
│ Data Layer (React Router)            │
│ - Loaders: Fetch server data         │
│ - Actions: Mutations                 │
│ - Cache: In-memory loader results    │
└──────────────┬───────────────────────┘
               ↓
┌──────────────────────────────────────┐
│ Server (Authoritative)               │
│ - Game Engine (poker logic)          │
│ - Training Analytics                 │
│ - User Management                    │
└──────────────┬───────────────────────┘
               ↓
┌──────────────────────────────────────┐
│ Database (Supabase PostgreSQL)       │
│ - Games, Events, Users, Scenarios    │
└──────────────────────────────────────┘
```

## Related Documentation

- [ADR 003: State Management](../decisions/003-state-management.md)
- [ADR 001: Tech Stack](../decisions/001-tech-stack.md)
- [ADR 006: Game Engine Architecture](../decisions/006-game-engine.md)
- [Architecture Overview](./README.md)

## References

- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [React Router Data Loading](https://reactrouter.com/en/main/route/loader)
- [React Router Mutations](https://reactrouter.com/en/main/route/action)
