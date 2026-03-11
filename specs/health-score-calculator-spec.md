# Feature: Health Score Calculator

## Context
- Comprehensive customer health scoring system for the Customer Intelligence Dashboard
- Provides predictive analytics for customer relationship health and churn risk
- Consists of two parts: a pure-function calculation library (`lib/healthCalculator.ts`) and a display widget (`components/CustomerHealthDisplay.tsx`)
- Integrates with `CustomerSelector` to show real-time health breakdowns for the selected customer
- Used by business analysts to identify at-risk accounts and prioritize outreach

## Requirements

### Functional Requirements

#### Core Algorithm
- Calculate a composite health score on a 0–100 scale from four weighted factors:
  - **Payment history** — 40% weight
  - **Engagement metrics** — 30% weight
  - **Contract status** — 20% weight
  - **Support satisfaction** — 10% weight
- Classify the resulting score into risk levels:
  - **Healthy** (71–100): customer relationship in good standing
  - **Warning** (31–70): moderate risk, monitor closely
  - **Critical** (0–30): high churn risk, immediate action recommended
- Individual factor scoring functions must each normalize their inputs to a 0–100 sub-score before weighting
- Handle new customers and missing/partial data gracefully with documented fallback values

#### Pure Function Implementation
- `scorePaymentHistory(data: PaymentData): number` — sub-score based on days since last payment, average delay, overdue amount
- `scoreEngagement(data: EngagementData): number` — sub-score based on login frequency, feature usage count, open support tickets
- `scoreContract(data: ContractData): number` — sub-score based on days until renewal, contract value, recent upgrades
- `scoreSupport(data: SupportData): number` — sub-score based on average resolution time, satisfaction scores, escalation count
- `calculateHealthScore(input: HealthScoreInput): HealthScoreResult` — combines all four factor scores using weighted average, returns overall score, risk level, and per-factor breakdown
- All functions must be pure (no side effects, no external calls)
- Input validation in every function with descriptive error messages via custom error classes

#### UI Component
- `CustomerHealthDisplay` widget displaying:
  - Overall health score with color-coded badge (red / yellow / green matching dashboard convention)
  - Expandable breakdown panel showing each factor's sub-score and weight
  - Loading state while score is being computed or data is fetching
  - Error state with user-friendly message when calculation fails

### Data Requirements

#### Input Interfaces
```ts
interface PaymentData {
  daysSinceLastPayment: number;
  averagePaymentDelayDays: number;
  overdueAmountUsd: number;
}

interface EngagementData {
  loginsLast30Days: number;
  featuresUsedLast30Days: number;
  openSupportTickets: number;
}

interface ContractData {
  daysUntilRenewal: number;
  contractValueUsd: number;
  recentUpgrades: number;
}

interface SupportData {
  avgResolutionTimeDays: number;
  satisfactionScore: number; // 0–10
  escalationCount: number;
}

interface HealthScoreInput {
  payment: PaymentData;
  engagement: EngagementData;
  contract: ContractData;
  support: SupportData;
}
```

#### Output Interface
```ts
type RiskLevel = 'healthy' | 'warning' | 'critical';

interface FactorScore {
  score: number;       // 0–100 normalized sub-score
  weight: number;      // e.g. 0.4 for payment
  contribution: number; // score * weight
}

interface HealthScoreResult {
  overall: number;     // 0–100 composite score
  riskLevel: RiskLevel;
  factors: {
    payment: FactorScore;
    engagement: FactorScore;
    contract: FactorScore;
    support: FactorScore;
  };
}
```

### Integration Requirements
- `CustomerHealthDisplay` receives `customer: Customer` prop and derives or fetches `HealthScoreInput` data
- Updates score in real time when `CustomerSelector` selection changes
- Color coding (red/yellow/green) consistent with `CustomerCard` health indicator thresholds
- Loading and error states follow existing dashboard widget patterns

## Constraints

### Technical Stack
- Next.js 15 (App Router)
- React 19 with TypeScript (strict mode)
- Tailwind CSS for all styling in the UI component
- No third-party charting or UI library dependencies

### Architecture Constraints
- All calculation logic in `lib/healthCalculator.ts` as pure functions — no React, no I/O
- Custom error classes (extending `Error`) for validation failures — e.g., `InvalidHealthScoreInputError`
- JSDoc comments on every exported function documenting formula, parameters, return value, and edge-case behavior
- `CustomerHealthDisplay` component in `components/CustomerHealthDisplay.tsx` with exported `CustomerHealthDisplayProps`

### Performance Requirements
- Score calculation must complete in < 5ms for a single customer
- Memoize `calculateHealthScore` results keyed by customer `id` to avoid redundant computation on re-renders
- No layout shift when expanding/collapsing the factor breakdown

### Design Constraints
- Responsive layout: stacks vertically on mobile, inline on tablet/desktop
- Factor breakdown collapsible via accessible toggle (keyboard navigable)
- Consistent spacing and typography with Tailwind spacing scale

### Security Considerations
- Validate all numeric inputs are finite numbers within expected ranges before calculation
- Do not log raw customer financial data to the console
- Proper TypeScript types prevent unexpected data shapes reaching the algorithm

## Acceptance Criteria

- [ ] `calculateHealthScore` returns a score in [0, 100] for valid inputs
- [ ] Weighted formula: Payment×0.4 + Engagement×0.3 + Contract×0.2 + Support×0.1 = overall score
- [ ] Risk level classified correctly: 0–30 → `critical`, 31–70 → `warning`, 71–100 → `healthy`
- [ ] Each factor scoring function normalizes its inputs to a 0–100 sub-score
- [ ] Missing or null input fields produce a documented fallback score, not a thrown error
- [ ] Invalid inputs (non-finite numbers, wrong types) throw a descriptive `InvalidHealthScoreInputError`
- [ ] All calculation functions are pure — identical inputs always produce identical outputs
- [ ] `CustomerHealthDisplay` renders overall score with correct color (red/yellow/green)
- [ ] Factor breakdown is expandable/collapsible and keyboard accessible
- [ ] Loading state displayed while data is unavailable
- [ ] Error state displayed with user-friendly message when calculation throws
- [ ] Score updates in real time when a different customer is selected in `CustomerSelector`
- [ ] Score calculation completes in < 5ms for a single customer
- [ ] Unit tests cover all four factor functions, `calculateHealthScore`, boundary values (0, 30, 31, 70, 71, 100), and error handling
- [ ] All exports properly typed; passes TypeScript strict mode checks
- [ ] JSDoc present on every exported function
- [ ] No console errors or warnings
- [ ] Follows project code style and conventions
