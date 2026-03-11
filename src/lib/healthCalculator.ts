/**
 * Health Score Calculator
 *
 * Pure-function library for computing composite customer health scores.
 * No side effects, no I/O, no React dependencies.
 */

// ---------------------------------------------------------------------------
// Input Interfaces
// ---------------------------------------------------------------------------

export interface PaymentData {
  daysSinceLastPayment: number;
  averagePaymentDelayDays: number;
  overdueAmountUsd: number;
}

export interface EngagementData {
  loginsLast30Days: number;
  featuresUsedLast30Days: number;
  openSupportTickets: number;
}

export interface ContractData {
  daysUntilRenewal: number;
  contractValueUsd: number;
  recentUpgrades: number;
}

export interface SupportData {
  avgResolutionTimeDays: number;
  satisfactionScore: number; // 0–10
  escalationCount: number;
}

export interface HealthScoreInput {
  payment: PaymentData;
  engagement: EngagementData;
  contract: ContractData;
  support: SupportData;
}

// ---------------------------------------------------------------------------
// Output Interfaces
// ---------------------------------------------------------------------------

export type RiskLevel = 'healthy' | 'warning' | 'critical';

export interface FactorScore {
  /** Normalized 0–100 sub-score for this factor */
  score: number;
  /** Weight applied to this factor (e.g. 0.4 for payment) */
  weight: number;
  /** Weighted contribution: score * weight */
  contribution: number;
}

export interface HealthScoreResult {
  /** Composite 0–100 score */
  overall: number;
  /** Classified risk level */
  riskLevel: RiskLevel;
  /** Per-factor breakdown */
  factors: {
    payment: FactorScore;
    engagement: FactorScore;
    contract: FactorScore;
    support: FactorScore;
  };
}

// ---------------------------------------------------------------------------
// Custom Error Class
// ---------------------------------------------------------------------------

/**
 * Thrown when a health score input contains invalid values such as
 * non-finite numbers or values outside expected ranges.
 */
export class InvalidHealthScoreInputError extends Error {
  constructor(field: string, value: unknown, reason: string) {
    super(
      `InvalidHealthScoreInputError: field "${field}" has invalid value ${JSON.stringify(value)} — ${reason}`
    );
    this.name = 'InvalidHealthScoreInputError';
  }
}

// ---------------------------------------------------------------------------
// Internal Validation Helpers
// ---------------------------------------------------------------------------

/**
 * Asserts that a value is a finite number within [min, max].
 * Throws `InvalidHealthScoreInputError` when the assertion fails.
 *
 * @param field - Human-readable field name for the error message
 * @param value - The value to validate
 * @param min - Minimum allowed value (inclusive)
 * @param max - Maximum allowed value (inclusive)
 */
function assertFiniteInRange(
  field: string,
  value: unknown,
  min: number,
  max: number
): asserts value is number {
  if (typeof value !== 'number') {
    throw new InvalidHealthScoreInputError(field, value, `expected a number, got ${typeof value}`);
  }
  if (!isFinite(value)) {
    throw new InvalidHealthScoreInputError(field, value, 'must be a finite number');
  }
  if (value < min || value > max) {
    throw new InvalidHealthScoreInputError(
      field,
      value,
      `must be between ${min} and ${max} (inclusive)`
    );
  }
}

/**
 * Clamps a value to [0, 100].
 */
function clamp100(value: number): number {
  return Math.max(0, Math.min(100, value));
}

// ---------------------------------------------------------------------------
// Factor Scoring Functions
// ---------------------------------------------------------------------------

/**
 * Scores payment history on a 0–100 scale.
 *
 * Formula:
 *   - Base: 100 points
 *   - Deduct up to 30 pts for days since last payment (penalty starts after 30 days, full penalty at 180 days)
 *   - Deduct up to 40 pts for average payment delay (penalty starts after 5 days, full penalty at 60 days)
 *   - Deduct up to 30 pts for overdue amount (penalty starts after $0, full penalty at $10,000)
 *
 * Fallback: any field that is null/undefined defaults to its worst-case value
 * (180 days since payment, 60-day average delay, $10,000 overdue) yielding a score of 0.
 *
 * @param data - Payment history data
 * @returns Normalized sub-score in [0, 100]
 * @throws InvalidHealthScoreInputError if any field is a non-finite number or out of range
 */
