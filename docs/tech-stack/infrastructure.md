# Infrastructure

> **Status:** Defined in [ADR 002](../decisions/002-deployment-platform.md)
> **Last Updated:** 2025-11-08

## Overview

Poker-sense deploys on **Vercel** (hosting + serverless functions) + **Supabase** (database + auth). This combination provides a generous free tier, zero-configuration deployments, and production-ready infrastructure for a mobile-first React Router v7 application.

## Architecture

```
┌─────────────────┐
│  User (Mobile)  │
└────────┬────────┘
         │
         v
┌─────────────────────────────────────┐
│  Vercel Edge Network (CDN)          │
│  - Static assets (CSS, JS, images)  │
│  - Edge caching                     │
└────────┬────────────────────────────┘
         │
         v
┌─────────────────────────────────────┐
│  Vercel Serverless Functions        │
│  - React Router loaders/actions     │
│  - Game engine (server-side)        │
│  - Better Auth handlers             │
└────────┬────────────────────────────┘
         │
         v
┌─────────────────────────────────────┐
│  Supabase PostgreSQL                │
│  - Game state, users, hands         │
│  - Row-level security (RLS)         │
│  - Better Auth data                 │
└─────────────────────────────────────┘
```

## Hosting Platform: Vercel

**Platform:** Vercel (Serverless + Edge)
**Framework:** React Router v7 (framework mode)
**Runtime:** Node.js 20.x
**Documentation:** [Vercel Docs](https://vercel.com/docs)

### Why Vercel?

- **Official RR v7 Support:** Zero-configuration deployment for React Router v7 framework mode
- **Generous Free Tier:** 100 GB bandwidth, unlimited serverless functions, 6000 build minutes/month
- **Edge Network:** Global CDN for fast mobile delivery (300+ locations)
- **Built-in CI/CD:** Automatic deployments from GitHub (main, staging, PRs)
- **Preview Deployments:** Every PR gets unique URL for testing
- **Instant Rollbacks:** One-click rollback to previous deployments
- **Environment Management:** Separate env vars for production/staging/preview
- **Zero Configuration:** No `vercel.json` needed for React Router v7

### Free Tier Limits

**Bandwidth:**
- 100 GB/month (sufficient for ~10k mobile users at 10 MB/user)

**Serverless Functions:**
- Unlimited invocations (fair use policy)
- 100 concurrent executions
- 10s max duration (game engine completes in < 500ms)
- 1024 MB memory
- 4.5 MB request/response payload

**Builds:**
- 6000 build minutes/month (100 hours)
- Unlimited deployments

**Storage:**
- Unlimited (build artifacts, static assets)

**Edge Network:**
- Included (global CDN)

**Monitoring:**
- Basic analytics included
- Function logs (24-hour retention on free tier)

### Environments

**Production:**
- Branch: `main`
- URL: `https://poker-sense.vercel.app`
- Auto-deploy on push to `main`
- Supabase: Production project

**Staging:**
- Branch: `staging`
- URL: `https://poker-sense-staging.vercel.app`
- Auto-deploy on push to `staging`
- Supabase: Staging project

**Preview:**
- Branch: Any PR
- URL: `https://poker-sense-pr-<number>.vercel.app`
- Auto-deploy on PR creation/update
- Supabase: Staging project (shared with staging)

### Deployment Configuration

**Automatic Detection:**
Vercel auto-detects React Router v7. No configuration file needed.

**Optional `vercel.json` (Advanced):**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "react-router",
  "functions": {
    "app/routes/**/*.ts": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```
build/
├── client/        # Client-side assets
├── server/        # Server-side functions
└── ...
```

### Environment Variables

Set in Vercel Dashboard → Settings → Environment Variables.

**Production:**
```bash
# Supabase (Production project)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Server-only

# Better Auth
BETTER_AUTH_SECRET=xxx # Generate: openssl rand -base64 32
BETTER_AUTH_URL=https://poker-sense.vercel.app

# Node Environment
NODE_ENV=production
```

**Staging:**
```bash
# Supabase (Staging project)
SUPABASE_URL=https://yyy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Better Auth
BETTER_AUTH_SECRET=xxx # Can use same or different
BETTER_AUTH_URL=https://poker-sense-staging.vercel.app

NODE_ENV=staging
```

**Preview (PR deployments):**
```bash
# Supabase (Staging project - shared with staging)
SUPABASE_URL=https://yyy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Better Auth (dynamic URL)
BETTER_AUTH_SECRET=xxx
BETTER_AUTH_URL=$VERCEL_URL # Automatically set by Vercel

NODE_ENV=preview
```

**Environment Scope:**
- **Production:** Only `main` branch
- **Preview:** All branches except `main`
- **Development:** Local development only (not deployed)

### CI/CD Pipeline

**Automatic Workflow:**

1. **Developer pushes to GitHub**
   - Push to `main` → Deploy to production
   - Push to `staging` → Deploy to staging
   - Open PR → Deploy to preview URL

2. **Vercel runs build**
   - Install dependencies (`npm install`)
   - Run build command (`npm run build`)
   - Upload build artifacts

3. **Deploy to edge network**
   - Static assets to CDN
   - Serverless functions to runtime

4. **Health checks**
   - HTTP 200 response on `/`
   - Function deployment status

5. **Notification**
   - GitHub commit status updated
   - Slack/Discord notification (optional)

**GitHub Integration:**

Vercel GitHub App automatically:
- Detects new commits
- Creates preview deployments for PRs
- Updates commit status (✅ Deployed / ❌ Failed)
- Comments on PR with preview URL

**Optional GitHub Actions:**

Add pre-deployment checks:

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, staging]
  pull_request:

jobs:
  test:
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
```

Vercel waits for checks to pass before deploying (configurable).

### Monitoring & Logging

**Vercel Dashboard:**

1. **Analytics:**
   - Page views
   - Unique visitors
   - Top pages
   - Referrers
   - Devices (mobile/desktop)

2. **Function Logs:**
   - Real-time log streaming
   - Search by function, time, status code
   - 24-hour retention (free tier)
   - 7-day retention (Pro tier)

3. **Performance:**
   - Function execution time
   - Cold start frequency
   - Error rates
   - Web Vitals (LCP, FID, CLS)

4. **Deployments:**
   - Build logs
   - Deployment status
   - Rollback history

**Access Logs:**

```bash
# Install Vercel CLI
npm install -g vercel

# View real-time logs
vercel logs https://poker-sense.vercel.app --follow

# Filter by function
vercel logs https://poker-sense.vercel.app --function app/routes/game.$gameId.tsx
```

**Alerts (Future - Phase 6):**
- Error rate > 5%
- Function duration > 5s
- Bandwidth > 90 GB (near limit)

### Performance Optimization

**Edge Caching:**

Static assets automatically cached at edge locations.

**Custom Cache Headers:**

```typescript
// app/routes/api.scenarios.tsx
export async function loader() {
  const scenarios = await fetchScenarios();

  return json(scenarios, {
    headers: {
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}
```

**Function Duration:**

Target: < 500ms per loader/action.

Optimize:
- Use database indexes
- Cache frequent queries (LRU cache)
- Minimize external API calls

**Bundle Size:**

Target: < 200 KB initial JS bundle.

Optimize:
- Route-based code splitting (automatic in React Router v7)
- Tree-shake unused dependencies
- Use `shadcn/ui` (zero runtime cost)

**Cold Starts:**

Serverless functions have ~100-300ms cold start.

Mitigate:
- Use edge functions for critical paths (future)
- Keep function bundles small (< 1 MB)
- Warm functions with health checks (if needed)

## Database: Supabase

**Platform:** Supabase (Managed PostgreSQL)
**Database:** PostgreSQL 15.x
**Documentation:** [Supabase Docs](https://supabase.com/docs)

### Why Supabase?

- **Free Tier:** 500 MB database, 50k monthly active users, 5 GB bandwidth
- **PostgreSQL:** Full relational database with JSONB, triggers, functions
- **Better Auth Adapter:** Official Supabase adapter for Better Auth
- **Row-Level Security:** Database-enforced authorization
- **Realtime Subscriptions:** WebSocket updates for live gameplay (optional)
- **Dashboard:** SQL editor, table viewer, query performance monitoring
- **Local Development:** Supabase CLI with Docker for production parity

### Free Tier Limits

**Database:**
- 500 MB storage (sufficient for 10k users + game history)
- Unlimited rows
- 100 max connections (15 pooled)

**API:**
- Unlimited requests (fair use policy)
- 5 GB bandwidth/month (database API only)

**Storage:**
- 1 GB file storage (for user avatars, future assets)

**Realtime:**
- 200 concurrent connections
- 2 GB bandwidth/month

**Edge Functions (Optional):**
- 500k invocations/month
- 10 GB bandwidth

**Backups:**
- Daily backups (7-day retention)

**Limitations:**
- **Inactivity Pause:** Projects pause after 7 days of no activity (auto-resume on first request, ~1-2s delay)
- **Region:** Single region deployment (multi-region on Pro tier)

### Supabase Projects

**Production:**
- Project: `poker-sense-prod`
- Region: `us-east-1` (or closest to majority users)
- URL: `https://xxx.supabase.co`

**Staging:**
- Project: `poker-sense-staging`
- Region: `us-east-1` (same as prod for consistency)
- URL: `https://yyy.supabase.co`

**Local Development:**
- Supabase CLI with Docker
- URL: `http://localhost:54321`

### Environment Configuration

**Local (.env.local):**
```bash
# From `supabase start` output
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Staging (Vercel):**
```bash
SUPABASE_URL=https://yyy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Production (Vercel):**
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Key Differences:**
- **Anon Key:** Client-safe, respects RLS policies
- **Service Key:** Server-only, bypasses RLS (admin access)

**Security:**
- Never expose `SUPABASE_SERVICE_KEY` to client
- Use `SUPABASE_ANON_KEY` for client-side queries
- Vercel environment variables are server-only by default

### Monitoring

**Supabase Dashboard:**

1. **Database:**
   - Storage usage (0-500 MB)
   - Connection count
   - Slow queries (> 100ms)
   - RLS policy evaluation time

2. **API:**
   - Request count
   - Bandwidth usage (0-5 GB)
   - Error rates

3. **Table Editor:**
   - View/edit data
   - Run SQL queries
   - Export to CSV

4. **Logs:**
   - Database logs (errors, warnings)
   - API request logs
   - RLS policy denials

**Alerts (Manual):**
- Database size > 450 MB (90% of limit)
- Bandwidth > 4.5 GB (90% of limit)
- Slow queries > 500ms

## Local Development

### Setup

**Prerequisites:**
- Docker Desktop
- Node.js 20.x
- npm

**Initialize Supabase:**

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize in project
cd /home/jimmy/personal/poker-sense
supabase init

# Creates supabase/ directory:
# supabase/
#   config.toml          # Supabase config
#   migrations/          # SQL migrations
#   seed.sql             # Seed data (optional)
```

**Start Local Stack:**

```bash
supabase start

# Output:
# Started supabase local development setup.
#
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323 (Web dashboard)
# Inbucket URL: http://localhost:54324 (Email testing)
# Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Service Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Update `.env.local`:**

```bash
# Supabase (from `supabase start` output)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Better Auth
BETTER_AUTH_SECRET=local-dev-secret-min-32-chars
BETTER_AUTH_URL=http://localhost:5173
```

**Start React Router Dev Server:**

```bash
npm run dev
# Open http://localhost:5173
```

### Development Workflow

**Day-to-day:**

```bash
# Start Supabase (if not running)
supabase start

# Start React Router dev server
npm run dev

# Code, test, iterate...

# Stop Supabase (when done)
supabase stop
```

**Database Changes:**

```bash
# Create migration
supabase migration new add_user_stats_table

# Edit migration file
# supabase/migrations/20251108123456_add_user_stats_table.sql

# Apply migration
supabase db reset # Resets DB and applies all migrations

# Verify in Studio
open http://localhost:54323
```

**Seed Data (Optional):**

```sql
-- supabase/seed.sql
INSERT INTO scenarios (mode, difficulty, config) VALUES
  ('hand_strength', 'beginner', '{"question": "...", "answer": "..."}'),
  ('odds', 'intermediate', '{"question": "...", "answer": "..."}');
```

Apply seed data:
```bash
supabase db reset # Includes seed.sql
```

### Production Parity

Local Supabase stack matches production:
- Same PostgreSQL version (15.x)
- Same RLS policies
- Same migrations
- Same extensions

**Differences:**
- Local: Docker containers
- Production: Managed Supabase infrastructure

## Deployment Workflow

### Development → Staging → Production

**1. Feature Development (Local):**

```bash
# Create feature branch
git checkout -b feature/add-hand-evaluator

# Develop locally (Supabase CLI + Vite)
npm run dev

# Write tests
npm test

# Commit changes
git add .
git commit -m "Add hand evaluator module"

# Push to GitHub
git push origin feature/add-hand-evaluator
```

**2. Pull Request → Preview Deployment:**

```bash
# Open PR on GitHub
# Vercel automatically deploys to preview URL:
# https://poker-sense-pr-42.vercel.app

# Preview uses staging Supabase project
# Test on preview URL (mobile devices, browsers)
```

**3. Merge to Staging:**

```bash
# Merge PR to staging branch
git checkout staging
git merge feature/add-hand-evaluator
git push origin staging

# Vercel auto-deploys to staging:
# https://poker-sense-staging.vercel.app

# Test on staging (QA, UAT)
```

**4. Database Migration (Staging):**

```bash
# Link to staging project
supabase link --project-ref staging-project-ref

# Push local migrations to staging
supabase db push

# Verify migration applied
supabase db remote commit
```

**5. Merge to Production:**

```bash
# Merge staging to main
git checkout main
git merge staging
git push origin main

# Vercel auto-deploys to production:
# https://poker-sense.vercel.app
```

**6. Database Migration (Production):**

```bash
# Link to production project
supabase link --project-ref prod-project-ref

# Push migrations to production
supabase db push

# Verify migration applied
supabase db remote commit
```

**7. Monitor Deployment:**

- Check Vercel deployment status
- Monitor function logs for errors
- Verify database queries succeed
- Test critical user flows (login, game creation)

### Rollback Strategy

**Vercel (Application):**

1. Go to Vercel Dashboard → Deployments
2. Find previous successful deployment
3. Click "⋯" → "Promote to Production"
4. Instant rollback (< 1 minute)

**Supabase (Database):**

Migrations are forward-only. To rollback:

1. Create revert migration:
   ```sql
   -- supabase/migrations/20251108234567_revert_user_stats.sql
   DROP TABLE user_stats;
   ```

2. Apply revert migration:
   ```bash
   supabase db push
   ```

**Best Practice:**
- Test migrations on staging first
- Always create revert migrations for destructive changes
- Keep database changes backward-compatible

## Scaling Considerations

### Free Tier → Paid Tier

**Triggers to Upgrade:**

**Vercel:**
- Bandwidth > 100 GB/month → Upgrade to Pro ($20/month for 1 TB)
- Build minutes > 6000/month → Pro has 24k minutes

**Supabase:**
- Database size > 500 MB → Upgrade to Pro ($25/month for 8 GB)
- Need 24/7 uptime (no inactivity pause) → Pro tier
- Need faster support → Pro tier

### Cost Projection

**10k Monthly Active Users (Current):**
- Vercel: Free tier (< 100 GB bandwidth)
- Supabase: Free tier (< 500 MB database)
- **Total: $0/month**

**100k Monthly Active Users:**
- Vercel Pro: $20/month (1 TB bandwidth)
- Supabase Pro: $25/month (8 GB database, no pause)
- **Total: $45/month**

**1M Monthly Active Users:**
- Vercel Pro: ~$100/month (10 TB bandwidth)
- Supabase Team: ~$100/month (100 GB database)
- **Total: ~$200/month**

**Revenue Threshold:**
- If monthly revenue > $100, upgrade to Pro tier
- If monthly revenue > $500, consider Team tier

### Performance Optimizations

**When to Optimize:**
- Function duration > 1s
- Database queries > 500ms
- Mobile page load > 3s

**Optimizations:**
- Add database indexes
- Implement query caching (LRU cache)
- Use edge functions for critical paths
- Enable Supabase connection pooling
- Compress images (WebP, AVIF)
- Enable Vercel edge caching

## Security

### Environment Variables

**Best Practices:**
- Never commit `.env` files to Git
- Use different secrets for staging/prod
- Rotate secrets every 90 days
- Use strong secrets (32+ chars random)

**Generate Secrets:**
```bash
# Better Auth secret
openssl rand -base64 32

# Or use 1Password, LastPass, etc.
```

**Vercel Security:**
- Environment variables encrypted at rest
- Only accessible to serverless functions (not client)
- Separate by environment (production/preview/development)

**Supabase Security:**
- Service key bypasses RLS (never expose to client)
- Anon key respects RLS (safe for client)
- Rotate keys via Supabase Dashboard → Settings → API

### Row-Level Security

Database enforces authorization (users can't query other users' data).

**Example Policy:**
```sql
-- Users can only view their own progress
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid() = user_id);
```

Test RLS policies:
```sql
-- As user A
SELECT * FROM user_progress; -- Only returns user A's data

-- As user B
SELECT * FROM user_progress; -- Only returns user B's data
```

### HTTPS

All traffic encrypted:
- Vercel: HTTPS by default (auto SSL cert)
- Supabase: HTTPS only (no HTTP)

### Rate Limiting (Future)

Consider Upstash Rate Limit for API abuse prevention (Phase 6).

## Monitoring & Alerting (Future - Phase 6)

### Error Tracking

**Sentry:**
- Capture runtime errors
- Track performance issues
- Source map support
- Slack/email alerts

**Setup:**
```bash
npm install @sentry/react @sentry/vite-plugin
```

```typescript
// app/entry.client.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://xxx@sentry.io/xxx',
  environment: process.env.NODE_ENV,
});
```

### Uptime Monitoring

**BetterStack (formerly BetterUptime):**
- HTTP health checks every 30s
- Alert on downtime (email, Slack, SMS)
- Status page for users

**UptimeRobot (Free):**
- HTTP/ping checks every 5 minutes
- Email alerts
- Public status page

### Analytics

**Vercel Analytics:**
- Included on free tier
- Web Vitals (LCP, FID, CLS)
- Page views, unique visitors
- Real User Monitoring (RUM)

**Plausible (Privacy-focused):**
- Self-hosted or managed ($9/month)
- GDPR compliant
- No cookies
- Real-time dashboard

## Backup & Disaster Recovery

### Vercel

**Deployment History:**
- Vercel stores all deployments indefinitely
- Rollback to any previous deployment
- Source code in Git (GitHub)

**Backup Strategy:**
- Git repository is source of truth
- Push to GitHub regularly
- Tag releases (`v1.0.0`, `v1.0.1`, etc.)

### Supabase

**Automatic Backups:**
- Daily backups (free tier)
- 7-day retention (free tier)
- 30-day retention (Pro tier)

**Manual Backups:**
```bash
# Export database to SQL
supabase db dump -f backup-$(date +%Y%m%d).sql

# Store in S3, Google Cloud Storage, or locally
```

**Restore:**
```bash
# Restore from backup
supabase db reset --db-url <connection-string> -f backup-20251108.sql
```

**Backup Schedule (Recommended):**
- **Daily:** Automatic Supabase backups
- **Weekly:** Manual SQL dump to cloud storage
- **Before Major Deploys:** Manual backup

### Disaster Recovery Plan

**Scenario 1: Vercel Outage**
- Status: Check [Vercel Status](https://www.vercel-status.com/)
- Action: Wait for resolution (historical uptime: 99.99%)
- Mitigation: None needed (Vercel handles redundancy)

**Scenario 2: Supabase Outage**
- Status: Check [Supabase Status](https://status.supabase.com/)
- Action: Wait for resolution
- Mitigation: Restore from backup to new Supabase project (if prolonged)

**Scenario 3: Data Corruption**
- Action: Restore from latest backup
- Steps:
  1. Identify corruption scope
  2. Restore from SQL dump (daily or weekly)
  3. Replay recent transactions (from audit logs)

**Scenario 4: Accidental Deletion**
- Action: Restore from Supabase automatic backup
- Steps:
  1. Contact Supabase support (Pro tier)
  2. Request point-in-time restore
  3. Or restore from manual SQL dump

**RTO (Recovery Time Objective):**
- Target: < 1 hour
- Vercel rollback: < 5 minutes
- Database restore: < 30 minutes

**RPO (Recovery Point Objective):**
- Target: < 24 hours (daily backups)
- Improve to < 1 hour with Pro tier (PITR)

## Related Documentation

- [ADR 002: Deployment Platform Selection](../decisions/002-deployment-platform.md)
- [Database](./database.md)
- [Backend Stack](./backend.md)
- [Frontend Stack](./frontend.md)

## Quick Reference

**Local Development:**
```bash
supabase start          # Start local Supabase
npm run dev            # Start React Router dev server
supabase stop          # Stop local Supabase
```

**Database Migrations:**
```bash
supabase migration new <name>  # Create migration
supabase db reset              # Apply migrations locally
supabase db push               # Push migrations to prod/staging
```

**Deployment:**
```bash
git push origin main           # Deploy to production
git push origin staging        # Deploy to staging
```

**Monitoring:**
```bash
vercel logs <url> --follow     # Stream function logs
vercel deployments             # List deployments
```

**Backup:**
```bash
supabase db dump -f backup.sql # Export database
```
