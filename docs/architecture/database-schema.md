# Database Schema

**Date:** 2025-11-08
**Status:** Complete
**Related ADRs:** [002](../decisions/002-deployment-platform.md), [005](../decisions/005-game-engine-architecture.md)

## Overview

PostgreSQL database schema for Poker-Sense, hosted on Supabase. Designed for game state persistence, event sourcing, training progress tracking, and analytics.

## Database Provider

**Platform:** Supabase (PostgreSQL 15+)
**Free Tier Limits:**
- 500MB database storage
- 2GB bandwidth/month
- Unlimited API requests
- Row-Level Security (RLS) enabled

## Schema Design Principles

1. **Normalized:** 3NF normalization to reduce redundancy
2. **Event Sourcing:** Game events stored for replay capability
3. **JSON Columns:** Complex state stored as JSONB (game state, scenario configs)
4. **Type Safety:** Enums for finite states (game status, training modes)
5. **Indexing:** Strategic indexes on frequent queries
6. **RLS Policies:** Row-level security for multi-tenant isolation
7. **Timestamps:** Created/updated timestamps on all tables

## Entity Relationship Diagram

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   users      │◄────────│    games     │────────►│ game_events  │
│              │ 1     n │              │ 1     n │              │
│ - id (PK)    │         │ - id (PK)    │         │ - id (PK)    │
│ - email      │         │ - user_id    │         │ - game_id    │
│ - username   │         │ - state      │         │ - player_id  │
│ - created_at │         │ - status     │         │ - action     │
└──────────────┘         │ - created_at │         │ - sequence   │
                         └──────────────┘         │ - created_at │
                                                  └──────────────┘
       │
       │ 1
       │
       │ n
       ▼
┌──────────────────┐      ┌─────────────────────┐
│  user_progress   │      │ training_scenarios  │
│                  │      │                     │
│ - id (PK)        │      │ - id (PK)           │
│ - user_id (FK)   │      │ - mode              │
│ - mode           │      │ - difficulty        │
│ - scenarios_done │      │ - config (JSONB)    │
│ - accuracy       │      │ - created_at        │
│ - updated_at     │      └─────────────────────┘
└──────────────────┘

       │ 1
       │
       │ n
       ▼
┌──────────────────┐
│ training_attempts│
│                  │
│ - id (PK)        │
│ - user_id (FK)   │
│ - scenario_id    │
│ - user_action    │
│ - correct        │
│ - rating         │
│ - created_at     │
└──────────────────┘
```

## Core Tables

### users

**Purpose:** User accounts and authentication (managed by Better Auth).

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

### games

**Purpose:** Current game state (6-max sit-n-go tournaments).

```sql
CREATE TYPE game_status AS ENUM (
  'WAITING',
  'DEALING',
  'PREFLOP',
  'FLOP',
  'TURN',
  'RIVER',
  'SHOWDOWN',
  'COMPLETE'
);

CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Current game state (serialized GameState)
  state JSONB NOT NULL,

  -- Derived fields (for indexing/querying)
  status game_status NOT NULL DEFAULT 'WAITING',
  hand_number INTEGER NOT NULL DEFAULT 1,
  small_blind INTEGER NOT NULL,
  big_blind INTEGER NOT NULL,

  -- Event sourcing
  event_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_games_user_id ON games(user_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_created_at ON games(created_at DESC);

-- RLS Policies
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own games"
  ON games FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own games"
  ON games FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own games"
  ON games FOR UPDATE
  USING (auth.uid() = user_id);
```

**State Column Schema (JSONB):**
```typescript
// Stored in games.state column
{
  "id": "uuid",
  "status": "PREFLOP" | "FLOP" | "TURN" | "RIVER" | "SHOWDOWN" | "COMPLETE",
  "players": [
    {
      "id": "uuid",
      "name": "string",
      "chips": 1500,
      "betThisRound": 10,
      "holeCards": ["Ah", "Kd"] | null,
      "position": "UTG" | "MP" | "CO" | "BTN" | "SB" | "BB",
      "hasFolded": false,
      "isAllIn": false
    }
  ],
  "pot": {
    "main": 50,
    "side": [
      { "amount": 30, "eligiblePlayers": ["uuid1", "uuid2"] }
    ]
  },
  "communityCards": ["Ah", "Kd", "Qc"],
  "currentBet": 10,
  "dealer": 0,
  "currentActor": 1,
  "handNumber": 5,
  "blinds": { "small": 5, "big": 10 },
  "deck": ["2h", "3d", ...]
}
```

### game_events

**Purpose:** Event log for game replay and auditability.

```sql
CREATE TABLE game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,

  -- Event details
  sequence INTEGER NOT NULL, -- Event order within game
  player_id UUID NOT NULL,
  action JSONB NOT NULL, -- PlayerAction type

  -- Resulting state (snapshot after action)
  resulting_state JSONB NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_game_events_game_id ON game_events(game_id, sequence);
CREATE INDEX idx_game_events_created_at ON game_events(created_at DESC);

-- Unique constraint (one sequence number per game)
CREATE UNIQUE INDEX idx_game_events_unique_sequence ON game_events(game_id, sequence);

-- RLS Policies
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read events for own games"
  ON game_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM games
      WHERE games.id = game_events.game_id
      AND games.user_id = auth.uid()
    )
  );
