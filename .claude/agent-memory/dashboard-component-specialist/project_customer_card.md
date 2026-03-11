---
name: CustomerCard component baseline
description: Established patterns and conventions in CustomerCard.tsx — the foundational component for this dashboard
type: project
---

## File
`src/components/CustomerCard.tsx`

## Key patterns established here

- Health score color logic uses `getHealthColor(score)` returning bg-color class strings: `bg-red-500` (0-30), `bg-yellow-500` (31-70), `bg-green-500` (71+). This is the canonical implementation — all other components must match this range logic exactly.
- Health label helper `getHealthLabel(score)` returns 'Poor' / 'Moderate' / 'Good' for the same bands.
- Card dimensions: `max-w-[400px] min-h-[120px]`
- Clickable cards use `role="button"` + `tabIndex={0}` + `onKeyDown` (Enter/Space) for full keyboard accessibility — do not use `<button>` wrapper.
- Domain display: show first domain, then `+N more` span for additional ones. Uses non-null assertion `domains!` inside guarded block.
- `React.memo` wraps a named inner function (not an arrow function) so the component name shows correctly in DevTools.
- Props interface pattern: `{ customer: Customer; onClick?: (customer: Customer) => void }`
- Dark mode supported via `dark:` Tailwind variants on all color tokens.
- Imports use `@/data/mock-customers` path alias (relative paths are a lint/convention violation here).
