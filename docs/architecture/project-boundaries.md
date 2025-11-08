# Project Boundaries

> **Status:** Defined in Phase 1 (Issue #8)
> **Last Updated:** 2025-11-08

## Overview

This document defines what IS and IS NOT in scope for the Texas Hold'em trainer MVP. Clear boundaries ensure focused development, realistic timelines, and successful delivery within constraints (9 weeks, solo developer, free tier infrastructure).

---

## In Scope (MVP)

### Core Gameplay

**Tournament-Style Poker Gameplay:**
- **Format:** Single-table Sit-n-Go tournaments (MVP), with architecture supporting multi-table expansion
- **Table Size:** 6-max (6 players per table)
- **Players:** 1 human + 5 AI opponents per game
- **Game Type:** No-Limit Texas Hold'em
- **Blind Structure:** Standard 2-level blinds (small blind / big blind), no antes for MVP
- **Starting Stack:** 1,500 chips (standard)
- **Tournament Duration:** ~10-20 minutes per game
- **Elimination:** Players eliminated when they lose all chips
- **Winner:** Last player standing wins the tournament

**Why Single-Table for MVP?**
Multi-table tournaments (MTT) require table consolidation logic, complex player redistribution, and synchronized state management across tables. Starting with single-table sit-n-go tournaments allows us to perfect the core game engine, training system, and UX before adding MTT complexity in post-MVP phases.

**Database Architecture:**
Supports multi-table tournaments (schema includes `games` → `players` relationships), but MVP implementation focuses on single-table gameplay.

---

### Training System

**4 Training Modes (All Required for MVP):**

1. **Hand Strength Recognition**
   - Evaluate pre-flop hand strength (starting hands)
   - Post-flop hand strength relative to board
   - Rank holdings (pairs, draws, made hands)
   - **Learning Goal:** Recognize when you have a strong/weak hand

2. **Odds Calculation**
   - Calculate pot odds
   - Estimate drawing odds (outs, % to improve)
   - Expected Value (EV) of calls/bets
   - **Learning Goal:** Make mathematically correct decisions

3. **Position & Strategy**
   - Early/middle/late position play
   - Positional advantage concepts
   - Aggression based on position
   - **Learning Goal:** Play tighter early position, wider late position

4. **Opponent Modeling**
   - Identify player types (tight/loose, passive/aggressive)
   - Adjust strategy to opponent tendencies
   - Read betting patterns
   - **Learning Goal:** Exploit opponent weaknesses

**Scenario Requirements:**
- **Minimum:** 20 scenarios across all 4 modes (5 per mode)
- **Target:** 25-30 scenarios for MVP
- **Difficulty Levels:** Beginner, Intermediate, Advanced (progressive difficulty)
- **Feedback:** Immediate explanation after each decision
- **Scoring:** Accuracy percentage, decision time, performance trends

---

### User Features

**Authentication:**
- Email/password authentication via Better Auth
- Session management (cookie-based)
- Password reset flow
- **No social login in MVP** (Google/GitHub deferred to post-MVP)

**Progress Tracking:**
- Track scenario completion (per mode, per difficulty)
- Accuracy rate by mode
- Decision time metrics
- Overall performance score
- **Simple analytics dashboard** (charts showing progress over time)

**User Profile:**
- Username, email
- Avatar (placeholder only, no uploads for MVP)
- Stats: Games played, scenarios completed, win rate, accuracy

**Settings:**
- Account settings (email, password change)
- Basic preferences (sound on/off)
- **No advanced customization** (card backs, table themes deferred)

---

### Technical Requirements

**Platforms:**
- **Mobile-first responsive web app** (iOS Safari, Android Chrome)
- Desktop support (Chrome, Firefox, Safari)
- **No native apps** (React Native, Swift, Kotlin out of scope)

**Performance Targets:**
- Initial load: < 3 seconds on 3G
- JavaScript bundle: < 150kb (gzipped)
- Time to interactive: < 2 seconds on 3G
- 60 FPS gameplay animations
- Lighthouse Mobile Score: 90+

**Browser Support:**
- Chrome 100+
- Safari 15+ (iOS 15+)
- Firefox 100+
- Edge 100+
- **No IE11** (end of life)

**Security:**
- Server-side game logic only (prevents cheating/reverse engineering)
- Input validation on all forms
- Supabase Row-Level Security (RLS) policies
- Better Auth session management
- **No client-side hand evaluation** (security critical)

**Test Coverage:**
- Game engine: **100%** (non-negotiable)
- Training logic: **90%+**
- UI components: **70%+**
- Overall: **95%+ target**

---

### Deployment

**Infrastructure:**
- Vercel (frontend/framework hosting)
- Supabase (Postgres database, auth integration)
- **Free tier only** (no paid plans)

**Environments:**
- Production (main branch)
- Preview deployments (pull requests)
- Local development (Docker Postgres or Supabase local CLI)

**Monitoring:**
- Vercel Analytics (basic traffic metrics)
- Error logging (console.error, structured logs)
- **No APM/Sentry in MVP** (deferred to Phase 6: Quality)

---

## Out of Scope (Deferred to Post-MVP)

### Gameplay Features

- **Multi-table tournaments (MTT):** Table consolidation, player redistribution, final tables
- **Cash games:** Non-tournament play with buy-ins/cash-outs
- **Tournament variants:** Rebuy, add-on, turbo, hyper-turbo structures
- **Alternative formats:** Omaha, Stud, other poker variants
- **Live multiplayer:** Human vs human gameplay (MVP is training only, AI opponents)
- **Replay/hand history:** Detailed hand review, export hand histories
- **Spectator mode:** Watch other games in progress

### Training Features

- **AI difficulty slider:** Adjustable opponent skill (MVP has fixed AI behavior per scenario)
- **Custom scenarios:** User-created training scenarios
- **Video tutorials:** Instructional videos embedded in training
- **Coaching tips:** Real-time hints during gameplay
- **GTO solver integration:** Game Theory Optimal recommendations
- **Advanced analytics:** Heat maps, range analysis, equity calculators
- **Spaced repetition:** Scenario recommendations based on performance

### Social Features

- **Leaderboards:** Global/friend rankings
- **Achievements/badges:** Gamification, unlockables
- **Friends system:** Add friends, compare stats
- **Chat:** In-game or global chat
- **Tournaments with prizes:** Real money or virtual currency prizes
- **Clubs/groups:** Community features

### User Features

- **Social login:** Google, GitHub, Apple, Discord OAuth
- **Profile customization:** Avatar uploads, card backs, table themes
- **Notifications:** Push notifications, email digests
- **Settings:** Advanced customization (animations, auto-muck, etc.)
- **Multi-language:** Internationalization (English-only for MVP)
- **Accessibility:** Screen reader support, high contrast mode (basic WCAG in MVP, advanced deferred)

### Technical Enhancements

- **Native mobile apps:** iOS/Android apps via React Native
- **Offline mode:** Play without internet connection
- **PWA features:** Install to home screen, background sync (basic PWA in MVP)
- **Real-time multiplayer:** WebSocket connections, live game updates
- **Advanced animations:** Framer Motion for card dealing, chip movements (basic CSS animations in MVP)
- **Performance optimizations:** Service workers, IndexedDB caching, edge functions
- **Advanced monitoring:** Sentry error tracking, PostHog analytics, session replay

### Content

- **50+ scenarios:** Expand to 50+ after MVP validation
- **Advanced difficulty:** Expert-level scenarios
- **Tournament series:** Multi-game tournament campaigns
- **Poker theory articles:** Educational content library

---

## Constraints

### Budget Constraints

**Infrastructure:**
- **Vercel Free Tier Limits:**
  - 100 GB-hours compute per month
  - 100 GB bandwidth per month
  - 10 second function execution limit
  - 1 GB memory per function
  - No Vercel Pro features (analytics, DDoS protection)

- **Supabase Free Tier Limits:**
  - 500 MB database storage
  - 1 GB file storage
  - 50,000 monthly active users (MAU)
  - 2 GB data transfer
  - No daily backups

**Impact:**
- Must optimize database queries (indexing critical)
- Bundle size optimization critical (mobile performance)
- No CDN for assets (use Vercel edge network)
- Manual database backups required

**Acceptable Trade-offs:**
- No premium fonts (use system fonts or Google Fonts)
- No stock photos (use CSS-generated card/chip graphics)
- No video hosting (defer tutorials)
- No email service (use Supabase SMTP for transactional email)

---

### Timeline Constraints

**Total Duration:** 9 weeks (November 8, 2025 - January 10, 2026)

**Phase Deadlines:**
- Phase 1 (BMAD): Nov 15 (7 days)
- Phase 2 (Foundation): Nov 22 (7 days)
- Phase 3 (Game Engine): Dec 6 (14 days)
- Phase 4 (AI Training): Dec 20 (14 days)
- Phase 5 (UX): Jan 3 (14 days)
- Phase 6 (Quality): Ongoing throughout
- Phase 7 (Deployment): Jan 10 (7 days)

**Developer Availability:**
- Solo developer
- **4-6 hours/day available** (after full-time job)
- ~25-35 hours/week
- ~225-315 hours total (aggressive timeline)

**Holiday Impact:**
- Dec 25 - Jan 1: Reduced availability
- Add buffer time to Phase 5/6

**Acceptable Trade-offs:**
- Focus on core features, defer polish
- Use existing libraries over custom implementations
- Prioritize test coverage over documentation
- Simple UI over elaborate animations
- MVP-first mindset: ship, iterate, improve

---

### Technical Constraints

**Development:**
- Solo developer (no code review, pair programming limited)
- No dedicated QA team (self-testing, CI/CD critical)
- No designer (use shadcn/ui defaults, simple aesthetics)
- Limited poker domain expertise (research required)

**Performance:**
- Mobile-first (slower devices, 3G networks)
- Free tier function limits (10s execution, 1 GB memory)
- Bundle size critical (< 150kb target)
- No CDN for assets (Vercel edge caching only)

**Security:**
- No penetration testing budget
- No security audit
- Rely on framework/library security (Better Auth, Supabase RLS)
- Basic input validation (Zod schemas)

**Testing:**
- No manual QA team (automated tests critical)
- Limited E2E test coverage (focus on critical paths)
- No device farm (test on personal devices)
- No browser testing service (local Chrome/Safari/Firefox)

**Acceptable Trade-offs:**
- Basic security (no advanced threat detection)
- Standard framework protections (no custom auth)
- Automated testing over manual QA
- Focus on happy path E2E tests

---

### Legal/Compliance Constraints

**Gambling Regulations:**
- **No real money:** Play money only, no cash prizes
- **No gambling license required:** Training application, not gambling platform
- **Age restriction:** 18+ recommended (no enforcement in MVP)
- Clear disclaimer: "For entertainment and training purposes only"

**Data Privacy:**
- **GDPR compliance:** Basic compliance (user can delete account, export data)
- **No data selling:** User data not shared with third parties
- **Minimal data collection:** Email, username, game stats only
- **Cookie consent:** Simple banner (Better Auth cookies disclosed)

**Terms of Service:**
- **Basic T&C:** Standard terms for web application use
- **Privacy Policy:** Simple policy (Supabase/Vercel data handling disclosed)
- **No legal review budget:** Use templates, best-effort compliance

**Content Rating:**
- Poker content (simulated gambling)
- No graphic content
- No chat (avoids moderation issues)
- Safe for 18+ audience

**Acceptable Trade-offs:**
- No formal legal review (rely on templates)
- Basic GDPR compliance (no DPO, no formal audit)
- Simple T&C (no custom contract law)
- Self-certify age restriction (no ID verification)

---

## Open Questions & Decisions

### Resolved Decisions

1. **Tournament Format:**
   - **Decision:** Single-table Sit-n-Go for MVP, architecture supports MTT expansion
   - **Rationale:** Simpler implementation, validates core gameplay, allows focus on training system

2. **Table Size:**
   - **Decision:** 6-max (6 players per table)
   - **Rationale:** Balance between realistic gameplay (not heads-up) and faster games (not full 9-max)

3. **AI Opponent Count:**
   - **Decision:** 5 AI opponents (6 players total including human)
   - **Rationale:** Full 6-max table experience

4. **Scenario Count:**
   - **Decision:** 20 minimum, 25-30 target for MVP
   - **Rationale:** 5+ scenarios per mode, enough variety for training validation

5. **Authentication:**
   - **Decision:** Email/password only for MVP
   - **Rationale:** Simpler implementation, social login deferred to post-MVP

6. **Analytics Depth:**
   - **Decision:** Simple dashboard (accuracy, completion, trends)
   - **Rationale:** Basic analytics sufficient for MVP validation, advanced features deferred

7. **Real-time Updates:**
   - **Decision:** Polling for MVP (no WebSockets/Supabase Realtime)
   - **Rationale:** AI opponents only in MVP, real-time not critical, defer complexity

8. **Customization:**
   - **Decision:** No card backs, table themes, avatars in MVP
   - **Rationale:** Focus on core gameplay and training, cosmetics deferred

---

### Deferred Questions (Post-MVP)

1. **Monetization Strategy:**
   - Freemium model? Premium scenarios? Ads?
   - **Decision:** Defer until MVP validation, affects architecture

2. **Multi-table Tournament Details:**
   - Table consolidation algorithm? Blind schedule? Prize structure?
   - **Decision:** Defer to post-MVP Phase 8

3. **AI Sophistication:**
   - Advanced GTO AI? Machine learning opponents?
   - **Decision:** MVP uses rule-based AI, defer ML to post-MVP

4. **Live Multiplayer:**
   - Human vs human gameplay? Matchmaking?
   - **Decision:** Training focus for MVP, defer multiplayer

5. **Content Expansion:**
   - 50+ scenarios? Video tutorials? Theory articles?
   - **Decision:** 20-30 scenarios validates MVP, expand if successful

6. **Platform Expansion:**
   - Native iOS/Android apps? Desktop app?
   - **Decision:** Web-first for MVP, evaluate after launch

---

## Success Criteria (MVP)

### Functional Requirements

- [ ] User can create account (email/password)
- [ ] User can play complete 6-max Sit-n-Go tournament (1 human + 5 AI)
- [ ] User can access all 4 training modes
- [ ] User can complete at least 20 different training scenarios
- [ ] User receives immediate feedback after scenario decisions
- [ ] User can view progress analytics dashboard
- [ ] User can change account settings (email, password)
- [ ] Game logic is 100% server-side (client cannot cheat)
- [ ] All 4 training modes provide meaningful learning outcomes

### Performance Requirements

- [ ] Initial page load < 3 seconds on 3G
- [ ] JavaScript bundle < 150kb (gzipped)
- [ ] 60 FPS gameplay animations
- [ ] Lighthouse Mobile Score 90+
- [ ] No runtime errors in production
- [ ] Function execution < 10 seconds (Vercel limit)

### Quality Requirements

- [ ] Game engine: 100% test coverage
- [ ] Training logic: 90%+ test coverage
- [ ] UI components: 70%+ test coverage
- [ ] Overall: 95%+ test coverage
- [ ] All critical E2E paths tested (signup, game, training scenario)
- [ ] No P0 bugs (crashes, data loss, security issues)
- [ ] Mobile-responsive on iOS Safari + Android Chrome

### User Experience Requirements

- [ ] User can complete first training scenario within 2 minutes of signup
- [ ] User understands training feedback (clear explanations)
- [ ] User can navigate app without confusion (intuitive UX)
- [ ] User experiences < 1 second latency on actions (responsive)
- [ ] User sees progress visually (charts, percentages, completion status)

### Business Requirements

- [ ] App deployed to production (public URL)
- [ ] Stays within free tier limits (Vercel + Supabase)
- [ ] No P0 security vulnerabilities (manual review + automated tools)
- [ ] Basic T&C and Privacy Policy published
- [ ] MVP validates core concept (5+ users can complete training scenarios)

---

## Scope Change Process

### How to Propose Scope Changes

1. **Identify Change:**
   - New feature request
   - Constraint change (budget, timeline)
   - Technical blocker (cannot implement as planned)

2. **Assess Impact:**
   - Timeline impact (adds how many days?)
   - Budget impact (requires paid tier?)
   - Technical complexity (affects other features?)
   - Priority (must-have vs nice-to-have)

3. **Make Decision:**
   - **Add to MVP:** Only if critical for validation, timeline allows
   - **Defer to Post-MVP:** If not critical, add to Phase 8 backlog
   - **Reject:** If out of scope or not aligned with goals

4. **Update Documentation:**
   - Update this document (In Scope / Out of Scope)
   - Update roadmap (Phase timelines)
   - Update related ADRs if architectural impact

### Scope Creep Prevention

**Discipline:**
- Stick to "must-have" mindset
- Defer polish to post-MVP
- Use MVP success criteria as gatekeeper
- Remember: 9 weeks is aggressive, focus is critical

**Red Flags:**
- "While we're at it, let's add..."
- "It would be cool if..."
- "This should be easy to add..."
- "Users probably expect..."

**Mantras:**
- "Is this critical for MVP validation?"
- "Can we validate the concept without this?"
- "Can we add this in Phase 8?"
- "Does this block other features?"

---

## Related Documentation

- [Core Assumptions](./assumptions.md) - Assumptions about users, usage, and technology
- [Development Roadmap](../development/roadmap.md) - Phase-by-phase plan
- [ADR 001: Tech Stack](../decisions/001-tech-stack.md) - Technical constraints
- [ADR 003: State Management](../decisions/003-state-management.md) - State architecture
- [ADR 005: Game Engine Architecture](../decisions/005-game-engine.md) - Game logic constraints
- [GitHub Issues](https://github.com/JimmayVV/poker-sense/issues) - All feature requests and bugs

---

## Changelog

- **2025-11-08:** Initial boundaries defined (Issue #8, Phase 1)
  - Single-table Sit-n-Go for MVP
  - 6-max table size
  - 20-30 scenarios target
  - Email/password auth only
  - Free tier constraints documented
  - Success criteria defined