```

**Action Column Schema (JSONB):**
```typescript
// Stored in game_events.action column
{ "type": "FOLD" }
| { "type": "CHECK" }
| { "type": "CALL" }
| { "type": "BET", "amount": 50 }
| { "type": "RAISE", "amount": 100 }
| { "type": "ALL_IN" }
```

### training_scenarios

**Purpose:** Pre-defined training scenarios (hand strength, odds, position, opponent modeling).

```sql
CREATE TYPE training_mode AS ENUM (
  'hand-strength',
  'odds-calculation',
  'position-strategy',
  'opponent-modeling'
);

CREATE TYPE difficulty AS ENUM (
  'beginner',
  'intermediate',
  'advanced',
  'expert'
);

CREATE TABLE training_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scenario metadata
  mode training_mode NOT NULL,
  difficulty difficulty NOT NULL,
  title TEXT NOT NULL,
  description TEXT,

  -- Scenario configuration (Scenario type)
  config JSONB NOT NULL,

  -- Correct action and explanation
  correct_action JSONB NOT NULL,
  explanation TEXT NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_training_scenarios_mode ON training_scenarios(mode);
CREATE INDEX idx_training_scenarios_difficulty ON training_scenarios(difficulty);
CREATE INDEX idx_training_scenarios_mode_difficulty ON training_scenarios(mode, difficulty);

-- RLS Policies (scenarios are public, read-only)
ALTER TABLE training_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read scenarios"
  ON training_scenarios FOR SELECT
  TO authenticated
  USING (true);
```

**Config Column Schema (JSONB):**
```typescript
// Stored in training_scenarios.config column
{
  "position": "BTN" | "SB" | "BB" | "UTG" | "MP" | "CO",
  "holeCards": ["Ah", "Kd"],
  "communityCards": ["Qc", "Jh", "9s"],
  "pot": 150,
  "toCall": 50,
  "stackSize": 1500,
  "opponents": [
    {
      "position": "BB",
      "stackSize": 1200,
      "tendency": "tight-aggressive" | "loose-passive" | etc.
    }
  ]
}
```

### user_progress

**Purpose:** Track training progress per user per mode.

```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode training_mode NOT NULL,

  -- Aggregate stats
  scenarios_completed INTEGER NOT NULL DEFAULT 0,
  scenarios_correct INTEGER NOT NULL DEFAULT 0,

  -- Accuracy percentage (computed)
  accuracy DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN scenarios_completed > 0
      THEN (scenarios_correct::DECIMAL / scenarios_completed * 100)
      ELSE 0
    END
  ) STORED,

  -- Average rating (1-5 scale)
  average_rating DECIMAL(3,2) DEFAULT 0,

  -- Breakdown by difficulty
  beginner_accuracy DECIMAL(5,2) DEFAULT 0,
  intermediate_accuracy DECIMAL(5,2) DEFAULT 0,
  advanced_accuracy DECIMAL(5,2) DEFAULT 0,
  expert_accuracy DECIMAL(5,2) DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE UNIQUE INDEX idx_user_progress_unique ON user_progress(user_id, mode);

-- RLS Policies
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);
```

### training_attempts

**Purpose:** Record individual training attempts for analytics.

```sql
CREATE TYPE rating AS ENUM (
  'perfect',
  'good',
  'acceptable',
  'suboptimal',
  'mistake'
);

