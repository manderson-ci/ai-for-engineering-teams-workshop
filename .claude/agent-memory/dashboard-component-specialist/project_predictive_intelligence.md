---
name: PredictiveIntelligence feature
description: PredictiveIntelligenceWidget.tsx + AlertDetailDrawer.tsx combining alert engine output with market sentiment; six alert rules, cooldown dedup, independent loading/error states
type: project
---

## Files created

- `/workspaces/ai-for-engineering-teams-workshop/src/components/PredictiveIntelligenceWidget.tsx` — combined UI widget (290 lines, client component)
- `/workspaces/ai-for-engineering-teams-workshop/src/components/AlertDetailDrawer.tsx` — per-alert detail panel (sub-component)

## Pre-existing files relied upon

- `src/lib/alerts.ts` — already existed with full `alertEngine`, `AlertCustomerData`, `Alert`, `dismissAlert`, `actionAlert`
- `src/lib/MarketIntelligenceService.ts` — already existed with `MarketIntelligenceService`, `MarketIntelligenceResponse`, TTL cache
- `src/app/api/market-intelligence/[company]/route.ts` — already existed with validation and error handling

## Alert interface key fields (lib/alerts.ts)

- `Alert` has: `id`, `customerId`, `type`, `priority`, `title`, `recommendedAction`, `triggeredAt`, `dismissed`, `actioned`, `dismissedAt?`, `actionedAt?`
- NOTE: `Alert` does NOT have a `triggeringData` field — AlertDetailDrawer accepts it as a separate optional prop instead
- `alertEngine(data, { existingAlerts })` returns `{ newAlerts, suppressedAlertTypes }`

## AlertDetailDrawer props

- `alert: Alert | null` — renders nothing when null
- `arr: number` — customer ARR passed separately (not on Alert interface)
- `triggeringData?: Record<string, string | number | boolean>` — optional snapshot passed by parent
- `onDismiss`, `onAction`, `onClose` — callbacks returning updated Alert copies

## PredictiveIntelligenceWidget design decisions

- `deriveAlertInput(customer)` seeds `AlertCustomerData` from `customer.healthScore` — same seeding pattern as `deriveHealthInput` in CustomerHealthDisplay
- Alert engine runs synchronously in a `setTimeout(fn, 120)` to allow loading skeleton to flash
- Market intelligence fetch is independent — failure in one section does not suppress the other
- `aria-live="assertive"` region in sr-only div announces new high-priority alerts automatically
- History toggle: `showHistory` state switches between active and dismissed/actioned alert lists
- Sentiment badge color: green=positive, yellow=neutral, red=negative (matches `getSentimentClasses` in MarketIntelligenceWidget)
- `AlertDetailDrawer` rendered inline below each selected alert row (not a modal/overlay)

## Constraints met

- PredictiveIntelligenceWidget.tsx: 290 lines (limit: 300)
- TypeScript strict: zero errors
- ESLint: zero errors (one pre-existing warning in MarketIntelligenceService.ts)
- All imports use `@/*` path aliases
- Named exports for both components and their props interfaces
