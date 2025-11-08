# Poker-Sense - Texas Hold'em Trainer

## Project Vision

Mobile-first Texas Hold'em training application with tournament-style gameplay. Train players on hand strength recognition, odds calculation, position & strategy, and opponent modeling. Server-side game logic. 100% test coverage. Deploy on free tier (Vercel + Supabase).

## Current Status

**Phase:** 3 - Game Engine Development (87.5% Complete - 7/8 issues)
**Next Phase:** 4 - AI Training
**Next Milestone:** Dec 6, 2025

**Phase 3 Progress:**
- ✅ Issue #29: Game constants & enums (36 tests, 100% coverage)
- ✅ Issue #28: Card & hand types (29 tests, 86% coverage)
- ✅ Issue #25: Deck management (44 tests, 94% coverage)
- ✅ Issue #30: Pot calculator (25 tests, 95% coverage)
- ✅ Issue #23: Hand evaluator (12 tests, 91% coverage)
- ✅ Issue #27: Action validator (30 tests, 99% coverage)
- ✅ Issue #26: Betting logic (26 tests, 98% coverage)
- ⏳ Issue #24: Tournament state machine (pending)

**Current Stats:**
- 208 tests passing
- 98.21% game-engine coverage
- All CI/CD checks passing

Track progress: https://github.com/JimmayVV/poker-sense/issues

## Project Structure

```
poker-sense/
├── app/                    # React Router v7 application
│   ├── routes/            # Page routes
│   ├── lib/               # Core logic
│   │   ├── game-engine/   # Poker logic (Phase 3)
│   │   └── training/      # Scenario system (Phase 4)
│   └── components/        # UI components (Phase 5)
├── config/                # All configuration files
├── docs/                  # Documentation & ADRs
├── tests/                 # Test suites
└── public/               # Static assets
```

## Development Workflow

### Phase-Based Approach
Work sequentially through phases. Each phase epic lists all issues. Mark complete before moving to next phase.

**Current Phase Tasks:** See [Phase 3 Epic - Issue #22](https://github.com/JimmayVV/poker-sense/issues/22)

### Test-Driven Development
1. Write tests first (Red)
2. Implement to pass tests (Green)
3. Refactor (Refactor)

**Coverage Requirements:**
- Game engine: 100% (no exceptions)
- Training logic: 90%+
- UI components: 70%+

### Issue Workflow
1. Pick issue from current phase
2. Read issue + acceptance criteria
3. Check dependencies (blocked by what?)
4. Implement with TDD
5. Mark as done when all criteria met
6. Move to next issue

**When Phase Complete:**
Close all phase issues with: `for i in {START..END}; do gh issue close $i -c "Phase N complete - [summary]"; done`

Example: Phase 2 complete → close issues #11-21

### Commit Strategy

**Infrastructure Phases (1, 2, 7):** Logical groupings (3-5 commits)
- Group related changes together
- Each commit should be a cohesive unit of work
- Example Phase 2: (1) React Router + TypeScript, (2) Code quality tools, (3) Testing setup, (4) CI + Supabase + Tailwind

**Feature Phases (3, 4, 5, 6):** Per-issue commits
- One commit per issue whenever practical
- Maintains clear history for feature development
- Easier to review, revert, and understand changes
- Include issue numbers in commit messages

**Commit Message Format:**
```
type: brief description (Issue #N)

- Bullet points of key changes
- Reference related issues
- Keep under 72 chars per line
```

Types: `feat`, `fix`, `test`, `chore`, `docs`, `ci`, `refactor`

## Key Decisions (ADRs)

**Tech Stack (Issue #2):**
- React Router v7 (framework mode) + Vite
- TypeScript (strictest settings)
- shadcn/ui + Tailwind CSS
- Vitest + Playwright
- Better Auth

**Deployment (Issue #3):**
- Vercel (frontend/framework)
- Supabase (database + auth)
- Staging + Production environments

**State Management (Issue #4):**
- Zustand (game state, training state)
- React Query (optional for API)
- Context (UI state)

**Testing (Issue #5):**
- Vitest (unit/integration)
- Playwright (E2E)
- 95%+ overall coverage target

**Game Engine (Issue #6):**
- State machine + Event log
- Server-side only (prevent reverse engineering)
- Deterministic, fully tested

See `/docs/decisions/` for detailed ADRs.

## Critical Requirements

### Must-Haves
- ✅ Mobile-first responsive design
- ✅ Tournament-style multi-table gameplay
- ✅ All 4 training modes (hand strength, odds, position, opponent modeling)
- ✅ 100% game logic test coverage
- ✅ Server-side game logic
- ✅ Better Auth integration
- ✅ Progress tracking + analytics
- ✅ 20+ training scenarios

### Config Organization
ALL config files in `/config` directory. Root stays clean.

### Security
- No client-side game logic
- Server validates all actions
- Better Auth for authentication
- Supabase RLS policies
- Environment secrets in Vercel

## Common Commands

```bash
# Development
npm run dev              # Start Supabase + dev server
npm run dev:app          # Dev server only (Supabase already running)
npm run typecheck        # Check types
npm run lint             # Lint code
npm run format           # Format code

# Database
npm run db:start         # Start local Supabase
npm run db:stop          # Stop local Supabase
npm run db:reset         # Reset database
npm run db:status        # Check status

# Testing
npm test                 # Run unit tests
npm run test:coverage    # Coverage report
npm run test:e2e         # E2E tests

# Building
npm run build            # Production build
```

## Phase Checklist

- [x] Phase 1: BMAD Framework (Issues #1-10) - Complete Nov 8
- [x] Phase 2: Foundation (Issues #11-21) - Complete Nov 8
- [ ] Phase 3: Game Engine (Issues #22-30) - Due Dec 6
- [ ] Phase 4: AI Training (Issues #31-39) - Due Dec 20
- [ ] Phase 5: UX (Issues #40-48) - Due Jan 3
- [ ] Phase 6: Quality (Issues #49-57) - Ongoing
- [ ] Phase 7: Deployment (Issues #58-66) - Due Jan 10

## Quick Reference

**Documentation:** `/docs/README.md`
**Decisions:** `/docs/decisions/`
**Architecture:** `/docs/architecture/`
**Tech Stack:** `/docs/tech-stack/`
**All Issues:** https://github.com/JimmayVV/poker-sense/issues
**Milestones:** https://github.com/JimmayVV/poker-sense/milestones

## Notes for Claude

- Reference issue numbers when discussing features (e.g., "per Issue #23")
- Always check current phase before suggesting work
- Enforce test-first development (no implementation without tests)
- Keep game logic server-side only
- Maintain 100% coverage on game engine
- Use existing GitHub issues for planning
- **When phase complete:** Close all phase issues using gh issue close, update phase checklist in CLAUDE.md
- Follow mobile-first approach for all UI work
- Config files go in `/config` directory
- All architectural decisions documented as ADRs

## Getting Started

Development environment is ready. Phase 3 is 87.5% complete.

**Next Steps:**
1. Complete Issue #24: Tournament State Machine (final Phase 3 component)
2. Begin Phase 4: AI Training (Issues #31-39)

**Recent Progress:**
- ✅ 7/8 Phase 3 issues complete
- ✅ 208 tests passing (98.21% game-engine coverage)
- ✅ Core game engine components implemented:
  - Constants, types, deck, pot calculator
  - Hand evaluator, action validator, betting logic
- ⏳ State machine pending (orchestrates all components)

**Current Priority:** Complete Issue #24 - Tournament State Machine to finish Phase 3.
