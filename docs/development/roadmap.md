# Development Roadmap

> **Status:** Defined in Phase 1 (Issue #10)
> **Last Updated:** 2025-11-08

## Overview

This roadmap details the 7-phase development plan for poker-sense MVP, from initial planning (Phase 1) through production deployment (Phase 7). Timeline: November 8, 2025 - January 10, 2026 (9 weeks). Solo developer, 4-6 hours/day.

**Timeline:** 9 weeks total
**Target Launch:** January 10, 2026
**Development Model:** Agile/iterative with TDD
**Deployment:** Continuous deployment to Vercel (staging + production)

---

## Phase Summary

| Phase | Name | Duration | Dates | Status |
|-------|------|----------|-------|--------|
| 1 | BMAD Framework & Planning | 7 days | Nov 8-15 | ✅ **COMPLETE** |
| 2 | Foundation & Setup | 7 days | Nov 15-22 | Pending |
| 3 | Game Engine | 14 days | Nov 22-Dec 6 | Pending |
| 4 | Training System | 14 days | Dec 6-20 | Pending |
| 5 | UI/UX | 14 days | Dec 20-Jan 3 | Pending |
| 6 | Quality & Testing | Ongoing | Nov 15-Jan 3 | Ongoing |
| 7 | Deployment & Launch | 7 days | Jan 3-10 | Pending |

---

## Phase 1: BMAD Framework & Planning ✅

**Duration:** Nov 8-15, 2025 (7 days)
**Status:** **COMPLETE**
**Goal:** Lock all architectural decisions to unblock development

### Deliverables ✅
- [x] ADR 001: Tech Stack Selection (React Router v7, shadcn/ui, Vitest)
- [x] ADR 002: Deployment Platform (Vercel + Supabase)
- [x] ADR 003: State Management (Zustand + Context)
- [x] ADR 004: Testing Strategy (Vitest + Playwright)
- [x] ADR 005: Game Engine Architecture (State Machine + Event Log)
- [x] Project Boundaries (scope, constraints, success criteria)
- [x] Core Assumptions (30+ assumptions documented)
- [x] Development Roadmap (this document)
- [x] System Overview (architecture, components)
- [x] Component Architecture (game engine, training system)
- [x] Database Schema (initial design)
- [x] Data Flow Documentation (5 flow patterns)

### Outcome ✅
All architectural decisions locked. Phase 2 unblocked.

---

## Phase 2: Foundation & Setup

**Duration:** Nov 15-22, 2025 (7 days)
**Goal:** Development environment ready, project scaffold complete
**Dependencies:** Phase 1 complete

### Week 3 Tasks (Nov 15-22)

#### Day 1-2: Project Initialization
- [ ] Initialize React Router v7 project with Vite
- [ ] Configure TypeScript (strict mode, path aliases)
- [ ] Set up ESLint + Prettier + Husky
- [ ] Configure Tailwind CSS
- [ ] Install shadcn/ui (button, card, dialog)
- [ ] Create project structure (`/app`, `/config`, `/tests`)
- [ ] Initialize git repository (already done)

#### Day 3-4: Development Infrastructure
- [ ] Set up Vitest (unit/integration testing)
- [ ] Set up Playwright (E2E testing)
- [ ] Configure test coverage thresholds (100% game engine, 95% overall)
- [ ] Set up Supabase project (staging + production)
- [ ] Configure local Supabase CLI + Docker
- [ ] Create initial database schema (users, games, scenarios)
- [ ] Set up Better Auth with Supabase adapter

#### Day 5-6: Deployment Pipeline
- [ ] Connect GitHub to Vercel
- [ ] Configure Vercel environments (staging, production, preview)
- [ ] Set environment variables (Supabase URLs, Better Auth secrets)
- [ ] Create first deployment (hello world)
- [ ] Set up CI/CD pipeline (GitHub Actions: lint, test, build)
- [ ] Test deployment workflow (PR → preview, merge → production)

#### Day 7: Documentation & First Component
- [ ] Create development setup guide
- [ ] Document local development workflow
- [ ] Create first UI component (Button with tests)
- [ ] Verify TDD workflow (Red-Green-Refactor)
- [ ] Smoke test: app loads on mobile device

### Deliverables
- Working development environment (local + cloud)
- Project scaffolded (directory structure, configs)
- CI/CD pipeline operational
- First component with 100% test coverage
- Database schema deployed (staging + production)
- Better Auth configured and working

### Acceptance Criteria
- [ ] `npm run dev` starts local development server
- [ ] `npm test` runs Vitest tests
- [ ] `npm run test:e2e` runs Playwright tests
- [ ] `git push` triggers CI/CD pipeline
- [ ] Merge to main deploys to production
- [ ] Database migrations work (local → staging → production)
- [ ] User can sign up with email/password (Better Auth)

### Risks
- Supabase local CLI setup issues → Use Supabase cloud for development
- Better Auth integration complexity → Follow official docs closely
- Vercel deployment fails → Check environment variables, build logs

### Parallel Work
- Can work on UI components while CI/CD pipeline is setting up

---

## Phase 3: Game Engine

**Duration:** Nov 22-Dec 6, 2025 (14 days)
**Goal:** Complete, tested poker game engine (100% coverage)
**Dependencies:** Phase 2 complete

### Week 4 Tasks (Nov 22-29)

#### Day 1-3: Core Data Structures
- [ ] Implement Card type (rank, suit)
- [ ] Implement Deck (create, shuffle, deal)
- [ ] Test shuffling (chi-square distribution test)
- [ ] Implement Player type (id, chips, cards, position, status)
- [ ] Implement GameState type (players, pot, community cards, etc.)
- [ ] Write 50+ unit tests (TDD approach)

#### Day 4-7: Hand Evaluator (TDD)
- [ ] Design hand evaluation algorithm (7-card best hand)
- [ ] Build lookup table generator (perfect hash, ~130k entries)
- [ ] Implement hand ranking (royal flush → high card)
- [ ] Test all hand types (100+ test cases)
- [ ] Benchmark performance (< 1ms per hand)
- [ ] Write comprehensive tests (edge cases, ties)

### Week 5 Tasks (Nov 29-Dec 6)

#### Day 1-3: State Machine
- [ ] Implement state transitions (WAITING → DEALING → ... → COMPLETE)
- [ ] Implement `applyAction` (pure function, immutable state)
- [ ] Implement action validator (validate legal moves)
- [ ] Test all transitions (50+ tests)
- [ ] Test invalid actions (error handling)

#### Day 4-5: Pot Management
- [ ] Implement pot calculator (main pot + side pots)
- [ ] Handle all-in scenarios
- [ ] Implement split pots (tie scenarios)
- [ ] Test complex scenarios (multiple all-ins, splits)

#### Day 6-7: Integration & React Router Actions
- [ ] Create React Router action for player actions
- [ ] Integrate game engine with Supabase
- [ ] Implement event logging (game_events table)
- [ ] Test full game flow (E2E test: deal → betting → showdown)
- [ ] Verify 100% test coverage (fail build if < 100%)

### Deliverables
- Complete game engine (6-max No-Limit Hold'em)
- Hand evaluator (all hand types, ties)
- State machine (all transitions)
- Pot calculator (main pot, side pots, splits)
- React Router actions (integrate with server)
- Event log (auditability, replay)
- **100% test coverage** (non-negotiable)

### Acceptance Criteria
- [ ] Can deal a complete hand (deal cards, betting rounds, showdown)
- [ ] Hand evaluator correctly ranks all hand types
- [ ] Pot calculator handles all-ins, side pots, splits
- [ ] All actions validated server-side
- [ ] Game state persists to database
- [ ] Event log records all actions
- [ ] 100% test coverage on game engine
- [ ] All tests pass in CI/CD

### Risks
- Hand evaluator too slow → Optimize lookup table or use library
- Complex pot logic bugs → Extensive testing, reference implementations
- 100% coverage difficult → TDD from start, pair program if stuck

### Parallel Work
- Hand evaluator + pot calculator can be developed in parallel
- Can start UI mockups while engine is being built

---

## Phase 4: Training System

**Duration:** Dec 6-20, 2025 (14 days)
**Goal:** 4 training modes with 20-30 scenarios, immediate feedback
**Dependencies:** Phase 3 complete (game engine)

### Week 6 Tasks (Dec 6-13)

#### Day 1-3: Scenario Engine
- [ ] Design scenario data structure (Scenario type)
- [ ] Implement scenario generator (hand strength, odds, position, opponent)
- [ ] Create 5 scenarios per mode (20 total)
- [ ] Store scenarios in database (training_scenarios table)
- [ ] Implement scenario loader (fetch from Supabase)

#### Day 4-7: Training Modes
- [ ] **Hand Strength Recognition:** Pre-flop hand strength, post-flop relative strength
- [ ] **Odds Calculation:** Pot odds, drawing odds, outs
- [ ] **Position & Strategy:** Early/middle/late position play
- [ ] **Opponent Modeling:** Identify player types (tight/loose, passive/aggressive)
- [ ] Test each mode (10+ tests per mode)

### Week 7 Tasks (Dec 13-20)

#### Day 1-3: Feedback System
- [ ] Implement feedback analyzer (evaluate user decisions)
- [ ] Generate explanations (why correct/incorrect)
- [ ] Calculate accuracy percentage
- [ ] Track decision time
- [ ] Test feedback quality (user-friendly explanations)

#### Day 4-5: Progress Tracking
- [ ] Implement user_progress table (aggregate stats)
- [ ] Implement training_attempts table (individual attempts)
- [ ] Track completion rates by mode
- [ ] Track accuracy rates by mode
- [ ] Implement analytics dashboard (basic charts)

#### Day 6-7: Integration & Testing
- [ ] Integrate training system with React Router actions
- [ ] Create E2E test: Complete a training scenario
- [ ] Verify 90%+ test coverage on training logic
- [ ] Test all 20 scenarios (accuracy, feedback quality)
- [ ] User testing (internal): Complete 5 scenarios, gather feedback

### Deliverables
- Scenario engine (4 modes, 20-30 scenarios)
- Feedback system (immediate, actionable explanations)
- Progress tracking (completion, accuracy, decision time)
- Analytics dashboard (basic charts)
- 90%+ test coverage on training logic

### Acceptance Criteria
- [ ] User can access all 4 training modes
- [ ] User can complete at least 20 different scenarios
- [ ] User receives immediate feedback after each decision
- [ ] Feedback is clear and actionable
- [ ] User can view progress dashboard (completion, accuracy)
- [ ] 90%+ test coverage on training logic
- [ ] All E2E tests pass (scenario completion flow)

### Risks
- Scenario quality poor → User test early, iterate on feedback
- Feedback not actionable → Review with poker players
- Progress tracking complex → Start simple (basic stats), iterate

### Parallel Work
- Scenario creation + feedback system can be developed in parallel
- Can start UI design while building training logic

---

## Phase 5: UI/UX

**Duration:** Dec 20, 2025 - Jan 3, 2026 (14 days)
**Goal:** Mobile-first UI, responsive design, 70%+ component coverage
**Dependencies:** Phase 3 + 4 complete (game engine + training system)

### Week 8 Tasks (Dec 20-27)

#### Day 1-3: Core Game UI
- [ ] PokerTable component (responsive, mobile-first)
- [ ] Card component (suits, ranks, animations)
- [ ] PlayerSeat component (chips, cards, actions)
- [ ] ActionButtons component (fold, call, raise)
- [ ] Pot display, community cards, dealer button
- [ ] Test components (React Testing Library)

#### Day 4-7: Training UI
- [ ] TrainingScenario component (scenario display)
- [ ] FeedbackModal component (immediate feedback)
- [ ] ScenarioList component (browse scenarios)
- [ ] ModeSelector component (4 training modes)
- [ ] Test components (70%+ coverage)

### Week 9 Tasks (Dec 27-Jan 3)

#### Day 1-3: Analytics & Settings
- [ ] ProgressDashboard component (charts, stats)
- [ ] UserProfile component (username, email, stats)
- [ ] Settings component (account, preferences)
- [ ] Navigation component (mobile-friendly)
- [ ] Test components (70%+ coverage)

#### Day 4-5: Authentication UI
- [ ] Login/Signup forms (Better Auth)
- [ ] Password reset flow
- [ ] Protected routes (redirect to login)
- [ ] Session management (cookie-based)
- [ ] Test auth flows (E2E tests)

#### Day 6-7: Polish & Responsiveness
- [ ] Test on mobile devices (iOS Safari, Android Chrome)
- [ ] Fix responsive issues (320px-1920px width)
- [ ] Add loading states, error states
- [ ] Add animations (card dealing, chip movements)
- [ ] Lighthouse audit (90+ mobile score)
- [ ] Accessibility audit (WCAG 2.1 Level A minimum)

### Deliverables
- Complete UI (game, training, analytics, settings, auth)
- Mobile-first responsive design (320px+)
- Animations (card dealing, chip movements)
- 70%+ component test coverage
- Lighthouse 90+ mobile score
- Basic accessibility (WCAG Level A)

### Acceptance Criteria
- [ ] User can play a full 6-max Sit-n-Go on mobile
- [ ] User can complete training scenarios on mobile
- [ ] User can view analytics dashboard on mobile
- [ ] User can change settings on mobile
- [ ] UI works on iOS Safari + Android Chrome
- [ ] Lighthouse mobile score 90+
- [ ] 70%+ component test coverage
- [ ] Basic keyboard navigation works

### Risks
- Mobile performance issues → Optimize bundle, lazy load
- Responsive design complex → Test early on devices
- Animations janky → Use CSS animations, RequestAnimationFrame

### Parallel Work
- Can work on multiple components in parallel (game UI, training UI, dashboard)
- Can work on animations while core UI is being built

---

## Phase 6: Quality & Testing (Ongoing)

**Duration:** Nov 15, 2025 - Jan 3, 2026 (Ongoing throughout Phases 2-5)
**Goal:** 95%+ overall test coverage, no P0 bugs
**Dependencies:** Parallel with all development phases

### Ongoing Tasks

#### Unit Testing (Continuous)
- [ ] Write tests before code (TDD)
- [ ] Maintain 100% game engine coverage
- [ ] Maintain 90%+ training logic coverage
- [ ] Maintain 70%+ UI component coverage
- [ ] Run tests on every commit (pre-commit hook)

#### Integration Testing (Weekly)
- [ ] Test React Router loaders/actions
- [ ] Test Supabase integration
- [ ] Test Zustand stores
- [ ] Test Better Auth flows
- [ ] Run integration tests in CI/CD

#### E2E Testing (Weekly)
- [ ] Test critical paths (signup, game, training scenario)
- [ ] Test on mobile emulators (iOS Safari, Android Chrome)
- [ ] Test error scenarios (network errors, validation errors)
- [ ] Run E2E tests in CI/CD

#### Performance Testing (Weekly)
- [ ] Monitor bundle size (< 150kb target)
- [ ] Monitor Lighthouse scores (90+ mobile)
- [ ] Monitor Core Web Vitals (LCP, FID, CLS)
- [ ] Optimize slow components

#### Security Testing (Weekly)
- [ ] Review server-side validation
- [ ] Review Supabase RLS policies
- [ ] Check for SQL injection, XSS
- [ ] Review environment variable handling

### Deliverables
- 95%+ overall test coverage
- All E2E tests passing
- Lighthouse 90+ mobile score
- No P0 bugs (crashes, data loss, security issues)
- Performance targets met (< 3s load, < 1s latency)

### Acceptance Criteria
- [ ] 100% game engine coverage
- [ ] 90%+ training logic coverage
- [ ] 70%+ UI component coverage
- [ ] 95%+ overall coverage
- [ ] All E2E tests pass
- [ ] No P0 bugs
- [ ] Lighthouse 90+ mobile
- [ ] Bundle size < 150kb

### Risks
- Flaky tests → Fix immediately, don't ignore
- Low coverage → Enforce thresholds (fail build)
- Performance regressions → Monitor continuously

---

## Phase 7: Deployment & Launch

**Duration:** Jan 3-10, 2026 (7 days)
**Goal:** Production deployment, monitoring, post-launch support
**Dependencies:** Phases 2-6 complete

### Week 10 Tasks (Jan 3-10)

#### Day 1-2: Pre-Launch Checklist
- [ ] Final code review (all phases)
- [ ] Run full test suite (all tests pass)
- [ ] Run Lighthouse audit (90+ mobile)
- [ ] Test on real devices (iOS, Android)
- [ ] Review Supabase RLS policies
- [ ] Review environment variables
- [ ] Create backup plan (database snapshots)

#### Day 3: Production Deployment
- [ ] Merge staging to production
- [ ] Deploy to Vercel production
- [ ] Run database migrations (production)
- [ ] Verify deployment (smoke tests)
- [ ] Monitor logs (Vercel functions)

#### Day 4-5: Monitoring Setup
- [ ] Set up Vercel Analytics
- [ ] Set up error logging (console.error)
- [ ] Set up free tier usage alerts (80% threshold)
- [ ] Create monitoring dashboard (Vercel + Supabase)
- [ ] Document incident response process

#### Day 6: Soft Launch
- [ ] Share with 5-10 friends (alpha testers)
- [ ] Monitor usage (DAU, scenarios completed)
- [ ] Monitor errors (bugs, crashes)
- [ ] Gather feedback (user interviews)
- [ ] Fix critical bugs (P0 issues)

#### Day 7: Public Launch
- [ ] Post to r/poker, TwoPlusTwo forums
- [ ] Share on Twitter, LinkedIn
- [ ] Monitor traffic (bandwidth, concurrent users)
- [ ] Monitor database size (stay within 500MB)
- [ ] Respond to feedback (GitHub issues)

### Deliverables
- Production deployment (public URL)
- Monitoring dashboard (Vercel + Supabase)
- Error tracking (logs, alerts)
- Usage analytics (DAU, retention)
- Post-launch support plan

### Acceptance Criteria
- [ ] App accessible at public URL
- [ ] No P0 bugs in production
- [ ] Monitoring operational (alerts, dashboards)
- [ ] Within free tier limits (bandwidth, database)
- [ ] 5+ users complete training scenarios
- [ ] Feedback collected (user interviews)

### Risks
- Production deployment fails → Rollback plan ready
- High traffic exceeds free tier → Upgrade plan prepared
- Critical bugs in production → Hotfix process documented

---

## Key Milestones

| Date | Milestone | Success Criteria |
|------|-----------|------------------|
| Nov 15 | Phase 1 Complete | All ADRs accepted, Phase 2 unblocked |
| Nov 22 | Dev Environment Ready | `npm run dev` works, first deployment |
| Dec 6 | Game Engine Complete | Can deal a full hand, 100% coverage |
| Dec 20 | Training System Complete | 4 modes, 20 scenarios, feedback working |
| Jan 3 | UI/UX Complete | Mobile-friendly, 90+ Lighthouse |
| Jan 10 | MVP Launched | Public URL, 5+ users, feedback collected |

---

## Dependencies & Sequencing

### Critical Path
1. Phase 1 (Planning) → Phase 2 (Foundation) → Phase 3 (Game Engine) → Phase 4 (Training) → Phase 5 (UI) → Phase 7 (Launch)
2. Phase 6 (Quality) runs parallel to Phases 2-5

### Blocking Dependencies
- **Phase 2 blocks Phase 3:** Need dev environment before building game engine
- **Phase 3 blocks Phase 4:** Training system requires working game engine
- **Phases 3 + 4 block Phase 5:** UI needs game engine + training system
- **Phases 2-6 block Phase 7:** Cannot launch without complete, tested MVP

### Parallel Work Opportunities
- **Phase 2:** Can work on UI components while setting up CI/CD
- **Phase 3:** Hand evaluator + pot calculator can be built in parallel
- **Phase 4:** Scenario creation + feedback system can be built in parallel
- **Phase 5:** Game UI, training UI, dashboard can be built in parallel
- **Phase 6:** Runs continuously in parallel with all phases

---

## Risk Assessment

### High-Risk Items

**1. 100% Game Engine Coverage Requirement**
- **Risk:** Difficult to achieve and maintain 100% coverage
- **Impact:** Critical (blocks MVP if not met)
- **Mitigation:** TDD from day 1, pair program if stuck, fail build if < 100%
- **Contingency:** Reduce scope (remove edge cases, simplify features)

**2. Timeline Aggressive for Solo Developer**
- **Risk:** 9 weeks is tight for full-stack app (225-315 hours total)
- **Impact:** High (may miss Jan 10 launch date)
- **Mitigation:** Work 6 hrs/day (not 4), cut scope if behind, focus on MVP only
- **Contingency:** Push launch to Jan 17 (1 week buffer)

**3. Hand Evaluator Performance**
- **Risk:** Custom hand evaluator may be slow (> 1ms)
- **Impact:** Medium (affects game feel, server cost)
- **Mitigation:** Prototype early (Week 4), benchmark, use lookup table
- **Contingency:** Use `poker-evaluator` npm library (trade off 100% coverage goal)

**4. Exceed Free Tier Limits**
- **Risk:** Unexpected traffic or database growth exceeds free tier
- **Impact:** High (costs money, breaks budget constraint)
- **Mitigation:** Monitor usage weekly, optimize queries, alert at 80% limit
- **Contingency:** Upgrade to paid tier ($5-20/month), fundraise or shut down

**5. Mobile Performance Issues**
- **Risk:** App slow on mobile (> 3s load, < 60fps animations)
- **Impact:** High (poor UX, high bounce rate)
- **Mitigation:** Optimize bundle size, test on real devices early
- **Contingency:** Remove animations, simplify UI, use SSR

### Medium-Risk Items

**6. Better Auth Integration Complexity**
- **Risk:** Better Auth + Supabase adapter may be tricky
- **Impact:** Medium (delays Phase 2)
- **Mitigation:** Follow official docs, use examples, ask on Discord
- **Contingency:** Use simpler auth (email magic links, no password)

**7. Scenario Quality**
- **Risk:** Training scenarios not engaging or educational
- **Impact:** Medium (users don't learn, poor retention)
- **Mitigation:** User test early, iterate on feedback
- **Contingency:** Reduce scenario count (focus on quality over quantity)

**8. Responsive Design Complexity**
- **Risk:** Poker table UI difficult to make responsive (320px-1920px)
- **Impact:** Medium (mobile UX suffers)
- **Mitigation:** Design mobile-first, test on devices early
- **Contingency:** Simplify UI (remove unnecessary elements)

### Low-Risk Items

**9. Supabase Local CLI Setup**
- **Risk:** Local development with Docker may have issues
- **Impact:** Low (can use Supabase cloud for dev)
- **Mitigation:** Follow setup guide, use cloud if local fails
- **Contingency:** Use Supabase cloud for all development

**10. Holiday Impact (Dec 25-Jan 1)**
- **Risk:** Reduced availability during holidays
- **Impact:** Low (Phase 5 has buffer time)
- **Mitigation:** Front-load work in Weeks 8-9
- **Contingency:** Extend Phase 5 by 2-3 days

---

## Resource Allocation

### Developer Time
- **Total Available:** 225-315 hours (9 weeks × 25-35 hrs/week)
- **Phase 1:** 28 hours (7 days × 4 hrs/day) ✅ **COMPLETE**
- **Phase 2:** 28 hours (7 days × 4 hrs/day)
- **Phase 3:** 56 hours (14 days × 4 hrs/day)
- **Phase 4:** 56 hours (14 days × 4 hrs/day)
- **Phase 5:** 56 hours (14 days × 4 hrs/day)
- **Phase 6:** ~40 hours (ongoing, parallel)
- **Phase 7:** 28 hours (7 days × 4 hrs/day)

**Total Estimated:** 292 hours (within range)

### Budget
- **Infrastructure:** $0/month (free tier: Vercel + Supabase)
- **Tools:** $0/month (all open source: React Router, Vitest, etc.)
- **Marketing:** $0 (organic growth only)
- **Contingency:** $20/month (if exceed free tier, upgrade Supabase)

**Total Budget:** $0-20/month

---

## MVP Definition

### Minimum Viable Product (MVP)

**Must Have:**
- User can create account (email/password)
- User can play 6-max Sit-n-Go tournament (1 human + 5 AI)
- User can access all 4 training modes
- User can complete 20+ different training scenarios
- User receives immediate feedback after decisions
- User can view progress analytics dashboard
- Game logic is 100% server-side (secure)
- 100% game engine test coverage
- 95%+ overall test coverage
- Mobile-responsive (iOS Safari + Android Chrome)
- Deployed to production (public URL)

**Can Defer:**
- Multi-table tournaments (MTT)
- Social features (leaderboards, friends, chat)
- Advanced analytics (heat maps, range analysis)
- Customization (card backs, table themes, avatars)
- Video tutorials
- 50+ scenarios (start with 20-30, expand post-MVP)

### Success Metrics (Post-Launch)

**Week 1 (Jan 10-17):**
- 10+ signups
- 5+ users complete at least 1 scenario
- 3+ users complete at least 5 scenarios
- No P0 bugs reported
- Stay within free tier limits

**Month 1 (Jan 10-Feb 10):**
- 100+ signups
- 50+ active users (DAU 20+)
- 40% day-7 retention
- 20% day-30 retention
- 90% first scenario completion rate
- No P0 bugs, < 5 P1 bugs
- Within free tier limits

**Success Criteria:**
- ✅ Users complete scenarios (validates training)
- ✅ Users return (retention > 30% D7)
- ✅ Users improve (accuracy increases over time)
- ✅ No critical bugs (app stable)
- ✅ Within budget (free tier sufficient)

**Failure Criteria:**
- ❌ High abandonment (< 50% complete first scenario)
- ❌ Low retention (< 20% D7)
- ❌ No improvement (accuracy flat over time)
- ❌ Critical bugs (crashes, data loss)
- ❌ Exceed free tier (unexpected costs)

---

## Phase 8: Post-MVP (Beyond Jan 10)

**After MVP launch, prioritize based on user feedback:**

### Potential Phase 8 Features
- Multi-table tournaments (if users request)
- 50+ training scenarios (expand content)
- Advanced analytics (heat maps, range analysis)
- Social features (leaderboards, achievements)
- Customization (card backs, table themes)
- Video tutorials (if users struggle)
- Mobile native apps (if web UX insufficient)
- Monetization (freemium, premium scenarios)

**Decision:** Wait for MVP validation before planning Phase 8.

---

## Related Documentation

- [Project Boundaries](../architecture/project-boundaries.md) - Scope decisions
- [Core Assumptions](../architecture/assumptions.md) - Assumptions to validate
- [Tech Stack](../decisions/001-tech-stack.md) - Technology choices
- [Testing Strategy](../decisions/004-testing-strategy.md) - Test requirements
- [Game Engine Architecture](../decisions/005-game-engine-architecture.md) - Engine design
- [GitHub Issues](https://github.com/JimmayVV/poker-sense/issues) - Track progress

---

## Changelog

- **2025-11-08:** Initial roadmap created (Issue #10, Phase 1)
  - 7 phases defined with timelines
  - Dependencies and parallel work identified
  - Risk assessment (10 risks documented)
  - MVP definition (success metrics defined)
  - Phase 1 marked complete