export function scorePaymentHistory(data: PaymentData): number {
  const daysSince = data.daysSinceLastPayment ?? 180;
  const avgDelay = data.averagePaymentDelayDays ?? 60;
  const overdue = data.overdueAmountUsd ?? 10000;

  assertFiniteInRange('daysSinceLastPayment', daysSince, 0, 36500);
  assertFiniteInRange('averagePaymentDelayDays', avgDelay, 0, 3650);
  assertFiniteInRange('overdueAmountUsd', overdue, 0, 1_000_000_000);

  // Penalty for days since last payment (0 penalty ≤30 days, full 30-pt penalty ≥180 days)
  const daysPenalty = clamp100(Math.max(0, (daysSince - 30) / (180 - 30)) * 30);

  // Penalty for average delay (0 penalty ≤5 days, full 40-pt penalty ≥60 days)
  const delayPenalty = clamp100(Math.max(0, (avgDelay - 5) / (60 - 5)) * 40);

  // Penalty for overdue amount (0 penalty at $0, full 30-pt penalty at $10,000)
  const overduePenalty = clamp100((overdue / 10000) * 30);

  return clamp100(100 - daysPenalty - delayPenalty - overduePenalty);
}

/**
 * Scores customer engagement on a 0–100 scale.
 *
 * Formula:
 *   - Login score: up to 40 pts (proportional to logins, saturates at 20 logins/month)
 *   - Feature usage score: up to 40 pts (proportional to features used, saturates at 10 features)
 *   - Open tickets penalty: deduct up to 20 pts (full penalty at ≥5 open tickets)
 *
 * Fallback: null/undefined fields default to 0 logins, 0 features, 0 tickets.
 *
 * @param data - Engagement metrics
 * @returns Normalized sub-score in [0, 100]
 * @throws InvalidHealthScoreInputError if any field is non-finite or out of range
 */
export function scoreEngagement(data: EngagementData): number {
  const logins = data.loginsLast30Days ?? 0;
  const features = data.featuresUsedLast30Days ?? 0;
  const tickets = data.openSupportTickets ?? 0;

  assertFiniteInRange('loginsLast30Days', logins, 0, 10000);
  assertFiniteInRange('featuresUsedLast30Days', features, 0, 10000);
  assertFiniteInRange('openSupportTickets', tickets, 0, 10000);

  const loginScore = clamp100((logins / 20) * 40);
  const featureScore = clamp100((features / 10) * 40);
  const ticketPenalty = clamp100((tickets / 5) * 20);

  return clamp100(loginScore + featureScore - ticketPenalty);
}

/**
 * Scores contract status on a 0–100 scale.
 *
 * Formula:
 *   - Renewal proximity: up to 40 pts (≥365 days until renewal = full 40 pts; 0 days = 0 pts)
 *   - Contract value: up to 40 pts (proportional, saturates at $100,000)
 *   - Upgrade bonus: up to 20 pts (each recent upgrade = 10 pts, max 2 upgrades)
 *
 * Fallback: null/undefined fields default to 0 days, $0, 0 upgrades.
 *
 * @param data - Contract details
 * @returns Normalized sub-score in [0, 100]
 * @throws InvalidHealthScoreInputError if any field is non-finite or out of range
 */
export function scoreContract(data: ContractData): number {
  const daysUntil = data.daysUntilRenewal ?? 0;
  const value = data.contractValueUsd ?? 0;
  const upgrades = data.recentUpgrades ?? 0;

  assertFiniteInRange('daysUntilRenewal', daysUntil, 0, 36500);
  assertFiniteInRange('contractValueUsd', value, 0, 1_000_000_000);
  assertFiniteInRange('recentUpgrades', upgrades, 0, 1000);

  const renewalScore = clamp100((daysUntil / 365) * 40);
  const valueScore = clamp100((value / 100000) * 40);
  const upgradeScore = clamp100((upgrades / 2) * 20);

  return clamp100(renewalScore + valueScore + upgradeScore);
}

