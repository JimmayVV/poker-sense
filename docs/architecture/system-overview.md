# System Overview

**Date:** 2025-11-08
**Status:** Complete
**Related ADRs:** [001](../decisions/001-tech-stack.md), [002](../decisions/002-deployment-platform.md), [005](../decisions/005-game-engine-architecture.md)

## High-Level Architecture

Poker-Sense is a full-stack TypeScript application with server-side game logic, client-side React UI, and Supabase backend.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
├─────────────────────────────────────────────────────────────────┤
│  React Router v7 App (SSR + Client Hydration)                   │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │  Routes (Pages)    │  │  UI Components     │                │
│  │  - /game           │  │  - PokerTable      │                │
│  │  - /training       │  │  - Cards, Chips    │                │
│  │  - /dashboard      │  │  - HandHistory     │                │
│  └────────────────────┘  └────────────────────┘                │
│  ┌────────────────────────────────────────────────────┐        │
│  │  Client State (Zustand)                             │        │
│  │  - UI state (modals, animations)                    │        │
│  │  - User preferences                                 │        │
│  │  - Training progress (cached)                       │        │
│  └────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              ▲ │
                              │ │ HTTPS
                              │ ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER (Vercel Edge)                        │
├─────────────────────────────────────────────────────────────────┤
│  React Router v7 Loaders & Actions (Serverless Functions)       │
│  ┌────────────────────────────────────────────────────┐        │
│  │  API Routes                                         │        │
│  │  - GET  /api/game/:id        (load game state)     │        │
│  │  - POST /api/game/:id/action (apply player action) │        │
│  │  - GET  /api/training/scenarios                     │        │
│  │  - POST /api/training/submit                        │        │
│  └────────────────────────────────────────────────────┘        │
│  ┌────────────────────────────────────────────────────┐        │
│  │  Game Engine (Pure Functions)                       │        │
│  │  - applyAction(state, action) → newState           │        │
│  │  - evaluateHand(cards) → ranking                   │        │
│  │  - calculatePots(players) → potDistribution        │        │
│  │  - validateAction(state, action) → valid/invalid   │        │
│  └────────────────────────────────────────────────────┘        │
│  ┌────────────────────────────────────────────────────┐        │
│  │  Training System                                    │        │
│  │  - Scenario engine (generate training hands)       │        │
│  │  - Feedback analyzer (evaluate decisions)          │        │
│  │  - Progress tracker                                 │        │
│  └────────────────────────────────────────────────────┘        │
│  ┌────────────────────────────────────────────────────┐        │
│  │  Authentication (Better Auth)                       │        │
│  │  - Session management                               │        │
│  │  - JWT tokens                                       │        │
│  └────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              ▲ │
                              │ │ Supabase Client
                              │ ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (Supabase Postgres)                  │
├─────────────────────────────────────────────────────────────────┤
│  Tables:                                                         │
│  - games (current game state, JSON)                             │
│  - game_events (action log, replay capability)                  │
│  - players (user profiles, chip counts)                         │
│  - training_scenarios (pre-defined training hands)              │
│  - user_progress (training stats, analytics)                    │
│  - hand_history (completed hands, showdown results)             │
│                                                                  │
│  Row-Level Security (RLS):                                       │
│  - Users can only read their own games                          │
│  - Server can write all game data (service role key)            │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### Client Layer (React Router v7 App)

**Responsibilities:**
- Render UI components (poker table, cards, chips)
- Handle user interactions (clicks, swipes)
- Display game state updates (from server)
- Manage UI state (modals, animations, tooltips)
- Cache training progress locally

**Key Technologies:**
- React Router v7 (framework mode, SSR)
- Vite (bundler, dev server)
- Tailwind CSS (styling)
- shadcn/ui (component library)
- Zustand (client state management)

**Data Flow:**
1. User clicks "Call" button
2. Client sends POST to `/api/game/:id/action`
3. Server responds with new game state
4. Client updates UI to show new state

