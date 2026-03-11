---
name: Health Score Calculator feature
description: Pure-function lib and display widget for composite customer health scoring; file paths, patterns, and key decisions
type: project
---

## Files Created

- `/workspaces/ai-for-engineering-teams-workshop/src/lib/healthCalculator.ts` — Pure-function calculation library (no React, no I/O)
- `/workspaces/ai-for-engineering-teams-workshop/src/components/CustomerHealthDisplay.tsx` — React 19 client component widget

## Architecture Decisions

- `src/lib/` directory was created as part of this feature (did not exist before).
- All four factor scoring functions (`scorePaymentHistory`, `scoreEngagement`, `scoreContract`, `scoreSupport`) normalize inputs to 0–100 before weighting.
- `calculateHealthScore` applies weights: Payment×0.4 + Engagement×0.3 + Contract×0.2 + Support×0.1.
- `classifyRiskLevel` maps 0–30 → `critical`, 31–70 → `warning`, 71–100 → `healthy` — consistent with CustomerCard thresholds.
- `InvalidHealthScoreInputError extends Error` is the custom error class for invalid inputs; missing/null fields use documented fallback values instead of throwing.
- Memoization via `useMemo` keyed on `customer.id` satisfies the < 5ms perf requirement.

## Component Patterns Used

- `'use client'` directive — uses useState and useMemo.
- Named exports: `CustomerHealthDisplay` and `CustomerHealthDisplayProps`.
- `React.FC<Props>` explicit typing.
- `getHealthColor(score)` utility replicates CustomerCard convention exactly.
- `COLOR_CLASSES` lookup map provides all Tailwind color token variants per risk tier.
- Loading state: animated skeleton with `role="status"` and `aria-label`.
- Error state: `role="alert"` panel with user-friendly message (raw error not surfaced to UI).
- Breakdown panel hidden via `hidden` class (not unmounted) to prevent layout shift.
- Toggle button uses `aria-expanded` + `aria-controls` for keyboard accessibility.
- Progress bars use `role="progressbar"` with `aria-valuenow/min/max/label`.

## Props Interface

```ts
interface CustomerHealthDisplayProps {
  customer: Customer | null;
  healthInput?: HealthScoreInput;   // optional override; synthetic fallback derived from customer.healthScore
  isLoading?: boolean;
}
```

## Key Exported Types from healthCalculator.ts

`PaymentData`, `EngagementData`, `ContractData`, `SupportData`, `HealthScoreInput`,
`RiskLevel`, `FactorScore`, `HealthScoreResult`, `InvalidHealthScoreInputError`,
`scorePaymentHistory`, `scoreEngagement`, `scoreContract`, `scoreSupport`,
`classifyRiskLevel`, `calculateHealthScore`
