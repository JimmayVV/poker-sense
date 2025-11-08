# Database

> **Status:** Defined in [ADR 002](../decisions/002-deployment-platform.md)
> **Last Updated:** 2025-11-08

## Overview

Poker-sense uses **Supabase PostgreSQL 15.x** as its database. Supabase provides a managed Postgres instance with row-level security, Better Auth integration, real-time subscriptions, and a generous free tier (500 MB database). Local development uses Supabase CLI with Docker for full production parity.

## Technology

**Database:** PostgreSQL 15.x (via Supabase)
**ORM/Query Builder:** Supabase Client SDK (direct SQL queries)
**Migrations:** Supabase CLI migrations
**Row-Level Security:** Enabled on all user-facing tables

## Why Supabase Postgres?

- **Free Tier:** 500 MB database, 50k monthly active users, 5 GB bandwidth
- **Better Auth Adapter:** Official Supabase adapter for Better Auth
- **PostgreSQL Features:** Full relational database, JSONB support, triggers, functions
- **Row-Level Security:** Database-enforced authorization (users can't query other users' data)
- **Realtime Subscriptions:** Optional WebSocket updates for live gameplay
- **Local Development:** Supabase CLI runs local Postgres in Docker
- **Automatic Backups:** Daily backups on free tier (7-day retention)
- **Dashboard:** SQL editor, table view, query performance monitoring

## Schema Design

### Core Tables

#### Users
Managed by Better Auth. Stores user accounts.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique user identifier (UUID)
- `email`: User email (unique, required)
- `username`: Display name (unique, required)
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

**Indexes:**
- `PRIMARY KEY (id)`
- `UNIQUE (email)`
- `UNIQUE (username)`

#### Games
Stores poker game instances (tournaments, training sessions).

```sql
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT NOT NULL CHECK (status IN ('waiting', 'in_progress', 'completed')),
  current_hand_id UUID,
  pot INTEGER DEFAULT 0,
  current_bet INTEGER DEFAULT 0,
  dealer_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique game identifier
- `status`: Game state (`waiting`, `in_progress`, `completed`)
- `current_hand_id`: Reference to active hand (nullable)
- `pot`: Current pot size (chips)
- `current_bet`: Current bet amount
- `dealer_position`: Dealer button position (0-9)
- `created_at`: Game creation timestamp
- `updated_at`: Last state change timestamp

**Constraints:**
- `CHECK (status IN ('waiting', 'in_progress', 'completed'))`

**Indexes:**
- `PRIMARY KEY (id)`

#### Players
Represents players in a specific game instance.

```sql
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chips INTEGER NOT NULL,
  position INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'folded', 'all_in', 'out')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique player identifier (scoped to game)
- `game_id`: Reference to game
- `user_id`: Reference to user account
- `chips`: Current chip count
- `position`: Seat position (0-9)
- `status`: Player state (`active`, `folded`, `all_in`, `out`)
- `created_at`: Join timestamp

**Constraints:**
- `FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE`
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- `CHECK (status IN ('active', 'folded', 'all_in', 'out'))`

**Indexes:**
- `PRIMARY KEY (id)`
- `INDEX idx_players_user (user_id)` - Find all games for a user
- `INDEX idx_players_game (game_id)` - Find all players in a game

#### Hands
Represents individual poker hands within a game.

```sql
CREATE TABLE hands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  hand_number INTEGER NOT NULL,
  community_cards JSONB,
  pot INTEGER NOT NULL,
  winner_id UUID REFERENCES players(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique hand identifier
- `game_id`: Reference to game
- `hand_number`: Sequential hand number (1, 2, 3...)
- `community_cards`: JSONB array of cards `[{rank: 'A', suit: 'hearts'}, ...]`
- `pot`: Final pot size for this hand
- `winner_id`: Reference to winning player (nullable if in progress)
- `created_at`: Hand start timestamp

**Community Cards Format:**
```json
[
  { "rank": "A", "suit": "hearts" },
  { "rank": "K", "suit": "spades" },
  { "rank": "Q", "suit": "diamonds" },
  { "rank": "J", "suit": "clubs" },
  { "rank": "10", "suit": "hearts" }
]
```

**Constraints:**
- `FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE`
- `FOREIGN KEY (winner_id) REFERENCES players(id)`

**Indexes:**
- `PRIMARY KEY (id)`
- `INDEX idx_hands_game (game_id)` - Find all hands in a game

#### Hand Actions
Audit log of all player actions (event sourcing for hand replay).

```sql
CREATE TABLE hand_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hand_id UUID REFERENCES hands(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('bet', 'fold', 'call', 'raise', 'check')),
  amount INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique action identifier
