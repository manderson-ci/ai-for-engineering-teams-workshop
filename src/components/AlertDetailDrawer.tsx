'use client';

import React from 'react';
import { Alert, dismissAlert, actionAlert } from '@/lib/alerts';

// ---------------------------------------------------------------------------
// Props Interface
// ---------------------------------------------------------------------------

export interface AlertDetailDrawerProps {
  /** The alert to display detail for. Pass null to render nothing. */
  alert: Alert | null;
  /** Customer ARR for context display */
  arr: number;
  /**
   * Snapshot of the data that triggered the alert.
   * Displayed as a key–value list in the detail panel.
   */
  triggeringData?: Record<string, string | number | boolean>;
  /** Called when the user dismisses the alert */
  onDismiss: (updated: Alert) => void;
  /** Called when the user marks the alert as actioned */
  onAction: (updated: Alert) => void;
  /** Called when the drawer should be closed without mutation */
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PRIORITY_CLASSES: Record<'high' | 'medium', { badge: string; border: string }> = {
  high: {
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
  medium: {
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
};

const TYPE_DESCRIPTION: Record<string, string> = {
  PAYMENT_OVERDUE: 'Triggered when payment has been overdue for more than 30 days.',
  HEALTH_SCORE_DROP: 'Triggered when the health score drops more than 20 points within a 7-day window.',
  LOGIN_DROP: 'Triggered when login frequency drops more than 50% compared to the 30-day weekly average (Engagement Cliff).',
  CONTRACT_EXPIRY_AT_RISK: 'Triggered when the contract renews in fewer than 90 days and the health score is below 50.',
  SUPPORT_TICKET_SURGE: 'Triggered when more than 3 support tickets are opened in 7 days, or any ticket is escalated.',
  NO_FEATURE_USAGE: 'Triggered when a growing account shows no new feature activity for 30 or more days.',
};

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatArr(arr: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(arr);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface DataSnapshotRowProps {
  label: string;
  value: string | number | boolean;
}

const DataSnapshotRow: React.FC<DataSnapshotRowProps> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
    <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
    </span>
  </div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * AlertDetailDrawer renders a panel with full detail for a single alert,
 * including: rule description, triggering data snapshot, recommended action,
 * customer ARR context, and dismiss/action controls.
 *
 * Renders nothing when `alert` is null.
 */
export const AlertDetailDrawer: React.FC<AlertDetailDrawerProps> = ({
  alert,
  arr,
  triggeringData,
  onDismiss,
  onAction,
  onClose,
}) => {
  if (!alert) return null;

  const priorityClasses = PRIORITY_CLASSES[alert.priority];
  const ruleDescription = TYPE_DESCRIPTION[alert.type] ?? 'Alert rule description unavailable.';
  const isResolved = alert.dismissed || alert.actioned;
  const snapshotEntries = triggeringData ? Object.entries(triggeringData) : [];

  function handleDismiss(): void {
    onDismiss(dismissAlert(alert!));
  }

  function handleAction(): void {
    onAction(actionAlert(alert!));
  }

  return (
    <div
      role="complementary"
      aria-label={`Alert detail: ${alert.title}`}
      className={[
        'rounded-lg border bg-white dark:bg-gray-800 p-4 w-full',
        priorityClasses.border,
      ].join(' ')}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${priorityClasses.badge}`}
          >
            {alert.priority}
          </span>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {alert.title}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close alert detail"
          className="shrink-0 rounded-md p-1 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>

      {/* Rule description */}
      <section className="mb-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
          Rule Description
        </h4>
        <p className="text-sm text-gray-700 dark:text-gray-300">{ruleDescription}</p>
      </section>

      {/* Triggering data snapshot */}
      {snapshotEntries.length > 0 && (
        <section className="mb-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
            Triggering Data Snapshot
          </h4>
          <div className="rounded-md bg-gray-50 dark:bg-gray-700/40 px-3 py-1">
            {snapshotEntries.map(([key, value]) => (
              <DataSnapshotRow key={key} label={key} value={value} />
            ))}
          </div>
        </section>
      )}

      {/* Recommended action */}
      <section className="mb-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
          Recommended Action
        </h4>
        <p className="text-sm text-gray-700 dark:text-gray-300">{alert.recommendedAction}</p>
      </section>

      {/* Customer ARR context */}
      <section className="mb-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">
          Customer ARR
        </h4>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatArr(arr)}</p>
      </section>

      {/* Triggered at */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
        Triggered {formatTimestamp(alert.triggeredAt)}
        {alert.dismissed && alert.dismissedAt && (
          <> &middot; Dismissed {formatTimestamp(alert.dismissedAt)}</>
        )}
        {alert.actioned && alert.actionedAt && (
          <> &middot; Actioned {formatTimestamp(alert.actionedAt)}</>
        )}
      </p>

      {/* Controls */}
      {!isResolved && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-1 min-w-[100px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={handleAction}
            className="flex-1 min-w-[100px] rounded-md border border-transparent bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Mark Actioned
          </button>
        </div>
      )}

      {isResolved && (
        <p
          className={`text-sm font-medium ${alert.dismissed ? 'text-gray-500 dark:text-gray-400' : 'text-green-700 dark:text-green-400'}`}
        >
          {alert.dismissed ? 'Alert dismissed.' : 'Alert marked as actioned.'}
        </p>
      )}
    </div>
  );
};

export default AlertDetailDrawer;
