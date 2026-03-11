'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Customer } from '@/data/mock-customers';
import {
  Alert,
  AlertType,
  AlertPriority,
  AlertCustomerData,
  alertEngine,
  dismissAlert,
  actionAlert,
  InvalidAlertInputError,
} from '@/lib/alerts';

// ---------------------------------------------------------------------------
// Props Interface
// ---------------------------------------------------------------------------

export interface AlertsPanelProps {
  /** The currently selected customer; null renders an empty-state */
  customer: Customer | null;
  /** Override alert data for the customer (omit to use synthetic derived data) */
  alertData?: AlertCustomerData;
  /** When true renders a loading skeleton */
  isLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Derives deterministic AlertCustomerData from a Customer record.
 * Uses the healthScore as a seed to produce plausible synthetic values —
 * demo data only, no PII or raw financial figures.
 */
function deriveAlertData(customer: Customer): AlertCustomerData {
  const score = customer.healthScore; // 0–100
  const isAtRisk = score <= 50;

  return {
    customerId: customer.id,
    daysSinceLastPayment: isAtRisk ? 35 + Math.round((50 - score) * 0.5) : 15,
    currentHealthScore: score,
    healthScoreSevenDaysAgo: isAtRisk ? score + 22 : score + 3,
    loginsLast7Days: Math.round((score / 100) * 4),
    avgLoginsPerWeekLast30Days: Math.round((score / 100) * 7) + 1,
    daysUntilRenewal: isAtRisk ? 60 : 200,
    supportTicketsLast7Days: isAtRisk ? 4 : 1,
    hasEscalatedTicket: score <= 30,
    daysSinceLastFeatureUse: score <= 70 ? 35 : 5,
    isGrowingAccount: customer.subscriptionTier === 'enterprise' || customer.subscriptionTier === 'premium',
  };
}

/** Sorts alerts: high priority first, then by triggeredAt descending. */
function sortAlerts(alerts: Alert[]): Alert[] {
  return [...alerts].sort((a, b) => {
    if (a.priority === b.priority) {
      return new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime();
    }
    return a.priority === 'high' ? -1 : 1;
  });
}

// ---------------------------------------------------------------------------
// Color / Style Mappings
// ---------------------------------------------------------------------------

const PRIORITY_STYLES: Record<AlertPriority, { badge: string; border: string; icon: string }> = {
  high: {
    badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-500',
  },
  medium: {
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-500',
  },
};

const PRIORITY_LABEL: Record<AlertPriority, string> = {
  high: 'High',
  medium: 'Medium',
};

const ALERT_TYPE_LABEL: Record<AlertType, string> = {
  PAYMENT_OVERDUE: 'Payment',
  HEALTH_SCORE_DROP: 'Health',
  LOGIN_DROP: 'Engagement',
  CONTRACT_EXPIRY_AT_RISK: 'Contract',
  SUPPORT_TICKET_SURGE: 'Support',
  NO_FEATURE_USAGE: 'Adoption',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const LoadingSkeleton: React.FC = () => (
  <div
    className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-4 animate-pulse"
    role="status"
    aria-label="Loading alerts"
  >
    <div className="h-5 w-32 rounded bg-gray-200 dark:bg-gray-700 mb-4" />
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-md border border-gray-100 dark:border-gray-700 p-3 space-y-2"
        >
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-600" />
            <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="ml-auto h-4 w-12 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-3 w-full rounded bg-gray-100 dark:bg-gray-700" />
        </div>
      ))}
    </div>
  </div>
);

interface AlertRowProps {
  alert: Alert;
  isExpanded: boolean;
  onToggle: () => void;
  onDismiss: () => void;
  onAction: () => void;
  showConfirmId: string | null;
  onConfirmDismiss: (id: string) => void;
  onCancelConfirm: () => void;
}

