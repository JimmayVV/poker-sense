# Backend Stack

> **Status:** Defined in [ADR 001](../decisions/001-tech-stack.md)
> **Last Updated:** 2025-11-08

## Overview

The "backend" for poker-sense leverages React Router v7's framework mode to provide server-side routes via loaders and actions. No separate Node.js/Express server needed. All server logic runs on Vercel's edge/serverless functions. Game engine logic is exclusively server-side to prevent reverse engineering.

## Architecture Philosophy

**No Traditional Backend:**
React Router v7 framework mode collocates server and client code in the same routes. Loaders fetch data server-side, actions handle mutations server-side. This eliminates the need for a separate API server.

**Server-Side Game Engine:**
All poker game logic (hand evaluation, pot calculation, action validation) runs server-side only. Client receives game state updates but cannot compute outcomes locally.

**Supabase for Persistence:**
Database, authentication, and storage provided by Supabase. React Router loaders/actions communicate with Supabase via server-side SDK.

## Runtime

### Node.js (Vercel Serverless)

**Version:** 20.x (LTS)
**Platform:** Vercel Serverless Functions
**Documentation:** [Vercel Functions Docs](https://vercel.com/docs/functions)

**Why Node.js on Vercel?**
- React Router v7 officially supported on Vercel
- Free tier includes 100GB-hours of compute
- Automatic scaling
- Edge network for low latency
- Zero configuration needed

**Function Limits (Free Tier):**
- **Duration:** 10 seconds max per invocation
- **Memory:** 1024 MB
- **Payload:** 4.5 MB request/response

**Implications:**
Game engine must complete hand evaluation in < 10 seconds (easily achievable).

## Framework: React Router v7 Server Routes

### Loaders (Data Fetching)

**Purpose:** Fetch data server-side before rendering route.

**Example: Fetch Game State**
```typescript
// app/routes/game.$gameId.tsx
import { json, LoaderFunctionArgs } from '@remix-run/node';
import { createServerClient } from '@/lib/supabase.server';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const supabase = createServerClient(request);

  // Fetch game state from Supabase
  const { data: game, error } = await supabase
    .from('games')
    .select('*, players(*), hands(*)')
    .eq('id', params.gameId)
    .single();

  if (error || !game) {
    throw new Response('Game not found', { status: 404 });
  }

  return json(game);
}
```

**Key Features:**
- Runs only on server (never exposed to client)
- TypeScript typed with `LoaderFunctionArgs`
- Return `json()` helper for serialization
- Can access request headers (auth cookies)

### Actions (Mutations)

**Purpose:** Handle form submissions and mutations server-side.

**Example: Player Action (Bet, Fold, Call)**
```typescript
// app/routes/game.$gameId.action.tsx
import { json, ActionFunctionArgs } from '@remix-run/node';
import { createServerClient } from '@/lib/supabase.server';
import { GameEngine } from '@/lib/game-engine';

export async function action({ params, request }: ActionFunctionArgs) {
  const supabase = createServerClient(request);
  const formData = await request.formData();

  const action = formData.get('action'); // 'bet' | 'fold' | 'call' | 'raise'
  const amount = formData.get('amount'); // bet/raise amount

  // Fetch current game state
  const { data: game } = await supabase
    .from('games')
    .select('*')
    .eq('id', params.gameId)
    .single();

  // Run game engine server-side
  const engine = new GameEngine(game);
  const newState = engine.processAction({
    playerId: session.user.id,
    action,
    amount: amount ? parseInt(amount) : undefined,
  });

  // Validate action (ensure legal move)
  if (!newState.valid) {
    return json({ error: newState.error }, { status: 400 });
  }

  // Persist new game state
  await supabase
    .from('games')
    .update(newState.gameState)
    .eq('id', params.gameId);

  return json({ success: true, gameState: newState.gameState });
}
```

**Key Features:**
- Receives form data from client
- Validates actions server-side
- Runs game engine logic
- Returns JSON response
- Never exposes game logic to client

## Database: Supabase

**Version:** Postgres 15.x
**Documentation:** [Supabase Docs](https://supabase.com/docs)

### Why Supabase?

- **Free Tier:** 500 MB database, 1 GB file storage, 50,000 monthly active users
- **Postgres:** Full SQL database with JSONB support
- **Real-time:** Built-in subscriptions for live game updates
- **Auth:** Better Auth integration via Supabase adapter
- **Row-Level Security:** Database-enforced auth policies
- **Edge Functions:** Optional for future serverless compute

### Schema Design

**Tables:**
```sql
-- Users (managed by Better Auth)
users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  created_at timestamp DEFAULT now()
)

-- Games
games (
  id uuid PRIMARY KEY,
  status text NOT NULL, -- 'waiting' | 'in_progress' | 'completed'
  current_hand_id uuid REFERENCES hands(id),
  pot integer DEFAULT 0,
  current_bet integer DEFAULT 0,
  dealer_position integer,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)

-- Players (in a game)
players (
  id uuid PRIMARY KEY,
  game_id uuid REFERENCES games(id),
  user_id uuid REFERENCES users(id),
  chips integer NOT NULL,
  position integer NOT NULL,
  status text NOT NULL, -- 'active' | 'folded' | 'all_in' | 'out'
  created_at timestamp DEFAULT now()
)

-- Hands (poker hands in a game)
hands (
  id uuid PRIMARY KEY,
  game_id uuid REFERENCES games(id),
  hand_number integer NOT NULL,
  community_cards jsonb, -- [{ rank, suit }, ...]
  pot integer NOT NULL,
  winner_id uuid REFERENCES players(id),
  created_at timestamp DEFAULT now()
)

-- Hand Actions (audit log of all player actions)
hand_actions (
  id uuid PRIMARY KEY,
  hand_id uuid REFERENCES hands(id),
  player_id uuid REFERENCES players(id),
  action text NOT NULL, -- 'bet' | 'fold' | 'call' | 'raise' | 'check'
  amount integer,
  created_at timestamp DEFAULT now()
)

-- Training Scenarios
scenarios (
  id uuid PRIMARY KEY,
  mode text NOT NULL, -- 'hand_strength' | 'odds' | 'position' | 'opponent'
  difficulty text NOT NULL, -- 'beginner' | 'intermediate' | 'advanced'
  config jsonb NOT NULL, -- scenario-specific configuration
  created_at timestamp DEFAULT now()
)

-- User Progress
user_progress (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  scenario_id uuid REFERENCES scenarios(id),
  completed boolean DEFAULT false,
  score integer,
  attempts integer DEFAULT 0,
  created_at timestamp DEFAULT now()
)
```

### Supabase Client (Server-Side)

**Location:** `app/lib/supabase.server.ts`

```typescript
import { createServerClient as createClient } from '@supabase/ssr';

export function createServerClient(request: Request) {
  const cookies = request.headers.get('Cookie');

  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies?.split(';')
            .find(c => c.trim().startsWith(`${name}=`))
            ?.split('=')[1];
        },
      },
    }
  );
}
```

**Usage:**
Only use in loaders/actions (server-side). Never import in client components.

### Row-Level Security (RLS)

**Purpose:** Database-enforced authorization.

**Example: Players can only see their own games**
```sql
CREATE POLICY "Users can view own games"
ON games FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM players WHERE game_id = games.id
  )
);
```

**Policies Needed:**
- Users can only view games they're in
- Users can only submit actions for their own player
- Training progress is private to each user

## Authentication: Better Auth

**Version:** 1.x
**Documentation:** [Better Auth Docs](https://www.better-auth.com/docs)

### Why Better Auth?

- **Supabase Adapter:** Integrates seamlessly with Supabase Postgres
- **Type-Safe:** Full TypeScript support
- **Flexible:** Email/password, OAuth (Google, GitHub), magic links
- **Session Management:** Secure cookie-based sessions
- **React Router Integration:** Works with loaders/actions

### Setup

**Location:** `app/lib/auth.server.ts`

```typescript
import { betterAuth } from 'better-auth';
import { supabaseAdapter } from 'better-auth/adapters/supabase';

export const auth = betterAuth({
  database: supabaseAdapter({
    url: process.env.SUPABASE_URL!,
    key: process.env.SUPABASE_SERVICE_KEY!,
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
});
```

### Protected Loaders

**Pattern:** Require authentication in loaders

```typescript
import { redirect } from '@remix-run/node';
import { auth } from '@/lib/auth.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return redirect('/login');
  }

  // Fetch user-specific data
  const games = await fetchUserGames(session.user.id);
  return json({ games });
}
```

## Game Engine Architecture

**Location:** `app/lib/game-engine/`

### Design Principles

1. **Server-Side Only:** Never import in client code
2. **Deterministic:** Same inputs always produce same outputs (testable)
3. **Immutable:** Return new state, never mutate
4. **Event-Sourced:** Store action log, replay to reconstruct state
5. **100% Test Coverage:** No exceptions

### Core Modules

```
app/lib/game-engine/
├── index.ts              # Main GameEngine class
├── hand-evaluator.ts     # Poker hand strength calculation
├── pot-calculator.ts     # Pot and side-pot logic
├── action-validator.ts   # Validate player actions (legal moves)
├── dealer.ts             # Deal cards, manage deck
└── types.ts              # TypeScript types
```

### Example: GameEngine Class

```typescript
// app/lib/game-engine/index.ts
export class GameEngine {
  constructor(private state: GameState) {}

  processAction(action: PlayerAction): GameEngineResult {
    // Validate action
    const validation = this.validateAction(action);
    if (!validation.valid) {
      return { valid: false, error: validation.error };
    }

    // Apply action to state
    const newState = this.applyAction(action);

    // Check if hand is over
    if (this.isHandComplete(newState)) {
      const winner = this.evaluateWinner(newState);
      newState.pot = 0;
      newState.winner = winner;
    }

    return { valid: true, gameState: newState };
  }

  private validateAction(action: PlayerAction): ValidationResult {
    // Ensure player exists, has enough chips, action is legal, etc.
  }

  private evaluateWinner(state: GameState): PlayerId {
    // Hand evaluation logic (5-card best hand)
  }
}
```

**Key Points:**
- Pure functions (no side effects)
- All logic testable in isolation
- Returns new state (immutable)
- Never throws exceptions (returns validation errors)

### Hand Evaluator

**Algorithm:** 7-card hand evaluator (5-card best hand from 7 total: 2 hole + 5 community)

**Ranking:**
1. Royal Flush
2. Straight Flush
3. Four of a Kind
4. Full House
5. Flush
6. Straight
7. Three of a Kind
8. Two Pair
9. Pair
10. High Card

**Performance:** Precompute lookup tables for fast evaluation (< 1ms per hand).

### Testing

**Coverage:** 100% (no exceptions)

**Test Structure:**
```typescript
// tests/game-engine/hand-evaluator.test.ts
import { describe, it, expect } from 'vitest';
import { evaluateHand } from '@/lib/game-engine/hand-evaluator';

describe('Hand Evaluator', () => {
  it('identifies royal flush', () => {
    const hand = [
      { rank: 'A', suit: 'hearts' },
      { rank: 'K', suit: 'hearts' },
      { rank: 'Q', suit: 'hearts' },
      { rank: 'J', suit: 'hearts' },
      { rank: '10', suit: 'hearts' },
    ];
    expect(evaluateHand(hand)).toEqual({ rank: 'royal_flush', score: 10 });
  });

  // 100+ more test cases...
});
```

## API Design Patterns

### RESTful Actions

**Pattern:** Use React Router actions as REST endpoints

```
POST /game/:gameId/action  → Player action (bet, fold, call, raise)
POST /game/:gameId/join    → Join game
POST /game/:gameId/leave   → Leave game
POST /training/scenario    → Start training scenario
POST /training/submit      → Submit scenario answer
```

**Why Actions (Not Loaders)?**
- Loaders are GET requests (data fetching)
- Actions are POST/PUT/DELETE (mutations)
- Actions receive form data or JSON payloads

### Error Handling

**Pattern:** Return error responses with proper status codes

```typescript
export async function action({ request }: ActionFunctionArgs) {
  try {
    const result = await processGameAction(request);
    return json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      return json({ error: error.message }, { status: 400 });
    }
    if (error instanceof AuthError) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Unexpected error
    console.error(error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Real-Time Updates (Optional)

**Technology:** Supabase Realtime

**Usage:**
Subscribe to game state changes for live multi-player updates:

```typescript
// Client-side (app/components/game/GameTable.tsx)
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase.client';

export function GameTable({ gameId }: { gameId: string }) {
  useEffect(() => {
    const channel = supabase
      .channel(`game:${gameId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`,
      }, (payload) => {
        // Update local game state
        updateGameState(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);
}
```

**Decision:** Implement in Phase 5 (UX) if needed. Polling may be sufficient for MVP.

## Environment Variables

**Server-Side Only:**
These variables are NEVER exposed to the client.

```bash
# .env.local (development)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # server-only

# Better Auth
BETTER_AUTH_SECRET=xxx
BETTER_AUTH_URL=http://localhost:5173
```

**Vercel Deployment:**
Set in Vercel dashboard → Settings → Environment Variables.

**Validation:**
Use Zod to validate environment variables at startup:

```typescript
// app/lib/env.server.ts
import { z } from 'zod';

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
});

export const env = envSchema.parse(process.env);
```

## Logging & Monitoring

### Development

**Console Logging:**
Use `console.log`, `console.error` for development.

**Structured Logging (Optional):**
Consider `pino` for JSON structured logs in production.

### Production

**Vercel Logs:**
Access via Vercel dashboard → Functions → Logs.

**Error Tracking (Future):**
Consider Sentry for production error tracking (Phase 6: Quality).

## Performance Optimization

### Caching

**Pattern:** Cache game state in memory for repeated reads

```typescript
import { LRUCache } from 'lru-cache';

const gameCache = new LRUCache<string, GameState>({
  max: 100, // Cache 100 games
  ttl: 1000 * 60 * 5, // 5 minutes
});

export async function loader({ params }: LoaderFunctionArgs) {
  const cached = gameCache.get(params.gameId);
  if (cached) return json(cached);

  const game = await fetchGameFromDB(params.gameId);
  gameCache.set(params.gameId, game);
  return json(game);
}
```

**Decision:** Implement in Phase 6 (Quality) if needed. Premature optimization avoided.

### Database Indexing

**Critical Indexes:**
```sql
CREATE INDEX idx_games_user ON players(user_id);
CREATE INDEX idx_hands_game ON hands(game_id);
CREATE INDEX idx_actions_hand ON hand_actions(hand_id);
```

### Function Duration

**Target:** < 500ms per loader/action (well under 10s Vercel limit).

**Monitoring:** Track with Vercel Analytics.

## Security Considerations

### Input Validation

**Pattern:** Validate all inputs with Zod

```typescript
import { z } from 'zod';

const PlayerActionSchema = z.object({
  action: z.enum(['bet', 'fold', 'call', 'raise', 'check']),
  amount: z.number().min(0).optional(),
});

export async function action({ request }: ActionFunctionArgs) {
  const data = await request.formData();
  const parsed = PlayerActionSchema.safeParse({
    action: data.get('action'),
    amount: data.get('amount') ? parseInt(data.get('amount')) : undefined,
  });

  if (!parsed.success) {
    return json({ error: 'Invalid input' }, { status: 400 });
  }

  // Process action
}
```

### Authorization

**Pattern:** Verify user owns resource before mutations

```typescript
export async function action({ params, request }: ActionFunctionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });

  // Verify user is in this game
  const player = await supabase
    .from('players')
    .select('*')
    .eq('game_id', params.gameId)
    .eq('user_id', session.user.id)
    .single();

  if (!player) {
    return json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Process action
}
```

### Rate Limiting (Future)

**Consider:** Upstash Rate Limit for API abuse prevention (Phase 6: Quality).

## Deployment

**Platform:** Vercel
**Configuration:** `vercel.json` (optional, defaults work)

**Build Command:** `npm run build`
**Output Directory:** `build/`

**Serverless Functions:**
React Router loaders/actions automatically deploy as Vercel serverless functions.

**Environment Variables:**
Set in Vercel dashboard. Never commit to Git.

## Future Considerations

### Potential Additions

- **WebSockets:** For real-time game updates (Supabase Realtime or Ably)
- **Background Jobs:** For tournament scheduling (Vercel Cron Jobs)
- **Edge Functions:** For low-latency game state fetching (Supabase Edge Functions)
- **GraphQL:** If REST becomes cumbersome (Hasura over Supabase)

**Decision:** Defer until Phase 6 (Quality) or Phase 7 (Deployment). Avoid premature complexity.

## Related Documentation

- [Frontend Stack](./frontend.md)
- [Testing Stack](./testing.md)
- [ADR 001: Tech Stack Selection](../decisions/001-tech-stack.md)
- [ADR 005: Deployment Infrastructure](../decisions/005-deployment.md)
- [ADR 006: Game Engine Architecture](../decisions/006-game-engine.md)
