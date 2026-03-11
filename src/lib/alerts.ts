/**
 * Alert Engine
 *
 * Pure-function library for evaluating customer alert rules and managing
 * alert state (deduplication, cooldowns, audit trail).
 * No side effects, no I/O, no React dependencies.
 */

// ---------------------------------------------------------------------------
// Input Interfaces
// ---------------------------------------------------------------------------

export interface AlertCustomerData {
  /** Unique customer identifier */
  customerId: string;
  /** Days since the most recent payment was received */
  daysSinceLastPayment: number;
  /** Current composite health score (0–100) */
  currentHealthScore: number;
  /** Health score from 7 days ago; used to detect drops */
  healthScoreSevenDaysAgo: number;
  /** Login count over the last 7 days */
  loginsLast7Days: number;
  /** Average login count per 7-day window over the last 30 days */
  avgLoginsPerWeekLast30Days: number;
  /** Days until the contract renews */
  daysUntilRenewal: number;
  /** Support tickets created in the last 7 days */
  supportTicketsLast7Days: number;
  /** Whether any of the recent support tickets have been escalated */
  hasEscalatedTicket: boolean;
  /** Days since any new feature was last used (null = never unused, i.e. actively used) */
  daysSinceLastFeatureUse: number | null;
  /** Whether this is a "growing" account (e.g. enterprise or on an upgrade path) */
  isGrowingAccount: boolean;
}

export interface AlertState {
  /** Previously triggered alerts for this customer, used for deduplication */
  existingAlerts: Alert[];
  /** Unix timestamp (ms) representing "now"; injectable for testing */
  nowMs?: number;
}

// ---------------------------------------------------------------------------
// Output Interfaces
// ---------------------------------------------------------------------------

export type AlertPriority = 'high' | 'medium';

export type AlertType =
  | 'PAYMENT_OVERDUE'
  | 'HEALTH_SCORE_DROP'
  | 'LOGIN_DROP'
  | 'CONTRACT_EXPIRY_AT_RISK'
  | 'SUPPORT_TICKET_SURGE'
  | 'NO_FEATURE_USAGE';

export interface Alert {
  /** Stable unique identifier for this specific alert instance */
  id: string;
  customerId: string;
  type: AlertType;
  priority: AlertPriority;
  /** Short human-readable title (no PII, no raw financials) */
  title: string;
  /** Recommended action for the CSM */
  recommendedAction: string;
  /** ISO-8601 timestamp when the alert was generated */
  triggeredAt: string;
  /** Whether the alert has been dismissed */
  dismissed: boolean;
  /** Whether the alert has been marked as actioned */
  actioned: boolean;
  /** ISO-8601 timestamp when the alert was dismissed, if applicable */
  dismissedAt?: string;
  /** ISO-8601 timestamp when the alert was actioned, if applicable */
  actionedAt?: string;
  /**
   * Optional snapshot of the data values that triggered this alert.
   * Values are limited to primitive types so they are safe to render directly
   * without risk of exposing complex objects or PII structures.
   */
  triggeringData?: Record<string, string | number | boolean>;
}

export interface AlertEngineResult {
  /** Newly generated alerts (not suppressed by cooldown) */
  newAlerts: Alert[];
  /** Alerts that were suppressed because a duplicate exists within the cooldown window */
  suppressedAlertTypes: AlertType[];
}

// ---------------------------------------------------------------------------
// Custom Error Class
// ---------------------------------------------------------------------------

/**
 * Thrown when alert engine inputs contain invalid values that prevent
 * safe rule evaluation.
 */
