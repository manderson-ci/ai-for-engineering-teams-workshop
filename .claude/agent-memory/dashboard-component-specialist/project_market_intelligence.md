---
name: MarketIntelligenceWidget feature
description: Three-layer market intelligence feature: API route, service class, and UI component. Patterns, paths, and architectural decisions.
type: project
---

## Files Created

- `src/lib/MarketIntelligenceService.ts` — Service class with 10-minute in-memory cache, `MarketIntelligenceError`, pure helpers `getCacheKey` and `isCacheValid`. Exports `MarketIntelligenceResponse` interface.
- `src/app/api/market-intelligence/[company]/route.ts` — Next.js 15 App Router Route Handler. Uses `params: Promise<{ company: string }>` (Next.js 15 async params pattern). Validates company with `/^[a-zA-Z0-9 \-]+$/`. Returns 400 for invalid input, 500 for service errors without stack traces.
- `src/components/MarketIntelligenceWidget.tsx` — Client component. Props: `company?: string`. Auto-fetches on `companyProp` change using `useEffect` + `useRef` to avoid redundant calls. Shows `WidgetSkeleton` during load, error panel with retry, and data panel with sentiment badge + up to 3 headlines.

## Key Patterns

- Sentiment color: `positive` → green, `neutral` → yellow, `negative` → red (consistent with health score convention).
- `getSentimentClasses(label)` returns `{ badge, text }` Tailwind class strings.
- `timeAgo(isoString)` utility converts ISO timestamps to human-readable relative strings.
- Manual company input only rendered when `company` prop is absent.
- `lastFetchedRef` prevents re-fetching when prop value is unchanged across renders.
- API route module-level `MarketIntelligenceService` instance persists cache across requests (singleton per server process).

## Next.js 15 Note

Route handler `params` is a `Promise` in Next.js 15 and must be `await`-ed before destructuring.