**Security Posture:**
- Zero game logic on client (prevents cheating)
- Only displays what server tells it
- Cannot calculate odds, hand strength, or pot size
- Authentication via Better Auth tokens

### Server Layer (React Router Actions)

**Responsibilities:**
- Process player actions
- Execute game engine logic
- Validate all actions server-side
- Persist game state to database
- Generate training scenarios
- Calculate analytics

**Key Technologies:**
- React Router v7 loaders/actions (serverless functions)
- TypeScript strict mode
- Zod (runtime validation)
- Supabase client (database access)
- Better Auth (authentication)

**Data Flow:**
1. Receive player action from client
2. Load current game state from database
3. Validate action is legal
4. Apply action via game engine (pure function)
5. Persist new state + event to database
6. Return new state to client

**Security Posture:**
- All game logic server-side only
- Validate every action (never trust client)
- RNG is cryptographically secure
- Database access via service role (bypasses RLS)
- Environment secrets in Vercel

### Database Layer (Supabase)

**Responsibilities:**
- Persist game state (current state + event log)
- Store user profiles and chip counts
- Track training progress and analytics
- Maintain hand history for review

**Key Technologies:**
- PostgreSQL (relational database)
- Row-Level Security (RLS policies)
- Real-time subscriptions (for multiplayer)
- Stored procedures (complex queries)

**Data Flow:**
1. Server writes new game state (JSON)
2. Server appends event to event log
3. Client subscribes to game state changes (real-time)
4. Database triggers update notifications

**Security Posture:**
- RLS policies prevent users from accessing others' games
- Server uses service role key (bypasses RLS)
- No sensitive data in client-visible columns
- Encrypted at rest (Supabase default)

## System Layers

### Presentation Layer
- **Components:** React functional components (TypeScript)
- **Styling:** Tailwind CSS utility classes
- **State:** Zustand stores for UI state
- **Routing:** React Router v7 file-based routes

### Application Layer
- **API Routes:** React Router loaders/actions (serverless)
- **Business Logic:** Game engine, training system
- **Authentication:** Better Auth middleware
- **Validation:** Zod schemas for all inputs

### Domain Layer
- **Game Engine:** Pure functions (state machine)
- **Training System:** Scenario generation, feedback
- **Analytics:** Progress tracking, performance metrics

### Data Layer
- **ORM:** Prisma (type-safe database client)
- **Database:** Supabase PostgreSQL
- **Caching:** React Router loaders (HTTP caching)

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend Framework** | React Router v7 | SSR, routing, server actions |
| **Bundler** | Vite | Fast builds, HMR |
| **Language** | TypeScript (strict) | Type safety |
| **UI Components** | shadcn/ui + Radix | Accessible components |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **State Management** | Zustand | Client state |
| **Forms** | React Hook Form + Zod | Type-safe forms |
| **Database** | Supabase (PostgreSQL) | Data persistence |
| **ORM** | Prisma | Type-safe queries |
| **Auth** | Better Auth | Authentication |
| **Deployment** | Vercel | Edge functions, CDN |
| **Testing** | Vitest | Unit/integration tests |
| **E2E Testing** | Playwright | End-to-end tests |

## Data Flow Examples

### Game Action Flow

```
User clicks "Raise $50"
    │
    ▼
Client validates UI state (has enough chips?)
    │
    ▼
POST /api/game/abc123/action { type: 'RAISE', amount: 50 }
    │
    ▼
Server: Load game state from DB
    │
    ▼
Server: Validate action (is it player's turn? legal raise?)
    │
    ▼
Server: Apply action via game engine (pure function)
    │   state' = applyAction(state, playerId, action, rng)
    │
    ▼
Server: Persist new state + event to database
    │   - UPDATE games SET state = state'
    │   - INSERT INTO game_events ...
    │
    ▼
Server: Return new state { status: 'FLOP', pot: 150, ... }
    │
    ▼
Client: Update UI to show new game state
    │   - Animate chips to pot
    │   - Deal flop cards
    │   - Highlight next player
```

