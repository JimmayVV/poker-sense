# 002. Deployment Platform Selection

**Date:** 2025-11-08
**Status:** Accepted
**Deciders:** Jimmy VV, Claude Code
**Technical Story:** [Issue #3](https://github.com/JimmayVV/poker-sense/issues/3)

## Context

Building a Texas Hold'em training application with React Router v7 framework mode. The application requires:

- **Free tier deployment** (hard budget constraint)
- **Database persistence** for game state, user data, training scenarios, progress tracking
- **Authentication** via Better Auth (requires database adapter)
- **Server-side game logic** (requires serverless/edge functions)
- **Mobile-first delivery** (edge network beneficial for low latency)
- **Staging + production environments** for safe deployments

Critical deployment requirements:
- Support React Router v7 framework mode (loaders/actions)
- PostgreSQL database (Better Auth requires relational DB)
- Generous free tier limits (500MB DB minimum, 100GB bandwidth)
- Serverless functions for game engine
- Environment variable management
- Easy CI/CD integration with GitHub
- Local development support (Docker or cloud CLI)

## Decision Drivers

- **Free Tier Viability:** Must support MVP on free tier (500MB DB, 100GB bandwidth, 100k function invocations/month)
- **React Router v7 Support:** Official or community-proven deployment support
- **Database Requirements:** PostgreSQL with row-level security, Better Auth adapter
- **Development Experience:** Easy local setup, fast deployments, good DX
- **Scalability Path:** Free tier today, paid tier if app grows
- **Ecosystem Maturity:** Stable, well-documented, active support
- **CI/CD Integration:** GitHub Actions or built-in CI/CD
- **Monitoring:** Built-in logs, analytics, error tracking

## Considered Options

### Decision 1: Hosting Platform

#### Option 1.1: Vercel

**Description:** Vercel serverless platform with edge network, official React Router v7 support.

**Pros:**
- **Official RR v7 Support:** First-class React Router framework mode support
- **Generous Free Tier:** 100GB bandwidth, 100 serverless functions, 6000 build minutes/month
- **Edge Network:** Global CDN for fast mobile delivery
- **Zero Configuration:** Deploy from GitHub with automatic builds
- **Built-in CI/CD:** Automatic preview deployments for PRs
- **Environment Management:** Easy env vars per environment (staging/prod)
- **Excellent DX:** Fast builds, instant rollbacks, preview URLs
- **Monitoring:** Built-in analytics, function logs, web vitals
- **Serverless Functions:** Node.js 20.x, 10s execution limit (sufficient for game engine)

**Cons:**
- **No Database:** Must use external database (Supabase, PlanetScale, etc.)
- **Vendor Lock-in:** Some Vercel-specific features (Edge Middleware)
- **Cold Starts:** Serverless functions have ~100-300ms cold start

**Free Tier Limits:**
- **Bandwidth:** 100 GB/month (sufficient for MVP: ~10k mobile users)
- **Function Invocations:** Unlimited (but 100 concurrent executions)
- **Function Duration:** 10s max (game engine completes in < 500ms)
- **Build Minutes:** 6000/month (100 hours)

#### Option 1.2: Railway

**Description:** Full-stack platform with built-in Postgres, supports Node.js apps.

**Pros:**
- **Integrated Database:** PostgreSQL included, no external service needed
- **Simple Pricing:** Pay for usage, predictable costs
- **Docker Support:** Deploy any Docker container
- **Good DX:** CLI, auto-deploys from GitHub
- **Persistent Storage:** Can run long-lived processes

**Cons:**
- **Free Tier Removed:** No free tier (minimum $5/month for hobby plan)
- **Less React Router Focus:** Not specialized for React frameworks
- **Smaller Community:** Less documentation than Vercel
- **No Edge Network:** Single-region deployment (higher mobile latency)

**Pricing:**
- **Hobby Plan:** $5/month (500MB DB, 500 hours compute)
- **Pro Plan:** $20/month (scales with usage)

**Verdict:** Rejected due to no free tier (violates budget constraint).

#### Option 1.3: Cloudflare Pages

**Description:** JAMstack platform with Cloudflare Workers for serverless functions, global edge network.

**Pros:**
- **Generous Free Tier:** 500 builds/month, unlimited bandwidth
- **Edge Network:** Deploy to 300+ global data centers
- **Cloudflare D1:** Built-in SQLite database (beta)
- **Workers Support:** Serverless functions at the edge
- **Fast Performance:** Edge computing reduces latency

**Cons:**
- **D1 Limitations:** SQLite (not Postgres), beta stability concerns
- **No Better Auth Adapter:** Better Auth requires Postgres, D1 is SQLite
- **Complex Setup:** Workers require different mental model than Node.js
- **Limited Node.js:** Workers use V8 isolates, not full Node.js runtime
- **React Router Support:** Community-driven, not official

**Verdict:** Rejected due to SQLite-only database (Better Auth needs Postgres).

#### Option 1.4: Fly.io

**Description:** Container-based platform, run apps globally, built-in Postgres.

**Pros:**
- **Integrated Postgres:** Managed PostgreSQL included
- **Global Network:** Deploy close to users
- **Full Docker Support:** Run any container
- **Free Tier:** 3 VMs (256MB RAM each), 3GB storage

**Cons:**
- **Container Complexity:** Requires Dockerfile, less simple than Vercel
- **Free Tier Limits:** 256MB RAM per VM (tight for game engine)
- **Less React Router Focus:** Generic platform, not React-specialized
- **Smaller Ecosystem:** Less documentation than Vercel

**Free Tier:**
- **Compute:** 3 shared-CPU VMs (256MB RAM each)
- **Storage:** 3 GB persistent volume
- **Bandwidth:** 100 GB/month

**Verdict:** Viable alternative, but Vercel + Supabase offers better DX and free tier.

### Decision 2: Database Platform

#### Option 2.1: Supabase

**Description:** Open-source Firebase alternative, Postgres database with auth, storage, realtime.

**Pros:**
- **Generous Free Tier:** 500 MB database, 1 GB file storage, 50k MAU
- **PostgreSQL 15.x:** Full relational database with JSONB support
- **Better Auth Adapter:** Official Supabase adapter for Better Auth
- **Row-Level Security:** Database-enforced authorization policies
- **Realtime Subscriptions:** WebSocket support for live game updates (optional)
- **Built-in Auth (Optional):** Can use Supabase Auth or Better Auth
- **Storage:** 1 GB file storage (for user avatars, future assets)
- **Edge Functions:** Optional serverless functions (Deno runtime)
- **Excellent DX:** Dashboard, SQL editor, auto-generated types
- **Local Development:** Supabase CLI with Docker (local Postgres)

**Cons:**
- **Paused Projects:** Free tier projects pause after 7 days inactivity (auto-resume on access)
- **Latency:** Database in single region (but edge caching available)
- **Vendor Lock-in:** Some Supabase-specific features (Realtime, Storage)

**Free Tier Limits:**
- **Database:** 500 MB (sufficient for 10k users + game history)
- **API Requests:** Unlimited (fair use policy)
- **Storage:** 1 GB (user avatars, assets)
- **Bandwidth:** 5 GB/month (database only, not counting Vercel CDN)
- **Row-Level Security:** Included

**Storage Estimation:**
```
Users: 10k users × 1 KB = 10 MB
Games: 5k games × 5 KB = 25 MB
Hands: 50k hands × 2 KB = 100 MB
Hand Actions: 500k actions × 0.5 KB = 250 MB
Scenarios: 50 scenarios × 10 KB = 0.5 MB
User Progress: 10k users × 20 scenarios × 0.5 KB = 100 MB
Total: ~485 MB (within 500 MB limit)
```

#### Option 2.2: PlanetScale

**Description:** MySQL-compatible serverless database with branching (like Git).

**Pros:**
- **Generous Free Tier:** 5 GB storage, 1 billion row reads/month
- **Database Branching:** Create branches for schema migrations (Git-like)
- **Excellent Performance:** Vitess-based, horizontal scaling
- **Zero Downtime Migrations:** Deploy schema changes without downtime
- **Good DX:** CLI, dashboard, connection pooling

**Cons:**
- **MySQL Only:** Better Auth prefers Postgres (Drizzle adapter needed)
- **No Free Tier (2024 Update):** PlanetScale removed free tier in April 2024
- **Less RLS Support:** Row-level security not as robust as Postgres

**Pricing (No Free Tier):**
- **Hobby Plan:** $29/month (10 GB storage)

**Verdict:** Rejected due to no free tier and MySQL vs Postgres preference.

#### Option 2.3: Neon

**Description:** Serverless Postgres with branching, instant scaling, pay-per-use.

**Pros:**
- **PostgreSQL:** Full Postgres compatibility
- **Generous Free Tier:** 0.5 GB storage, 100 hours compute/month
- **Branching:** Create database branches for testing
- **Instant Scaling:** Scale to zero when idle
- **Better Auth Adapter:** Postgres support

**Cons:**
- **Compute Hours Limit:** 100 hours/month free (3.3 hours/day, may exhaust)
- **Cold Starts:** Database sleeps when idle, 1-2s wakeup time
- **Storage Limit:** 0.5 GB (tight, same as Supabase but less bandwidth)
- **No Realtime:** Must build own WebSocket solution

**Free Tier:**
- **Storage:** 0.5 GB
- **Compute:** 100 hours/month (active time only)
- **Branches:** 10 branches

**Verdict:** Viable alternative, but compute hour limit risky. Supabase offers more features.

#### Option 2.4: Turso

**Description:** Edge-hosted SQLite database, globally distributed.

**Pros:**
- **Edge Distribution:** Deploy database close to users
- **Generous Free Tier:** 9 GB storage, 1 billion row reads/month
- **Instant Scaling:** SQLite performance
- **Embedded Replicas:** Can embed DB in Vercel functions (future)

**Cons:**
- **SQLite Only:** Better Auth requires Postgres (no Turso adapter)
- **Limited SQL Features:** SQLite less powerful than Postgres
- **No RLS:** Must implement authorization in application code
- **Newer Product:** Less battle-tested than Postgres options

**Verdict:** Rejected due to SQLite vs Postgres and lack of Better Auth support.

### Decision 3: Local Development Strategy

#### Option 3.1: Supabase CLI (Docker)

**Description:** Run local Supabase stack with Docker (Postgres, Auth, Storage, Realtime).

**Pros:**
- **Full Parity:** Local environment matches production
- **Offline Development:** Work without internet
- **Fast Iteration:** No network latency
- **Automatic Migrations:** Sync schema changes to production

**Cons:**
- **Docker Dependency:** Requires Docker Desktop
- **Resource Usage:** Multiple containers (Postgres, Auth, etc.)

#### Option 3.2: Cloud Development (Supabase Staging Project)

**Description:** Use separate Supabase project for development, deploy to cloud.

**Pros:**
- **No Docker:** Simpler setup
- **Matches Production:** Same cloud environment

**Cons:**
- **Network Latency:** Slower than local
- **Requires Internet:** Can't work offline
- **Free Tier Limit:** Only 2 free projects (dev + prod)

**Decision:** Use Supabase CLI (Option 3.1) for local development, cloud for staging/prod.

## Decision Outcome

### Hosting Platform
**Chosen:** Vercel

**Justification:**
Vercel provides the best developer experience for React Router v7 framework mode with official support, zero-configuration deployments, and a generous free tier (100GB bandwidth, unlimited functions). The edge network ensures fast mobile delivery globally. Built-in CI/CD with preview deployments enables safe staging workflows. While Vercel doesn't include a database, pairing with Supabase gives us more flexibility and a better free tier (500MB DB vs Railway's $5/month minimum).