export class InvalidAlertInputError extends Error {
  constructor(field: string, value: unknown, reason: string) {
    super(
      `InvalidAlertInputError: field "${field}" has invalid value ${JSON.stringify(value)} — ${reason}`
    );
    this.name = 'InvalidAlertInputError';
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Cooldown period per alert type in milliseconds. Prevents alert fatigue. */
const COOLDOWN_MS: Record<AlertType, number> = {
  PAYMENT_OVERDUE: 24 * 60 * 60 * 1000,        // 24 hours
  HEALTH_SCORE_DROP: 12 * 60 * 60 * 1000,       // 12 hours
  LOGIN_DROP: 24 * 60 * 60 * 1000,              // 24 hours
  CONTRACT_EXPIRY_AT_RISK: 7 * 24 * 60 * 60 * 1000, // 7 days
  SUPPORT_TICKET_SURGE: 12 * 60 * 60 * 1000,    // 12 hours
  NO_FEATURE_USAGE: 7 * 24 * 60 * 60 * 1000,    // 7 days
};

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Validates that a value is a finite number.
 * @throws InvalidAlertInputError if validation fails.
 */
function assertFiniteNumber(field: string, value: unknown): asserts value is number {
  if (typeof value !== 'number' || !isFinite(value)) {
    throw new InvalidAlertInputError(
      field,
      value,
      `expected a finite number, got ${typeof value === 'number' ? 'non-finite number' : typeof value}`
    );
  }
}

/**
 * Validates that a value is a non-negative finite number.
 * @throws InvalidAlertInputError if validation fails.
 */
function assertNonNegative(field: string, value: unknown): asserts value is number {
  assertFiniteNumber(field, value);
  if ((value as number) < 0) {
    throw new InvalidAlertInputError(field, value, 'must be >= 0');
  }
}

/**
 * Validates all fields of AlertCustomerData before rule evaluation.
 * @throws InvalidAlertInputError on the first invalid field encountered.
 */
function validateAlertInput(data: AlertCustomerData): void {
  if (typeof data.customerId !== 'string' || data.customerId.trim() === '') {
    throw new InvalidAlertInputError('customerId', data.customerId, 'must be a non-empty string');
  }
  assertNonNegative('daysSinceLastPayment', data.daysSinceLastPayment);
  assertNonNegative('currentHealthScore', data.currentHealthScore);
  assertNonNegative('healthScoreSevenDaysAgo', data.healthScoreSevenDaysAgo);
  assertNonNegative('loginsLast7Days', data.loginsLast7Days);
  assertNonNegative('avgLoginsPerWeekLast30Days', data.avgLoginsPerWeekLast30Days);
  assertNonNegative('daysUntilRenewal', data.daysUntilRenewal);
  assertNonNegative('supportTicketsLast7Days', data.supportTicketsLast7Days);
  if (data.daysSinceLastFeatureUse !== null) {
    assertNonNegative('daysSinceLastFeatureUse', data.daysSinceLastFeatureUse);
  }
}

/**
 * Generates a deterministic alert ID from customer ID, type, and a timestamp
 * bucket (rounded to the hour) so that repeated runs within the same hour
 * produce the same ID — enabling safe deduplication.
 */
function generateAlertId(customerId: string, type: AlertType, nowMs: number): string {
  const hourBucket = Math.floor(nowMs / (60 * 60 * 1000));
  return `${customerId}:${type}:${hourBucket}`;
}

/**
 * Determines whether an alert of the given type is within its cooldown window
 * for this customer based on the existing alert list.
 *
 * @param existingAlerts - Previously generated alerts for this customer
 * @param type - The alert type to check
 * @param nowMs - Current time in milliseconds
 * @returns true if a duplicate alert exists within the cooldown period
 */
export function isWithinCooldown(
  existingAlerts: Alert[],
  type: AlertType,
  nowMs: number
): boolean {
  const cooldown = COOLDOWN_MS[type];
  return existingAlerts.some((alert) => {
    if (alert.type !== type) return false;
    if (alert.dismissed || alert.actioned) return false;
    const triggeredMs = new Date(alert.triggeredAt).getTime();
    return nowMs - triggeredMs < cooldown;
  });
}

// ---------------------------------------------------------------------------
// Rule Evaluation Functions
// ---------------------------------------------------------------------------

/**
 * Evaluates the PAYMENT_OVERDUE rule.
 *
 * Trigger: payment is more than 30 days overdue.
 * Priority: high
 *
 * @param data - Customer alert data
 * @returns true if this rule fires
 */
export function evaluatePaymentOverdue(data: AlertCustomerData): boolean {
  return data.daysSinceLastPayment > 30;
}

/**
 * Evaluates the HEALTH_SCORE_DROP rule.
 *
 * Trigger: health score has dropped by more than 20 points in the last 7 days.
 * Priority: high
 *
 * @param data - Customer alert data
 * @returns true if this rule fires
 */
export function evaluateHealthScoreDrop(data: AlertCustomerData): boolean {
  const drop = data.healthScoreSevenDaysAgo - data.currentHealthScore;
  return drop > 20;
}

/**
 * Evaluates the LOGIN_DROP rule.
 *
 * Trigger: login frequency over the past 7 days has dropped by more than 50%
 * compared to the 30-day weekly average.
 * Priority: high
 *
 * @param data - Customer alert data
 * @returns true if this rule fires
 */
export function evaluateLoginDrop(data: AlertCustomerData): boolean {
  if (data.avgLoginsPerWeekLast30Days === 0) return false;
  const dropPct =
    (data.avgLoginsPerWeekLast30Days - data.loginsLast7Days) /
    data.avgLoginsPerWeekLast30Days;
  return dropPct > 0.5;
}

/**
 * Evaluates the CONTRACT_EXPIRY_AT_RISK rule.
 *
 * Trigger: contract expires within 90 days AND health score is below 50.
 * Priority: high
 *
 * @param data - Customer alert data
 * @returns true if this rule fires
 */
export function evaluateContractExpiryAtRisk(data: AlertCustomerData): boolean {
  return data.daysUntilRenewal < 90 && data.currentHealthScore < 50;
}

/**
 * Evaluates the SUPPORT_TICKET_SURGE rule.
 *
 * Trigger: more than 3 support tickets in the last 7 days, OR any escalated ticket.
 * Priority: medium
 *
 * @param data - Customer alert data
 * @returns true if this rule fires
 */
export function evaluateSupportTicketSurge(data: AlertCustomerData): boolean {
  return data.supportTicketsLast7Days > 3 || data.hasEscalatedTicket;
}

/**
 * Evaluates the NO_FEATURE_USAGE rule.
 *
 * Trigger: no new feature usage in the last 30 days for a growing account.
 * Priority: medium
 *
 * @param data - Customer alert data
 * @returns true if this rule fires
 */
export function evaluateNoFeatureUsage(data: AlertCustomerData): boolean {
  if (!data.isGrowingAccount) return false;
  if (data.daysSinceLastFeatureUse === null) return false;
  return data.daysSinceLastFeatureUse >= 30;
}

// ---------------------------------------------------------------------------
// Alert Factory
// ---------------------------------------------------------------------------

/** Static metadata (title and recommendedAction) for each alert type. */
const ALERT_METADATA: Record<AlertType, { title: string; recommendedAction: string }> = {
  PAYMENT_OVERDUE: {
    title: 'Payment overdue',
    recommendedAction:
      'Contact the billing team and schedule a call with the account owner to resolve outstanding balance.',
  },
  HEALTH_SCORE_DROP: {
    title: 'Significant health score decline',
    recommendedAction:
      'Review the health score breakdown to identify which factors declined and schedule a check-in call.',
  },
  LOGIN_DROP: {
    title: 'Login frequency drop',
    recommendedAction:
      'Reach out to the primary contact to understand whether they are experiencing friction or reduced value.',
  },
  CONTRACT_EXPIRY_AT_RISK: {
    title: 'Contract renewal at risk',
    recommendedAction:
      'Initiate a renewal conversation now and engage an executive sponsor if the health score does not improve.',
  },
  SUPPORT_TICKET_SURGE: {
    title: 'Elevated support activity',
    recommendedAction:
      'Review open support tickets, ensure timely resolution, and offer a dedicated support session.',
  },
  NO_FEATURE_USAGE: {
    title: 'No new feature adoption',
    recommendedAction:
      'Schedule a product enablement session to demonstrate recently released features relevant to this account.',
  },
};

const ALERT_PRIORITY: Record<AlertType, AlertPriority> = {
  PAYMENT_OVERDUE: 'high',
  HEALTH_SCORE_DROP: 'high',
  LOGIN_DROP: 'high',
  CONTRACT_EXPIRY_AT_RISK: 'high',
  SUPPORT_TICKET_SURGE: 'medium',
  NO_FEATURE_USAGE: 'medium',
};

/**
 * Creates an Alert object for the given type.
 *
 * Alert message strings deliberately contain no PII or raw financial figures —
 * only actionable operational descriptions safe for audit logs and UI rendering.
 */
function createAlert(
  customerId: string,
  type: AlertType,
  nowMs: number
): Alert {
  const now = new Date(nowMs).toISOString();
  return {
    id: generateAlertId(customerId, type, nowMs),
    customerId,
    type,
    priority: ALERT_PRIORITY[type],
    title: ALERT_METADATA[type].title,
    recommendedAction: ALERT_METADATA[type].recommendedAction,
    triggeredAt: now,
    dismissed: false,
    actioned: false,
  };
}

// ---------------------------------------------------------------------------
// Alert State Mutation Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a new copy of the alert with `dismissed` set to true and a
 * `dismissedAt` timestamp recorded.  Does not mutate the original.
 *
 * @param alert - The alert to dismiss
 * @param nowMs - Current time in milliseconds (injectable for testing)
 * @returns A new Alert with updated dismissal fields and an audit-trail timestamp
 */
export function dismissAlert(alert: Alert, nowMs: number = Date.now()): Alert {
  return {
    ...alert,
    dismissed: true,
    dismissedAt: new Date(nowMs).toISOString(),
  };
}

/**
 * Returns a new copy of the alert with `actioned` set to true and an
 * `actionedAt` timestamp recorded.  Does not mutate the original.
 *
 * @param alert - The alert to mark as actioned
 * @param nowMs - Current time in milliseconds (injectable for testing)
 * @returns A new Alert with updated actioned fields and an audit-trail timestamp
 */
export function actionAlert(alert: Alert, nowMs: number = Date.now()): Alert {
  return {
    ...alert,
    actioned: true,
    actionedAt: new Date(nowMs).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Alert Engine
// ---------------------------------------------------------------------------

/**
 * Evaluates all alert rules against customer data and returns newly triggered
 * alerts, respecting cooldown windows to prevent alert fatigue.
 *
 * Rules evaluated (in priority order):
 *   High priority:
 *     1. PAYMENT_OVERDUE      — payment > 30 days overdue
 *     2. HEALTH_SCORE_DROP    — score drops > 20 pts in 7 days
 *     3. LOGIN_DROP           — logins drop > 50% vs. 30-day avg
 *     4. CONTRACT_EXPIRY_AT_RISK — renewal < 90 days AND score < 50
 *   Medium priority:
 *     5. SUPPORT_TICKET_SURGE — > 3 tickets in 7 days OR escalated ticket
 *     6. NO_FEATURE_USAGE     — no feature use in 30 days for growing accounts
 *
 * Deduplication: alerts of the same type for the same customer are suppressed
 * when an active (not dismissed/actioned) alert of that type exists within
 * the configured cooldown window.
 *
 * @param data - Customer data to evaluate rules against
 * @param state - Existing alert state for deduplication
 * @returns AlertEngineResult containing new alerts and suppressed alert types
 * @throws InvalidAlertInputError if any input field is invalid
 */
export function alertEngine(
  data: AlertCustomerData,
  state: AlertState
): AlertEngineResult {
  validateAlertInput(data);

  const nowMs = state.nowMs ?? Date.now();
  const newAlerts: Alert[] = [];
  const suppressedAlertTypes: AlertType[] = [];

  /** Evaluates a single rule and either generates or suppresses an alert. */
  function evaluate(type: AlertType, ruleFired: boolean): void {
    if (!ruleFired) return;
    if (isWithinCooldown(state.existingAlerts, type, nowMs)) {
      suppressedAlertTypes.push(type);
    } else {
      newAlerts.push(createAlert(data.customerId, type, nowMs));
    }
  }

  evaluate('PAYMENT_OVERDUE', evaluatePaymentOverdue(data));
  evaluate('HEALTH_SCORE_DROP', evaluateHealthScoreDrop(data));
  evaluate('LOGIN_DROP', evaluateLoginDrop(data));
  evaluate('CONTRACT_EXPIRY_AT_RISK', evaluateContractExpiryAtRisk(data));
  evaluate('SUPPORT_TICKET_SURGE', evaluateSupportTicketSurge(data));
  evaluate('NO_FEATURE_USAGE', evaluateNoFeatureUsage(data));

  return { newAlerts, suppressedAlertTypes };
}