### Training Scenario Flow

```
User clicks "Start Training" → "Position Training"
    │
    ▼
GET /api/training/scenarios?mode=position
    │
    ▼
Server: Generate scenario (random hand, position, stacks)
    │   scenario = generatePositionScenario(difficulty)
    │
    ▼
Server: Return scenario { position: 'BTN', hand: ['Ah', 'Kd'], ... }
    │
    ▼
Client: Display poker table with scenario
    │
    ▼
User makes decision (Fold / Call / Raise)
    │
    ▼
POST /api/training/submit { scenarioId, decision }
    │
    ▼
Server: Evaluate decision (correct strategy?)
    │   feedback = analyzeDecision(scenario, decision)
    │
    ▼
Server: Update user progress in database
    │   - Increment scenarios_completed
    │   - Track accuracy by position
    │
    ▼
Server: Return feedback { correct: true, explanation: "...", stats: ... }
    │
    ▼
Client: Show feedback modal, update progress bar
```

### Real-Time Multiplayer Flow (Future)

```
Player A makes action
    │
    ▼
Server: Update game state in database
    │
    ▼
Supabase: Trigger real-time notification
    │
    ▼
Players B-F: Receive state update via WebSocket
    │
    ▼
Clients: Update UI to reflect new state
```

## External Dependencies

### Production Dependencies
- **Vercel:** Hosting, serverless functions, CDN
- **Supabase:** PostgreSQL database, real-time, auth
- **Better Auth:** Authentication provider
- **Cloudflare (optional):** CDN, DDoS protection

### Development Dependencies
- **GitHub:** Source control, CI/CD (Actions)
- **Playwright Cloud:** E2E test runner
- **Sentry (optional):** Error tracking

### Third-Party Services (None)
- No external poker APIs
- No third-party card images (custom SVG)
- No analytics services (self-hosted)

## Security Model

### Client Security
- **Zero Trust:** Never trust client inputs
- **No Game Logic:** Client cannot calculate anything
- **Read-Only State:** Client receives game state, cannot modify
- **Authentication:** JWT tokens in HTTP-only cookies

### Server Security
- **Server-Side Logic:** All game rules enforced server-side
- **Action Validation:** Every action validated before applying
- **RNG Security:** Cryptographically secure random number generator
- **Rate Limiting:** Prevent action spam (Vercel edge config)

### Database Security
- **RLS Policies:** Users can only access their own data
- **Service Role:** Server bypasses RLS with service key
- **Environment Secrets:** API keys in Vercel environment variables
- **Encrypted at Rest:** Supabase default encryption

### Network Security
- **HTTPS Only:** All traffic encrypted
- **CORS:** Strict origin policies
- **CSRF Protection:** Better Auth built-in protection

## Performance Characteristics

### Client Performance
- **Initial Load:** <2s on 3G mobile
- **Bundle Size:** <150kb gzipped (React Router + shadcn/ui)
- **Interactive:** <1s to first interaction
- **Animations:** 60fps on mobile (CSS transforms)

### Server Performance
- **Action Latency:** <100ms (game engine + database)
- **Cold Start:** <500ms (Vercel edge functions)
- **Database Query:** <50ms (Supabase, indexed queries)
- **Hand Evaluation:** <1ms (O(1) lookup table)

### Database Performance
- **Read Latency:** <20ms (Supabase co-located with Vercel)
- **Write Latency:** <30ms (single transaction)
- **Real-Time Latency:** <100ms (WebSocket update)

## Scalability

### Current Architecture (Free Tier)
- **Concurrent Users:** ~100 active games simultaneously
- **Request Rate:** 1000 requests/minute (Vercel free tier)
- **Database Size:** 500MB (Supabase free tier)
- **Bandwidth:** 100GB/month (Vercel free tier)

