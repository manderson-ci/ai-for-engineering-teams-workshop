'use client';

import React, { useMemo, useState } from 'react';
import { Customer } from '@/data/mock-customers';
import {
  calculateHealthScore,
  HealthScoreResult,
  HealthScoreInput,
  InvalidHealthScoreInputError,
} from '@/lib/healthCalculator';

// ---------------------------------------------------------------------------
// Props Interface
// ---------------------------------------------------------------------------

export interface CustomerHealthDisplayProps {
  /** The selected customer to display health data for */
  customer: Customer | null;
  /** Optional override for the health score input data.
   *  When omitted, synthetic data derived from the customer record is used. */
  healthInput?: HealthScoreInput;
  /** When true the component renders a loading skeleton */
  isLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Maps a health score to the project-standard color tokens.
 * Thresholds match CustomerCard: 0–30 red, 31–70 yellow, 71–100 green.
 */
function getHealthColor(score: number): 'red' | 'yellow' | 'green' {
  if (score <= 30) return 'red';
  if (score <= 70) return 'yellow';
  return 'green';
}

const COLOR_CLASSES: Record<
  'red' | 'yellow' | 'green',
  { badge: string; bar: string; text: string; container: string }
> = {
  red: {
    badge: 'bg-red-500 text-white',
    bar: 'bg-red-500',
    text: 'text-red-700 dark:text-red-400',
    container: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950',
  },
  yellow: {
    badge: 'bg-yellow-500 text-white',
    bar: 'bg-yellow-500',
    text: 'text-yellow-700 dark:text-yellow-400',
    container: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950',
  },
  green: {
    badge: 'bg-green-500 text-white',
    bar: 'bg-green-500',
    text: 'text-green-700 dark:text-green-400',
    container: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950',
  },
};

const RISK_LABEL: Record<string, string> = {
  critical: 'Critical',
  warning: 'Warning',
  healthy: 'Healthy',
};

const FACTOR_LABELS: Record<string, string> = {
  payment: 'Payment History',
  engagement: 'Engagement',
  contract: 'Contract Status',
  support: 'Support Satisfaction',
};

/**
 * Derives a deterministic `HealthScoreInput` from a `Customer` record so that
 * the component works without an explicit `healthInput` prop.
 *
 * The derivation uses the customer's existing `healthScore` field as a seed to
 * produce plausible, consistent synthetic values — this is demo data only.
 */
function deriveHealthInput(customer: Customer): HealthScoreInput {
  const seed = customer.healthScore; // 0–100

  return {
    payment: {
      daysSinceLastPayment: Math.round(30 + (100 - seed) * 1.5),
      averagePaymentDelayDays: Math.round(((100 - seed) / 100) * 30),
      overdueAmountUsd: Math.round(((100 - seed) / 100) * 5000),
    },
    engagement: {
      loginsLast30Days: Math.round((seed / 100) * 20),
      featuresUsedLast30Days: Math.round((seed / 100) * 10),
      openSupportTickets: Math.round(((100 - seed) / 100) * 4),
    },
    contract: {
      daysUntilRenewal: Math.round((seed / 100) * 365),
      contractValueUsd: Math.round((seed / 100) * 80000),
      recentUpgrades: seed >= 71 ? 1 : 0,
    },
    support: {
      avgResolutionTimeDays: Math.round(((100 - seed) / 100) * 14),
      satisfactionScore: Math.round((seed / 100) * 10),
      escalationCount: seed <= 30 ? 2 : seed <= 70 ? 1 : 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const LoadingSkeleton: React.FC = () => (
  <div
    className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-4 animate-pulse"
    role="status"
    aria-label="Loading health score"
  >
    <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-700 mb-3" />
    <div className="flex items-center gap-3 mb-4">
      <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-3 rounded bg-gray-200 dark:bg-gray-700" />
      ))}
    </div>
  </div>
);

interface FactorRowProps {
  label: string;
  factor: { score: number; weight: number; contribution: number };
}

const FactorRow: React.FC<FactorRowProps> = ({ label, factor }) => {
  const color = getHealthColor(factor.score);
  const classes = COLOR_CLASSES[color];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round(factor.weight * 100)}% weight
          </span>
          <span className={`font-semibold ${classes.text}`}>{factor.score}</span>
        </div>
      </div>
      {/* Progress bar — no layout shift as it uses a fixed-height container */}
      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${classes.bar}`}
          style={{ width: `${factor.score}%` }}
          role="progressbar"
          aria-valuenow={factor.score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label} score: ${factor.score} out of 100`}
        />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * Displays a customer's composite health score with an expandable factor breakdown.
 *
 * - Renders a color-coded overall score badge (red / yellow / green) matching
 *   the dashboard-wide convention from CustomerCard.
 * - Provides an accessible, keyboard-navigable toggle to expand/collapse the
 *   per-factor breakdown panel.
 * - Shows a loading skeleton when `isLoading` is true or `customer` is null.
 * - Shows a user-friendly error state when score calculation fails.
 */