- `hand_id`: Reference to hand
- `player_id`: Reference to player
- `action`: Action type (`bet`, `fold`, `call`, `raise`, `check`)
- `amount`: Bet/raise amount (nullable for fold/check)
- `created_at`: Action timestamp

**Constraints:**
- `FOREIGN KEY (hand_id) REFERENCES hands(id) ON DELETE CASCADE`
- `FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE`
- `CHECK (action IN ('bet', 'fold', 'call', 'raise', 'check'))`

**Indexes:**
- `PRIMARY KEY (id)`
- `INDEX idx_hand_actions_hand (hand_id)` - Fetch all actions for a hand

**Usage:**
Event sourcing pattern. Replay all actions to reconstruct hand state.

```typescript
// Example: Replay hand
const actions = await supabase
  .from('hand_actions')
  .select('*')
  .eq('hand_id', handId)
  .order('created_at', { ascending: true });

let handState = initialHandState;
for (const action of actions) {
  handState = gameEngine.applyAction(handState, action);
}
```

#### Scenarios
Training scenarios (pre-configured poker situations).

```sql
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mode TEXT NOT NULL CHECK (mode IN ('hand_strength', 'odds', 'position', 'opponent')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique scenario identifier
- `mode`: Training mode (hand strength, odds calculation, position play, opponent modeling)
- `difficulty`: Difficulty level
- `config`: JSONB scenario configuration (cards, pot, players, etc.)
- `created_at`: Creation timestamp

**Config Format (Example):**
```json
{
  "holeCards": [
    { "rank": "A", "suit": "spades" },
    { "rank": "K", "suit": "spades" }
  ],
  "communityCards": [
    { "rank": "Q", "suit": "spades" },
    { "rank": "J", "suit": "hearts" },
    { "rank": "10", "suit": "diamonds" }
  ],
  "pot": 500,
  "currentBet": 100,
  "position": "button",
  "opponents": [
    { "position": "small_blind", "chips": 1000, "style": "aggressive" },
    { "position": "big_blind", "chips": 800, "style": "tight" }
  ],
  "question": "What is the probability of completing your flush on the river?",
  "answer": 0.196,
  "explanation": "9 outs (remaining spades) / 46 unseen cards = 19.6%"
}
```

**Constraints:**
- `CHECK (mode IN ('hand_strength', 'odds', 'position', 'opponent'))`
- `CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'))`

**Indexes:**
- `PRIMARY KEY (id)`

#### User Progress
Tracks user completion and scores for training scenarios.

```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  score INTEGER,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, scenario_id)
);
```

**Fields:**
- `id`: Unique progress record
- `user_id`: Reference to user
- `scenario_id`: Reference to scenario
- `completed`: Whether user completed scenario
- `score`: User score (0-100)
- `attempts`: Number of attempts
- `created_at`: First attempt timestamp

**Constraints:**
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- `FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE`
- `UNIQUE (user_id, scenario_id)` - One progress record per user per scenario

**Indexes:**
- `PRIMARY KEY (id)`
- `INDEX idx_user_progress_user (user_id)` - Fetch all progress for a user
- `UNIQUE (user_id, scenario_id)`

### Schema Diagram

```
users (1) ----< (N) players (N) >---- (1) games
                  |                        |
                  |                        |
                  v                        v
            hand_actions (N) >---- (1) hands

users (1) ----< (N) user_progress (N) >---- (1) scenarios
```

## Row-Level Security (RLS)

All user-facing tables have RLS enabled. Database enforces authorization.

### Policies

**Games - View Own Games:**
```sql
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own games" ON games
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM players WHERE game_id = games.id
    )
  );
```

Users can only view games they're playing in.

**Players - View Players in Own Games:**
```sql
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view players in own games" ON players
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM players WHERE game_id = players.game_id
    )
  );
```

Users can view all players in games they're in (to see opponent chip counts).