const AlertRow: React.FC<AlertRowProps> = React.memo(function AlertRow({
  alert,
  isExpanded,
  onToggle,
  onDismiss,
  onAction,
  showConfirmId,
  onConfirmDismiss,
  onCancelConfirm,
}) {
  const styles = PRIORITY_STYLES[alert.priority];
  const isPendingConfirm = showConfirmId === alert.id;

  return (
    <div
      className={`rounded-md border ${styles.border} bg-white dark:bg-gray-800 overflow-hidden`}
    >
      {/* Alert header row */}
      <button
        type="button"
        className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
        aria-expanded={isExpanded}
        onClick={onToggle}
      >
        {/* Priority dot */}
        <span
          className={`mt-0.5 shrink-0 h-2.5 w-2.5 rounded-full ${
            alert.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'
          }`}
          aria-hidden="true"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {alert.title}
            </span>
            <span
              className={`shrink-0 text-xs font-medium rounded-full px-2 py-0.5 ${styles.badge}`}
            >
              {PRIORITY_LABEL[alert.priority]}
            </span>
            <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
              {ALERT_TYPE_LABEL[alert.type]}
            </span>
          </div>
        </div>

        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`shrink-0 h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Detail panel */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-700 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Recommended action: </span>
            {alert.recommendedAction}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Triggered: {new Date(alert.triggeredAt).toLocaleString()}
          </p>

          {/* Action controls */}
          {isPendingConfirm ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 self-center">
                Dismiss this alert?
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="text-xs font-medium px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  onClick={() => onConfirmDismiss(alert.id)}
                >
                  Confirm dismiss
                </button>
                <button
                  type="button"
                  className="text-xs font-medium px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                  onClick={onCancelConfirm}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="text-xs font-medium px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                onClick={onAction}
                aria-label={`Mark alert "${alert.title}" as actioned`}
              >
                Mark actioned
              </button>
              <button
                type="button"
                className="text-xs font-medium px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                onClick={onDismiss}
                aria-label={`Dismiss alert "${alert.title}"`}
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * Displays a prioritized list of customer alerts generated by the alert engine.
 *
 * - High-priority alerts always appear above medium-priority alerts.
 * - Each alert row expands to show a detail panel with a recommended action.
 * - Dismiss and mark-actioned controls include a confirmation step for dismiss.
 * - A panel header toggle switches between active and historical (dismissed/actioned) views.
 * - Shows a loading skeleton when `isLoading` is true or `customer` is null.
 * - Shows an error state when alert generation fails.
 */
export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  customer,
  alertData,
  isLoading = false,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmDismissId, setConfirmDismissId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate alerts whenever the selected customer changes.
  // useMemo is keyed on customer.id + alertData to match CustomerHealthDisplay pattern.
  const generatedAlerts = useMemo<Alert[]>(() => {
    if (!customer) {
      setError(null);
      return [];
    }

    try {
      const data = alertData ?? deriveAlertData(customer);
      const result = alertEngine(data, { existingAlerts: [] });
      setError(null);
      return result.newAlerts;
    } catch (err) {
      if (err instanceof InvalidAlertInputError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while evaluating alerts.');
      }
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id, alertData]);

  // Merge generated alerts with any local state mutations (dismiss / action).
  // On customer change, reset local alert state to the freshly generated list.
  const [localAlerts, setLocalAlerts] = useState<Alert[]>(generatedAlerts);
  const prevCustomerId = React.useRef<string | null>(customer?.id ?? null);

  // Sync alerts and reset UI state whenever the customer or generated alerts change.
  React.useEffect(() => {
    if (customer?.id !== prevCustomerId.current) {
      prevCustomerId.current = customer?.id ?? null;
      setExpandedId(null);
      setShowHistory(false);
      setConfirmDismissId(null);
    }
    setLocalAlerts(generatedAlerts);
  }, [customer?.id, generatedAlerts]);

  const handleToggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setConfirmDismissId(null);
  }, []);

  const handleDismissRequest = useCallback((id: string) => {
    setConfirmDismissId(id);
  }, []);

  const handleConfirmDismiss = useCallback((id: string) => {
    setLocalAlerts((prev) =>
      prev.map((a) => (a.id === id ? dismissAlert(a) : a))
    );
    setConfirmDismissId(null);
    setExpandedId(null);
  }, []);

  const handleCancelConfirm = useCallback(() => {
    setConfirmDismissId(null);
  }, []);

  const handleAction = useCallback((id: string) => {
    setLocalAlerts((prev) =>
      prev.map((a) => (a.id === id ? actionAlert(a) : a))
    );
    setExpandedId(null);
  }, []);

  // --- Loading state ---
  if (isLoading) {
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
  if (error) {
    return (
      <div
        className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-4"
        role="alert"
      >
        <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
          Unable to evaluate alerts
        </p>
        <p className="text-xs text-red-600 dark:text-red-500">
          Please verify the customer data and try again.
        </p>
      </div>
    );
  }

  // Partition into active and historical
  const activeAlerts = sortAlerts(localAlerts.filter((a) => !a.dismissed && !a.actioned));
  const historicalAlerts = sortAlerts(localAlerts.filter((a) => a.dismissed || a.actioned));
  const displayedAlerts = showHistory ? historicalAlerts : activeAlerts;

  const highCount = activeAlerts.filter((a) => a.priority === 'high').length;
  const mediumCount = activeAlerts.filter((a) => a.priority === 'medium').length;

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-4 w-full">
      {/* Panel header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Alerts — {customer.name}
          </h3>

          {/* Active count badges */}
          {!showHistory && (
            <div className="flex items-center gap-1.5">
              {highCount > 0 && (
                <span className="text-xs font-medium rounded-full px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                  {highCount} high
                </span>
              )}
              {mediumCount > 0 && (
                <span className="text-xs font-medium rounded-full px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                  {mediumCount} medium
                </span>
              )}
            </div>
          )}
        </div>

        {/* History toggle */}
        <button
          type="button"
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          onClick={() => {
            setShowHistory((prev) => !prev);
            setExpandedId(null);
            setConfirmDismissId(null);
          }}
          aria-pressed={showHistory}
        >
          {showHistory ? 'View active alerts' : 'View history'}
        </button>
      </div>

      {/* Alert list */}
      {displayedAlerts.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
          {showHistory ? 'No historical alerts.' : 'No active alerts for this customer.'}
        </div>
      ) : (
        <ul className="space-y-2" aria-label={showHistory ? 'Historical alerts' : 'Active alerts'}>
          {displayedAlerts.map((alert) => (
            <li key={alert.id}>
              <AlertRow
                alert={alert}
                isExpanded={expandedId === alert.id}
                onToggle={() => handleToggle(alert.id)}
                onDismiss={() => handleDismissRequest(alert.id)}
                onAction={() => handleAction(alert.id)}
                showConfirmId={confirmDismissId}
                onConfirmDismiss={handleConfirmDismiss}
                onCancelConfirm={handleCancelConfirm}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AlertsPanel;
