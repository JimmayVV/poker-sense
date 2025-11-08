# Core Assumptions

> **Status:** Defined in Phase 1 (Issue #9)
> **Last Updated:** 2025-11-08

## Overview

This document identifies and validates all assumptions about users, technology, usage patterns, and business model for the poker-sense MVP. Each assumption includes a confidence level, impact assessment, and validation strategy. Challenging these assumptions early reduces risk and informs architectural decisions.

**Rating System:**
- **Confidence:** High (80%+) | Medium (50-80%) | Low (<50%)
- **Impact:** Critical (blocks MVP) | High (major feature impact) | Medium (feature quality) | Low (nice-to-have)
- **Validation:** Research (desk research) | Prototype (build to learn) | MVP (validate with real users) | Analytics (post-launch data)

---

## User Assumptions

### UA-1: Target Skill Level
**Assumption:** Users are beginner to intermediate poker players who want to improve tournament decision-making.

**Confidence:** High (90%)
**Impact:** Critical (affects training content difficulty)

**Rationale:**
- Experienced players likely use GTO solvers (PioSolver, GTO+)
- Complete beginners need hand rules explanations (out of MVP scope)
- Intermediate players benefit most from scenario training

**Validation Method:** MVP (user feedback on scenario difficulty)

**Risk if Wrong:**
- Scenarios too advanced → users frustrated, abandon
- Scenarios too basic → users bored, no learning value

**Mitigation:**
- Offer 3 difficulty levels (beginner, intermediate, advanced)
- Start with beginner scenarios, unlock harder ones
- Track completion rates by difficulty

---

### UA-2: Device Usage Pattern
**Assumption:** 70% mobile usage, 30% desktop usage.

**Confidence:** Medium (70%)
**Impact:** Critical (affects design priority)

**Rationale:**
- Training apps typically used on mobile (commutes, casual sessions)
- Desktop users likely more serious (longer sessions)
- Mobile-first mandated by project requirements

**Validation Method:** Analytics (track device types post-launch)

**Risk if Wrong:**
- Higher desktop usage → over-optimized for mobile, desktop UX suffers
- Higher mobile usage → validates mobile-first approach

**Mitigation:**
- Design mobile-first, ensure desktop usable (not optimized)
- Track device analytics from day 1
- Adjust priorities in Phase 8 based on data

---

### UA-3: Session Duration
**Assumption:** Users spend 10-20 minutes per session on average, completing 3-5 scenarios.

**Confidence:** Medium (65%)
**Impact:** Medium (affects scenario pacing, engagement)

**Rationale:**
- Similar training apps: Duolingo (~15 min), Brilliant (~20 min)
- 6-max Sit-n-Go takes ~15 minutes
- Training scenarios designed for 2-4 minutes each

**Validation Method:** Analytics (track session duration, scenarios per session)

**Risk if Wrong:**
- Longer sessions → add more scenarios per mode
- Shorter sessions → simplify scenarios, reduce cognitive load

**Mitigation:**
- Design scenarios for 2-4 min completion
- Track abandonment rates (if high, scenarios too long)
- Add session goals (e.g., "Complete 3 scenarios today")

---

### UA-4: Learning Goals
**Assumption:** Users want to improve cash tournament results, not just learn poker theory.

**Confidence:** High (85%)
**Impact:** High (affects training design philosophy)

**Rationale:**
- App is "trainer," not "tutorial"
- Scenario-based learning is practical, not theoretical
- Progress tracking emphasizes win rate, accuracy

**Validation Method:** MVP (user feedback on training effectiveness)

**Risk if Wrong:**
- Users want theory → add "learn more" links to external resources
- Users want practice → validates scenario approach

**Mitigation:**
- Focus on actionable scenarios (not theory lectures)
- Add "Why?" explanations after each scenario
- Defer video tutorials to post-MVP

---

### UA-5: Age Restriction
**Assumption:** Users are 18+ (legal gambling age awareness).

**Confidence:** High (90%)
**Impact:** Low (no enforcement in MVP)

**Rationale:**
- Poker has gambling associations (even play money)
- 18+ avoids legal issues in jurisdictions with gambling laws
- No age verification in MVP (honor system only)

**Validation Method:** Legal (terms of service disclaimer)

**Risk if Wrong:**
- Users under 18 access → legal risk in some jurisdictions

**Mitigation:**
- Display "18+ recommended" disclaimer
- Terms of service require 18+ agreement
- No real money (reduces legal risk)

---

### UA-6: Poker Knowledge
**Assumption:** Users know basic poker rules (hand rankings, betting actions, blinds).

**Confidence:** High (90%)
**Impact:** Critical (no tutorial content in MVP)

**Rationale:**
- Target is "improve skills," not "learn to play"
- Adding tutorial content triples scope
- Basic rules widely available online

**Validation Method:** MVP (track scenario completion rates)

**Risk if Wrong:**
- Users don't know rules → high abandonment on first scenario

**Mitigation:**
- Display "Requires basic poker knowledge" on signup
- Link to external poker rules resources
- Track first scenario completion rate (if < 50%, add tutorial)

---

## Technical Assumptions

### TA-1: Browser Support
**Assumption:** Users use modern browsers (Chrome 100+, Safari 15+, Firefox 100+, Edge 100+). IE11 not supported.

**Confidence:** High (95%)
**Impact:** Medium (affects polyfill needs)

**Rationale:**
- IE11 end of life (June 2022)
- Mobile Safari 15+ covers iOS 15+ (released Sept 2021, 95%+ adoption)
- Chrome 100+ covers Android 5+ (2014 devices)

**Validation Method:** Analytics (track browser versions)

**Risk if Wrong:**
- Older browsers → app broken for some users

**Mitigation:**
- Show "unsupported browser" warning (detect via user agent)
- Use modern JavaScript (no polyfills for IE11)
- Test on iOS Safari 15, Android Chrome 100

---

### TA-2: Network Stability
**Assumption:** Users have stable internet connections (3G minimum). No offline mode required.

**Confidence:** Medium (70%)
**Impact:** Medium (affects error handling)

**Rationale:**
- Training requires server communication (game logic server-side)
- Mobile networks generally stable in target markets (US, EU)
- Offline mode adds significant complexity

**Validation Method:** Analytics (track network errors)

**Risk if Wrong:**
- Frequent disconnections → poor UX, high abandonment

**Mitigation:**
- Graceful error handling (retry failed requests)
- Show "no connection" message (actionable)
- Cache training scenarios locally (IndexedDB)
- Defer offline mode to post-MVP

---

### TA-3: Screen Size Support
**Assumption:** Users have screens 320px+ width (iPhone SE and larger).

**Confidence:** High (95%)
**Impact:** High (affects responsive breakpoints)

**Rationale:**
- iPhone SE (2016) has 320px width (< 1% market share)
- Modern phones start at 360px width (Galaxy S8+)
- Mobile-first design prioritizes 360px+

**Validation Method:** Analytics (track screen resolutions)

**Risk if Wrong:**
- Smaller screens → UI broken, unplayable

**Mitigation:**
- Test on 320px width (iPhone SE emulator)
- Use responsive design (Tailwind breakpoints: sm:360px+)
- Minimum font size 14px (readable on small screens)

---

### TA-4: Performance Expectations
**Assumption:** Users expect < 3 second initial load and < 1 second action responsiveness on mobile.

**Confidence:** High (85%)
**Impact:** Critical (affects retention)

**Rationale:**
- Google research: 53% mobile users abandon if load > 3s
- Gaming apps feel "responsive" at < 1s latency
- Mobile-first mandates fast performance

**Validation Method:** Analytics (track Web Vitals: LCP, FID, CLS)

**Risk if Wrong:**
- Slower load → high bounce rate, poor retention

**Mitigation:**
- Target < 150kb JavaScript bundle (gzipped)
- Code splitting per route (lazy load)
- Monitor Lighthouse scores (90+ mobile)
- Optimize images (WebP format, lazy load)

---

### TA-5: JavaScript Required
**Assumption:** Users have JavaScript enabled (required for app to function).

**Confidence:** High (99%)
**Impact:** Critical (app is SPA, no SSR fallback)

**Rationale:**
- React apps require JavaScript
- < 1% users disable JavaScript (accessibility tools, privacy browsers)
- No SSR fallback in MVP (added complexity)

**Validation Method:** Analytics (track JS disabled visits)

**Risk if Wrong:**
- Users with JS disabled → blank page, no fallback

**Mitigation:**
- Show `<noscript>` message: "JavaScript required"
- Defer SSR fallback to post-MVP if analytics show demand

---

### TA-6: Storage Availability
**Assumption:** Users have localStorage available (5 MB minimum). No IndexedDB required for MVP.

**Confidence:** High (95%)
**Impact:** Medium (affects persistence strategy)

**Rationale:**
- localStorage supported in all modern browsers
- 5 MB sufficient for user preferences, in-progress scenarios
- IndexedDB adds complexity (defer to post-MVP if needed)

**Validation Method:** Feature detection (localStorage.setItem test)

**Risk if Wrong:**
- localStorage full → app breaks, can't save progress

**Mitigation:**
- Feature detect localStorage on app load
- Show error if unavailable: "Browser storage required"
- Clear old data periodically (LRU cache)

---

## Usage Pattern Assumptions

### UP-1: Daily Active Users (DAU)
**Assumption:** Start with < 100 DAU, grow to 500-1000 DAU within 3 months post-launch.

**Confidence:** Low (40%)
**Impact:** Medium (affects infrastructure scaling)

**Rationale:**
- Organic growth only (no marketing budget)
- Poker community is niche (forums, Reddit r/poker ~500k members)
- Similar apps (PokerSnowie, GTO+) have small but dedicated user bases

**Validation Method:** Analytics (track DAU, growth rate)

**Risk if Wrong:**
- Higher growth → exceed free tier limits, need paid tier
- Lower growth → validates MVP, iterate on features

**Mitigation:**
- Monitor Vercel bandwidth (alert at 80GB of 100GB free tier)
- Monitor Supabase DB size (alert at 400MB of 500MB)
- Prepare upgrade plan if limits approached

---

### UP-2: Concurrent Users
**Assumption:** < 50 concurrent users at peak times.

**Confidence:** Medium (60%)
**Impact:** High (affects serverless function concurrency)

**Rationale:**
- Low DAU (< 1000) → concurrent users unlikely to spike
- Vercel free tier: 100 concurrent function executions
- Peak times: evenings, weekends

**Validation Method:** Analytics (track concurrent sessions)

**Risk if Wrong:**
- Higher concurrency → serverless functions throttled, slow responses

**Mitigation:**
- Monitor Vercel function concurrency
- Add queue system if throttling occurs (defer to post-MVP)
- Upgrade to paid tier if sustained high concurrency

---

### UP-3: Scenarios per Session
**Assumption:** Users complete 3-5 scenarios per session on average.

**Confidence:** Medium (65%)
**Impact:** Medium (affects content pacing, database load)

**Rationale:**
- Session duration 10-20 min → 3-5 scenarios at 2-4 min each
- Duolingo users complete ~5 lessons per session
- Engagement drops after 20 minutes (fatigue)

**Validation Method:** Analytics (track scenarios completed per session)

**Risk if Wrong:**
- Fewer scenarios → users want longer sessions, add more content
- More scenarios → validates pacing

**Mitigation:**
- Design for 3-5 scenarios initially
- Add "Daily Challenge" (bonus scenario) if users want more
- Track completion rates (adjust pacing if high abandonment)

---

### UP-4: Retention Rates
**Assumption:** 40% day-7 retention, 20% day-30 retention.

**Confidence:** Low (30%)
**Impact:** High (validates MVP success)

**Rationale:**
- Gaming apps: 20-40% day-7 retention typical
- Educational apps: 30-50% day-7 retention
- No data for poker training apps specifically

**Validation Method:** Analytics (cohort analysis post-launch)

**Risk if Wrong:**
- Lower retention → poor product-market fit, iterate on features
- Higher retention → successful MVP, expand content

**Mitigation:**
- Track retention from day 1
- Interview churned users (exit survey)
- A/B test onboarding, scenario difficulty

---

### UP-5: Peak Usage Times
**Assumption:** Peak usage evenings (6-10 PM local time) and weekends.

**Confidence:** Medium (70%)
**Impact:** Low (affects monitoring, scaling)

**Rationale:**
- Gaming/training apps peak after work hours
- Poker players active evenings, weekends

**Validation Method:** Analytics (hourly/daily usage patterns)

**Risk if Wrong:**
- Different peak times → adjust monitoring, support hours

**Mitigation:**
- Monitor usage patterns post-launch
- Scale infrastructure if unexpected peaks

---

## Business Assumptions

### BA-1: Monetization
**Assumption:** No monetization for MVP. Defer to post-launch based on user feedback.

**Confidence:** High (95%)
**Impact:** Low (MVP is validation, not revenue)

**Rationale:**
- Free app validates product-market fit
- Monetization adds complexity (payment processing, premium features)
- User feedback informs monetization strategy (ads vs subscriptions vs one-time purchase)

**Validation Method:** MVP (user surveys on willingness to pay)

**Risk if Wrong:**
- Users expect free forever → hard to monetize later

**Mitigation:**
- Display "Early Access - Free during beta" message
- Survey users post-launch: "Would you pay for premium scenarios?"
- Explore freemium model (free basic, paid advanced scenarios)

---

### BA-2: Growth Strategy
**Assumption:** Organic growth via poker communities (Reddit, 2+2 forums, Discord servers).

**Confidence:** Medium (60%)
**Impact:** Medium (affects user acquisition rate)

**Rationale:**
- No marketing budget (free tier only)
- Poker community is active online (r/poker, TwoPlusTwo, Upswing Discord)
- Word-of-mouth if training is effective

**Validation Method:** MVP (track referral sources)

**Risk if Wrong:**
- Slow growth → iterate on features, add viral mechanics (referral bonuses)
- Fast growth → validates product-market fit

**Mitigation:**
- Add "Share your progress" feature (Twitter, Discord)
- Track referral sources (UTM parameters)
- Engage with poker communities (share free tool)

---

### BA-3: Support Model
**Assumption:** Self-service support (docs, FAQ, GitHub issues). No live support for MVP.

**Confidence:** High (85%)
**Impact:** Low (solo developer can't provide live support)

**Rationale:**
- Solo developer, limited time
- GitHub issues for bug reports
- FAQ for common questions

**Validation Method:** MVP (track support requests)

**Risk if Wrong:**
- High support demand → users frustrated, poor experience

**Mitigation:**
- Comprehensive FAQ
- GitHub issue templates (bug report, feature request)
- Email for critical issues only
- Add live chat post-MVP if demand justifies

---

### BA-4: Content Cadence
**Assumption:** Launch with 20-30 scenarios, add 5 new scenarios per month post-MVP.

**Confidence:** Medium (70%)
**Impact:** Medium (affects long-term engagement)

**Rationale:**
- 20-30 scenarios sufficient for MVP validation
- Users complete ~20 scenarios in first month
- 5 scenarios per month keeps content fresh

**Validation Method:** Analytics (track scenario completion rates)

**Risk if Wrong:**
- Users complete all scenarios quickly → churn, no reason to return

**Mitigation:**
- Prioritize high-completion scenarios (most engaging)
- Add difficulty levels (same scenario, harder opponent AI)
- User-generated scenarios (community content, deferred)

---

### BA-5: Cost per User
**Assumption:** Stay within free tier limits (< $0/month) for up to 10,000 MAU.

**Confidence:** Medium (65%)
**Impact:** Critical (budget constraint)

**Rationale:**
- Vercel free tier: 100 GB bandwidth → ~10k mobile users
- Supabase free tier: 500 MB DB → ~10k users with game history
- Efficient queries, optimized bundle size

**Validation Method:** Monitoring (track bandwidth, DB size)

**Risk if Wrong:**
- Exceed free tier → unexpected costs, need paid tier

**Mitigation:**
- Monitor usage weekly
- Optimize database queries (indexes, pagination)
- Compress assets (WebP images, gzip)
- Alert at 80% of free tier limits

---

## Learning Assumptions

### LA-1: Training Effectiveness
**Assumption:** Users improve measurably after completing 10+ scenarios (accuracy rate increases, decision time decreases).

**Confidence:** Medium (60%)
**Impact:** Critical (validates MVP success)

**Rationale:**
- Scenario-based learning proven effective (Duolingo, Brilliant)
- Poker is skill-based (practice improves results)
- Feedback loop critical (immediate explanation after decisions)

**Validation Method:** Analytics (track accuracy rate over time, decision time trends)

**Risk if Wrong:**
- No improvement → training ineffective, redesign scenarios

**Mitigation:**
- Track performance metrics (accuracy, decision time)
- A/B test feedback styles (text vs visual)
- Interview users: "Did you improve?"

---

### LA-2: Feedback Preference
**Assumption:** Users prefer immediate feedback (right after scenario) over delayed feedback.

**Confidence:** High (80%)
**Impact:** High (affects training UX)

**Rationale:**
- Gaming psychology: instant feedback more engaging
- Delayed feedback requires users to remember context
- Educational apps prioritize immediate feedback

**Validation Method:** MVP (user feedback on training experience)

**Risk if Wrong:**
- Users prefer delayed → batch feedback at end of session

**Mitigation:**
- Default to immediate feedback
- Add "Review all at end" option post-MVP if requested

---

### LA-3: Engagement Mechanics
**Assumption:** Progress tracking (charts, percentages, completion status) increases engagement more than gamification (badges, leaderboards).

**Confidence:** Medium (55%)
**Impact:** Medium (affects analytics dashboard design)

**Rationale:**
- Target audience: improvement-focused, not achievement-focused
- Progress tracking is practical (shows skill growth)
- Gamification can feel gimmicky for serious players

**Validation Method:** MVP (A/B test progress dashboard vs badges)

**Risk if Wrong:**
- Users want gamification → add badges, streaks, achievements

**Mitigation:**
- Launch with progress tracking only
- Survey users: "Would you like badges/achievements?"
- Add gamification in Phase 8 if requested

---

### LA-4: Difficulty Progression
**Assumption:** Users want progressive difficulty (start easy, unlock harder scenarios).

**Confidence:** High (85%)
**Impact:** High (affects scenario design, unlocking logic)

**Rationale:**
- Skill-building requires scaffolding (easy → hard)
- Unlocking creates sense of progression
- Prevents overwhelming users with hard scenarios early

**Validation Method:** MVP (track scenario completion rates by difficulty)

**Risk if Wrong:**
- Users want all scenarios unlocked → remove gating

**Mitigation:**
- Default to progressive unlocking
- Add "Unlock all" option for advanced users
- Track abandonment rates (if high on beginner, adjust difficulty)

---

## Technology Assumptions

### TA-7: Poker Library
**Assumption:** Custom hand evaluator is sufficient (no need for external poker library like `poker-evaluator` npm).

**Confidence:** Medium (65%)
**Impact:** High (affects game engine development time)

**Rationale:**
- Hand evaluation is deterministic (lookup tables fast)
- External libraries add dependencies (maintenance risk)
- Custom implementation allows 100% test coverage

**Validation Method:** Prototype (build hand evaluator, benchmark performance)

**Risk if Wrong:**
- Custom evaluator too slow → use `poker-evaluator` library

**Mitigation:**
- Prototype hand evaluator in Phase 3 (Week 3-4)
- Benchmark: < 1ms per hand evaluation
- Fallback to `poker-evaluator` if performance insufficient

---

### TA-8: Randomness
**Assumption:** `Crypto.getRandomValues()` provides sufficient randomness for card shuffling.

**Confidence:** High (90%)
**Impact:** High (affects game fairness)

**Rationale:**
- `Crypto.getRandomValues()` is cryptographically secure
- No need for external RNG libraries
- Sufficient for poker card shuffling

**Validation Method:** Testing (statistical tests for card distribution)

**Risk if Wrong:**
- Biased card distribution → unfair games, user complaints

**Mitigation:**
- Unit test card shuffling (chi-square test for distribution)
- Seed RNG with timestamp + user ID (reproducible shuffles for testing)

---

### TA-9: State Persistence
**Assumption:** Zustand + localStorage sufficient for state persistence. No IndexedDB or Supabase realtime needed.

**Confidence:** High (85%)
**Impact:** Medium (affects state architecture)

**Rationale:**
- localStorage sufficient for MVP (user preferences, in-progress scenarios)
- IndexedDB adds complexity (defer to post-MVP)
- Supabase realtime not needed (AI opponents only, no live multiplayer)

**Validation Method:** MVP (test persistence across sessions, browser refreshes)

**Risk if Wrong:**
- localStorage insufficient → migrate to IndexedDB

**Mitigation:**
- Monitor localStorage usage (5 MB limit)
- Clear stale data periodically (LRU cache)
- Defer IndexedDB until needed

---

## Validation Summary

### High-Confidence Assumptions (80%+)
- UA-4: Learning goals (improve tournament results)
- UA-5: Age restriction (18+)
- UA-6: Poker knowledge (users know basic rules)
- TA-1: Browser support (modern browsers only)
- TA-3: Screen size (320px+ width)
- TA-4: Performance expectations (< 3s load)
- TA-5: JavaScript required
- TA-6: Storage availability (localStorage)
- BA-1: No monetization for MVP
- BA-3: Self-service support
- LA-2: Immediate feedback preferred
- LA-4: Progressive difficulty
- TA-8: Crypto randomness sufficient
- TA-9: localStorage sufficient

### Medium-Confidence Assumptions (50-80%)
- UA-2: Device usage (70% mobile)
- UA-3: Session duration (10-20 min)
- TA-2: Network stability (3G minimum)
- UP-1: DAU growth (500-1000 in 3 months)
- UP-2: Concurrent users (< 50 peak)
- UP-3: Scenarios per session (3-5)
- UP-5: Peak usage times (evenings, weekends)
- BA-2: Organic growth via communities
- BA-4: Content cadence (5 scenarios/month)
- BA-5: Cost per user (free tier sufficient)
- LA-1: Training effectiveness (measurable improvement)
- LA-3: Progress tracking > gamification
- TA-7: Custom hand evaluator sufficient

### Low-Confidence Assumptions (<50%)
- UP-1: DAU growth (specific numbers highly uncertain)
- UP-4: Retention rates (40% D7, 20% D30)

### Critical Risks
1. **Exceed free tier limits** (BA-5) → Monitor usage, upgrade plan ready
2. **Training not effective** (LA-1) → Track metrics, iterate on scenarios
3. **Users lack basic poker knowledge** (UA-6) → Track first scenario completion
4. **Performance too slow** (TA-4) → Bundle size optimization, Lighthouse monitoring
5. **Custom hand evaluator slow** (TA-7) → Benchmark early, fallback to library

---

## Related Documentation

- [Project Boundaries](./project-boundaries.md) - Scope decisions inform assumptions
- [Development Roadmap](../development/roadmap.md) - Validation timeline
- [Tech Stack](../decisions/001-tech-stack.md) - Technical assumptions validated
- [Testing Strategy](../decisions/004-testing-strategy.md) - Assumption validation via tests

---

## Changelog

- **2025-11-08:** Initial assumptions documented (Issue #9, Phase 1)
  - 30+ assumptions across 5 categories
  - Confidence, impact, and validation method per assumption
  - Critical risks identified with mitigation strategies
