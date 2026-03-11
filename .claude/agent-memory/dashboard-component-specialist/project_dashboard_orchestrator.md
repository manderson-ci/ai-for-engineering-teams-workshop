---
name: DashboardOrchestrator feature
description: Orchestration layer files, error boundary patterns, export utilities, health check API, security headers in next.config.ts, and page.tsx composition
type: project
---

## Files Created

- `src/components/DashboardErrorBoundary.tsx` — Class component; application-level catch-all; full-page fallback with "Reload" and "Export logs" buttons; sanitized messages in production; structured JSON log in production; no stack traces in UI
- `src/components/WidgetErrorBoundary.tsx` — Class component; per-widget isolation; inline error card; retry up to maxRetries (default 3); exhaustion message after limit; `WidgetError` custom error class with `category` + `context`
- `src/lib/exportUtils.ts` — Pure functions: `exportCustomers`, `exportHealthScores`, `exportAlerts`, `exportMarketIntelligence`; `triggerDownload` browser helper; `ExportAuditEntry` with hashed userId; CSV via `toCsv` helper; `ExportFilter` with tier + date range
- `src/app/api/health/route.ts` — GET /api/health; 200 when healthy, 503 when degraded; checks market-intelligence dependency with 2s abort timeout; returns structured JSON with `status`, `version`, `timestamp`, `dependencies`
- `next.config.ts` — Security headers on all routes: X-Frame-Options SAMEORIGIN, X-Content-Type-Options nosniff, Referrer-Policy, CSP (no unsafe-inline for scripts), Permissions-Policy, HSTS; `reactStrictMode: true`; `compress: true`
- `src/app/page.tsx` — Full orchestration: DashboardErrorBoundary wraps all; skip-to-content link (first focusable); all widgets lazy-loaded via `React.lazy` + `Suspense` with `WidgetSkeleton` fallbacks; `WidgetErrorBoundary` per widget; `ExportPanel` modal; toast notification system with `aria-live="polite"`; `aria-live` announcer region for customer selection changes

## Key Patterns

- Error boundaries must be class components (React requirement for `componentDidCatch`)
- `getDerivedStateFromError` needs `// eslint-disable-next-line @typescript-eslint/no-unused-vars` comment since ESLint doesn't recognize `_` prefix convention for that static method
- `HealthScoreExportRow[]` → `toCsv()` requires double cast: `as unknown as Array<Record<...>>` because strict TS won't widen the interface type directly
- Export audit: `hashString(userId)` uses djb2 variant — no raw PII in audit logs
- Health check probes market intelligence route with 2s AbortController timeout; treats 400 (bad company name) as "alive"
- All widgets use `React.lazy(() => import(...).then(m => ({ default: m.ComponentName })))` pattern for named exports

## Acceptance Criteria Coverage

- AC: Widget failure isolated — WidgetErrorBoundary wraps each widget independently
- AC: DashboardErrorBoundary full-page fallback — implemented with Reload + Export logs
- AC: Retry max 3 — WidgetErrorBoundary.maxRetries default 3; button disabled on exhaustion
- AC: No stack traces in production UI — sanitized messages; console.error only
- AC: CSV + JSON exports — exportUtils.ts covers all 4 sources
- AC: Export audit log — ExportAuditEntry with hashed userId, timestamp, filters
- AC: Lazy-load all widgets — React.lazy + Suspense in page.tsx
- AC: Skip-to-content — first element in DOM, sr-only until focused
- AC: aria-live regions — dashboard-announcer for selections, ToastList for notifications
- AC: /api/health — returns 200/503 with dependency status
- AC: Security headers — next.config.ts headers() function; no unsafe-inline in script-src
- AC: Export progress + cancel — ExportPanel uses cancelRef + setProgress state