### Database Platform
**Chosen:** Supabase (PostgreSQL)

**Justification:**
Supabase offers the best combination of features and free tier limits. 500MB Postgres database supports MVP with room to grow. Better Auth has an official Supabase adapter. Row-level security enforces authorization at the database level (critical for multi-user games). Optional Realtime subscriptions enable future live game updates. Local development via Supabase CLI with Docker provides full parity. The 7-day inactivity pause is acceptable (auto-resumes on first request). PlanetScale has no free tier, Neon's compute hours may exhaust, and Turso/Cloudflare D1 lack Postgres compatibility.

### Local Development
**Chosen:** Supabase CLI with Docker

**Justification:**
Full local stack (Postgres, Auth, Storage) provides offline development, fast iteration, and production parity. Automatic migrations ensure schema changes sync to production safely. Docker dependency is acceptable given user familiarity with containerization.

### Consequences

**Positive:**
- **Zero Hosting Cost:** Vercel free tier supports MVP (100GB bandwidth, unlimited functions)
- **Generous Database:** 500 MB Postgres sufficient for 10k users + game history
- **Official RR v7 Support:** Zero-configuration Vercel deployments
- **Best-in-Class DX:** Fast builds, preview URLs, instant rollbacks
- **Full Postgres Features:** JSONB, RLS, Better Auth adapter
- **Realtime Capability:** Optional Supabase Realtime for live games (Phase 5)
- **Local Development:** Supabase CLI enables offline work
- **Automatic CI/CD:** GitHub integration with preview deployments
- **Monitoring:** Built-in Vercel logs, analytics, Supabase dashboard

