'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MarketIntelligenceResponse } from '@/lib/MarketIntelligenceService';

export interface MarketIntelligenceWidgetProps {
  company?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSentimentClasses(label: 'positive' | 'neutral' | 'negative'): {
  badge: string;
  text: string;
} {
  switch (label) {
    case 'positive':
      return { badge: 'bg-green-100 text-green-700', text: 'text-green-700' };
    case 'negative':
      return { badge: 'bg-red-100 text-red-700', text: 'text-red-700' };
    default:
      return { badge: 'bg-yellow-100 text-yellow-700', text: 'text-yellow-700' };
  }
}

function timeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec} seconds ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function WidgetSkeleton(): React.JSX.Element {
  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 w-full animate-pulse"
      aria-busy="true"
      aria-label="Loading market intelligence"
    >
      <div className="h-5 w-1/3 rounded bg-gray-200 dark:bg-gray-700 mb-3" />
      <div className="h-6 w-24 rounded-full bg-gray-200 dark:bg-gray-700 mb-4" />
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MarketIntelligenceWidget({
  company: companyProp,
}: MarketIntelligenceWidgetProps): React.JSX.Element {
  const [data, setData] = useState<MarketIntelligenceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Manual input for when no customer is selected
  const [inputValue, setInputValue] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);

  // Track the last-fetched company to avoid redundant calls
  const lastFetchedRef = useRef<string | null>(null);

  const VALID_COMPANY_RE = /^[a-zA-Z0-9 \-]+$/;

  const fetchData = useCallback(async (company: string): Promise<void> => {
    setLoading(true);
    setError(null);
    lastFetchedRef.current = company;

    try {
      const res = await fetch(
        `/api/market-intelligence/${encodeURIComponent(company)}`,
      );
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Failed to fetch market intelligence.');
      }
      const json = (await res.json()) as MarketIntelligenceResponse;
      setData(json);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch when companyProp changes
  useEffect(() => {
    if (!companyProp) return;
    if (companyProp === lastFetchedRef.current) return;
    void fetchData(companyProp);
  }, [companyProp, fetchData]);

  // Manual search handler
  function handleManualSearch(): void {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setInputError('Please enter a company name.');
      return;
    }
    if (!VALID_COMPANY_RE.test(trimmed)) {
      setInputError('Only letters, numbers, spaces, and hyphens are allowed.');
      return;
    }
    setInputError(null);
    void fetchData(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') handleManualSearch();
  }

  // Determine active company label for the heading
  const activeCompany = data?.company ?? companyProp ?? null;

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="border-b border-gray-100 dark:border-gray-700 px-4 py-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Market Intelligence
          {activeCompany && (
            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400 truncate">
              — {activeCompany}
            </span>
          )}
        </h2>
      </div>

      {/* Manual input (shown when no companyProp is provided) */}
      {!companyProp && (
        <div className="px-4 pt-3 pb-1">
          <label
            htmlFor="market-company-input"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Company name
          </label>
          <div className="flex gap-2">
            <input
              id="market-company-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Acme Corp"
              className={[
                'flex-1 min-w-0 rounded-md border px-3 py-1.5 text-sm',
                'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',
                'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                inputError
                  ? 'border-red-400 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600',
              ].join(' ')}
            />
            <button
              onClick={handleManualSearch}
              disabled={loading}
              className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Search
            </button>
          </div>
          {inputError && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {inputError}
            </p>
          )}
        </div>
      )}

      {/* Body */}
      <div className="p-4">
        {/* Loading skeleton */}
        {loading && <WidgetSkeleton />}

        {/* Error state */}
        {!loading && error && (
          <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            <button
              onClick={() => {
                const target = companyProp ?? lastFetchedRef.current;
                if (target) void fetchData(target);
              }}
              className="mt-2 text-sm font-medium text-red-700 dark:text-red-400 underline hover:text-red-900 dark:hover:text-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty / prompt state */}
        {!loading && !error && !data && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {companyProp
              ? 'Fetching market data…'
              : 'Enter a company name above to load market intelligence.'}
          </p>
        )}

        {/* Data state */}
        {!loading && !error && data && (
          <div className="space-y-4">
            {/* Sentiment badge + meta */}
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold capitalize ${getSentimentClasses(data.sentiment.label).badge}`}
              >
                {data.sentiment.label}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {data.articleCount} article{data.articleCount !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Updated {timeAgo(data.lastUpdated)}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Confidence: {Math.round(data.sentiment.confidence * 100)}%
              </span>
            </div>

            {/* Headlines */}
            {data.headlines.length > 0 && (
              <ul className="space-y-3">
                {data.headlines.slice(0, 3).map((headline, index) => (
                  <li
                    key={index}
                    className="border-t border-gray-100 dark:border-gray-700 pt-3 first:border-t-0 first:pt-0"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">
                      {headline.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {headline.source}
                      <span className="mx-1">·</span>
                      {timeAgo(headline.publishedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
