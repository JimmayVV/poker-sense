# Frontend Stack

> **Status:** Defined in [ADR 001](../decisions/001-tech-stack.md)
> **Last Updated:** 2025-11-08

## Overview

The frontend stack prioritizes mobile-first performance, rapid development velocity, and type safety. Built on React Router v7 framework mode with Vite, leveraging modern tooling for the best developer experience.

## Framework & Runtime

### React Router v7 (Framework Mode)

**Version:** 7.x
**Mode:** Framework mode with file-based routing
**Documentation:** [React Router v7 Docs](https://reactrouter.com/en/main)

**Why React Router v7?**
- **Vite-powered builds:** Fastest build times for TDD workflow (critical with 100% test coverage goal)
- **Lightweight:** ~100kb baseline bundle vs 200-300kb for Next.js (better mobile performance)
- **Server routes:** Loaders/actions provide server-side logic without complexity of RSC
- **Mature:** React Router is stable, widely understood, less vendor lock-in
- **Simple mental model:** No RSC/Server Components complexity, easier for solo developer

**Key Features Used:**
- File-based routing (`app/routes/`)
- Route loaders for data fetching
- Route actions for mutations (game moves, auth)
- Typed routes with TypeScript
- Built-in SSR support
- Error boundaries per route

**Example Route:**
```typescript
// app/routes/game.$gameId.tsx
import { json, LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

export async function loader({ params }: LoaderFunctionArgs) {
  const game = await fetchGameState(params.gameId);
  return json(game);
}

export default function Game() {
  const game = useLoaderData<typeof loader>();
  return <GameTable game={game} />;
}
```

### Vite

**Version:** 6.x
**Documentation:** [Vite Docs](https://vitejs.dev/)

**Why Vite?**
- **Speed:** Sub-second HMR, fastest build tool available
- **ESM-native:** Modern module system, no bundler overhead in dev
- **Plugin ecosystem:** Rich ecosystem, React Router v7 plugin included
- **TypeScript:** First-class TypeScript support, no extra config

**Configuration:**
Located at `/config/vite.config.ts`

**Key Plugins:**
- `@react-router/dev/vite` - Framework mode integration
- `vite-tsconfig-paths` - Path alias support (`@/` for `app/`)

## UI Framework

### React 18

**Version:** 18.x
**Features Used:**
- Concurrent rendering
- Automatic batching
- Transitions for non-urgent updates (poker animations)
- Suspense for code splitting

**TypeScript:**
All components use TypeScript with strict mode enabled. Function components typed with `React.FC` or explicit return types.

## Component Library

### shadcn/ui

**Version:** Latest
**Documentation:** [shadcn/ui Docs](https://ui.shadcn.com/)

**Why shadcn/ui?**
- **Zero bundle cost:** Components copied into codebase, tree-shakeable
- **Full customization:** Own the code, modify as needed for poker UI
- **Tailwind-native:** Perfect for mobile-first design
- **Accessible:** Built on Radix UI primitives (ARIA-compliant)
- **Modern:** Clean design system, easy to theme

**Installation:**
```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog
```

**Components Used:**
- Button, Card, Dialog, Dropdown, Tooltip (poker UI)
- Table, Tabs (training scenarios)
- Progress, Slider (analytics, bet sizing)
- Toast (notifications)

**Customization:**
Components live in `app/components/ui/` and can be freely modified. Theme configured via CSS variables in `app/tailwind.css`.

### Radix UI

**Version:** Latest
**Documentation:** [Radix UI Docs](https://www.radix-ui.com/)

**Usage:**
Underlying primitives for shadcn/ui components. Not used directly; accessed through shadcn/ui wrappers.

**Why Radix?**
- Unstyled, accessible primitives
- Handles complex interactions (focus management, keyboard nav, ARIA)
- Small bundle size
- Composable

## Styling

### Tailwind CSS

**Version:** 3.x
**Documentation:** [Tailwind Docs](https://tailwindcss.com/)

**Why Tailwind?**
- **Mobile-first:** Built-in responsive utilities (`sm:`, `md:`, `lg:`)
- **Performance:** Purges unused CSS, tiny production bundle
- **Velocity:** Rapid prototyping, no context switching
- **Consistency:** Design tokens enforce consistent spacing/colors
- **shadcn/ui:** Native integration with shadcn/ui

**Configuration:**
Located at `/config/tailwind.config.ts`

**Custom Theme:**
```typescript
// Poker-specific colors
colors: {
  felt: { green: '#0d5f2f', blue: '#1a5f7a' },
  chip: { red: '#dc2626', blue: '#2563eb', black: '#171717' },
  card: { red: '#dc2626', black: '#171717' }
}
```

**Plugins:**
- `@tailwindcss/forms` - Better form styling
- `tailwindcss-animate` - Animation utilities (chip movements, card flips)

### CSS Modules (Optional)

For complex animations or component-specific styles not suited to Tailwind, CSS Modules are available:

```typescript
import styles from './PokerTable.module.css';

export function PokerTable() {
  return <div className={styles.table}>...</div>;
}
```

**When to Use:**
- Complex keyframe animations
- Performance-critical styles (avoid Tailwind recalculation)

## State Management

> **See:** [ADR 003: State Management](../decisions/003-state-management.md)

### Zustand

**Version:** 4.x
**Documentation:** [Zustand Docs](https://zustand-demo.pmnd.rs/)

**Usage:**
- Game state (current hand, players, pot, dealer button)
- Training state (scenarios, progress, analytics)
- UI state (modals, toast notifications)

**Why Zustand?**
- Minimal boilerplate (much simpler than Redux)
- Excellent TypeScript support
- Small bundle size (1kb)
- No providers needed
- Easy to test

**Example Store:**
```typescript
// app/lib/stores/game-store.ts
import { create } from 'zustand';

interface GameState {
  gameId: string | null;
  players: Player[];
  pot: number;
  currentBet: number;
  actions: {
    placeBet: (amount: number) => void;
    fold: () => void;
  };
}

export const useGameStore = create<GameState>((set) => ({
  gameId: null,
  players: [],
  pot: 0,
  currentBet: 0,
  actions: {
    placeBet: (amount) => set((state) => ({ pot: state.pot + amount })),
    fold: () => set({ gameId: null }),
  },
}));
```

### React Query (Optional)

**Version:** 5.x
**Documentation:** [TanStack Query Docs](https://tanstack.com/query/latest)

**Usage:**
May be used for API caching if needed. React Router loaders handle most data fetching, but React Query could cache training scenarios or analytics.

**Decision:** Defer until Phase 4 (AI Training). React Router loaders likely sufficient.

## Routing

### React Router v7 File-Based Routing

**Pattern:**
```
app/routes/
├── _index.tsx              # / (home)
├── game.$gameId.tsx        # /game/:gameId
├── training._index.tsx     # /training
├── training.$mode.tsx      # /training/:mode
└── analytics.tsx           # /analytics
```

**Layout Routes:**
```typescript
// app/routes/_layout.tsx (shared layout)
export default function Layout() {
  return (
    <div>
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}
```

**Path Aliases:**
```typescript
import { GameTable } from '@/components/game/GameTable';
import { useGameStore } from '@/lib/stores/game-store';
```

## Forms

### React Router Form Actions

**Usage:**
Use React Router's `<Form>` component with actions for mutations:

```typescript
// app/routes/auth.login.tsx
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');

  const session = await login(email, password);
  return redirect('/game', {
    headers: { 'Set-Cookie': await commitSession(session) }
  });
}

export default function Login() {
  return (
    <Form method="post">
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Login</button>
    </Form>
  );
}
```

### React Hook Form (Optional)

**Version:** 7.x
**Documentation:** [React Hook Form Docs](https://react-hook-form.com/)

**Usage:**
For complex forms with validation (user settings, tournament config).

**Why React Hook Form?**
- Excellent performance (uncontrolled inputs)
- TypeScript support with Zod schema validation
- Small bundle size

**Decision:** Use for complex forms only. Simple forms use React Router `<Form>`.

## Type Safety

### TypeScript

**Version:** 5.x
**Configuration:** `/tsconfig.json`

**Strict Mode Settings:**
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

**Path Aliases:**
```json
{
  "paths": {
    "@/*": ["./app/*"]
  }
}
```

### Zod (Schema Validation)

**Version:** 3.x
**Documentation:** [Zod Docs](https://zod.dev/)

**Usage:**
- Validate loader/action data
- Form validation with React Hook Form
- Environment variable validation

**Example:**
```typescript
import { z } from 'zod';

const GameStateSchema = z.object({
  gameId: z.string().uuid(),
  players: z.array(PlayerSchema),
  pot: z.number().min(0),
});

type GameState = z.infer<typeof GameStateSchema>;
```

## Testing

> **See:** [ADR 004: Testing Strategy](../decisions/004-testing-strategy.md)

**Unit/Integration:** Vitest
**E2E:** Playwright
**Coverage Target:** 70%+ for UI components

## Icons

### Lucide React

**Version:** Latest
**Documentation:** [Lucide Docs](https://lucide.dev/)

**Why Lucide?**
- Tree-shakeable (only import icons you use)
- Consistent design system
- Accessible (ARIA labels built-in)
- Small bundle impact

**Usage:**
```typescript
import { Heart, Diamond, Spade, Club } from 'lucide-react';

export function CardSuit({ suit }: { suit: 'hearts' | 'diamonds' | 'spades' | 'clubs' }) {
  const Icon = { hearts: Heart, diamonds: Diamond, spades: Spade, clubs: Club }[suit];
  return <Icon className="h-4 w-4" />;
}
```

## Build & Development

### Development Server

```bash
npm run dev
# Runs on http://localhost:5173
```

**Features:**
- Hot Module Replacement (HMR)
- Fast Refresh for React components
- TypeScript type-checking in background

### Production Build

```bash
npm run build
# Outputs to build/ directory
```

**Optimizations:**
- Code splitting per route
- Tree-shaking unused code
- CSS purging (Tailwind)
- Asset minification

### Bundle Analysis

```bash
npm run build -- --analyze
```

Monitor bundle size to stay within free tier limits.

## Deployment

**Platform:** Vercel
**Documentation:** [Vercel React Router Docs](https://vercel.com/docs/frameworks/react-router)

**Automatic Deployment:**
- Push to `main` → Production deployment
- Pull requests → Preview deployments

**Environment Variables:**
Set in Vercel dashboard (not in `.env.production`).

## Development Tools

### Linting

**ESLint:** `@typescript-eslint/strict` configuration
**Prettier:** Opinionated formatting
**Husky + lint-staged:** Pre-commit hooks

```bash
npm run lint
npm run format
```

### Git Hooks

**Pre-commit:**
- Lint staged files
- Format with Prettier
- TypeScript type-check

### VS Code Extensions (Recommended)

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Error Lens
- React Router Snippets

## Performance Considerations

### Mobile-First Optimizations

1. **Lazy Loading:** Code-split routes for faster initial load
2. **Image Optimization:** Use WebP format, lazy load images
3. **Bundle Size:** Monitor with `npm run build -- --analyze`
4. **Tailwind Purging:** Automatically removes unused CSS
5. **Tree-shaking:** shadcn/ui components tree-shake aggressively

### Target Metrics

- **Initial Load:** < 100kb JavaScript (gzipped)
- **Time to Interactive:** < 2 seconds on 3G
- **Lighthouse Score:** 90+ on mobile

## Future Considerations

### Potential Additions

- **Framer Motion:** Advanced animations for poker actions (chip movements, card dealing)
- **React Query:** If API caching needed beyond React Router loaders
- **Sentry:** Error tracking in production
- **PostHog:** Analytics and feature flags

**Decision:** Defer until Phase 5 (UX) or Phase 6 (Quality). Avoid premature optimization.

## Related Documentation

- [Backend Stack](./backend.md)
- [Testing Stack](./testing.md)
- [ADR 001: Tech Stack Selection](../decisions/001-tech-stack.md)
- [ADR 003: State Management](../decisions/003-state-management.md)
- [ADR 004: Testing Strategy](../decisions/004-testing-strategy.md)
