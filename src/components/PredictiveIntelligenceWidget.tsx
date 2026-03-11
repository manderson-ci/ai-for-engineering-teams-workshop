'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AlertCustomerData, alertEngine } from '@/lib/alerts';
import { MarketIntelligenceResponse } from '@/lib/MarketIntelligenceService';
import { Customer } from '@/data/mock-customers';
import { AlertDetailDrawer } from '@/components/AlertDetailDrawer';

// ---------------------------------------------------------------------------
// Props Interface
// ---------------------------------------------------------------------------

export interface PredictiveIntelligenceWidgetProps {
  /** The currently selected customer. Drives alert evaluation and market fetch. */
  customer: Customer | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSentimentClasses(label: 'positive' | 'neutral' | 'negative'): string {
  if (label === 'positive') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (label === 'negative') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
}

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

const PRIORITY_BADGE: Record<'high' | 'medium', string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const PRIORITY_ROW: Record<'high' | 'medium', string> = {
  high: 'border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:hover:bg-red-900/30',
  medium: 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-950/40 dark:hover:bg-yellow-900/30',
};

/** Derives a deterministic AlertCustomerData from a Customer record. */
function deriveAlertInput(customer: Customer): AlertCustomerData {
  const s = customer.healthScore;
  return {
    customerId: customer.id,
    daysSinceLastPayment: s <= 30 ? 35 : s <= 50 ? 10 : 5,
    currentHealthScore: s,
    healthScoreSevenDaysAgo: s <= 40 ? s + 25 : s,
    loginsLast7Days: s <= 30 ? 1 : Math.round((s / 100) * 10),
    avgLoginsPerWeekLast30Days: Math.round((s / 100) * 10),
    daysUntilRenewal: s <= 40 ? 60 : 180,
    supportTicketsLast7Days: s <= 30 ? 4 : 1,
    hasEscalatedTicket: s <= 20,
    daysSinceLastFeatureUse: s <= 50 ? 35 : null,
    isGrowingAccount: customer.subscriptionTier === 'enterprise',
  };
}

function AlertsSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-2 animate-pulse" aria-busy="true" aria-label="Loading alerts">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 rounded-md bg-gray-200 dark:bg-gray-700" />
      ))}
    </div>
  );
}

function MarketSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-2 animate-pulse" aria-busy="true" aria-label="Loading market intelligence">
      <div className="h-5 w-24 rounded-full bg-gray-200 dark:bg-gray-700" />
      {[1, 2, 3].map((i) => <div key={i} className="h-4 rounded bg-gray-200 dark:bg-gray-700" />)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const PredictiveIntelligenceWidget: React.FC<PredictiveIntelligenceWidgetProps> = ({
  customer,
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [marketData, setMarketData] = useState<MarketIntelligenceResponse | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);
  const lastFetchedCompany = useRef<string | null>(null);

  // Run alert engine (synchronous) when customer changes
  useEffect(() => {
    if (!customer) { setAlerts([]); setSelectedAlert(null); return; }
    setAlertsLoading(true);
    const timer = setTimeout(() => {
      const result = alertEngine(deriveAlertInput(customer), { existingAlerts: [] });
      setAlerts(result.newAlerts);
      setSelectedAlert(null);
      const highTitles = result.newAlerts.filter((a) => a.priority === 'high').map((a) => a.title).join(', ');
      setLiveAnnouncement(highTitles ? `New high-priority alerts for ${customer.company}: ${highTitles}` : '');
      setAlertsLoading(false);
    }, 120);
    return () => clearTimeout(timer);
  }, [customer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMarket = useCallback(async (company: string): Promise<void> => {
    setMarketLoading(true);
    setMarketError(null);
    lastFetchedCompany.current = company;
    try {
      const res = await fetch(`/api/market-intelligence/${encodeURIComponent(company)}`);
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Failed to fetch market intelligence.');
      }
      setMarketData((await res.json()) as MarketIntelligenceResponse);
    } catch (err) {
      setMarketError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setMarketLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!customer) { setMarketData(null); setMarketError(null); return; }
    if (customer.company === lastFetchedCompany.current) return;
    void fetchMarket(customer.company);
  }, [customer?.company, fetchMarket]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDismiss(updated: Alert): void {
    setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    if (selectedAlert?.id === updated.id) setSelectedAlert(updated);
  }

  function handleAction(updated: Alert): void {
    setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    if (selectedAlert?.id === updated.id) setSelectedAlert(updated);
  }

  const activeAlerts = alerts.filter((a) => !a.dismissed && !a.actioned);
  const historicalAlerts = alerts.filter((a) => a.dismissed || a.actioned);
  const displayedAlerts = showHistory ? historicalAlerts : activeAlerts;

  if (!customer) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select a customer to view predictive intelligence.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 w-full overflow-hidden">
      {/* aria-live: announces new high-priority alerts without user interaction */}
      <div role="status" aria-live="assertive" aria-atomic="true" className="sr-only">
        {liveAnnouncement}
      </div>

      {/* Header */}
      <div className="border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
          Predictive Intelligence
          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
            — {customer.company}
          </span>
        </h2>
        <button
          type="button"
          onClick={() => setShowHistory((prev) => !prev)}
          className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          {showHistory ? 'Active alerts' : `History (${historicalAlerts.length})`}
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Alerts section */}
        <section aria-label="Customer alerts">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {showHistory ? 'Alert History' : 'Active Alerts'}
          </h3>
          {alertsLoading && <AlertsSkeleton />}
          {!alertsLoading && displayedAlerts.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {showHistory ? 'No historical alerts.' : 'No active alerts.'}
            </p>
          )}
          {!alertsLoading && displayedAlerts.length > 0 && (
            <ul className="space-y-2">
              {displayedAlerts.map((alert) => (
                <li key={alert.id}>
                  <button
                    type="button"
                    aria-pressed={selectedAlert?.id === alert.id}
                    onClick={() => setSelectedAlert((prev) => prev?.id === alert.id ? null : alert)}
                    className={`w-full text-left rounded-md border px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${PRIORITY_ROW[alert.priority]}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${PRIORITY_BADGE[alert.priority]}`}>
                        {alert.priority}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {alert.title}
                      </span>
                      <span className="ml-auto shrink-0 text-xs text-gray-400 dark:text-gray-500">
                        {timeAgo(alert.triggeredAt)}
                      </span>
                    </div>
                  </button>
                  {selectedAlert?.id === alert.id && (
                    <div className="mt-2">
                      <AlertDetailDrawer
                        alert={selectedAlert}
                        arr={customer.healthScore * 1000}
                        onDismiss={handleDismiss}
                        onAction={handleAction}
                        onClose={() => setSelectedAlert(null)}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Market intelligence section */}
        <section aria-label="Market intelligence" className="border-t border-gray-100 dark:border-gray-700 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Market Sentiment</h3>
          {marketLoading && <MarketSkeleton />}
          {!marketLoading && marketError && (
            <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-3">
              <p className="text-sm text-red-700 dark:text-red-400">{marketError}</p>
              <button type="button" onClick={() => void fetchMarket(customer.company)}
                className="mt-1 text-sm font-medium text-red-700 dark:text-red-400 underline hover:text-red-900 dark:hover:text-red-200">
                Retry
              </button>
            </div>
          )}
          {!marketLoading && !marketError && !marketData && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Fetching market data…</p>
          )}
          {!marketLoading && !marketError && marketData && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold capitalize ${getSentimentClasses(marketData.sentiment.label)}`}>
                  {marketData.sentiment.label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {marketData.articleCount} article{marketData.articleCount !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Updated {timeAgo(marketData.lastUpdated)}
                </span>
              </div>
              {marketData.headlines.length > 0 && (
                <ul className="space-y-2">
                  {marketData.headlines.slice(0, 3).map((headline, idx) => (
                    <li key={idx} className="border-t border-gray-100 dark:border-gray-700 pt-2 first:border-t-0 first:pt-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">
                        {headline.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {headline.source}<span className="mx-1">&middot;</span>{timeAgo(headline.publishedAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PredictiveIntelligenceWidget;
