# Poker Sense - Texas Hold'em Trainer

Mobile-first Texas Hold'em training application with tournament-style gameplay. Built with React Router v7, TypeScript, and Tailwind CSS.

## Project Status

**Phase:** 2 - Foundation (Complete)
**Next:** Phase 3 - Game Engine Development
**Milestone:** Nov 15, 2025

Track progress: [GitHub Issues](https://github.com/JimmayVV/poker-sense/issues)

## Tech Stack

- **Framework:** React Router v7 (framework mode) + Vite
- **Language:** TypeScript (strictest settings)
- **Styling:** Tailwind CSS + shadcn/ui
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Auth:** Better Auth + Supabase
- **Database:** Supabase (PostgreSQL)
- **Code Quality:** ESLint + Prettier

## Prerequisites

- Node.js 20+
- npm
- Docker (for local Supabase)

## Quick Start

1. **Clone and install:**
   ```bash
   git clone https://github.com/JimmayVV/poker-sense.git
   cd poker-sense
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your local settings (defaults work for local dev)
   ```

3. **Run development server:**
   ```bash
   npm run dev
   # Automatically starts Supabase + dev server
   ```

   Visit http://localhost:3000

   **Note:** First run requires Docker for Supabase. The `dev` command starts both Supabase and the app server automatically.

## Development Commands

```bash
# Development
npm run dev              # Start Supabase + dev server (http://localhost:3000)
npm run dev:app          # Start dev server only (Supabase must be running)
npm run build            # Production build
npm run start            # Start production server

# Database (Supabase)
npm run db:start         # Start local Supabase
npm run db:stop          # Stop local Supabase
npm run db:reset         # Reset database (reapply migrations)
npm run db:status        # Check Supabase status

# Code Quality
npm run typecheck        # TypeScript type checking
npm run lint             # ESLint
npm run format           # Format with Prettier
npm run format:check     # Check formatting

# Testing
npm test                 # Run unit tests (watch mode)
npm run test:coverage    # Coverage report (95%+ target)
npm run test:e2e         # E2E tests (Playwright)
npm run test:e2e:ui      # E2E with UI
npm run test:e2e:debug   # Debug E2E tests
```

## Project Structure

```
poker-sense/
├── app/                    # React Router v7 application
│   ├── routes/            # Page routes
│   │   └── home.tsx       # Index route
│   ├── lib/               # Core logic
│   │   ├── auth.server.ts # Better Auth config (server)
│   │   ├── auth.client.ts # Better Auth client
│   │   └── utils.ts       # Utilities (cn helper)
│   ├── components/        # UI components
│   ├── entry.client.tsx   # Client entry point
│   ├── entry.server.tsx   # Server entry point
│   ├── root.tsx           # Root layout
│   ├── routes.ts          # Route configuration
│   └── globals.css        # Global styles (Tailwind)
├── config/                # All configuration files
│   ├── eslint.config.js   # ESLint config
│   ├── .prettierrc.json   # Prettier config
│   ├── tsconfig.json      # TypeScript config
│   ├── vite.config.ts     # Vite config
│   ├── vitest.config.ts   # Vitest config
│   ├── playwright.config.ts # Playwright config
│   ├── tailwind.config.ts # Tailwind config
│   ├── postcss.config.js  # PostCSS config
│   ├── react-router.config.ts # React Router config
│   ├── components.json    # shadcn/ui config
│   └── supabase.toml      # Supabase config
├── tests/                 # Test suites
│   └── e2e/              # E2E tests
├── supabase/             # Supabase migrations & functions
├── docs/                 # Documentation & ADRs
├── .github/              # GitHub Actions workflows
└── public/              # Static assets
```

## Configuration

All configuration files are in the `/config` directory with symlinks in the root for tool compatibility.

## Testing Strategy

- **Unit Tests:** Vitest with React Testing Library
- **E2E Tests:** Playwright (Chromium, Firefox, WebKit, Mobile)
- **Coverage Target:** 95%+ overall, 100% for game engine

See [Testing Strategy ADR](docs/decisions/005-testing-strategy.md) for details.

## VS Code Setup

Recommended extensions (auto-suggested when opening project):
- ESLint
- Prettier

Format-on-save is configured in `.vscode/settings.json`

## Environment Variables

See `.env.example` for all available variables. Defaults are set for local development.

Required for production:
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Auth secret key
- `SUPABASE_URL` - Supabase API URL
- `SUPABASE_ANON_KEY` - Supabase anon key

## CI/CD

GitHub Actions workflow runs on all commits and PRs:
- TypeScript type checking
- ESLint linting
- Prettier format checking
- Unit tests with coverage
- E2E tests
- Production build

## Contributing

1. Check [current phase issues](https://github.com/JimmayVV/poker-sense/issues)
2. Follow TDD: Write tests first, then implementation
3. Maintain 95%+ test coverage
4. Run `npm run typecheck && npm run lint && npm test` before committing
5. Format code: `npm run format`

## Documentation

- [Architecture Overview](docs/README.md)
- [ADRs](docs/decisions/)
- [Tech Stack Details](docs/tech-stack/)
- [All Issues](https://github.com/JimmayVV/poker-sense/issues)

## License

MIT

## Support

- **Issues:** [GitHub Issues](https://github.com/JimmayVV/poker-sense/issues)
- **Docs:** See `/docs` directory