export const CustomerHealthDisplay: React.FC<CustomerHealthDisplayProps> = ({
  customer,
  healthInput,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Memoize calculation keyed by customer id + healthInput to avoid redundant
  // re-computation on unrelated re-renders.
  const result = useMemo<{ data: HealthScoreResult | null; error: string | null }>(() => {
    if (!customer) return { data: null, error: null };

    try {
      const input = healthInput ?? deriveHealthInput(customer);
      const data = calculateHealthScore(input);
      return { data, error: null };
    } catch (err) {
      if (err instanceof InvalidHealthScoreInputError) {
        return { data: null, error: err.message };
      }
      return { data: null, error: 'An unexpected error occurred while calculating the health score.' };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id, healthInput]);

  // --- Loading state ---
  if (isLoading || (!customer && !result.error)) {
    return <LoadingSkeleton />;
  }

  // --- Empty / no customer selected ---
  if (!customer) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">No customer selected.</p>
      </div>
    );
  }

  // --- Error state ---
  if (result.error) {
    return (
      <div
        className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-4"
        role="alert"
      >
        <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
          Unable to calculate health score
        </p>
        <p className="text-xs text-red-600 dark:text-red-500">
          Please verify the customer data and try again.
        </p>
      </div>
    );
  }

  const { data } = result;
  if (!data) return null;

  const color = getHealthColor(data.overall);
  const classes = COLOR_CLASSES[color];

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-4 w-full">
      {/* Header: customer name */}
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 truncate">
        Health Score — {customer.name}
      </h3>

      {/* Overall score row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        {/* Score badge */}
        <div
          className={`shrink-0 flex items-center justify-center h-14 w-14 rounded-full text-xl font-bold ${classes.badge}`}
          aria-label={`Overall health score: ${data.overall} out of 100`}
        >
          {data.overall}
        </div>

        <div className="flex flex-col gap-0.5">
          <span className={`text-lg font-semibold ${classes.text}`}>
            {RISK_LABEL[data.riskLevel]}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Composite score · 4 factors
          </span>
        </div>
      </div>

      {/* Expandable factor breakdown */}
      <div className={`rounded-md border ${classes.container} overflow-hidden`}>
        {/* Toggle button — no layout shift: always renders, height is stable */}
        <button
          type="button"
          className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
          aria-expanded={isExpanded}
          aria-controls="health-factor-breakdown"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          <span>Factor Breakdown</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Breakdown panel — hidden via display rather than unmount to avoid layout shift */}
        <div
          id="health-factor-breakdown"
          className={`px-3 pb-3 pt-1 space-y-3 ${isExpanded ? 'block' : 'hidden'}`}
        >
          {(
            Object.entries(data.factors) as Array<
              [keyof typeof data.factors, (typeof data.factors)[keyof typeof data.factors]]
            >
          ).map(([key, factor]) => (
            <FactorRow
              key={key}
              label={FACTOR_LABELS[key] ?? key}
              factor={factor}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerHealthDisplay;