### Scaling Strategy (If Needed)
1. **Vertical:** Upgrade Vercel/Supabase tiers
2. **Caching:** Add Redis for hot game state
3. **CDN:** Serve static assets from edge
4. **Database:** Read replicas for analytics queries
5. **Real-Time:** Separate WebSocket server (Ably, Pusher)

## Deployment Pipeline

```
Developer commits to main branch
    │
    ▼
GitHub Actions: Run tests (Vitest + Playwright)
    │
    ▼
Tests pass? → Vercel: Deploy to staging environment
    │
    ▼
Manual QA on staging
    │
    ▼
Promote to production (Vercel dashboard or CLI)
    │
    ▼
Production live (zero downtime)
```

## Environment Configuration

### Local Development
- `.env.local` for secrets (gitignored)
- Supabase local development instance (optional)
- Vite dev server on `http://localhost:5173`

### Staging Environment
- Vercel preview deployment (PR-based)
- Supabase staging database
- Test data seeded

### Production Environment
- Vercel production deployment
- Supabase production database
- Environment variables in Vercel dashboard

## Monitoring & Observability

### Metrics (Phase 7)
- **Client Metrics:** Vercel Analytics (Web Vitals)
- **Server Metrics:** Vercel function logs
- **Database Metrics:** Supabase dashboard
- **Error Tracking:** Console logs (Sentry optional)

### Logging
- **Client Errors:** Captured and sent to server
- **Server Errors:** Vercel function logs
- **Audit Trail:** game_events table (every action logged)

### Alerts
- **Deployment Failures:** GitHub Actions notifications
- **High Error Rate:** Vercel alerts (if configured)
- **Database Issues:** Supabase alerts

## Development Workflow

### Local Development
```bash
npm run dev          # Start Vite dev server
npm run typecheck    # Check TypeScript
npm test             # Run Vitest tests
npm run test:e2e     # Run Playwright tests
```

### Testing
- **Unit Tests:** Vitest (game engine, training system)
- **Integration Tests:** Vitest (API routes)
- **E2E Tests:** Playwright (user flows)
- **Coverage Target:** 95%+ overall, 100% game engine

### Deployment
```bash
git push origin main              # Auto-deploys to staging
vercel --prod                     # Deploy to production
```

## Architecture Principles

### Server-Side First
- Game logic lives server-side (security requirement)
- Client is thin presentation layer
- Server is source of truth

### Pure Functions
- Game engine is pure functions (deterministic, testable)
- No side effects in business logic
- Immutable state updates

### Type Safety
- TypeScript strict mode everywhere
- Zod validation at runtime (API boundaries)
- Discriminated unions for state machines

### Mobile-First
- Optimize bundle size (tree-shaking)
- Minimize network requests (batch updates)
- Fast animations (CSS transforms)

### Testability
- 100% coverage on game engine
- Pure functions easy to test
- Deterministic RNG for testing

### Progressive Enhancement
- Works without JavaScript (SSR)
- Enhances with client-side hydration
- Graceful degradation on slow networks

## Future Enhancements

### Phase 8+ (Post-MVP)
- **Multi-Table Tournaments:** Real tournament structures
- **Real-Time Multiplayer:** Live games with other players
- **AI Opponents:** Bot players for practice
- **Hand Replayer:** Review past hands with analysis
- **Leaderboards:** Global/friend rankings
- **Mobile App:** React Native wrapper (optional)

### Technical Debt to Address
- [ ] Add Redis caching for hot game state
- [ ] Implement WebSocket for real-time updates
- [ ] Add Sentry for error tracking
- [ ] Optimize database indexes based on query patterns
- [ ] Add CDN for static assets (Cloudflare)
- [ ] Implement rate limiting per user
- [ ] Add database backups and point-in-time recovery

## Related Documentation

- [Component Architecture](./component-architecture.md) - Detailed component breakdown
- [Database Schema](./database-schema.md) - Database design
- [ADR 001: Tech Stack](../decisions/001-tech-stack.md)
- [ADR 005: Game Engine](../decisions/005-game-engine-architecture.md)
