# Spec Template for Workshop

## Feature: Customer Health Monitoring System

### Context
- Provides proactive customer risk monitoring and early warning capabilities for the Customer Intelligence Dashboard
- Combines the Health Score Calculator (`lib/healthCalculator.ts`) with a Predictive Alerts Engine (`lib/alerts.ts`) into a unified monitoring system
- Used by Customer Success Managers (CSMs) to identify at-risk accounts before churn occurs and prioritize daily workloads
- Sits alongside CustomerSelector, CustomerCard, and MarketIntelligence widgets as a core dashboard component

### Requirements

**Functional Requirements**

- Calculate customer health scores (0–100) using a weighted multi-factor model:
  - Payment history (40%), Engagement (30%), Contract status (20%), Support satisfaction (10%)
- Classify scores into risk levels: Healthy (71–100), Warning (31–70), Critical (0–30)
- Evaluate alert rules against customer data and surface actionable warnings:
  - **High Priority**: Payment overdue >30 days or health score drops >20 pts in 7 days; login frequency drops >50% vs. 30-day average; contract expires <90 days AND health score <50
  - **Medium Priority**: >3 support tickets in 7 days or an escalated ticket; no new feature usage in 30 days for growing accounts
- Deduplicate alerts and enforce cooldown periods to prevent alert fatigue
- Update scores and alerts in real time when the selected customer changes via CustomerSelector

**User Interface Requirements**

- `CustomerHealthDisplay` widget:
  - Overall health score with color-coded gauge/badge (green / amber / red)
  - Expandable breakdown panel showing individual factor scores
  - Loading skeleton and error states consistent with other dashboard widgets
- `AlertsPanel` widget:
  - Prioritized alert list with color-coded severity (red = high, yellow = medium)
  - Per-alert detail panel with recommended action and contextual data
  - Dismiss / mark-actioned controls with confirmation
  - Historical alerts view toggled from the panel header

**Data Requirements**

- Payment history: days since last payment, average payment delay, overdue amounts
- Engagement metrics: login frequency, feature usage count, open support tickets
- Contract information: days until renewal, contract value, recent upgrade history
- Support data: average resolution time, satisfaction score, escalation counts
- Alert state: triggered alerts, cooldown timestamps, dismissal/action audit trail

**Integration Requirements**

- `lib/healthCalculator.ts` — pure calculation functions, no side effects
- `lib/alerts.ts` — pure rule-evaluation functions, no side effects
- CustomerSelector drives customer context; all widgets re-evaluate on selection change
- Color-coding and loading/error patterns must match existing dashboard components

### Constraints

- **Technical stack**: Next.js 15, React 19, TypeScript (strict), Tailwind CSS
- **Architecture**: Pure functions only in `lib/`; no direct API calls or side effects inside calculator/alert modules
- **File structure**:
  - `lib/healthCalculator.ts` — scoring functions + `calculateHealthScore`
  - `lib/alerts.ts` — rule functions + `alertEngine`
  - `components/CustomerHealthDisplay.tsx`
  - `components/AlertsPanel.tsx`
- **TypeScript interfaces** required for all inputs, outputs, alert types, and component props; extend base `Error` for custom error classes
- **JSDoc comments** on all exported functions explaining business logic and formulas
- **Performance**: calculations must complete synchronously in <5 ms per customer; support caching for repeated calls with identical inputs
- **Security**: no sensitive customer data (PII, raw financials) exposed in alert message strings; input validation on all data before calculation; rate-limit alert generation
- **Responsive design**: widgets must render correctly at dashboard breakpoints (mobile 375 px, tablet 768 px, desktop 1280 px)
- **Component size**: individual widget files ≤300 lines; extract sub-components when needed

### Acceptance Criteria

- [ ] `calculateHealthScore` returns a score in [0, 100] and correct risk level for all valid inputs
- [ ] Each individual factor scoring function (payment, engagement, contract, support) returns a normalized value in [0, 100]
- [ ] Invalid or missing input data triggers descriptive validation errors (custom Error subclass)
- [ ] `alertEngine` generates the correct alert type(s) for each documented trigger condition
- [ ] Duplicate alerts for the same customer/issue within the cooldown window are suppressed
- [ ] `CustomerHealthDisplay` renders the correct color, score, and factor breakdown for Healthy, Warning, and Critical states
- [ ] `AlertsPanel` renders high-priority alerts above medium-priority alerts
- [ ] Dismissing an alert updates audit trail and removes it from the active list
- [ ] All widgets display loading skeletons while data is fetching
- [ ] All widgets display error states with a retry action when data fetching fails
- [ ] Selecting a new customer via CustomerSelector triggers score recalculation and alert re-evaluation
- [ ] Unit tests cover: all factor scoring functions, boundary values (0, 30, 70, 100), all alert rule triggers, deduplication logic, and input validation paths
- [ ] No sensitive customer data appears in rendered alert message strings
- [ ] Responsive layout verified at 375 px, 768 px, and 1280 px viewport widths
