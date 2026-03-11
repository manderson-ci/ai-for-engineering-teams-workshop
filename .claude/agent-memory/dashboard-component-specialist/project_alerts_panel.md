---
name: Alerts Panel feature
description: lib/alerts.ts pure alert engine and AlertsPanel.tsx widget; alert types, cooldown deduplication, dismiss/action audit trail, history view
type: project
---

## Files created

- `/workspaces/ai-for-engineering-teams-workshop/src/lib/alerts.ts` — pure alert rule evaluation functions and alertEngine
- `/workspaces/ai-for-engineering-teams-workshop/src/components/AlertsPanel.tsx` — client component displaying prioritized alert list

## Also modified (pre-existing bug fix)

- `/workspaces/ai-for-engineering-teams-workshop/src/components/AlertDetailDrawer.tsx` — fixed `Object.entries(alert.triggeringData)` to `Object.entries(alert.triggeringData ?? {})` to satisfy strict TypeScript

## lib/alerts.ts key design points

- `AlertCustomerData` interface is the single input type for all rule evaluations
- `Alert` interface includes optional `triggeringData?: Record<string, string | number | boolean>` for AlertDetailDrawer compatibility
- Six alert types: PAYMENT_OVERDUE, HEALTH_SCORE_DROP, LOGIN_DROP, CONTRACT_EXPIRY_AT_RISK (all high priority), SUPPORT_TICKET_SURGE, NO_FEATURE_USAGE (both medium priority)
- Per-type cooldown windows in `COOLDOWN_MS` constant; `isWithinCooldown` is an exported helper (useful for testing)
- `dismissAlert` and `actionAlert` are pure immutable-update helpers; they do not mutate
- `alertEngine` validates all inputs via `validateAlertInput` before any rule evaluation
- `InvalidAlertInputError extends Error` matches the pattern from `InvalidHealthScoreInputError`

## AlertsPanel.tsx key design points

- Props: `customer: Customer | null`, `alertData?: AlertCustomerData`, `isLoading?: boolean`
- `deriveAlertData` seeds synthetic data from `customer.healthScore` — same pattern as `deriveHealthInput` in CustomerHealthDisplay
- Alert state is managed locally; `generatedAlerts` (useMemo keyed on `customer?.id`) seeds `localAlerts` (useState)
- Customer change detection via `React.useRef` + render-time comparison — avoids an extra useEffect
- `sortAlerts` guarantees high > medium ordering, then newest-first within priority
- `AlertRow` sub-component uses `React.memo`; dismiss flow requires a confirmation step before committing
- History view toggle (active vs. dismissed/actioned) via `showHistory` state
- Loading skeleton, error state (role="alert"), empty state all present
- `'use client'` directive present; all imports use `@/*` path aliases
