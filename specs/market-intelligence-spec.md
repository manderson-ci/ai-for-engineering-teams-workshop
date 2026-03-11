# Feature: Market Intelligence Widget

## Context
- Market intelligence widget for the Customer Intelligence Dashboard
- Provides real-time market sentiment and news analysis for a selected customer's company
- Composed of three layers: API route, service class, and UI component
- Integrated into the main Dashboard alongside `CustomerSelector` and `CustomerHealthDisplay`
- Company name is driven by the selected customer, enabling real-time updates on selection change
- Uses mock data generation for reliable, predictable operation without external API dependencies

## Requirements

### Functional Requirements

#### API Layer (`/api/market-intelligence/[company]`)
- Next.js Route Handler accepting `company` as a dynamic path segment
- Validate and sanitize the `company` parameter before use (non-empty, alphanumeric + spaces/hyphens)
- Generate mock market data using `generateMockMarketData` from `src/data/mock-market-intelligence.ts`
- Calculate sentiment using `calculateMockSentiment` from the same module
- Simulate realistic API latency (e.g., 300–600ms random delay) for authentic UX
- Return a consistent JSON response:
  ```ts
  interface MarketIntelligenceResponse {
    company: string;
    sentiment: {
      score: number;       // normalized -1 to 1
      label: 'positive' | 'neutral' | 'negative';
      confidence: number;  // 0–1
    };
    articleCount: number;
    headlines: Array<{
      title: string;
      source: string;
      publishedAt: string;
    }>;
    lastUpdated: string;   // ISO 8601 timestamp
  }
  ```
- Return `400` for invalid/missing company name with sanitized error message
- Return `500` with sanitized error message on unexpected failures — no stack traces or internal details in response body

#### Service Layer (`lib/MarketIntelligenceService.ts`)
- `MarketIntelligenceService` class with a `getMarketIntelligence(company: string)` method
- In-memory cache with 10-minute TTL; return cached result if valid, otherwise fetch fresh data
- Custom `MarketIntelligenceError` class (extends `Error`) for domain-specific error handling
- Pure helper functions for cache key generation and TTL validation — no side effects
- All public methods fully typed with TypeScript interfaces

#### UI Component (`components/MarketIntelligenceWidget.tsx`)
- Display overall sentiment with color-coded badge:
  - Green: `positive`
  - Yellow: `neutral`
  - Red: `negative`
- Show total article count and `lastUpdated` timestamp (human-readable, e.g., "2 minutes ago")
- Display top 3 headlines, each with title, source name, and relative publication date
- Optional manual company name input field with validation for cases where no customer is selected
- Loading state: skeleton or spinner while fetching
- Error state: user-friendly message with retry option

### Data Requirements
- Consumes `generateMockMarketData` and `calculateMockSentiment` from `src/data/mock-market-intelligence.ts`
- `MockHeadline`: `{ title: string; source: string; publishedAt: string; url?: string }`
- `MockMarketData`: `{ articleCount: number; headlines: MockHeadline[] }`
- Sentiment output: `{ score: number; label: 'positive' | 'neutral' | 'negative'; confidence: number }`
- Cache keyed by normalized company name (lowercase, trimmed)

### Integration Requirements
- `MarketIntelligenceWidget` receives `company?: string` prop from Dashboard when a customer is selected
- Automatically fetches new data when `company` prop changes
- Color coding (green/yellow/red) consistent with `CustomerCard` and `CustomerHealthDisplay` conventions
- Loading and error state patterns match other dashboard widgets
- Dashboard grid layout accommodates the widget alongside existing panels

## Constraints

### Technical Stack
- Next.js 15 App Router with Route Handlers (not `pages/api`)
- React 19 with TypeScript (strict mode)
- Tailwind CSS for all styling — no inline styles or CSS modules
- No external news API, no third-party UI library dependencies

### File Structure and Naming
| Artifact | Path |
|---|---|
| API route | `app/api/market-intelligence/[company]/route.ts` |
| Service class | `lib/MarketIntelligenceService.ts` |
| UI component | `components/MarketIntelligenceWidget.tsx` |
| Props interface | `MarketIntelligenceWidgetProps` exported from component file |
| Error class | `MarketIntelligenceError` exported from service file |

### Performance Requirements
- Cache hit path must return in < 5ms (in-memory lookup only)
- Cache miss path includes simulated delay of 300–600ms (acceptable for demo)
- No layout shift during loading → loading skeleton matches final widget dimensions
- Widget re-fetches only when `company` prop value changes (memoized fetch)

### Design Constraints
- Responsive: stacks vertically on mobile, inline on tablet/desktop
- Sentiment badge prominent at the top of the card
- Headlines list: no more than 3 items visible by default
- Consistent spacing and typography with Tailwind spacing scale
- Color coding matches dashboard convention: `text-green-*` / `text-yellow-*` / `text-red-*`

### Security Considerations
- Validate `company` path parameter server-side: reject empty strings and non-alphanumeric patterns
- Sanitize all mock-generated strings before including in API response (no raw interpolation into HTML)
- Error responses must not expose stack traces, internal paths, or service implementation details
- No sensitive customer data included in API request URL or response body

## Acceptance Criteria

- [ ] `GET /api/market-intelligence/[company]` returns valid `MarketIntelligenceResponse` JSON for a valid company name
- [ ] API returns `400` with a sanitized error message for empty or invalid company names
- [ ] API response includes `sentiment`, `articleCount`, `headlines` (max 3), and `lastUpdated`
- [ ] Sentiment label is `positive`, `neutral`, or `negative` with a confidence score in [0, 1]
- [ ] `MarketIntelligenceService` caches results for 10 minutes and returns cached data on subsequent calls
- [ ] Cache is invalidated after TTL expires and a fresh fetch is triggered
- [ ] `MarketIntelligenceError` is thrown (not a generic `Error`) on service-layer failures
- [ ] `MarketIntelligenceWidget` renders sentiment badge with correct color (green/yellow/red)
- [ ] Widget displays article count and a human-readable `lastUpdated` time
- [ ] Widget displays up to 3 headlines with title, source, and relative date
- [ ] Loading state (skeleton/spinner) shown while fetch is in progress
- [ ] Error state shown with user-friendly message and retry option on fetch failure
- [ ] Widget auto-fetches when `company` prop changes; does not re-fetch if prop is unchanged
- [ ] Optional company name input field validates input before triggering fetch
- [ ] No sensitive data or stack traces exposed in API error responses
- [ ] All TypeScript interfaces exported and strict mode checks pass
- [ ] Responsive layout works on mobile (320px+), tablet (768px+), and desktop (1024px+)
- [ ] Color coding consistent with `CustomerCard` and `CustomerHealthDisplay` conventions
- [ ] No console errors or warnings
- [ ] Follows project code style and conventions