**Negative:**
- **Multi-Service Complexity:** Manage Vercel + Supabase separately
- **Supabase Inactivity Pause:** Free projects pause after 7 days (auto-resume, ~1-2s delay)
- **Vendor Lock-in:** Some Vercel/Supabase-specific features
- **Cold Starts:** Vercel serverless functions have ~100-300ms cold start (acceptable)
- **Database Region:** Supabase free tier in single region (add edge caching if needed)

**Neutral:**
- **Environment Management:** Must configure env vars in both Vercel and locally
- **Two Dashboards:** Vercel for functions, Supabase for database
- **Docker Dependency:** Supabase CLI requires Docker Desktop

## Implementation Notes

### Vercel Setup

**1. Connect GitHub Repository:**
```bash
# Install Vercel CLI (optional)
npm install -g vercel

# Link project
vercel link
```

**2. Configure Environment Variables:**
In Vercel Dashboard → Settings → Environment Variables:
```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # server-only

# Better Auth
BETTER_AUTH_SECRET=xxx # Generate with: openssl rand -base64 32
BETTER_AUTH_URL=https://poker-sense.vercel.app # Production URL
```

**3. Deployment Configuration:**
Vercel auto-detects React Router v7. No `vercel.json` needed. Optional config:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "react-router",
  "functions": {
    "app/routes/**/*.ts": {
      "maxDuration": 10
    }
  }
}
```

**4. Environments:**
- **Production:** `main` branch → poker-sense.vercel.app
- **Staging:** `staging` branch → poker-sense-staging.vercel.app
- **Preview:** All PRs → unique URL (e.g., poker-sense-pr-42.vercel.app)

### Supabase Setup

**1. Create Project:**
- Go to [Supabase Dashboard](https://app.supabase.com/)
- Create new project: `poker-sense-prod`
- Select region: `us-east-1` (or closest to majority users)
- Set database password (save in password manager)

**2. Create Staging Project:**
- Create second project: `poker-sense-staging`
- Same region for consistency

**3. Local Development (Supabase CLI):**
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase in project
supabase init

# Start local stack (requires Docker)
supabase start

# Output:
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**4. Create Tables:**
Create migration files in `supabase/migrations/`:

```sql
-- supabase/migrations/20251108000001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Better Auth managed)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table
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

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chips INTEGER NOT NULL,
  position INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'folded', 'all_in', 'out')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hands table
