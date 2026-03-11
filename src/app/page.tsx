'use client';

import React, { lazy, Suspense, useState, useCallback, useRef } from 'react';
import { Customer, mockCustomers } from '@/data/mock-customers';
import { DashboardErrorBoundary } from '@/components/DashboardErrorBoundary';
import { WidgetErrorBoundary } from '@/components/WidgetErrorBoundary';
import {
  ExportFormat,
  ExportFilter,
  ExportAuditEntry,
  exportCustomers,
  exportHealthScores,
  exportAlerts,
  exportMarketIntelligence,
  triggerDownload,
} from '@/lib/exportUtils';

// ---------------------------------------------------------------------------
// Lazy-loaded widgets (code splitting per acceptance criteria)
// ---------------------------------------------------------------------------

const CustomerSelector = lazy(() =>
  import('@/components/CustomerSelector').then((m) => ({ default: m.CustomerSelector })),
);
const CustomerHealthDisplay = lazy(() =>
  import('@/components/CustomerHealthDisplay').then((m) => ({ default: m.CustomerHealthDisplay })),
);
const AlertsPanel = lazy(() =>
  import('@/components/AlertsPanel').then((m) => ({ default: m.AlertsPanel })),
);
const PredictiveIntelligenceWidget = lazy(() =>
  import('@/components/PredictiveIntelligenceWidget').then((m) => ({
    default: m.PredictiveIntelligenceWidget,
  })),
);

// ---------------------------------------------------------------------------
// Widget Skeleton (loading fallback for Suspense)
// ---------------------------------------------------------------------------