/**
 * Scores support satisfaction on a 0–100 scale.
 *
 * Formula:
 *   - Satisfaction score: up to 60 pts (proportional to 0–10 CSAT, 10 → 60 pts)
 *   - Resolution time penalty: deduct up to 20 pts (0 days = no penalty; ≥14 days = full penalty)
 *   - Escalation penalty: deduct up to 20 pts (each escalation = 10 pts, max 2)
 *
 * Fallback: null/undefined fields default to 5 satisfaction, 14 days resolution, 2 escalations.
 *
 * @param data - Support satisfaction data
 * @returns Normalized sub-score in [0, 100]
 * @throws InvalidHealthScoreInputError if any field is non-finite or out of range
 */
export function scoreSupport(data: SupportData): number {
  const satisfaction = data.satisfactionScore ?? 5;
  const resolutionTime = data.avgResolutionTimeDays ?? 14;
  const escalations = data.escalationCount ?? 2;

  assertFiniteInRange('satisfactionScore', satisfaction, 0, 10);
  assertFiniteInRange('avgResolutionTimeDays', resolutionTime, 0, 3650);
  assertFiniteInRange('escalationCount', escalations, 0, 10000);

  const satisfactionScore = clamp100((satisfaction / 10) * 60);
  const resolutionPenalty = clamp100((resolutionTime / 14) * 20);
  const escalationPenalty = clamp100((escalations / 2) * 20);

  return clamp100(satisfactionScore - resolutionPenalty - escalationPenalty);
}

// ---------------------------------------------------------------------------
// Risk Level Classification
// ---------------------------------------------------------------------------

/**
 * Classifies a composite health score into a risk level.
 *
 * Thresholds match the dashboard-wide convention used in CustomerCard:
 *   - 0–30   → 'critical'
 *   - 31–70  → 'warning'
 *   - 71–100 → 'healthy'
 *
 * @param score - Composite health score in [0, 100]
 * @returns The corresponding RiskLevel
 */
export function classifyRiskLevel(score: number): RiskLevel {
  if (score <= 30) return 'critical';
  if (score <= 70) return 'warning';
  return 'healthy';
}

// ---------------------------------------------------------------------------
// Main Calculation Function
// ---------------------------------------------------------------------------

/**
 * Computes a composite customer health score from four weighted factors.
 *
 * Weights:
 *   - Payment history:     40% (0.4)
 *   - Engagement metrics:  30% (0.3)
 *   - Contract status:     20% (0.2)
 *   - Support satisfaction: 10% (0.1)
 *
 * Overall score = Payment×0.4 + Engagement×0.3 + Contract×0.2 + Support×0.1
 *
 * All factor scoring sub-functions apply input validation; invalid inputs
 * (non-finite numbers, out-of-range values) throw `InvalidHealthScoreInputError`.
 * Missing/null fields within each factor use documented fallback values rather
 * than throwing.
 *
 * @param input - The four-factor health score input
 * @returns A `HealthScoreResult` containing the overall score, risk level, and per-factor breakdown
 * @throws InvalidHealthScoreInputError if any numeric input is invalid
 */
export function calculateHealthScore(input: HealthScoreInput): HealthScoreResult {
  const WEIGHTS = {
    payment: 0.4,
    engagement: 0.3,
    contract: 0.2,
    support: 0.1,
  } as const;

  const paymentScore = scorePaymentHistory(input.payment);
  const engagementScore = scoreEngagement(input.engagement);
  const contractScore = scoreContract(input.contract);
  const supportScore = scoreSupport(input.support);

  const overall = clamp100(
    paymentScore * WEIGHTS.payment +
      engagementScore * WEIGHTS.engagement +
      contractScore * WEIGHTS.contract +
      supportScore * WEIGHTS.support
  );

  return {
    overall: Math.round(overall),
    riskLevel: classifyRiskLevel(overall),
    factors: {
      payment: {
        score: Math.round(paymentScore),
        weight: WEIGHTS.payment,
        contribution: Math.round(paymentScore * WEIGHTS.payment),
      },
      engagement: {
        score: Math.round(engagementScore),
        weight: WEIGHTS.engagement,
        contribution: Math.round(engagementScore * WEIGHTS.engagement),
      },
      contract: {
        score: Math.round(contractScore),
        weight: WEIGHTS.contract,
        contribution: Math.round(contractScore * WEIGHTS.contract),
      },
      support: {
        score: Math.round(supportScore),
        weight: WEIGHTS.support,
        contribution: Math.round(supportScore * WEIGHTS.support),
      },
    },
  };
}
