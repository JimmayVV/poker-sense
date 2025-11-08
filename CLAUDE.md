# Poker-Sense - Texas Hold'em Trainer

## Project Vision

Mobile-first Texas Hold'em training application with tournament-style gameplay. Train players on hand strength recognition, odds calculation, position & strategy, and opponent modeling. Server-side game logic. 100% test coverage. Deploy on free tier (Vercel + Supabase).

## Current Status

**Phase:** 1 - BMAD Framework Setup & Planning
**Next Milestone:** Nov 15, 2025

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

**Current Phase Tasks:** See [Issue #1](https://github.com/JimmayVV/poker-sense/issues/1)

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
npm run dev              # Start dev server
npm run typecheck        # Check types
npm run lint             # Lint code
npm run format           # Format code

# Testing
npm test                 # Run unit tests
npm run test:coverage    # Coverage report
npm run test:e2e         # E2E tests

# Building
npm run build            # Production build
```

## Phase Checklist

- [ ] Phase 1: BMAD Framework (Issues #1-10) - Due Nov 15
- [ ] Phase 2: Foundation (Issues #11-21) - Due Nov 22
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
- Update phase checklist as phases complete
- Follow mobile-first approach for all UI work
- Config files go in `/config` directory
- All architectural decisions documented as ADRs

## Getting Started

1. Complete Phase 1 issues (#2-10) - architectural decisions
2. Set up development environment (Phase 2, Issue #12)
3. Begin game engine with TDD (Phase 3, Issue #23)
4. Build incrementally, test everything
5. Deploy to production (Phase 7)

**Current Priority:** Complete Phase 1 ADRs to unblock Phase 2.