CREATE TABLE training_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES training_scenarios(id) ON DELETE CASCADE,

  -- Attempt details
  user_action JSONB NOT NULL,
  correct_action JSONB NOT NULL,

  -- Evaluation
  correct BOOLEAN NOT NULL,
  rating rating NOT NULL,

  -- Feedback
  explanation TEXT,

  -- Stats at time of attempt
  hand_strength DECIMAL(5,2), -- Percentile (0-100)
  pot_odds DECIMAL(5,2), -- Percentage
  equity DECIMAL(5,2), -- Percentage (0-100)

  -- Time tracking
  time_taken_ms INTEGER, -- Milliseconds to make decision

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_training_attempts_user_id ON training_attempts(user_id);
CREATE INDEX idx_training_attempts_scenario_id ON training_attempts(scenario_id);
CREATE INDEX idx_training_attempts_created_at ON training_attempts(created_at DESC);
CREATE INDEX idx_training_attempts_user_created ON training_attempts(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE training_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own attempts"
  ON training_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts"
  ON training_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Supporting Tables

### hand_history

**Purpose:** Completed hands for review and analytics (future phase).

```sql
CREATE TABLE hand_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Hand details
  hand_number INTEGER NOT NULL,
  hole_cards JSONB NOT NULL, -- [Card, Card]
  community_cards JSONB NOT NULL, -- Card[]

  -- Outcome
  won BOOLEAN NOT NULL,
  amount_won INTEGER NOT NULL, -- Can be negative (lost)

  -- Final hand
  hand_rank TEXT NOT NULL, -- "ROYAL_FLUSH", "PAIR", etc.
  hand_description TEXT NOT NULL, -- "Royal Flush", "Pair of Aces"

  -- Actions taken during hand
  actions JSONB NOT NULL, -- PlayerAction[]

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_hand_history_user_id ON hand_history(user_id);
CREATE INDEX idx_hand_history_game_id ON hand_history(game_id);
CREATE INDEX idx_hand_history_created_at ON hand_history(created_at DESC);

-- RLS Policies
ALTER TABLE hand_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own hand history"
  ON hand_history FOR SELECT
  USING (auth.uid() = user_id);
```

## Database Functions

### update_user_progress()

**Purpose:** Update user progress after training attempt.

```sql
CREATE OR REPLACE FUNCTION update_user_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Get scenario mode
  DECLARE
    scenario_mode training_mode;
    scenario_difficulty difficulty;
  BEGIN
    SELECT mode, difficulty INTO scenario_mode, scenario_difficulty
    FROM training_scenarios
    WHERE id = NEW.scenario_id;

    -- Upsert user_progress
    INSERT INTO user_progress (user_id, mode, scenarios_completed, scenarios_correct)
    VALUES (NEW.user_id, scenario_mode, 1, CASE WHEN NEW.correct THEN 1 ELSE 0 END)
    ON CONFLICT (user_id, mode) DO UPDATE
    SET
      scenarios_completed = user_progress.scenarios_completed + 1,
      scenarios_correct = user_progress.scenarios_correct + CASE WHEN NEW.correct THEN 1 ELSE 0 END,
      updated_at = now();

    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_update_user_progress
AFTER INSERT ON training_attempts
FOR EACH ROW
EXECUTE FUNCTION update_user_progress();
```

### increment_game_event_count()

**Purpose:** Increment event count when new event added.

```sql
CREATE OR REPLACE FUNCTION increment_game_event_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE games
  SET event_count = event_count + 1,
      updated_at = now()
  WHERE id = NEW.game_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_increment_game_event_count
AFTER INSERT ON game_events
FOR EACH ROW
EXECUTE FUNCTION increment_game_event_count();
```

### update_updated_at()

**Purpose:** Automatically update `updated_at` timestamp.

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER trigger_update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_games_updated_at
BEFORE UPDATE ON games
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_training_scenarios_updated_at
BEFORE UPDATE ON training_scenarios
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_user_progress_updated_at
BEFORE UPDATE ON user_progress
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

## Indexes Strategy

### Query Patterns

**Most frequent queries:**

1. Load game state: `SELECT * FROM games WHERE id = ?`
2. Load game events: `SELECT * FROM game_events WHERE game_id = ? ORDER BY sequence`
3. Fetch training scenarios: `SELECT * FROM training_scenarios WHERE mode = ? AND difficulty = ?`
4. Get user progress: `SELECT * FROM user_progress WHERE user_id = ? AND mode = ?`
5. Recent attempts: `SELECT * FROM training_attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`

**Indexes created:**
- Primary keys (automatic unique index)
- Foreign keys (game_id, user_id, scenario_id)
- Query filters (mode, difficulty, status)
- Sort columns (created_at DESC)
- Composite indexes (user_id + mode, mode + difficulty)

## Row-Level Security (RLS)

### Security Model

**Principle:** Users can only access their own data.

**Implementation:**
- RLS enabled on all user-specific tables
- Policies use `auth.uid()` to check user ID
- Training scenarios are public (read-only)
- Server uses service role key (bypasses RLS)

**Example Policy:**
```sql
CREATE POLICY "Users can read own games"
  ON games FOR SELECT
  USING (auth.uid() = user_id);
```

**Server Access:**
- Server uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- Client uses `SUPABASE_ANON_KEY` (enforces RLS)

## Migration Strategy

### Phase 1: Core Tables (Phase 2)
- `users` (managed by Better Auth)
- `games`
- `game_events`

### Phase 2: Training System (Phase 4)
- `training_scenarios`
- `user_progress`
- `training_attempts`

### Phase 3: Analytics (Phase 6)
- `hand_history`
- Additional indexes based on query patterns

### Migrations
Use Supabase migrations (SQL files):
```bash
supabase migration new create_games_table
supabase db push
```

## Seed Data

### Training Scenarios (Phase 4)

**Seed 20+ training scenarios:**
- 5 scenarios per training mode
- Mix of difficulties (beginner → expert)
- Cover common poker situations

**Example seed:**
```sql
INSERT INTO training_scenarios (mode, difficulty, title, config, correct_action, explanation)
VALUES (
  'hand-strength',
  'beginner',
  'Top Pair on Dry Board',
  '{"position": "BTN", "holeCards": ["Ah", "Kd"], "communityCards": ["Kh", "7c", "2s"], "pot": 100, "toCall": 50, "stackSize": 1500}',
  '{"type": "CALL"}',
  'Top pair with top kicker on a dry board is a strong hand. Calling is correct to build the pot.'
);
```

## Performance Considerations

### Query Optimization
- JSONB indexes on frequently queried fields (e.g., `games.state->>'status'`)
- Partial indexes on active games only (`WHERE status != 'COMPLETE'`)
- Analyze query plans with `EXPLAIN ANALYZE`

### JSONB Indexing (if needed)
```sql
-- Index on game status (JSONB field)
CREATE INDEX idx_games_state_status ON games USING btree ((state->>'status'));
```

### Connection Pooling
- Supabase provides connection pooling (default)
- Use `pgBouncer` for high concurrency

### Backups
- Supabase auto-backup (daily on free tier)
- Manual backups before migrations: `supabase db dump`

## Constraints and Validations

### Check Constraints

```sql
-- Ensure chips are non-negative
ALTER TABLE games
ADD CONSTRAINT check_blinds_positive
CHECK (small_blind > 0 AND big_blind > 0);

-- Ensure accuracy is 0-100
ALTER TABLE user_progress
ADD CONSTRAINT check_accuracy_range
CHECK (accuracy >= 0 AND accuracy <= 100);

-- Ensure event sequence is positive
ALTER TABLE game_events
ADD CONSTRAINT check_sequence_positive
CHECK (sequence > 0);
```

### Foreign Key Cascades

- `ON DELETE CASCADE`: When user deleted, delete all games, events, progress, attempts
- `ON DELETE RESTRICT`: Cannot delete scenario if attempts reference it (future: change to RESTRICT)

## Database Size Estimates

### Free Tier (500MB)

**Estimated storage per record:**
- `users`: ~1KB per user
- `games`: ~10KB per game (JSONB state)
- `game_events`: ~5KB per event
- `training_scenarios`: ~2KB per scenario
- `user_progress`: ~500B per mode per user
- `training_attempts`: ~1KB per attempt

**Capacity estimates:**
- 100 users
- 500 completed games (10 games per user avg)
- 50,000 game events (100 events per game avg)
- 50 training scenarios
- 400 user progress records (100 users × 4 modes)
- 50,000 training attempts (500 per user avg)

**Total storage: ~300MB** (fits comfortably in free tier)

## Future Enhancements

### Phase 7+
- **Real-time subscriptions:** Subscribe to game state changes (multiplayer)
- **Leaderboards table:** Track top players
- **Achievements table:** Track unlocked achievements
- **Friend system:** Friend requests, friend games
- **Tournament history:** Multi-table tournament results

### Analytics Tables
- **Daily stats:** Aggregate user stats per day
- **Session tracking:** Track training sessions
- **Heatmaps:** Positional play heatmaps

## Related Documentation

- [System Overview](./system-overview.md) - High-level architecture
- [Component Architecture](./component-architecture.md) - Component design
- [ADR 002: Deployment Platform](../decisions/002-deployment-platform.md)
- [ADR 005: Game Engine Architecture](../decisions/005-game-engine-architecture.md)