CREATE TABLE hands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  hand_number INTEGER NOT NULL,
  community_cards JSONB,
  pot INTEGER NOT NULL,
  winner_id UUID REFERENCES players(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hand actions table
CREATE TABLE hand_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hand_id UUID REFERENCES hands(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('bet', 'fold', 'call', 'raise', 'check')),
  amount INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training scenarios table
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mode TEXT NOT NULL CHECK (mode IN ('hand_strength', 'odds', 'position', 'opponent')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress table
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

-- Indexes for performance
CREATE INDEX idx_players_user ON players(user_id);
CREATE INDEX idx_players_game ON players(game_id);
CREATE INDEX idx_hands_game ON hands(game_id);
CREATE INDEX idx_hand_actions_hand ON hand_actions(hand_id);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);

-- Row-Level Security (RLS) policies
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE hands ENABLE ROW LEVEL SECURITY;
ALTER TABLE hand_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view games they're in
CREATE POLICY "Users can view own games" ON games
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM players WHERE game_id = games.id
    )
  );

-- Policy: Users can view players in their games
CREATE POLICY "Users can view players in own games" ON players
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM players WHERE game_id = players.game_id
    )
  );

-- Policy: Users can view their own progress
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can update their own progress
CREATE POLICY "Users can update own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify own progress" ON user_progress
  FOR UPDATE USING (auth.uid() = user_id);
