# Spec Template for Workshop

## Feature: PredictiveIntelligence

### Context
- Unified intelligence layer that combines proactive customer risk alerting with real-time market sentiment analysis into a single dashboard surface
- Predictive Alerts Engine (`lib/alerts.ts`) surfaces early warning signals from customer behavioral data; Market Intelligence Service (`lib/marketIntelligence.ts`) enriches risk context with external company news and sentiment
- Used by Customer Success Managers to correlate internal health signals with external market events — e.g., a declining health score alongside negative company news strengthens the case for immediate outreach
- Sits alongside CustomerHealthDisplay in the dashboard; receives customer context from CustomerSelector and passes company name to the market intelligence API route

### Requirements

**Functional Requirements**

- Predictive Alerts Engine evaluating five rule types against customer data:
  - **High Priority**: Payment overdue >30 days OR health score drops >20 pts in 7 days
  - **High Priority**: Login frequency drops >50% vs. 30-day average (Engagement Cliff)
  - **High Priority**: Contract expires <90 days AND health score <50
  - **Medium Priority**: >3 support tickets in 7 days OR any escalated ticket
  - **Medium Priority**: No new feature usage in 30 days for growing accounts
- Deduplication logic suppresses repeated alerts for the same customer/rule within a configurable cooldown window
- Alert history tracking with full audit trail (triggered, dismissed, actioned)
- Market Intelligence API route at `/api/market-intelligence/[company]`:
  - Validates and sanitizes company name input
  - Returns sentiment classification (positive / neutral / negative), news article count, top 3 headlines with source and publication date, and last-updated timestamp
  - Simulates realistic API delay; uses mock data generation for reliable, predictable behavior
  - 10-minute TTL cache per company to reduce redundant calls
- `PredictiveIntelligenceWidget` combines alerts and market sentiment in a single panel:
  - Prioritized alert list (high before medium) with color-coded severity
  - Per-alert detail drawer with recommended action and supporting data
  - Market sentiment badge with color indicator (green / yellow / red) and headline list
  - Dismiss / mark-actioned controls updating audit trail
  - Historical alerts view toggled from panel header

**User Interface Requirements**

- Alert list: high-priority items in red, medium-priority in yellow; sorted by priority then recency
- Per-alert detail panel: rule description, triggering data snapshot, recommended action, customer ARR context
- Market sentiment section: color-coded sentiment badge, article count, last-updated timestamp, top 3 headlines with source
- Company name input field (pre-populated from CustomerSelector) with inline validation
- Loading skeletons for both alerts and market data while fetching
- Error states with retry action for both sub-systems, independently recoverable
- `aria-live` region announces new high-priority alerts automatically

**Data Requirements**

- Alert inputs per customer: health score history (7-day window), login frequency (30-day average + current), payment overdue days, support ticket count and escalation flag (7-day window), feature usage recency, contract expiry days, ARR
- Alert output per triggered rule: `alertId`, `customerId`, `type`, `priority`, `triggeredAt`, `cooldownUntil`, `status` (active / dismissed / actioned), `auditTrail[]`
- Market intelligence response: `company`, `sentiment` (positive | neutral | negative), `newsCount`, `headlines[]` (`title`, `source`, `publishedAt`), `cachedAt`, `ttlSeconds`
- Deduplication key: `customerId + alertType + cooldownWindow`

**Integration Requirements**

- `lib/alerts.ts` — pure rule-evaluation functions + `alertEngine` orchestrator; no side effects
- `lib/marketIntelligence.ts` — `MarketIntelligenceService` class with TTL cache and `MarketIntelligenceError` custom error class
- `/api/market-intelligence/[company]` — Next.js 15 App Router Route Handler
- CustomerSelector drives customer context; both alerts and market data re-evaluate on selection change
- Color coding, loading skeletons, and error patterns match existing dashboard widgets
- `PredictiveIntelligenceWidget` integrates into the main dashboard grid alongside CustomerHealthDisplay without layout regressions

### Constraints

- **Technical stack**: Next.js 15 App Router, React 19, TypeScript (strict), Tailwind CSS
- **File structure**:
  - `lib/alerts.ts` — pure alert rule functions + `alertEngine`
  - `lib/marketIntelligence.ts` — `MarketIntelligenceService` + cache + error class
  - `app/api/market-intelligence/[company]/route.ts` — Route Handler
  - `components/PredictiveIntelligenceWidget.tsx` — combined UI component
  - `components/AlertDetailDrawer.tsx` — per-alert detail panel (extracted sub-component)
- **TypeScript interfaces** required for: all alert types, customer data inputs, market intelligence request/response, component props; `MarketIntelligenceError` and alert error classes extend `Error`
- **Pure functions**: all logic in `lib/alerts.ts` must be pure (no side effects, no API calls); `MarketIntelligenceService` encapsulates side effects and is injected/mocked in tests
- **Security**:
  - Company name validated against allowlist pattern (alphanumeric + spaces/hyphens, max 100 chars) before use in mock data generation
  - No sensitive customer PII or financials in alert message strings or API responses
  - Error responses sanitized — no stack traces or internal paths in production
  - Rate limiting on `/api/market-intelligence/[company]` (configurable; default 30 req/min per IP)
- **Caching**: market intelligence responses cached in-memory with 10-minute TTL; cache key = normalized company name (lowercase, trimmed)
- **Performance**: `alertEngine` must complete synchronously in <5 ms for up to 500 customers; market API responses served from cache in <20 ms
- **Component size**: `PredictiveIntelligenceWidget.tsx` ≤ 300 lines; extract `AlertDetailDrawer` when detail panel logic exceeds ~80 lines
- **Responsive design**: widget renders correctly at 375 px, 768 px, and 1280 px breakpoints

### Acceptance Criteria

- [ ] `alertEngine` triggers the correct alert type and priority for each of the five documented rule conditions
- [ ] No duplicate alert is generated for the same `customerId + alertType` within the active cooldown window
- [ ] Dismissing or actioning an alert updates `status` and appends an entry to `auditTrail[]`
- [ ] High-priority alerts always render above medium-priority alerts in the widget
- [ ] Alert detail drawer displays rule description, triggering data snapshot, recommended action, and customer ARR
- [ ] `aria-live` region announces new high-priority alerts without requiring user interaction
- [ ] `/api/market-intelligence/[company]` returns valid sentiment, news count, and headlines for a valid company name
- [ ] API returns 400 for company names failing validation (empty, >100 chars, disallowed characters)
- [ ] API returns 429 when rate limit is exceeded
- [ ] Subsequent requests within the 10-minute TTL window are served from cache (verified by response time <20 ms and `cachedAt` timestamp unchanged)
- [ ] Sentiment badge renders green for positive, yellow for neutral, red for negative
- [ ] Market intelligence section and alerts section each display independent loading skeletons while their respective data loads
- [ ] A failure in the market intelligence API does not suppress or break the alerts panel, and vice versa
- [ ] Selecting a new customer via CustomerSelector triggers alert re-evaluation and a market intelligence fetch for the new company name
- [ ] No stack traces, file paths, or sensitive customer data appear in error messages rendered in the UI or returned in API error responses
- [ ] Unit tests cover: all five alert rule functions, deduplication logic, cooldown expiry, `alertEngine` with mixed rule inputs, `MarketIntelligenceService` cache hit/miss/expiry, and input validation for the API route
- [ ] Widget renders correctly and passes axe-core accessibility scan at all three responsive breakpoints