**Hands - View Hands in Own Games:**
```sql
ALTER TABLE hands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view hands in own games" ON hands
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM players WHERE game_id = hands.game_id
    )
  );
```

**Hand Actions - View Actions in Own Games:**
```sql
ALTER TABLE hand_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view actions in own hands" ON hand_actions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT p.user_id FROM players p
      INNER JOIN hands h ON h.game_id = p.game_id
      WHERE h.id = hand_actions.hand_id
    )
  );
```

**User Progress - View and Update Own Progress:**
```sql
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);
```

**Scenarios - Public Read:**
```sql
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scenarios" ON scenarios
  FOR SELECT USING (true);
```

Training scenarios are public (anyone can view).

### RLS Testing

Verify policies work:

```sql
-- As user A (auth.uid() = 'user-a-uuid')
SELECT * FROM games; -- Should only return games where user A is a player

-- As user B (auth.uid() = 'user-b-uuid')
SELECT * FROM user_progress; -- Should only return user B's progress
```

## Supabase Client Usage

### Server-Side Client (Loaders/Actions)

**Create client with auth context:**

```typescript
// app/lib/supabase.server.ts
import { createServerClient as createClient } from '@supabase/ssr';

export function createServerClient(request: Request) {
  const cookies = request.headers.get('Cookie');

  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies
            ?.split(';')
            .find((c) => c.trim().startsWith(`${name}=`))
            ?.split('=')[1];
        },
      },
    }
  );
}
```

**Usage in loaders:**

```typescript
// app/routes/game.$gameId.tsx
import { json, LoaderFunctionArgs } from '@remix-run/node';
import { createServerClient } from '@/lib/supabase.server';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const supabase = createServerClient(request);

  // RLS automatically filters to user's games
  const { data: game, error } = await supabase
    .from('games')
    .select(`
      *,
      players (*),
      hands (*)
    `)
    .eq('id', params.gameId)
    .single();

  if (error || !game) {
    throw new Response('Game not found', { status: 404 });
  }

  return json(game);
}
```

**Usage in actions:**

```typescript
// app/routes/game.$gameId.action.tsx
import { json, ActionFunctionArgs } from '@remix-run/node';
import { createServerClient } from '@/lib/supabase.server';

export async function action({ params, request }: ActionFunctionArgs) {
  const supabase = createServerClient(request);
  const formData = await request.formData();

  const action = formData.get('action');
  const amount = formData.get('amount');

  // Insert hand action (RLS ensures user is in game)
  const { data, error } = await supabase
    .from('hand_actions')
    .insert({
      hand_id: params.handId,
      player_id: currentPlayerId,
      action,
      amount: amount ? parseInt(amount) : null,
    })
    .select()
    .single();

  if (error) {
    return json({ error: error.message }, { status: 400 });
  }

  return json({ success: true, action: data });
}
```

### Client-Side Client (Optional)

For real-time subscriptions or client-side queries:

```typescript
// app/lib/supabase.client.ts
import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);
```

**Usage (real-time updates):**

```typescript
// app/components/game/GameTable.tsx
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase.client';

export function GameTable({ gameId }: { gameId: string }) {
  useEffect(() => {
    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          console.log('Game updated:', payload.new);
          // Update local state
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  return <div>Game Table</div>;
}
```

## Migrations

### Local Development

**Create migration:**

```bash
# Start local Supabase
supabase start

# Create new migration
supabase migration new add_scenarios_table

# Edit migration file
# supabase/migrations/20251108123456_add_scenarios_table.sql

# Apply migration
supabase db reset # Applies all migrations
```

**Migration File Example:**

```sql
-- supabase/migrations/20251108123456_add_scenarios_table.sql

CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mode TEXT NOT NULL CHECK (mode IN ('hand_strength', 'odds', 'position', 'opponent')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scenarios" ON scenarios
  FOR SELECT USING (true);
```

### Production Deployment

**Push migrations to production:**

```bash
# Link to production project
supabase link --project-ref your-project-ref

# Push local migrations to production
supabase db push

# Verify migration applied
supabase db remote commit # Saves remote state
```

**Rollback (if needed):**

```bash
# Rollback last migration
supabase migration repair <migration-id> --status reverted

# Create revert migration
supabase migration new revert_scenarios_table
```

## Backup Strategy