function WidgetSkeleton({ label }: { label: string }): React.JSX.Element {
  return (
    <div
      className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-4 animate-pulse"
      role="status"
      aria-label={`Loading ${label}`}
    >
      <div className="h-5 w-40 rounded bg-gray-200 dark:bg-gray-700 mb-3" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 rounded bg-gray-100 dark:bg-gray-700" />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast notification
// ---------------------------------------------------------------------------

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error';
}

function ToastList({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }): React.JSX.Element {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={[
            'pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg text-sm font-medium',
            t.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-300'
              : t.type === 'warning'
              ? 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300',
          ].join(' ')}
        >
          <span className="flex-1">{t.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
            className="shrink-0 rounded p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export Panel
// ---------------------------------------------------------------------------

interface ExportPanelProps {
  onClose: () => void;
  selectedCustomer: Customer | null;
  onAuditLog: (entry: ExportAuditEntry) => void;
  onToast: (message: string, type: Toast['type']) => void;
}

function ExportPanel({ onClose, selectedCustomer, onAuditLog, onToast }: ExportPanelProps): React.JSX.Element {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [tier, setTier] = useState<Customer['subscriptionTier'] | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const cancelRef = useRef(false);

  const filters: ExportFilter = {
    subscriptionTier: tier || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  function cancel(): void {
    cancelRef.current = true;
    setIsCancelled(true);
    setProgress(null);
  }

  async function runExport(source: 'customers' | 'health-scores' | 'alerts' | 'market-intelligence'): Promise<void> {
    cancelRef.current = false;
    setIsCancelled(false);
    setProgress(0);

    // Simulate streaming progress across 4 steps
    for (let step = 1; step <= 4; step++) {
      if (cancelRef.current) {
        setProgress(null);
        onToast('Export cancelled.', 'warning');
        return;
      }
      await new Promise<void>((resolve) => setTimeout(resolve, 150));
      setProgress(step * 25);
    }

    if (cancelRef.current) {
      setProgress(null);
      onToast('Export cancelled.', 'warning');
      return;
    }

    try {
      let result;
      if (source === 'customers') {
        result = exportCustomers(mockCustomers, format, filters);
      } else if (source === 'health-scores') {
        // Build health score rows from mock customers
        const rows = mockCustomers.map((c) => ({
          customerId: c.id,
          customerName: c.name,
          company: c.company,
          overallScore: c.healthScore,
          riskLevel: c.healthScore <= 30 ? 'critical' : c.healthScore <= 70 ? 'warning' : 'healthy',
          exportedAt: new Date().toISOString(),
        }));
        result = exportHealthScores(rows, format, filters);
      } else if (source === 'alerts') {
        // Export empty alerts list when none available (no alert state at page level)
        result = exportAlerts([], format, filters);
      } else {
        // market-intelligence: export placeholder row for selected customer if any
        const rows = selectedCustomer
          ? [
              {
                company: selectedCustomer.company,
                sentimentLabel: 'neutral',
                sentimentScore: 0.5,
                articleCount: 0,
                lastUpdated: new Date().toISOString(),
              },
            ]
          : [];
        result = exportMarketIntelligence(rows, format, filters);
      }

      onAuditLog(result.audit);
      triggerDownload(result);
      onToast(`${source} export complete — ${result.audit.recordCount} record(s) downloaded.`, 'success');
    } catch {
      onToast('Export failed. Please try again.', 'error');
    } finally {
      setProgress(null);
    }
  }

  const sources: { id: 'customers' | 'health-scores' | 'alerts' | 'market-intelligence'; label: string }[] = [
    { id: 'customers', label: 'Customer Data' },
    { id: 'health-scores', label: 'Health Scores' },
    { id: 'alerts', label: 'Alert History' },
    { id: 'market-intelligence', label: 'Market Intelligence' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Export data"
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 px-4 py-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Export Data</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export panel"
            className="rounded-md p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Format selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Format
            </label>
            <div className="flex gap-3">
              {(['csv', 'json'] as ExportFormat[]).map((f) => (
                <label key={f} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="export-format"
                    value={f}
                    checked={format === f}
                    onChange={() => setFormat(f)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 uppercase">{f}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tier filter */}
          <div>
            <label htmlFor="export-tier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subscription Tier
            </label>
            <select
              id="export-tier"
              value={tier}
              onChange={(e) => setTier(e.target.value as Customer['subscriptionTier'] | '')}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All tiers</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="export-date-from" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                From
              </label>
              <input
                id="export-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="export-date-to" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                To
              </label>
              <input
                id="export-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Progress bar */}
          {progress !== null && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">Exporting…</span>
                <button
                  type="button"
                  onClick={cancel}
                  className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
                >
                  Cancel
                </button>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Export progress"
                />
              </div>
            </div>
          )}

          {isCancelled && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400">Export cancelled.</p>
          )}

          {/* Data source buttons */}
          <div className="pt-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Export Source</p>
            <div className="grid grid-cols-2 gap-2">
              {sources.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={progress !== null}
                  onClick={() => void runExport(s.id)}
                  className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function Home(): React.JSX.Element {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = String(++toastIdRef.current);
    setToasts((prev) => [...prev, { id, message, type }]);
    // Auto-dismiss after 5 s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleAuditLog = useCallback((entry: ExportAuditEntry) => {
    // Structured audit log — no PII in message
    console.info(
      JSON.stringify({
        level: 'audit',
        event: 'data_export',
        userIdHash: entry.userIdHash,
        dataSource: entry.dataSource,
        format: entry.format,
        recordCount: entry.recordCount,
        timestamp: entry.timestamp,
      }),
    );
  }, []);

  const handleExportLogs = useCallback(() => {
    // Triggered from DashboardErrorBoundary full-page fallback
    const logData = JSON.stringify(
      {
        event: 'error_log_export',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      },
      null,
      2,
    );
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-log_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return (
    <DashboardErrorBoundary onExportLogs={handleExportLogs}>
      {/* Skip-to-content link — first focusable element on the page */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Application header / toolbar */}
        <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 items-center justify-between gap-4">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                Customer Intelligence Dashboard
              </h1>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowExportPanel(true)}
                  aria-label="Open export panel"
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                    <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                  </svg>
                  <span className="hidden sm:inline">Export</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main id="main-content" tabIndex={-1} className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6">
          {/* aria-live region for health score and alert announcements */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
            id="dashboard-announcer"
          >
            {selectedCustomer
              ? `Selected customer: ${selectedCustomer.name}, health score ${selectedCustomer.healthScore}`
              : ''}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left column: Customer Selector */}
            <section
              aria-label="Customer list"
              className="lg:col-span-7 xl:col-span-6"
            >
              <WidgetErrorBoundary widgetName="Customer Selector">
                <Suspense fallback={<WidgetSkeleton label="customer list" />}>
                  <CustomerSelector
                    onSelect={setSelectedCustomer}
                    selectedCustomerId={selectedCustomer?.id ?? null}
                  />
                </Suspense>
              </WidgetErrorBoundary>
            </section>

            {/* Right column: Detail widgets */}
            <div className="lg:col-span-5 xl:col-span-6 flex flex-col gap-6">
              {selectedCustomer ? (
                <>
                  {/* Health Display */}
                  <WidgetErrorBoundary widgetName="Health Score">
                    <Suspense fallback={<WidgetSkeleton label="health score" />}>
                      <CustomerHealthDisplay customer={selectedCustomer} />
                    </Suspense>
                  </WidgetErrorBoundary>

                  {/* Alerts Panel */}
                  <WidgetErrorBoundary widgetName="Alerts">
                    <Suspense fallback={<WidgetSkeleton label="alerts" />}>
                      <AlertsPanel customer={selectedCustomer} />
                    </Suspense>
                  </WidgetErrorBoundary>

                  {/* Predictive Intelligence */}
                  <WidgetErrorBoundary widgetName="Predictive Intelligence">
                    <Suspense fallback={<WidgetSkeleton label="predictive intelligence" />}>
                      <PredictiveIntelligenceWidget customer={selectedCustomer} />
                    </Suspense>
                  </WidgetErrorBoundary>
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Select a customer to view details.</p>
              )}
            </div>
          </div>
        </main>

        {/* Export Panel modal */}
        {showExportPanel && (
          <ExportPanel
            onClose={() => setShowExportPanel(false)}
            selectedCustomer={selectedCustomer}
            onAuditLog={handleAuditLog}
            onToast={addToast}
          />
        )}

        {/* Toast notifications */}
        <ToastList toasts={toasts} onDismiss={dismissToast} />
      </div>
    </DashboardErrorBoundary>
  );
}
