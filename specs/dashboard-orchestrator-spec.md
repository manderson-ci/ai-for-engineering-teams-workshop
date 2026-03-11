# Spec Template for Workshop

## Feature: DashboardOrchestrator

### Context
- Top-level orchestration layer that composes all Customer Intelligence Dashboard widgets into a production-ready, enterprise-grade application
- Wraps CustomerSelector, CustomerCard, CustomerHealthDisplay, AlertsPanel, and MarketIntelligence in a unified error boundary and performance optimization hierarchy
- Used by Customer Success Managers as their primary daily interface; must be reliable, accessible, and fast under business-critical conditions
- Sits at `app/page.tsx` (or equivalent layout entry point) and owns global concerns: error handling, data export, accessibility, security hardening, and deployment configuration

### Requirements

**Functional Requirements**

- Multi-level error boundary system that isolates failures per widget without taking down the full dashboard:
  - `DashboardErrorBoundary` — application-level catch-all with full-page fallback
  - `WidgetErrorBoundary` — per-widget isolation with inline error UI and retry action
  - Retry limits (e.g., max 3 attempts) with user feedback after exhaustion
  - Development mode shows full stack traces; production mode shows sanitized messages only
- Data export system covering all major data sources:
  - Customer data in CSV and JSON with configurable customer segment and date range filters
  - Health score reports including historical data and factor breakdown
  - Alert history and audit logs for compliance
  - Market intelligence summaries and trend reports
  - Progress indicator and cancellation support for exports; streaming for large datasets
  - Export audit logging with user identity and timestamp
- Performance optimizations applied across all existing widgets without breaking functionality:
  - `React.memo` / `useMemo` / `useCallback` on expensive components and callbacks
  - `React.lazy` + `Suspense` boundaries for code-split widgets
  - Virtual scrolling for customer lists and data tables
  - Service worker for offline capability and static asset caching
- Accessibility compliance (WCAG 2.1 AA) across the full dashboard:
  - Skip-to-content link at top of page
  - Logical tab order with visible focus indicators meeting WCAG contrast ratios
  - `aria-live` regions for dynamic alert and health score updates
  - Modal/popover focus trap; keyboard shortcuts for common actions
  - High-contrast mode support
- Security hardening applied at the Next.js configuration and component levels:
  - CSP headers, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`
  - Input sanitization for all search queries and user-provided data
  - Sensitive data redacted from error messages and client-side logs
  - CSRF protection on API routes; HTTPS enforcement
  - Rate limiting on export endpoints

**User Interface Requirements**

- Single-page dashboard layout composing all widgets with responsive grid (mobile 375 px, tablet 768 px, desktop 1280 px)
- Per-widget error state: inline error card with icon, human-readable message, and "Retry" button
- Full-page error fallback: branded error screen with "Reload" and "Export logs" options
- Export panel: triggered from a dashboard toolbar button; shows format selector, filter controls, progress bar, and cancel button
- Loading skeleton for each widget during initial data fetch and lazy-load
- Toast / notification system for export completion, retry exhaustion, and system-level warnings

**Data Requirements**

- Aggregates data from all existing widget data sources (customer list, health scores, alerts, market intelligence)
- Export payloads formatted per destination (CSV flattened, JSON nested); file names include dataset type + ISO timestamp
- Error events include: component name, error message (sanitized), user ID (hashed), timestamp, and retry count
- Performance metrics collected: FCP, LCP, CLS, TTI, and component render durations

**Integration Requirements**

- Wraps all previously built components; must not alter their internal APIs
- Health check endpoint at `/api/health` returning system and dependency status (for load balancer / uptime monitoring)
- Production logging integration (structured JSON logs) with appropriate log levels per environment
- CDN-ready static asset configuration in `next.config.ts`

### Constraints

- **Technical stack**: Next.js 15, React 19, TypeScript (strict), Tailwind CSS
- **File structure**:
  - `components/DashboardErrorBoundary.tsx`
  - `components/WidgetErrorBoundary.tsx`
  - `lib/exportUtils.ts` — format-specific export handlers (pure functions)
  - `app/api/health/route.ts` — health check endpoint
  - `next.config.ts` — security headers + bundle optimizations
  - `app/page.tsx` — orchestration layout entry point
- **TypeScript**: custom error classes extending `Error` with `category` and `context` fields; strict props interfaces for all boundary components
- **Performance targets (Core Web Vitals)**:
  - FCP < 1.5 s, LCP < 2.5 s, CLS < 0.1, TTI < 3.5 s on standard broadband
  - 60 fps for all interactions and animations
- **Bundle**: tree-shaking enabled; bundle analysis output in CI; no individual chunk >250 KB gzipped
- **Accessibility**: axe-core integrated in test suite; no critical or serious violations permitted
- **Security**: no secrets or PII in client-side bundles or error messages; CSP policy must not use `unsafe-inline` for scripts
- **Backward compatibility**: all existing widget components remain functional without internal changes

### Acceptance Criteria

- [ ] A failure in any single widget is caught by `WidgetErrorBoundary` and displays an inline error card without affecting other widgets
- [ ] `DashboardErrorBoundary` catches unhandled application-level errors and renders the full-page fallback with "Reload" and "Export logs" actions
- [ ] Retry mechanism attempts up to 3 times, then disables the retry button and shows an exhaustion message
- [ ] Production error messages contain no stack traces, file paths, or sensitive customer data
- [ ] CSV and JSON exports are generated correctly for each data source (customer data, health scores, alerts, market intelligence)
- [ ] Export progress bar updates during streaming; "Cancel" stops generation and cleans up partial files
- [ ] All exports are logged with user identity (hashed), timestamp, and filter parameters
- [ ] Lighthouse performance audit scores ≥ 90 for Performance, Accessibility, and Best Practices in CI
- [ ] FCP < 1.5 s, LCP < 2.5 s, CLS < 0.1, TTI < 3.5 s measured in production build
- [ ] All widgets lazy-load via `React.lazy`; bundle analysis shows no chunk > 250 KB gzipped
- [ ] axe-core automated scan reports zero critical or serious accessibility violations
- [ ] Keyboard-only navigation reaches every interactive element in logical tab order; focus indicators are visible
- [ ] `aria-live` regions announce new alerts and health score changes to screen readers
- [ ] Skip-to-content link is the first focusable element and jumps to main content
- [ ] Security headers (CSP, X-Frame-Options, X-Content-Type-Options) present on all responses; verified by automated header check in CI
- [ ] No `unsafe-inline` in CSP script-src directive
- [ ] `/api/health` returns 200 with dependency status when healthy; 503 with degraded status when a dependency is unavailable
- [ ] All existing widget components pass their original unit tests unchanged after orchestration layer is added
- [ ] Export endpoint returns 429 when rate limit is exceeded