**Automatic Backups:**
- **Frequency:** Daily (free tier)
- **Retention:** 7 days (free tier), 30 days (Pro tier)
- **Location:** Supabase managed

**Manual Backups:**

```bash
# Export database to SQL
supabase db dump -f backup.sql

# Restore from SQL
supabase db reset --db-url <connection-string> -f backup.sql
```

**Production Backup (Recommended):**
- Upgrade to Pro tier ($25/month) for 30-day retention
- Export weekly backups to S3/Google Cloud Storage

## Performance Optimization

### Indexes

**Critical indexes:**

```sql
-- Players by user (find all games for a user)
CREATE INDEX idx_players_user ON players(user_id);

-- Players by game (find all players in a game)
CREATE INDEX idx_players_game ON players(game_id);

-- Hands by game (fetch hand history)
CREATE INDEX idx_hands_game ON hands(game_id);

-- Hand actions by hand (replay hand)
CREATE INDEX idx_hand_actions_hand ON hand_actions(hand_id);

-- User progress by user (fetch user's training progress)
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
```

### Query Optimization

**Use JSONB indexes for scenario config:**

```sql
-- Index on scenario difficulty
CREATE INDEX idx_scenarios_difficulty ON scenarios(difficulty);

-- JSONB GIN index for config queries
CREATE INDEX idx_scenarios_config ON scenarios USING GIN(config);

-- Query scenarios with specific card in config
SELECT * FROM scenarios
WHERE config @> '{"holeCards": [{"rank": "A", "suit": "spades"}]}';
```

### Connection Pooling

Supabase provides connection pooling automatically (PgBouncer).

**Connection limits (free tier):**
- **Max connections:** 100
- **Pooled connections:** 15

Use `?pgbouncer=true` query param for pooling:

```typescript
const supabase = createClient(
  process.env.SUPABASE_URL! + '?pgbouncer=true',
  process.env.SUPABASE_ANON_KEY!
);
```

## Storage Estimation

**Target:** Support 10,000 users on free tier (500 MB limit).

```
Users: 10,000 × 1 KB = 10 MB
Games: 5,000 × 5 KB = 25 MB
Players: 50,000 × 0.5 KB = 25 MB
Hands: 50,000 × 2 KB = 100 MB
Hand Actions: 500,000 × 0.5 KB = 250 MB
Scenarios: 50 × 10 KB = 0.5 MB
User Progress: 10,000 users × 20 scenarios × 0.5 KB = 100 MB
---
Total: ~510 MB
```

**Over limit solution:**
- Archive old games (move to cold storage)
- Delete completed games after 90 days
- Compress hand action JSON

## Security Considerations

### Input Validation

Validate all inputs before database queries:

```typescript
import { z } from 'zod';

const PlayerActionSchema = z.object({
  action: z.enum(['bet', 'fold', 'call', 'raise', 'check']),
  amount: z.number().min(0).optional(),
});

// In action handler
const parsed = PlayerActionSchema.safeParse(formData);
if (!parsed.success) {
  return json({ error: 'Invalid input' }, { status: 400 });
}
```

### SQL Injection Prevention

Supabase client uses prepared statements (no SQL injection risk).

**Safe:**
```typescript
await supabase.from('games').select('*').eq('id', gameId);
```

**Unsafe (never do this):**
```typescript
// ❌ NEVER use raw SQL with user input
await supabase.rpc('get_game', { query: `SELECT * FROM games WHERE id = '${gameId}'` });
```

### RLS Bypass Prevention

Always use `anon` key (not `service` key) for client queries. Service key bypasses RLS.

**Server-side loaders/actions:**
```typescript
// ✅ Use anon key (respects RLS)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY! // Respects RLS
);

// ❌ Never use service key for user queries
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Bypasses RLS (admin only)
);
```

## Monitoring

**Supabase Dashboard:**
- Database size and growth rate
- Slow queries (> 100ms)
- RLS policy evaluation time
- Connection count
- API request logs

**Alerts:**
- Database size > 450 MB (90% of free tier)
- Slow queries > 500ms
- Connection pool exhaustion

## Related Documentation

- [ADR 002: Deployment Platform Selection](../decisions/002-deployment-platform.md)
- [Infrastructure](./infrastructure.md)
- [Backend Stack](./backend.md)