```

**5. Apply Migrations:**
```bash
# Local
supabase db reset # Applies all migrations

# Production
supabase link --project-ref xxx # Link to prod project
supabase db push # Push local migrations to prod
```

### Better Auth Setup

**1. Install Better Auth:**
```bash
npm install better-auth
npm install @better-auth/supabase-adapter
```

**2. Configure Better Auth:**
```typescript
// app/lib/auth.server.ts
import { betterAuth } from 'better-auth';
import { supabaseAdapter } from '@better-auth/supabase-adapter';

export const auth = betterAuth({
  database: supabaseAdapter({
    url: process.env.SUPABASE_URL!,
    key: process.env.SUPABASE_SERVICE_KEY!, // Service key (server-only)
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Enable in production
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
});
```

**3. Create Auth Routes:**
```typescript
// app/routes/auth.$.tsx
import { auth } from '@/lib/auth.server';

export async function loader({ request }: LoaderFunctionArgs) {
  return auth.handler(request);
}

export async function action({ request }: ActionFunctionArgs) {
  return auth.handler(request);
}
```

### Environment Variables

**Local (.env.local):**
```bash
# Supabase (from `supabase start` output)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Better Auth
BETTER_AUTH_SECRET=xxx # Generate with: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:5173
```

**Staging (Vercel):**
```bash
SUPABASE_URL=https://xxx.supabase.co # Staging project
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

BETTER_AUTH_SECRET=xxx # Same as prod (or separate)
BETTER_AUTH_URL=https://poker-sense-staging.vercel.app
```

**Production (Vercel):**
```bash
SUPABASE_URL=https://yyy.supabase.co # Prod project
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

BETTER_AUTH_SECRET=xxx # Strong secret (32+ chars)
BETTER_AUTH_URL=https://poker-sense.vercel.app
```

### CI/CD Pipeline

**GitHub Actions (Optional - Vercel handles automatically):**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main, staging]
  pull_request:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
      # Vercel auto-deploys, but can trigger manually:
      # - run: vercel deploy --prod
      #   if: github.ref == 'refs/heads/main'
```

**Vercel Auto-Deploy (Default):**
- **Push to `main`:** Auto-deploy to production
- **Push to `staging`:** Auto-deploy to staging
- **Open PR:** Create preview deployment

### Monitoring & Logging

**Vercel Logs:**
- Access via Vercel Dashboard → Functions → Logs
- Search by function, time range, status code
- Real-time log streaming

**Supabase Dashboard:**
- Database queries (slow queries, errors)
- RLS policy evaluation
- Storage usage, bandwidth
- API request logs

**Future Additions (Phase 6):**
- **Error Tracking:** Sentry for production errors
- **Analytics:** Vercel Analytics for web vitals
- **Uptime Monitoring:** BetterStack or UptimeRobot

### Scaling Considerations

**Free Tier Limits:**
- **Vercel Bandwidth:** 100 GB/month → ~10k MAU (10 MB/user)
- **Supabase Database:** 500 MB → ~10k users + game history
- **Supabase API:** Unlimited (fair use)

**Scaling Triggers:**
- **Vercel:** Upgrade to Pro ($20/month) for 1 TB bandwidth
- **Supabase:** Upgrade to Pro ($25/month) for 8 GB database, no inactivity pause

**Cost Projection (10k → 100k users):**
- **Vercel Pro:** $20/month (1 TB bandwidth)
- **Supabase Pro:** $25/month (8 GB database)
- **Total:** $45/month for 100k MAU (acceptable if revenue > $100/month)

## Related Decisions

- [ADR 001: Tech Stack Selection](./001-tech-stack.md) - React Router v7, Vite, shadcn/ui
- [ADR 004: State Management](./004-state-management.md) - Zustand for client state
- [ADR 005: Testing Strategy](./005-testing-strategy.md) - Vitest, Playwright
- [ADR 006: Game Engine Architecture](./006-game-engine.md) - Server-side implementation

## Links

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel React Router Deployment](https://vercel.com/docs/frameworks/react-router)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Better Auth Supabase Adapter](https://www.better-auth.com/docs/adapters/supabase)
- [Vercel Pricing](https://vercel.com/pricing)
- [Supabase Pricing](https://supabase.com/pricing)
