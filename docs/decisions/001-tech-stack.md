# 001. Tech Stack Selection

**Date:** 2025-11-08
**Status:** Accepted
**Deciders:** Jimmy VV, Claude Code
**Technical Story:** [Issue #2](https://github.com/JimmayVV/poker-sense/issues/2)

## Context

Building a mobile-first Texas Hold'em training application with tournament-style gameplay. The application requires server-side game logic to prevent reverse engineering, 100% test coverage for the game engine, and deployment on free-tier infrastructure (Vercel + Supabase). Development timeline is 9 weeks with a solo developer.

Critical constraints:
- Mobile-first responsive design (primary use case)
- Server-side game logic (security requirement)
- Free tier deployment (Vercel + Supabase)
- Solo developer with limited time budget
- 100% test coverage on game engine
- Fast development velocity required

## Decision Drivers

- **Mobile Performance:** Bundle size, initial load time, runtime performance on mobile devices
- **Development Velocity:** Solo developer needs productive tooling, good DX, minimal configuration
- **Type Safety:** Strictest TypeScript to catch errors early, reduce testing burden
- **Free Tier Compatibility:** Stay within Vercel/Supabase limits (bundle size, function execution time)
- **Server-Side Logic:** Framework must support secure server-side game engine
- **Test Coverage:** Easy to achieve 100% coverage on game logic
- **Ecosystem Maturity:** Stable, well-documented, active community
- **Long-term Viability:** Technologies with staying power, not bleeding edge

## Considered Options

### Decision 1: Application Framework

#### Option 1.1: React Router v7 (Framework Mode)

**Description:** React Router v7 in framework mode with Vite. File-based routing, loaders/actions for server logic, built-in SSR support. Leverages Vite's speed and React Router's maturity.

**Pros:**
- Vite provides fastest build times (critical for TDD workflow)
- Framework mode gives server-side routes via loaders/actions
- Lightweight compared to Next.js (smaller bundle, simpler)
- React Router is stable, mature, widely understood
- Excellent TypeScript support with typed loaders/actions
- Easy to deploy on Vercel (official support)
- Minimal vendor lock-in (can migrate to Remix/other if needed)
- Server routes perfect for game engine API

**Cons:**
- Newer framework mode (less battle-tested than Next.js)
- Smaller ecosystem than Next.js App Router
- Less built-in features (no image optimization, etc.)

#### Option 1.2: Next.js 14 (App Router)

**Description:** Next.js 14 with App Router, React Server Components, Server Actions.

**Pros:**
- Most mature full-stack React framework
- Excellent documentation and community
- Built-in image optimization, font optimization
- Vercel's flagship product (best deployment experience)
- Large ecosystem of plugins and examples

**Cons:**
- Heavier bundle size (200-300kb baseline vs 100kb for RR)
- Webpack-based (slower builds than Vite)
- More complex mental model (RSC, Server Actions, client components)
- Opinionated structure may slow down solo developer
- Overkill for poker trainer (don't need SEO, static generation)

#### Option 1.3: Remix v2

**Description:** Remix framework with nested routing, loaders/actions.

**Pros:**
- Excellent server-side data loading patterns
- Nested routing matches poker app structure
- Strong TypeScript support
- Can deploy to Vercel

**Cons:**
- Being merged into React Router v7 (migration overhead)
- Why use Remix when RR v7 achieves same goals?
- Community fragmenting between Remix and RR v7

### Decision 2: UI Component Library

#### Option 2.1: shadcn/ui

**Description:** Copy-paste component library built on Radix UI + Tailwind CSS. Components copied into your codebase, fully customizable.

**Pros:**
- Zero runtime bundle cost (tree-shakeable, only use what you need)
- Full customization (components live in your repo)
- Tailwind CSS native (matches mobile-first approach)
- Accessible by default (Radix UI primitives)
- Modern, clean design system
- No version lock-in (you own the code)
- Excellent mobile responsiveness out of box
- Fast to prototype with

**Cons:**
- Must copy/paste components (not npm install)
- Requires Tailwind CSS knowledge
- Less comprehensive than Ant Design/Mantine

#### Option 2.2: Mantine

**Description:** Full-featured React component library with hooks, 100+ components.

**Pros:**
- Comprehensive component set
- Built-in dark mode
- Good TypeScript support
- Active development

**Cons:**
- 300kb+ bundle size (heavy for mobile)
- CSS-in-JS runtime cost
- Less Tailwind-friendly
- More opinionated styling

#### Option 2.3: Ant Design

**Description:** Enterprise UI library, very comprehensive.

**Pros:**
- Extremely comprehensive (100+ components)
- Battle-tested in production
- Good documentation

**Cons:**
- 500kb+ bundle size (dealbreaker for mobile)
- Less modern design aesthetic
- Harder to customize
- Not Tailwind-based

### Decision 3: Package Manager

#### Option 3.1: npm

**Description:** Default Node.js package manager, v10+ with workspaces support.

**Pros:**
- User already familiar
- Universal compatibility
- No extra installation needed
- Predictable, stable
- Best Vercel integration (default)

**Cons:**
- Slower than pnpm/bun
- Larger node_modules size
- Less efficient disk usage

#### Option 3.2: pnpm

**Description:** Fast, disk-efficient package manager with strict node_modules.

**Pros:**
- Fastest install times
- Disk-efficient (symlinks)
- Strict dependency resolution

**Cons:**
- User less familiar
- Occasional compatibility issues
- Extra setup step

#### Option 3.3: bun

**Description:** All-in-one JavaScript runtime with built-in package manager.

**Pros:**
- Extremely fast
- Can replace Node.js + npm

**Cons:**
- Still maturing (v1.x)
- Some compatibility issues with ecosystem
- Vercel uses Node.js by default

### Decision 4: Linting & Formatting

#### Option 4.1: ESLint (typescript-eslint) + Prettier

**Description:** Standard TypeScript linting with Prettier for formatting.

**Pros:**
- Industry standard
- Excellent TypeScript support
- Catches bugs before runtime
- Consistent code style
- Good IDE integration

**Cons:**
- Configuration overhead
- Can be slow on large codebases

#### Option 4.2: Biome

**Description:** All-in-one linter/formatter (Rust-based, replaces ESLint + Prettier).

**Pros:**
- Much faster than ESLint + Prettier
- Single tool (less config)
- Modern, active development

**Cons:**
- Less mature ecosystem
- Some ESLint rules not yet supported
- User less familiar

### Decision 5: Git Hooks

#### Option 5.1: Husky + lint-staged

**Description:** Git hooks to run linting/formatting on pre-commit.

**Pros:**
- Enforces code quality before commits
- Fast (only lints staged files)
- Prevents broken commits

**Cons:**
- Slows down commit flow slightly
- Can be bypassed with --no-verify

#### Option 5.2: No git hooks

**Description:** Rely on IDE and CI for linting.

**Pros:**
- Faster commit workflow
- Less tooling

**Cons:**
- Easier to commit broken code
- More CI failures

## Decision Outcome

### Framework & Bundler
**Chosen:** React Router v7 (framework mode) + Vite

**Justification:**
React Router v7 framework mode provides the perfect balance for this project. Vite's build speed is critical for TDD workflow with 100% test coverage requirements. The framework mode gives us server-side routes (loaders/actions) for game engine API without the complexity of Next.js App Router or the bundle weight. For a poker trainer that doesn't need SEO, static generation, or image optimization, Next.js is overkill. React Router v7 is lighter (smaller mobile bundle), faster to build (Vite), and simpler to reason about for a solo developer on a 9-week timeline.

### UI Library
**Chosen:** shadcn/ui + Tailwind CSS

**Justification:**
shadcn/ui is ideal for mobile-first development. Zero bundle cost (tree-shakeable), built on accessible Radix primitives, and Tailwind-native. For a poker trainer where bundle size directly impacts mobile performance, shadcn/ui's copy-paste approach means we only ship what we use. Full customization is important for poker-specific UI (cards, chips, tables). Mantine and Ant Design add 300-500kb+ to the bundle, unacceptable for mobile-first.

### Package Manager
**Chosen:** npm

**Justification:**
User is already familiar with npm, and it has the best Vercel integration (default, no configuration needed). While pnpm is faster, the time savings don't justify the learning curve for a solo developer on a tight timeline. npm v10+ with workspaces is sufficient for this project's needs.

### Linting & Formatting
**Chosen:** ESLint (@typescript-eslint/strict) + Prettier

**Justification:**
Industry standard with excellent TypeScript support. Using `@typescript-eslint/strict` config ensures maximum type safety. Prettier removes formatting debates. Biome is promising but less mature; not worth the risk for a project with a hard deadline.

### Git Hooks
**Chosen:** Husky + lint-staged

**Justification:**
Enforcing linting on pre-commit prevents broken code from entering the repository. Critical for solo developer who doesn't have code review as a safety net. Small commit delay is worth the code quality guarantee.

### Consequences

**Positive:**
- Fastest possible build times (Vite) enable rapid TDD cycles
- Smallest mobile bundle (RR v7 + shadcn/ui) ensures fast loading
- Server-side routes (loaders/actions) keep game logic secure
- Full TypeScript strictness catches errors at compile time
- Free tier compatible (bundle size, execution time)
- Simple mental model (no RSC complexity)
- Full control over UI components (shadcn/ui copy-paste)
- Familiar tooling (npm, ESLint, Prettier)

**Negative:**
- Less comprehensive UI library than Mantine/Ant (need to build some components)
- Newer framework mode (less Stack Overflow answers)
- Must manually copy shadcn/ui components (not `npm install`)
- npm slower than pnpm (mitigated by Vite speed)

**Neutral:**
- TypeScript strictness requires more upfront type definitions
- Tailwind CSS required (not a con, but locked in)
- Husky hooks can be bypassed with `--no-verify`

## Implementation Notes

### Initial Setup

```bash
# Create React Router v7 app with Vite
npx create-react-router@latest poker-sense --template vite

# Install shadcn/ui
npx shadcn@latest init

# Install dev dependencies
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D eslint-config-prettier eslint-plugin-react-hooks
npm install -D prettier
npm install -D husky lint-staged

# Initialize Husky
npx husky init
```

### TypeScript Configuration

Use strictest settings in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

### ESLint Configuration

Extend `@typescript-eslint/strict` for maximum type safety.

### Path Aliases

Configure `@` for `app/` directory:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./app/*"]
    }
  }
}
```

### Environment Variables

Use Vite's `.env` convention:
- `.env.local` for local development (gitignored)
- `.env.production` for production secrets (Vercel)

### Deployment

Vercel configuration is automatic for React Router v7. Add environment variables in Vercel dashboard.

## Related Decisions

- [ADR 003: State Management](./003-state-management.md) - Will use Zustand for client state
- [ADR 004: Testing Strategy](./004-testing-strategy.md) - Vitest for unit/integration tests
- [ADR 005: Deployment Infrastructure](./005-deployment.md) - Vercel + Supabase configuration
- [ADR 006: Game Engine Architecture](./006-game-engine.md) - Server-side implementation using React Router loaders/actions

## Links

- [React Router v7 Documentation](https://reactrouter.com/en/main)
- [Vite Documentation](https://vitejs.dev/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vercel React Router Deployment](https://vercel.com/docs/frameworks/react-router)
